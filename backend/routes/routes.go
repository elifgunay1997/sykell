package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sykell/backend/handlers"
	"github.com/sykell/backend/utils"
)

func SetupRoutes(r *gin.Engine) {
	// Health check endpoint (no auth required)
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes with authentication
	api := r.Group("/api")
	api.Use(utils.AuthMiddleware())

	urlHandler := handlers.NewURLHandler()

	// URL management endpoints
	urls := api.Group("/urls")
	{
		urls.POST("", urlHandler.CreateURL)                    // Add URL
		urls.GET("", urlHandler.GetURLs)                       // List URLs with pagination
		urls.GET("/:id", urlHandler.GetURLDetails)             // Get URL details
		urls.DELETE("", urlHandler.DeleteURLs)                 // Delete selected URLs
		urls.POST("/:id/reanalyze", urlHandler.ReanalyzeURL)   // Re-analyze URL
	}
} 