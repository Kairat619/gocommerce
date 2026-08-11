package session

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type key string

const sessionKey key = "session"

// sessionTTL is how long a session lives before it is considered expired.
const sessionTTL = 24 * time.Hour

// Store is a Postgres-backed session store. Sessions persist across restarts
// and can be shared across multiple app replicas.
type Store struct {
	pool *pgxpool.Pool
}

// Session is a per-request handle to a single session row. It caches the
// session data map for the lifetime of the request and writes changes back to
// Postgres immediately.
type Session struct {
	id     string
	store  *Store
	values map[string]any
}

// New creates a new Postgres-backed session store.
func New(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// load reads a session's data map from Postgres. A missing or expired session
// yields an empty map.
func (s *Store) load(ctx context.Context, sessionID string) map[string]any {
	values := make(map[string]any)
	if s == nil || s.pool == nil {
		return values
	}

	var raw []byte
	err := s.pool.QueryRow(ctx,
		`SELECT data FROM sessions WHERE id = $1 AND expires_at > NOW()`,
		sessionID,
	).Scan(&raw)
	if err != nil {
		// No row (or a transient error): treat as an empty session.
		return values
	}

	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &values); err != nil {
			log.Printf("session: failed to decode data for %s: %v", sessionID, err)
			return make(map[string]any)
		}
	}
	return values
}

// persist upserts a session's data map into Postgres.
func (s *Store) persist(ctx context.Context, sessionID string, values map[string]any) {
	if s == nil || s.pool == nil {
		return
	}

	raw, err := json.Marshal(values)
	if err != nil {
		log.Printf("session: failed to encode data for %s: %v", sessionID, err)
		return
	}

	_, err = s.pool.Exec(ctx,
		`INSERT INTO sessions (id, data, expires_at)
		 VALUES ($1, $2, NOW() + $3::interval)
		 ON CONFLICT (id) DO UPDATE
		 SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`,
		sessionID, raw, sessionTTL.String(),
	)
	if err != nil {
		log.Printf("session: failed to persist %s: %v", sessionID, err)
	}
}

// remove deletes a session row from Postgres.
func (s *Store) remove(ctx context.Context, sessionID string) {
	if s == nil || s.pool == nil {
		return
	}
	if _, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE id = $1`, sessionID); err != nil {
		log.Printf("session: failed to delete %s: %v", sessionID, err)
	}
}

// DeleteExpired removes expired session rows. Safe to call periodically.
func (s *Store) DeleteExpired(ctx context.Context) error {
	if s == nil || s.pool == nil {
		return nil
	}
	_, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE expires_at <= NOW()`)
	return err
}

// Get retrieves a value from the session.
func (sess *Session) Get(key string) (any, bool) {
	val, ok := sess.values[key]
	return val, ok
}

// Set stores a value in the session and persists it.
func (sess *Session) Set(key string, value any) {
	sess.values[key] = value
	sess.store.persist(context.Background(), sess.id, sess.values)
}

// Delete removes a value from the session and persists the change.
func (sess *Session) Delete(key string) {
	delete(sess.values, key)
	sess.store.persist(context.Background(), sess.id, sess.values)
}

// Destroy wipes the entire session.
func (sess *Session) Destroy() {
	sess.values = make(map[string]any)
	sess.store.remove(context.Background(), sess.id)
}

// ID returns the session ID.
func (sess *Session) ID() string {
	return sess.id
}

// Regenerate creates a new session ID, migrates data to it, and removes the old
// row. Returns the new ID.
func (sess *Session) Regenerate() string {
	ctx := context.Background()
	oldID := sess.id
	newID := generateSecureID()

	newValues := make(map[string]any, len(sess.values))
	for k, v := range sess.values {
		newValues[k] = v
	}

	sess.store.persist(ctx, newID, newValues)
	sess.store.remove(ctx, oldID)

	sess.id = newID
	sess.values = newValues
	return newID
}

// RegenerateWithCookie creates a new session ID, migrates data, and updates the cookie.
func (sess *Session) RegenerateWithCookie(w http.ResponseWriter) string {
	newID := sess.Regenerate()
	setSessionCookie(w, newID, sessionTTL)
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
				setSessionCookie(w, sessionID, sessionTTL)
			} else {
				sessionID = cookie.Value
			}

			sess := &Session{
				id:     sessionID,
				store:  store,
				values: store.load(r.Context(), sessionID),
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
