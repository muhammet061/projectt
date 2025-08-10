package main

import (
	"log"
	"net/http"

	"file-sharing-backend/internal/database"
	"file-sharing-backend/internal/handlers"
	"file-sharing-backend/internal/middleware"
	"file-sharing-backend/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	db, err := database.New()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db)
	fileHandler := handlers.NewFileHandler(db)
	adminHandler := handlers.NewAdminHandler(db)

	// Initialize cleanup service
	cleanupService := services.NewCleanupService(db)
	cleanupService.StartCleanupRoutine()

	// Initialize Gin
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization"},
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Auth routes
	r.POST("/api/auth/register", authHandler.Register)
	r.POST("/api/auth/login", authHandler.Login)

	// Public file access
	r.GET("/share/:uuid", fileHandler.GetFile)
	r.GET("/api/files/info/:uuid", fileHandler.GetFileInfo)
	r.GET("/api/files/info/:uuid", fileHandler.GetFileInfo)

	// Protected routes
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// File routes
		api.POST("/files/upload", fileHandler.UploadFiles)
		api.GET("/files", fileHandler.GetUserFiles)
		api.DELETE("/files/:uuid", fileHandler.DeleteFile)

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AdminMiddleware())
		{
			admin.GET("/stats", adminHandler.GetStats)
			admin.GET("/users", adminHandler.GetAllUsers)
			admin.GET("/files", adminHandler.GetAllFiles)
			admin.DELETE("/files/:id", adminHandler.DeleteFileAdmin)
		}
	}

	log.Println("Server starting on :8080...")
	log.Fatal(r.Run(":8080"))
}