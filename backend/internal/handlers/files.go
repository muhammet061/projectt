package handlers

import (
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"file-sharing-backend/internal/database"
	"file-sharing-backend/internal/middleware"
	"file-sharing-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type FileHandler struct {
	db         *database.DB
	uploadPath string
}

func NewFileHandler(db *database.DB) *FileHandler {
	uploadPath := os.Getenv("UPLOAD_PATH")
	if uploadPath == "" {
		uploadPath = "./uploads"
	}
	
	// Create upload directory if it doesn't exist
	os.MkdirAll(uploadPath, 0755)
	
	return &FileHandler{
		db:         db,
		uploadPath: uploadPath,
	}
}

func (h *FileHandler) UploadFiles(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files uploaded"})
		return
	}

	password := c.PostForm("password")
	var passwordHash *string
	if password != "" {
		hashedPwd, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		hashStr := string(hashedPwd)
		passwordHash = &hashStr
	}

	var responses []models.UploadResponse
	expiresAt := time.Now().Add(24 * time.Hour)

	for _, file := range files {
		// Generate UUID for file
		fileUUID := uuid.New().String()
		
		// Create file path
		ext := filepath.Ext(file.Filename)
		fileName := fileUUID + ext
		filePath := filepath.Join(h.uploadPath, fileName)

		// Save file to disk
		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open uploaded file"})
			return
		}
		defer src.Close()

		dst, err := os.Create(filePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file on server"})
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, src); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Save file info to database
		var fileID int
		err = h.db.QueryRow(`
			INSERT INTO files (uuid, user_id, original_name, file_path, file_size, mime_type, password_hash, expires_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id`,
			fileUUID, userID, file.Filename, filePath, file.Size, file.Header.Get("Content-Type"), passwordHash, expiresAt,
		).Scan(&fileID)

		if err != nil {
			os.Remove(filePath) // Clean up file if database insert fails
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file info"})
			return
		}

		shareURL := fmt.Sprintf("/share/%s", fileUUID)
		
		responses = append(responses, models.UploadResponse{
			UUID:        fileUUID,
			ShareURL:    shareURL,
			FileName:    file.Filename,
			FileSize:    file.Size,
			ExpiresAt:   expiresAt,
			HasPassword: passwordHash != nil,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Files uploaded successfully",
		"files":   responses,
	})
}

func (h *FileHandler) GetUserFiles(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	rows, err := h.db.Query(`
		SELECT id, uuid, original_name, file_size, mime_type, 
		       password_hash IS NOT NULL as has_password,
		       download_count, expires_at, created_at
		FROM files 
		WHERE user_id = $1 
		ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch files"})
		return
	}
	defer rows.Close()

	var files []models.File
	for rows.Next() {
		var file models.File
		err := rows.Scan(
			&file.ID, &file.UUID, &file.OriginalName, &file.FileSize,
			&file.MimeType, &file.HasPassword, &file.DownloadCount,
			&file.ExpiresAt, &file.CreatedAt,
		)
		if err != nil {
			continue
		}
		
		file.IsExpired = time.Now().After(file.ExpiresAt)
		files = append(files, file)
	}

	c.JSON(http.StatusOK, gin.H{"files": files})
}

func (h *FileHandler) DeleteFile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	fileUUID := c.Param("uuid")
	if fileUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File UUID is required"})
		return
	}

	var file models.File
	err = h.db.QueryRow(`
		SELECT id, file_path, user_id 
		FROM files 
		WHERE uuid = $1`,
		fileUUID,
	).Scan(&file.ID, &file.FilePath, &file.UserID)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Check if user owns the file
	if file.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Delete file from filesystem
	if err := os.Remove(file.FilePath); err != nil {
		// Log error but continue with database deletion
		fmt.Printf("Warning: Failed to delete file from filesystem: %v\n", err)
	}

	// Delete file record from database
	_, err = h.db.Exec("DELETE FROM files WHERE id = $1", file.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully"})
}

func (h *FileHandler) GetFileInfo(c *gin.Context) {
	fileUUID := c.Param("uuid")
	if fileUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File UUID is required"})
		return
	}

	var file models.File
	err := h.db.QueryRow(`
		SELECT id, original_name, file_size, mime_type, 
		       password_hash IS NOT NULL as has_password, 
		       expires_at, download_count, created_at
		FROM files 
		WHERE uuid = $1`,
		fileUUID,
	).Scan(&file.ID, &file.OriginalName, &file.FileSize, 
		   &file.MimeType, &file.HasPassword, &file.ExpiresAt, 
		   &file.DownloadCount, &file.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Check if file is expired
	if time.Now().After(file.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "File has expired"})
		return
	}

	file.IsExpired = time.Now().After(file.ExpiresAt)

	c.JSON(http.StatusOK, gin.H{
		"file": gin.H{
			"original_name":  file.OriginalName,
			"file_size":      file.FileSize,
			"mime_type":      file.MimeType,
			"has_password":   file.HasPassword,
			"download_count": file.DownloadCount,
			"expires_at":     file.ExpiresAt,
			"created_at":     file.CreatedAt,
			"is_expired":     file.IsExpired,
		},
	})
}

func (h *FileHandler) GetFile(c *gin.Context) {
	fileUUID := c.Param("uuid")
	if fileUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File UUID is required"})
		return
	}

	// ALWAYS redirect browser requests to frontend first
	acceptHeader := c.GetHeader("Accept")
	userAgent := c.GetHeader("User-Agent")
	
	// Check if this is a browser request (not an API call)
	isBrowserRequest := strings.Contains(acceptHeader, "text/html") || strings.Contains(userAgent, "Mozilla")
	
	// If browser request and no password query param, redirect to frontend
	if isBrowserRequest && c.Query("password") == "" {
		// Get the frontend URL from environment or use default
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "http://localhost:3000"
		}
		redirectURL := fmt.Sprintf("%s/share/%s", frontendURL, fileUUID)
		fmt.Printf("Redirecting browser to: %s\n", redirectURL)
		c.Redirect(http.StatusFound, redirectURL)
		return
	}

	var file models.File
	err := h.db.QueryRow(`
		SELECT id, original_name, file_path, file_size, mime_type, 
		       password_hash, expires_at, download_count
		FROM files 
		WHERE uuid = $1`,
		fileUUID,
	).Scan(&file.ID, &file.OriginalName, &file.FilePath, &file.FileSize, 
		   &file.MimeType, &file.PasswordHash, &file.ExpiresAt, &file.DownloadCount)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Check if file is expired
	if time.Now().After(file.ExpiresAt) {
		c.JSON(http.StatusGone, gin.H{"error": "File has expired"})
		return
	}

	// Check if password is required
	if file.PasswordHash != nil {
		password := c.Query("password")
		if password == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":            "Password required",
				"password_required": true,
			})
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(*file.PasswordHash), []byte(password))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
			return
		}
	}

	// Increment download count
	_, err = h.db.Exec("UPDATE files SET download_count = download_count + 1 WHERE id = $1", file.ID)
	if err != nil {
		fmt.Printf("Warning: Failed to increment download count: %v\n", err)
	}

	// Log download
	clientIP := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	_, err = h.db.Exec(`
		INSERT INTO downloads (file_id, ip_address, user_agent) 
		VALUES ($1, $2, $3)`,
		file.ID, clientIP, userAgent,
	)
	if err != nil {
		fmt.Printf("Warning: Failed to log download: %v\n", err)
	}

	// Serve file
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", "attachment; filename="+file.OriginalName)
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Length", strconv.FormatInt(file.FileSize, 10))

	c.File(file.FilePath)
}