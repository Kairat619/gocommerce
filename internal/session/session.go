package session

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"sync"
	"time"
)

type key string

const sessionKey key = "session"

// Store is a cookie-based session store for development.
// In production, swap this for a server-side store (Redis, Postgres, etc.)
type Store struct {
	mu       sync.RWMutex
	sessions map[string]map[string]any
}

type Session struct {
	id          string
	store       *Store
	values      map[string]any
	regenerated bool
}

// New creates a new session store.
func New() *Store {
	return &Store{
		sessions: make(map[string]map[string]any),
	}
}

func (s *Store) getOrCreate(sessionID string) map[string]any {
	s.mu.Lock()
	defer s.mu.Unlock()
	if data, ok := s.sessions[sessionID]; ok {
		return data
	}
	s.sessions[sessionID] = make(map[string]any)
	return s.sessions[sessionID]
}

// Get retrieves a value from the session.
func (s *Store) Get(sessionID string, key string) (any, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	data, ok := s.sessions[sessionID]
	if !ok {
		return nil, false
	}
	val, ok := data[key]
	return val, ok
}

// Set stores a value in the session.
func (s *Store) Set(sessionID string, key string, value any) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.sessions[sessionID]; !ok {
		s.sessions[sessionID] = make(map[string]any)
	}
	s.sessions[sessionID][key] = value
}

// Delete removes a value from the session.
func (s *Store) Delete(sessionID string, key string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if data, ok := s.sessions[sessionID]; ok {
		delete(data, key)
	}
}

// Destroy wipes the entire session.
func (s *Store) Destroy(sessionID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, sessionID)
}

// Regenerate creates a new session ID and migrates data from the old session.
func (s *Store) Regenerate(oldID string) (string, map[string]any) {
	s.mu.Lock()
	defer s.mu.Unlock()

	newID := generateSecureID()

	// Copy data from old session
	oldData, ok := s.sessions[oldID]
	if ok {
		newData := make(map[string]any, len(oldData))
		for k, v := range oldData {
			newData[k] = v
		}
		s.sessions[newID] = newData
	} else {
		s.sessions[newID] = make(map[string]any)
	}

	// Remove old session
	delete(s.sessions, oldID)

	return newID, s.sessions[newID]
}

// Get retrieves a value from the session.
func (sess *Session) Get(key string) (any, bool) {
	return sess.store.Get(sess.id, key)
}

// Set stores a value in the session.
func (sess *Session) Set(key string, value any) {
	sess.store.Set(sess.id, key, value)
}

// Delete removes a value from the session.
func (sess *Session) Delete(key string) {
	sess.store.Delete(sess.id, key)
}

// Destroy wipes the entire session.
func (sess *Session) Destroy() {
	sess.store.Destroy(sess.id)
}

// ID returns the session ID.
func (sess *Session) ID() string {
	return sess.id
}

// Regenerate creates a new session ID and migrates data.
func (sess *Session) Regenerate() string {
	newID, _ := sess.store.Regenerate(sess.id)
	sess.id = newID
	return newID
}

// RegenerateWithCookie creates a new session ID, migrates data, and updates the cookie.
func (sess *Session) RegenerateWithCookie(w http.ResponseWriter) string {
	newID := sess.Regenerate()
	setSessionCookie(w, newID, 24*time.Hour)
	return newID
}

// FromContext retrieves the session from the request context.
func FromContext(ctx context.Context) *Session {
	sess, _ := ctx.Value(sessionKey).(*Session)
	return sess
}

// Middleware reads/creates a session cookie and injects the Session into context.
func Middleware(store *Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie("gocommerce_session")
			var sessionID string

			if err != nil || cookie.Value == "" {
				sessionID = generateSecureID()
				setSessionCookie(w, sessionID, 24*time.Hour)
			} else {
				sessionID = cookie.Value
			}

			sess := &Session{
				id:     sessionID,
				store:  store,
				values: store.getOrCreate(sessionID),
			}

			ctx := context.WithValue(r.Context(), sessionKey, sess)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// setSessionCookie sets the session cookie with the given duration.
func setSessionCookie(w http.ResponseWriter, sessionID string, maxAge time.Duration) {
	http.SetCookie(w, &http.Cookie{
		Name:     "gocommerce_session",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(maxAge.Seconds()),
	})
}

// SetRememberMe sets a long-lived remember me cookie.
func SetRememberMe(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "gocommerce_remember",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(30 * 24 * time.Hour.Seconds()), // 30 days
	})
}

// ClearRememberMe clears the remember me cookie.
func ClearRememberMe(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "gocommerce_remember",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	})
}

// generateSecureID generates a cryptographically secure random session ID.
func generateSecureID() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		// Fallback to timestamp-based ID if crypto/rand fails
		return generateFallbackID()
	}
	return hex.EncodeToString(b)
}

func generateFallbackID() string {
	b := make([]byte, 32)
	for i := range b {
		b[i] = "abcdefghijklmnopqrstuvwxyz0123456789"[time.Now().UnixNano()%36]
		time.Sleep(time.Nanosecond)
	}
	return string(b)
}
