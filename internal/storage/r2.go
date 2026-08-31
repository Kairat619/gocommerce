package storage

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// R2 uploads objects to Cloudflare R2 (or any S3-compatible endpoint) using
// SigV4 request signing over the standard library HTTP client.
type R2 struct {
	Endpoint  string // e.g. https://<account>.r2.cloudflarestorage.com
	AccessKey string
	SecretKey string
	Bucket    string
	PublicURL string // CDN / public bucket URL used to build the returned URL
	Region    string
	Client    *http.Client
}

// NewR2 builds an R2 storage client. Region defaults to "auto", which is what
// Cloudflare R2 expects.
func NewR2(endpoint, accessKey, secretKey, bucket, publicURL string) *R2 {
	return &R2{
		Endpoint:  strings.TrimRight(endpoint, "/"),
		AccessKey: accessKey,
		SecretKey: secretKey,
		Bucket:    bucket,
		PublicURL: strings.TrimRight(publicURL, "/"),
		Region:    "auto",
		Client:    &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *R2) Name() string { return "r2" }

func (s *R2) Put(ctx context.Context, key, contentType string, body []byte) (string, error) {
	target := fmt.Sprintf("%s/%s/%s", s.Endpoint, s.Bucket, key)

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, target, bytes.NewReader(body))
	if err != nil {
		return "", err
	}

	payloadHash := sha256Hex(body)
	now := time.Now().UTC()

	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Cache-Control", "public, max-age=31536000, immutable")
	req.Header.Set("X-Amz-Content-Sha256", payloadHash)
	req.Header.Set("X-Amz-Date", now.Format("20060102T150405Z"))
	req.ContentLength = int64(len(body))

	if err := s.sign(req, payloadHash, now); err != nil {
		return "", err
	}

	resp, err := s.Client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		detail, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return "", fmt.Errorf("r2 upload failed (%s): %s", resp.Status, strings.TrimSpace(string(detail)))
	}

	base := s.PublicURL
	if base == "" {
		base = fmt.Sprintf("%s/%s", s.Endpoint, s.Bucket)
	}
	return base + "/" + key, nil
}

// sign adds an AWS Signature Version 4 Authorization header to req.
func (s *R2) sign(req *http.Request, payloadHash string, now time.Time) error {
	amzDate := now.Format("20060102T150405Z")
	dateStamp := now.Format("20060102")
	scope := fmt.Sprintf("%s/%s/s3/aws4_request", dateStamp, s.Region)

	signedHeaders := "cache-control;content-type;host;x-amz-content-sha256;x-amz-date"
	canonicalHeaders := strings.Join([]string{
		"cache-control:" + req.Header.Get("Cache-Control"),
		"content-type:" + req.Header.Get("Content-Type"),
		"host:" + req.URL.Host,
		"x-amz-content-sha256:" + payloadHash,
		"x-amz-date:" + amzDate,
	}, "\n") + "\n"

	canonicalRequest := strings.Join([]string{
		req.Method,
		canonicalURI(req.URL),
		req.URL.RawQuery,
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	}, "\n")

	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256",
		amzDate,
		scope,
		sha256Hex([]byte(canonicalRequest)),
	}, "\n")

	key := hmacSHA256([]byte("AWS4"+s.SecretKey), dateStamp)
	key = hmacSHA256(key, s.Region)
	key = hmacSHA256(key, "s3")
	key = hmacSHA256(key, "aws4_request")
	signature := hex.EncodeToString(hmacSHA256(key, stringToSign))

	req.Header.Set("Authorization", fmt.Sprintf(
		"AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		s.AccessKey, scope, signedHeaders, signature,
	))
	return nil
}

// canonicalURI URI-encodes each path segment as SigV4 requires, leaving the
// separators intact.
func canonicalURI(u *url.URL) string {
	segments := strings.Split(u.EscapedPath(), "/")
	for i, seg := range segments {
		unescaped, err := url.PathUnescape(seg)
		if err != nil {
			continue
		}
		segments[i] = strings.ReplaceAll(url.QueryEscape(unescaped), "+", "%20")
	}
	return strings.Join(segments, "/")
}

func sha256Hex(b []byte) string {
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

func hmacSHA256(key []byte, data string) []byte {
	m := hmac.New(sha256.New, key)
	m.Write([]byte(data))
	return m.Sum(nil)
}
