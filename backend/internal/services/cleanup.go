package services

import (
	"log"
	"os"
	"time"

	"file-sharing-backend/internal/database"
)

type CleanupService struct {
	db *database.DB
}

func NewCleanupService(db *database.DB) *CleanupService {
	return &CleanupService{db: db}
}

func (cs *CleanupService) StartCleanupRoutine() {
	ticker := time.NewTicker(1 * time.Hour)
	go func() {
		for range ticker.C {
			cs.CleanupExpiredFiles()
		}
	}()
}

func (cs *CleanupService) CleanupExpiredFiles() {
	log.Println("Starting cleanup of expired files...")

	query := `
		SELECT id, file_path, original_name 
		FROM files 
		WHERE expires_at < NOW()
	`
	
	rows, err := cs.db.Query(query)
	if err != nil {
		log.Printf("Error querying expired files: %v", err)
		return
	}
	defer rows.Close()

	var expiredFiles []struct {
		ID       int
		FilePath string
		Name     string
	}

	for rows.Next() {
		var file struct {
			ID       int
			FilePath string
			Name     string
		}
		if err := rows.Scan(&file.ID, &file.FilePath, &file.Name); err != nil {
			log.Printf("Error scanning expired file: %v", err)
			continue
		}
		expiredFiles = append(expiredFiles, file)
	}

	for _, file := range expiredFiles {
		// Delete file from filesystem
		if err := os.Remove(file.FilePath); err != nil {
			log.Printf("Error deleting file %s: %v", file.FilePath, err)
		} else {
			log.Printf("Deleted expired file: %s", file.Name)
		}

		// Delete file record from database
		_, err := cs.db.Exec("DELETE FROM files WHERE id = $1", file.ID)
		if err != nil {
			log.Printf("Error deleting file record %d: %v", file.ID, err)
		}
	}

	log.Printf("Cleanup completed. Removed %d expired files", len(expiredFiles))
}
