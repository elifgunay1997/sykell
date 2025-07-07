package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sykell/backend/config"
	"github.com/sykell/backend/models"
	"github.com/sykell/backend/utils"
)

type URLHandler struct {
	crawler *utils.CrawlerService
}

func NewURLHandler() *URLHandler {
	return &URLHandler{
		crawler: utils.NewCrawlerService(),
	}
}

// CreateURL handles POST /api/urls
func (h *URLHandler) CreateURL(c *gin.Context) {
	var req models.CreateURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if URL already exists
	var existingURL models.URL
	if err := config.DB.Where("url = ?", req.URL).First(&existingURL).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "URL already exists"})
		return
	}

	// Create new URL
	url := models.URL{
		URL:    req.URL,
		Status: string(models.StatusQueued),
	}

	if err := config.DB.Create(&url).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create URL"})
		return
	}

	// Start analysis in background
	go h.analyzeURL(url.ID, req.URL)

	c.JSON(http.StatusCreated, url)
}

// GetURLs handles GET /api/urls
func (h *URLHandler) GetURLs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	search := c.Query("search")
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

	var urls []models.URL
	var total int64

	query := config.DB.Model(&models.URL{})

	// Apply search filter
	if search != "" {
		query = query.Where("url LIKE ?", "%"+search+"%")
	}

	// Apply status filter
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Get total count
	query.Count(&total)

	// Get paginated results
	err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&urls).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch URLs"})
		return
	}

	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	response := models.URLListResponse{
		URLs:       urls,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// GetURLDetails handles GET /api/urls/:id
func (h *URLHandler) GetURLDetails(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid URL ID"})
		return
	}

	var url models.URL
	if err := config.DB.First(&url, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	var analysis models.AnalysisResult
	if err := config.DB.Where("url_id = ?", id).First(&analysis).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"url":      url,
			"analysis": nil,
		})
		return
	}

	var brokenLinks []models.BrokenLink
	config.DB.Where("analysis_id = ?", analysis.ID).Find(&brokenLinks)

	response := models.AnalysisDetailResponse{
		AnalysisResult: analysis,
		BrokenLinks:    brokenLinks,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteURLs handles DELETE /api/urls
func (h *URLHandler) DeleteURLs(c *gin.Context) {
	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Delete analysis results first
	config.DB.Where("url_id IN ?", req.IDs).Delete(&models.AnalysisResult{})

	// Delete URLs
	if err := config.DB.Where("id IN ?", req.IDs).Delete(&models.URL{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete URLs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URLs deleted successfully"})
}

// ReanalyzeURL handles POST /api/urls/:id/reanalyze
func (h *URLHandler) ReanalyzeURL(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid URL ID"})
		return
	}

	var url models.URL
	if err := config.DB.First(&url, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	// Update status to queued
	url.Status = string(models.StatusQueued)
	config.DB.Save(&url)

	// Start analysis in background
	go h.analyzeURL(url.ID, url.URL)

	c.JSON(http.StatusOK, gin.H{"message": "Reanalysis started"})
}

// analyzeURL performs the actual URL analysis in background
func (h *URLHandler) analyzeURL(urlID uint, targetURL string) {
	db := config.DB

	// Update status to running
	db.Model(&models.URL{}).Where("id = ?", urlID).Update("status", models.StatusRunning)

	// Perform analysis
	result, brokenLinks, err := h.crawler.AnalyzeURL(targetURL)

	if err != nil {
		// Update status to error
		db.Model(&models.URL{}).Where("id = ?", urlID).Update("status", models.StatusError)
		return
	}

	// Set URL ID
	result.URLID = urlID

	// Delete existing analysis if any
	db.Where("url_id = ?", urlID).Delete(&models.AnalysisResult{})
	db.Where("analysis_id IN (SELECT id FROM analysis_results WHERE url_id = ?)", urlID).Delete(&models.BrokenLink{})

	// Save analysis result
	if err := db.Create(result).Error; err != nil {
		db.Model(&models.URL{}).Where("id = ?", urlID).Update("status", models.StatusError)
		return
	}

	// Save broken links
	for i := range brokenLinks {
		brokenLinks[i].AnalysisID = result.ID
	}
	if len(brokenLinks) > 0 {
		db.Create(&brokenLinks)
	}

	// Update status to done
	db.Model(&models.URL{}).Where("id = ?", urlID).Update("status", models.StatusDone)
} 