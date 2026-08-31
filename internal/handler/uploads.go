package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"gocommerce/internal/storage"
)

// UploadHandler receives admin media uploads and hands them to the configured
// storage backend (Cloudflare R2 in production, local disk in development).
type UploadHandler struct {
	store   storage.Storage
	maxSize int64
}

func NewUploadHandler(store storage.Storage, maxSize int64) *UploadHandler {
	return &UploadHandler{store: store, maxSize: maxSize}
}

// Store accepts a single "file" form field and responds with the public URL.
// It answers JSON because it is called by XHR from the product media manager
// rather than as an Inertia visit.
func (h *UploadHandler) Store() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, h.maxSize+(1<<20))

		if err := r.ParseMultipartForm(h.maxSize + (1 << 20)); err != nil {
			writeUploadError(w, http.StatusRequestEntityTooLarge, "File is too large.")
			return
		}
		defer r.MultipartForm.RemoveAll()

		file, header, err := r.FormFile("file")
		if err != nil {
			writeUploadError(w, http.StatusBadRequest, "No file was uploaded.")
			return
		}
		defer file.Close()

		if header.Size > h.maxSize {
			writeUploadError(w, http.StatusRequestEntityTooLarge, "File is too large.")
			return
		}

		body, err := io.ReadAll(io.LimitReader(file, h.maxSize))
		if err != nil {
			writeUploadError(w, http.StatusBadRequest, "Could not read the uploaded file.")
			return
		}

		contentType := header.Header.Get("Content-Type")
		if contentType == "" {
			contentType = http.DetectContentType(body)
		}

		ext, err := storage.ExtensionFor(contentType)
		if err != nil {
			writeUploadError(w, http.StatusUnsupportedMediaType, "Only JPG, PNG, WEBP, GIF, AVIF and SVG images are allowed.")
			return
		}

		key, err := storage.BuildKey("products", header.Filename, ext)
		if err != nil {
			writeUploadError(w, http.StatusInternalServerError, "Could not prepare the upload.")
			return
		}

		url, err := h.store.Put(r.Context(), key, contentType, body)
		if err != nil {
			writeUploadError(w, http.StatusBadGateway, "Upload failed: "+err.Error())
			return
		}

		writeJSON(w, http.StatusCreated, map[string]any{
			"url":  url,
			"name": header.Filename,
			"size": len(body),
		})
	}
}

func writeUploadError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]any{"error": message})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
