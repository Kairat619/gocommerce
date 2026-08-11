package middleware

import (
	"net/http"
	"sync"
	"time"
)

// RateLimiter provides in-memory rate limiting.
type RateLimiter struct {
	mu       sync.Mutex
	attempts map[string][]time.Time
	limit    int
	window   time.Duration
}

// NewRateLimiter creates a new rate limiter with the given limit and window.
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		attempts: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

// Allow checks if a request from the given key is allowed.
func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	// Clean up old attempts
	attempts := rl.attempts[key]
	validAttempts := make([]time.Time, 0, len(attempts))
	for _, t := range attempts {
		if t.After(windowStart) {
			validAttempts = append(validAttempts, t)
		}
	}

	if len(validAttempts) >= rl.limit {
		rl.attempts[key] = validAttempts
		return false
	}

	rl.attempts[key] = append(validAttempts, now)
	return true
}

// Reset clears attempts for a key (e.g., after successful login).
func (rl *RateLimiter) Reset(key string) {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	delete(rl.attempts, key)
}

// Remaining returns the number of remaining attempts for a key.
func (rl *RateLimiter) Remaining(key string) int {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	windowStart := now.Add(-rl.window)

	attempts := rl.attempts[key]
	validAttempts := 0
	for _, t := range attempts {
		if t.After(windowStart) {
			validAttempts++
		}
	}

	remaining := rl.limit - validAttempts
	if remaining < 0 {
		return 0
	}
	return remaining
}

// RateLimitMiddleware creates middleware that rate-limits requests by IP.
func RateLimitMiddleware(limiter *RateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr
			if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
				ip = forwarded
			}

			if !limiter.Allow(ip) {
				w.Header().Set("Retry-After", "60")
				http.Error(w, "Too many requests. Please try again later.", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// LoginRateLimiter creates a rate limiter specifically for login attempts.
func LoginRateLimiter() *RateLimiter {
	return NewRateLimiter(10, 1*time.Minute)
}
