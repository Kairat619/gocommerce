package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect creates a new PostgreSQL connection pool using the provided DSN.
// It retries the initial ping to tolerate the database not being reachable
// the instant the app boots (common on platforms like Railway).
func Connect(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	const maxAttempts = 10
	var lastErr error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		lastErr = pool.Ping(pingCtx)
		cancel()
		if lastErr == nil {
			return pool, nil
		}
		log.Printf("database not ready (attempt %d/%d): %v", attempt, maxAttempts, lastErr)
		time.Sleep(time.Duration(attempt) * time.Second)
	}

	pool.Close()
	return nil, fmt.Errorf("unable to ping database after %d attempts: %w", maxAttempts, lastErr)
}
