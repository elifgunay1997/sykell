package main

import (
	"github.com/gin-gonic/gin"
	"log"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := gin.Default()

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	log.Printf("Starting server on :%s", port)
	err := r.Run(":" + port)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
} 