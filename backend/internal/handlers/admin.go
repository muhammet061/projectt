package handlers

import (
	"net/http"
	"strconv"
	"time"

	"file-sharing-backend/internal/database"
	"file-sharing-backend/internal/models"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	db *database.DB
}

func NewAdminHandler(db *database.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

func (h *AdminHandler) GetStats(c *gin.Context) {
	var stats models.Stats

	// Total users
	h.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&stats.TotalUsers)

	// Total files
	h.db.QueryRow("SELECT COUNT(*) FROM files").Scan(&stats.TotalFiles)

	// Active files (not expired)
	h.db.QueryRow("SELECT COUNT(*) FROM files WHERE expires_at > NOW()").Scan(&stats.ActiveFiles)

	// Total downloads
	h.db.QueryRow("SELECT COUNT(*) FROM downloads").Scan(&stats.TotalDownloads)

	// Today's downloads
	h.db.QueryRow(`
		SELECT COUNT(*) FROM downloads 
		WHERE downloaded_at >= DATE_TRUNC('day', NOW())
	`).Scan(&stats.TodayDownloads)

	// Total file size
	h.db.QueryRow("SELECT COALESCE(SUM(file_size), 0) FROM files").Scan(&stats.TotalSize)

	c.JSON(http.StatusOK, stats)
}

func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	rows, err := h.db.Query(`
		SELECT u.id, u.email, u.is_admin, u.created_at, COUNT(f.id) as file_count
		FROM users u
		LEFT JOIN files f ON u.id = f.user_id
		GROUP BY u.id, u.email, u.is_admin, u.created_at
		ORDER BY u.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	defer rows.Close()

	var users []gin.H
	for rows.Next() {
		var user gin.H = make(gin.H)
		var id int
		var email string
		var isAdmin bool
		var createdAt time.Time
		var fileCount int

		err := rows.Scan(&id, &email, &isAdmin, &createdAt, &fileCount)
		if err != nil {
			continue
		}

		user["id"] = id
		user["email"] = email
		user["is_admin"] = isAdmin
		user["created_at"] = createdAt
		user["file_count"] = fileCount

		users = append(users, user)
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

func (h *AdminHandler) GetAllFiles(c *gin.Context) {
	rows, err := h.db.Query(`
		SELECT f.id, f.uuid, f.original_name, f.file_size, f.mime_type,
		       f.password_hash IS NOT NULL as has_password, f.download_count,
		       f.expires_at, f.created_at, u.email
		FROM files f
		JOIN users u ON f.user_id = u.id
		ORDER BY f.created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch files"})
		return
	}
	defer rows.Close()

	var files []gin.H
	for rows.Next() {
		var file gin.H = make(gin.H)
		var id int
		var uuid, originalName, mimeType, userEmail string
		var fileSize int64
		var hasPassword bool
		var downloadCount int
		var expiresAt, createdAt time.Time

		err := rows.Scan(&id, &uuid, &originalName, &fileSize, &mimeType,
			&hasPassword, &downloadCount, &expiresAt, &createdAt, &userEmail)
		if err != nil {
			continue
		}

		file["id"] = id
		file["uuid"] = uuid
		file["original_name"] = originalName
		file["file_size"] = fileSize
		file["mime_type"] = mimeType
		file["has_password"] = hasPassword
		file["download_count"] = downloadCount
		file["expires_at"] = expiresAt
		file["created_at"] = createdAt
		file["user_email"] = userEmail
		file["is_expired"] = time.Now().After(expiresAt)

		files = append(files, file)
	}

	c.JSON(http.StatusOK, gin.H{"files": files})
}

func (h *AdminHandler) DeleteFileAdmin(c *gin.Context) {
	fileIDStr := c.Param("id")
	fileID, err := strconv.Atoi(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	var filePath string
	err = h.db.QueryRow("SELECT file_path FROM files WHERE id = $1", fileID).Scan(&filePath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Delete file from filesystem (ignore errors)
	// os.Remove(filePath)

	// Delete file record from database
	_, err = h.db.Exec("DELETE FROM files WHERE id = $1", fileID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully"})
}