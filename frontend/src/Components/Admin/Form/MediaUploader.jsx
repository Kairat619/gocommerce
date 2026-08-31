import { useRef, useState } from "react";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"];
const MAX_BYTES = 10 * 1024 * 1024;

let uploadKey = 0;

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// Sends one file to /admin/uploads. XHR rather than fetch so the progress bar
// can report real upload progress.
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

export default function MediaUploader({ images = [], onChange, errors = {} }) {
  const [pending, setPending] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
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
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const accepted = [];
    const rejected = [];

    files.forEach((file) => {
      const problem = validate(file);
      if (problem) rejected.push({ key: `u${uploadKey++}`, name: file.name, error: problem });
      else accepted.push({ key: `u${uploadKey++}`, name: file.name, file, progress: 0 });
    });

    setPending((current) => [...current, ...accepted, ...rejected]);

    for (const item of accepted) {
      try {
        const result = await uploadFile(item.file, (progress) => {
          setPending((current) => current.map((p) => (p.key === item.key ? { ...p, progress } : p)));
        });
        onChange((current) => [
          ...current,
          { url: result.url, alt_text: "", is_primary: current.length === 0 },
        ]);
        setPending((current) => current.filter((p) => p.key !== item.key));
      } catch (error) {
        setPending((current) =>
          current.map((p) => (p.key === item.key ? { ...p, error: error.message, progress: 0 } : p)),
        );
      }
    }
  }

  function move(from, to) {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function remove(index) {
    const next = images.filter((_, i) => i !== index);
    if (next.length > 0 && !next.some((image) => image.is_primary)) {
      next[0] = { ...next[0], is_primary: true };
    }
    onChange(next);
  }

  function setPrimary(index) {
    onChange(images.map((image, i) => ({ ...image, is_primary: i === index })));
  }

  function updateAlt(index, alt) {
    onChange(images.map((image, i) => (i === index ? { ...image, alt_text: alt } : image)));
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
          dragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-gray-50"
        }`}
      >
        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5 7.5 12M12 7.5V21"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          Drag images here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            browse your files
          </button>
        </p>
        <p className="mt-1 text-xs text-gray-500">JPG, PNG, WEBP, GIF, AVIF or SVG · up to {formatSize(MAX_BYTES)} each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {pending.length > 0 && (
        <ul className="mt-3 space-y-2">
          {pending.map((item) => (
            <li key={item.key} className="rounded-lg border border-gray-200 px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-gray-700">{item.name}</span>
                {item.error ? (
                  <button
                    type="button"
                    onClick={() => setPending((current) => current.filter((p) => p.key !== item.key))}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Dismiss
                  </button>
                ) : (
                  <span className="text-xs text-gray-500">{item.progress}%</span>
                )}
              </div>
              {item.error ? (
                <p className="mt-1 text-xs text-red-600">{item.error}</p>
              ) : (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-[width] duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {images.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={`${image.url}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              className={`group relative overflow-hidden rounded-lg border bg-white ${
                image.is_primary ? "border-indigo-500 ring-1 ring-indigo-500" : "border-gray-200"
              } ${dragIndex === index ? "opacity-50" : ""}`}
            >
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img src={image.url} alt={image.alt_text || ""} className="h-full w-full object-cover" />
              </div>

              {image.is_primary && (
                <span className="absolute left-1.5 top-1.5 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Main
                </span>
              )}

              <button
                type="button"
                onClick={() => remove(index)}
                aria-label="Remove image"
                className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-gray-500 shadow-sm hover:text-red-600"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>

              <div className="space-y-1.5 p-2">
                <input
                  value={image.alt_text || ""}
                  onChange={(e) => updateAlt(index, e.target.value)}
                  placeholder="Alt text"
                  className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(index, index - 1)}
                      disabled={index === 0}
                      aria-label="Move image earlier"
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, index + 1)}
                      disabled={index === images.length - 1}
                      aria-label="Move image later"
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" />
                      </svg>
                    </button>
                  </div>
                  {!image.is_primary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(index)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Set main
                    </button>
                  )}
                </div>
              </div>

              {errors[`images.${index}.url`] && (
                <p className="border-t border-red-100 bg-red-50 px-2 py-1 text-xs text-red-600">
                  {errors[`images.${index}.url`]}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {images.length === 0 && pending.length === 0 && (
        <p className="mt-3 text-xs text-gray-500">
          The first image you add becomes the main product image shown in listings and search results.
        </p>
      )}
    </div>
  );
}
