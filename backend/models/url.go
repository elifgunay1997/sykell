package models

import (
	"time"
)

type URL struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	URL       string    `json:"url" gorm:"type:varchar(512);not null;uniqueIndex"`
	Status    string    `json:"status" gorm:"not null;default:'queued'"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type URLStatus string

const (
	StatusQueued  URLStatus = "queued"
	StatusRunning URLStatus = "running"
	StatusDone    URLStatus = "done"
	StatusError   URLStatus = "error"
)

type CreateURLRequest struct {
	URL string `json:"url" binding:"required,url"`
}

type URLListResponse struct {
	URLs       []URL `json:"urls"`
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	TotalPages int   `json:"total_pages"`
} 