// Package config provides centralized configuration management for GoCommerce.
// All environment variables are loaded and validated here.
package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all application configuration.
type Config struct {
	Port      string
	AppEnv    string
	AppURL    string
	Database  DatabaseConfig
	Session   SessionConfig
	R2        R2Config
	RateLimit RateLimitConfig
	Upload    UploadConfig
}

// DatabaseConfig holds PostgreSQL connection settings.
type DatabaseConfig struct {
	URL string
}

// SessionConfig holds session management settings.
type SessionConfig struct {
	Key string
}

// R2Config holds Cloudflare R2 (S3-compatible) storage settings.
type R2Config struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	PublicURL string
}

// RateLimitConfig holds rate limiting settings.
type RateLimitConfig struct {
	Login int
}

// UploadConfig holds file upload settings.
type UploadConfig struct {
	MaxSize int64
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	return &Config{
		Port:   getEnv("PORT", "8080"),
		AppEnv: getEnv("APP_ENV", "development"),
		AppURL: getEnv("APP_URL", "http://localhost:5173"),
		Database: DatabaseConfig{
			URL: getEnv("DATABASE_URL", "postgres://gocommerce:gocommerce@localhost:5432/gocommerce?sslmode=disable"),
		},
		Session: SessionConfig{
			Key: getEnv("SESSION_KEY", "change-me-in-production"),
		},
		R2: R2Config{
			Endpoint:  os.Getenv("R2_ENDPOINT"),
			AccessKey: os.Getenv("R2_ACCESS_KEY"),
			SecretKey: os.Getenv("R2_SECRET_KEY"),
			Bucket:    os.Getenv("R2_BUCKET"),
			PublicURL: os.Getenv("R2_PUBLIC_URL"),
		},
		RateLimit: RateLimitConfig{
			Login: getEnvInt("RATE_LIMIT_LOGIN", 10),
		},
		Upload: UploadConfig{
			MaxSize: getEnvInt64("MAX_UPLOAD_SIZE", 10<<20),
		},
	}
}

// IsDevelopment returns true if running in development mode.
func (c *Config) IsDevelopment() bool {
	return c.AppEnv == "development"
}

// IsProduction returns true if running in production mode.
func (c *Config) IsProduction() bool {
	return c.AppEnv == "production"
}

// DSN returns the database connection string.
func (c *Config) DSN() string {
	return c.Database.URL
}

// R2Enabled returns true if R2 storage is configured.
func (c *Config) R2Enabled() bool {
	return c.R2.Endpoint != "" && c.R2.AccessKey != "" && c.R2.SecretKey != "" && c.R2.Bucket != ""
}

// Validate checks that required configuration values are set.
func (c *Config) Validate() error {
	if c.Session.Key == "" || c.Session.Key == "change-me-in-production" {
		if c.IsProduction() {
			return fmt.Errorf("SESSION_KEY must be set in production")
		}
	}
	return nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvInt64(key string, fallback int64) int64 {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.ParseInt(value, 10, 64); err == nil {
			return i
		}
	}
	return fallback
}
