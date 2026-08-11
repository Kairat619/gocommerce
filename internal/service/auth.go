package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"

	"gocommerce/internal/db"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailTaken         = errors.New("email is already registered")
	ErrWeakPassword       = errors.New("password does not meet requirements")
	ErrInvalidEmail       = errors.New("invalid email format")
)

type AuthService struct {
	queries *db.Queries
}

func NewAuthService(queries *db.Queries) *AuthService {
	return &AuthService{queries: queries}
}

// Register creates a new user account.
func (s *AuthService) Register(ctx context.Context, name, email, password string) (db.User, error) {
	if err := ValidatePassword(password); err != nil {
		return db.User{}, fmt.Errorf("%w: %v", ErrWeakPassword, err)
	}

	existing, err := s.queries.GetUserByEmail(ctx, email)
	if err == nil && existing.ID.Valid {
		return db.User{}, ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return db.User{}, err
	}

	user, err := s.queries.CreateUser(ctx, db.CreateUserParams{
		Name:         name,
		Email:        email,
		PasswordHash: string(hash),
		Role:         "customer",
	})
	if err != nil {
		return db.User{}, err
	}

	return user, nil
}

// Login authenticates a user with email and password.
func (s *AuthService) Login(ctx context.Context, email, password string) (db.User, error) {
	user, err := s.queries.GetUserByEmail(ctx, email)
	if err != nil {
		return db.User{}, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return db.User{}, ErrInvalidCredentials
	}

	return user, nil
}

// GetUserByID retrieves a user by their ID.
func (s *AuthService) GetUserByID(ctx context.Context, id string) (db.User, error) {
	uuid, err := ParseUUID(id)
	if err != nil {
		return db.User{}, fmt.Errorf("invalid user ID: %w", err)
	}
	return s.queries.GetUserByID(ctx, uuid)
}

// GetUserByEmail retrieves a user by their email.
func (s *AuthService) GetUserByEmail(ctx context.Context, email string) (db.User, error) {
	return s.queries.GetUserByEmail(ctx, email)
}

// UpdateUser updates user profile information.
func (s *AuthService) UpdateUser(ctx context.Context, id, name, email string) (db.User, error) {
	uuid, err := ParseUUID(id)
	if err != nil {
		return db.User{}, fmt.Errorf("invalid user ID: %w", err)
	}

	return s.queries.UpdateUser(ctx, db.UpdateUserParams{
		ID:    uuid,
		Name:  name,
		Email: email,
	})
}

// ValidatePassword checks if a password meets security requirements.
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	if len(password) > 128 {
		return errors.New("password must be less than 128 characters")
	}
	return nil
}

// ParseUUID parses a UUID string into a pgtype.UUID.
func ParseUUID(s string) (pgtype.UUID, error) {
	clean := make([]byte, 0, 32)
	for _, c := range s {
		if c != '-' {
			if (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F') {
				clean = append(clean, byte(c))
			}
		}
	}

	if len(clean) != 32 {
		return pgtype.UUID{}, errors.New("invalid UUID length")
	}

	var b [16]byte
	for i := 0; i < 32; i += 2 {
		hi := fromHexChar(clean[i])
		lo := fromHexChar(clean[i+1])
		if hi < 0 || lo < 0 {
			return pgtype.UUID{}, errors.New("invalid UUID character")
		}
		b[i/2] = byte(hi<<4 | lo)
	}

	return pgtype.UUID{Bytes: b, Valid: true}, nil
}

func fromHexChar(c byte) int {
	switch {
	case c >= '0' && c <= '9':
		return int(c - '0')
	case c >= 'a' && c <= 'f':
		return int(c-'a') + 10
	case c >= 'A' && c <= 'F':
		return int(c-'A') + 10
	default:
		return -1
	}
}

// UUIDToString converts a pgtype.UUID to a string.
func UUIDToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	b := u.Bytes
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
