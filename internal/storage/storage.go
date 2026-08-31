// Package storage stores uploaded media and returns the public URL for it.
// Cloudflare R2 is used when configured (see config.R2Config); otherwise files
// are written to public/uploads and served by the app's static file server.
package storage

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"
)

// ErrUnsupportedType is returned when a file's content type is not an allowed image type.
var ErrUnsupportedType = errors.New("unsupported file type")

// allowedTypes maps accepted content types to their file extension.
var allowedTypes = map[string]string{
	"image/jpeg":    ".jpg",
	"image/pjpeg":   ".jpg",
	"image/png":     ".png",
	"image/webp":    ".webp",
	"image/gif":     ".gif",
	"image/avif":    ".avif",
	"image/svg+xml": ".svg",
}

// Storage saves a file and returns the URL it can be served from.
type Storage interface {
	Put(ctx context.Context, key, contentType string, body []byte) (string, error)
	Name() string
}

// ExtensionFor returns the canonical extension for an allowed image content
// type, or ErrUnsupportedType when the type is not an accepted image.
func ExtensionFor(contentType string) (string, error) {
	base, _, _ := strings.Cut(contentType, ";")
	ext, ok := allowedTypes[strings.ToLower(strings.TrimSpace(base))]
	if !ok {
		return "", ErrUnsupportedType
	}
	return ext, nil
}

// BuildKey returns a collision-resistant object key under prefix that keeps a
// readable trace of the original file name.
func BuildKey(prefix, originalName, ext string) (string, error) {
	stem := strings.TrimSuffix(filepath.Base(originalName), filepath.Ext(originalName))
	stem = sanitize(stem)
	if stem == "" {
		stem = "image"
	}
	if len(stem) > 60 {
		stem = stem[:60]
	}

	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}

	now := time.Now().UTC()
	return path.Join(prefix, now.Format("2006/01"), fmt.Sprintf("%s-%x%s", stem, buf, ext)), nil
}

func sanitize(s string) string {
	var b strings.Builder
	prevDash := false
	for _, r := range strings.ToLower(s) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			prevDash = false
		default:
			if !prevDash && b.Len() > 0 {
				b.WriteByte('-')
				prevDash = true
			}
		}
	}
	return strings.Trim(b.String(), "-")
}

// Local writes uploads under Root and serves them from BaseURL.
type Local struct {
	Root    string // filesystem directory, e.g. "public/uploads"
	BaseURL string // public prefix, e.g. "/uploads"
}

// NewLocal returns a Local storage rooted at public/uploads.
func NewLocal() *Local {
	return &Local{Root: filepath.Join("public", "uploads"), BaseURL: "/uploads"}
}

func (l *Local) Name() string { return "local" }

func (l *Local) Put(ctx context.Context, key, contentType string, body []byte) (string, error) {
	dest := filepath.Join(l.Root, filepath.FromSlash(key))
	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return "", err
	}

	f, err := os.Create(dest)
	if err != nil {
		return "", err
	}
	defer f.Close()

	if _, err := f.Write(body); err != nil {
		return "", err
	}

	return l.BaseURL + "/" + key, nil
}
