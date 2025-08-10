package models

import (
	"time"
)

type User struct {
	ID           int       `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	IsAdmin      bool      `json:"is_admin" db:"is_admin"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type File struct {
	ID           int       `json:"id" db:"id"`
	UUID         string    `json:"uuid" db:"uuid"`
	UserID       int       `json:"user_id" db:"user_id"`
	OriginalName string    `json:"original_name" db:"original_name"`
	FilePath     string    `json:"file_path" db:"file_path"`
	FileSize     int64     `json:"file_size" db:"file_size"`
	MimeType     string    `json:"mime_type" db:"mime_type"`
	PasswordHash *string   `json:"-" db:"password_hash"`
	HasPassword  bool      `json:"has_password"`
	DownloadCount int      `json:"download_count" db:"download_count"`
	ExpiresAt    time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
	IsExpired    bool      `json:"is_expired"`
}

type Download struct {
	ID           int       `json:"id" db:"id"`
	FileID       int       `json:"file_id" db:"file_id"`
	IPAddress    string    `json:"ip_address" db:"ip_address"`
	UserAgent    string    `json:"user_agent" db:"user_agent"`
	DownloadedAt time.Time `json:"downloaded_at" db:"downloaded_at"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type UploadResponse struct {
	UUID        string `json:"uuid"`
	ShareURL    string `json:"share_url"`
	FileName    string `json:"file_name"`
	FileSize    int64  `json:"file_size"`
	ExpiresAt   time.Time `json:"expires_at"`
	HasPassword bool   `json:"has_password"`
}

type Stats struct {
	TotalUsers     int `json:"total_users"`
	TotalFiles     int `json:"total_files"`
	ActiveFiles    int `json:"active_files"`
	TotalDownloads int `json:"total_downloads"`
	TodayDownloads int `json:"today_downloads"`
	TotalSize      int64 `json:"total_size"`
}