package models

import (
	"time"
)

type AnalysisResult struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	URLID         uint      `json:"url_id" gorm:"not null;uniqueIndex"`
	URL           URL       `json:"url" gorm:"foreignKey:URLID"`
	Title         string    `json:"title"`
	HTMLVersion   string    `json:"html_version"`
	H1Count       int       `json:"h1_count"`
	H2Count       int       `json:"h2_count"`
	H3Count       int       `json:"h3_count"`
	H4Count       int       `json:"h4_count"`
	H5Count       int       `json:"h5_count"`
	H6Count       int       `json:"h6_count"`
	InternalLinks int       `json:"internal_links"`
	ExternalLinks int       `json:"external_links"`
	BrokenLinks   int       `json:"broken_links"`
	HasLoginForm  bool      `json:"has_login_form"`
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type BrokenLink struct {
	ID            uint   `json:"id" gorm:"primaryKey"`
	AnalysisID    uint   `json:"analysis_id" gorm:"not null"`
	URL           string `json:"url" gorm:"not null"`
	StatusCode    int    `json:"status_code"`
	ErrorMessage  string `json:"error_message"`
}

type AnalysisDetailResponse struct {
	AnalysisResult AnalysisResult `json:"analysis_result"`
	BrokenLinks    []BrokenLink   `json:"broken_links"`
} 