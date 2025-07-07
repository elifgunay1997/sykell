package main

import (
	"github.com/gin-gonic/gin"
	"github.com/sykell/backend/config"
	"github.com/sykell/backend/routes"
	"log"
	"os"
)

func main() {
	// Set Gin mode
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database
	config.InitDB()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := gin.Default()

	// Setup CORS for frontend
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// Setup routes
	routes.SetupRoutes(r)

	log.Printf("Starting server on :%s", port)
	err := r.Run(":" + port)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
} 