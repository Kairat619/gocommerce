import { useRef, useState } from "react";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"];
const MAX_BYTES = 10 * 1024 * 1024;

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Same endpoint and the same storage the product media uploader writes to
// (Cloudflare R2 in production, local disk in development) — this component
// only differs in holding a single image rather than an ordered gallery.
function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/admin/uploads");
    request.responseType = "json";
    request.withCredentials = true;

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      const payload = request.response || {};
      if (request.status >= 200 && request.status < 300 && payload.url) {
        resolve(payload);
      } else {
        reject(new Error(payload.error || `Upload failed (${request.status})`));
      }
    };
    request.onerror = () => reject(new Error("Upload failed — check your connection."));
    request.onabort = () => reject(new Error("Upload cancelled."));

    request.send(body);
  });
}

export default function SingleImageUploader({ value, onChange, alt = "", error, name = "image" }) {
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);

  function validate(file) {
    if (!ACCEPTED.includes(file.type)) {
      return "Unsupported format. Use JPG, PNG, WEBP, GIF, AVIF or SVG.";
    }
    if (file.size > MAX_BYTES) {
      return `Too large (${formatSize(file.size)}). Maximum is ${formatSize(MAX_BYTES)}.`;
    }
    return null;
  }

  async function handleFiles(fileList) {
    const file = Array.from(fileList || [])[0];
    if (!file) return;

    const problem = validate(file);
    if (problem) {
      setUploadError(problem);
      return;
    }

    setUploadError(null);
    setProgress(0);

    try {
      const result = await uploadFile(file, setProgress);
      // The previous image is left in storage on purpose: it may still be
      // referenced by another record, and nothing here owns the bucket.
      onChange(result.url);
    } catch (failure) {
      setUploadError(failure.message);
    } finally {
      setProgress(null);
    }
  }

  const uploading = progress !== null;
  const message = uploadError || error;

  if (value && !uploading) {
    return (
      <div>
        <div
          className={`overflow-hidden rounded-lg border ${message ? "border-red-400" : "border-gray-200"}`}
        >
          <div className="aspect-[16/9] bg-gray-100">
            <img src={value} alt={alt} className="h-full w-full object-cover" />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-xs text-gray-500" title={value}>
              {value}
            </p>
            <div className="flex flex-shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadError(null);
                  onChange("");
                }}
                className="text-xs font-medium text-gray-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        {message && (
          <p className="mt-1.5 text-sm text-red-600" role="alert">
            {message}
          </p>
        )}

        <input
          ref={inputRef}
          id={name}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragOver
            ? "border-indigo-500 bg-indigo-50"
            : message
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-gray-50"
        }`}
      >
        {uploading ? (
          <div>
            <p className="text-sm text-gray-600">Uploading… {progress}%</p>
            <div className="mx-auto mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <svg
              className="mx-auto h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5 7.5 12M12 7.5V21"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Drag an image here, or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                browse your files
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              JPG, PNG, WEBP, GIF, AVIF or SVG · up to {formatSize(MAX_BYTES)}
            </p>
          </>
        )}
      </div>

      {message && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {message}
        </p>
      )}

      <input
        ref={inputRef}
        id={name}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
