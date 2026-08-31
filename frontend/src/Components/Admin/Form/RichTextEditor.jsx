import { useEffect, useRef, useState } from "react";
import Field from "./Field";

const HEADINGS = [
  { value: "p", label: "Paragraph" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
  { value: "blockquote", label: "Quote" },
];

function ToolbarButton({ onClick, title, children, active }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-sm transition-colors ${
        active ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}

// Lightweight rich text editor built on contentEditable. The project ships no
// editor dependency, and the stored value stays plain HTML so existing product
// descriptions keep rendering unchanged.
export default function RichTextEditor({ label, name, value, onChange, error, hint, placeholder }) {
  const editorRef = useRef(null);
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || showSource) return;
    if (editor.innerHTML !== (value || "")) {
      editor.innerHTML = value || "";
    }
  }, [value, showSource]);

  function exec(command, argument = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    push();
  }

  function push() {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  function applyBlock(tag) {
    exec("formatBlock", tag === "p" ? "<p>" : `<${tag}>`);
  }

  function addLink() {
    const url = window.prompt("Link URL");
    if (!url) return;
    exec("createLink", url);
  }

  function addImage() {
    const url = window.prompt("Image URL");
    if (!url) return;
    exec("insertImage", url);
  }

  function addTable() {
    const html =
      '<table class="w-full border-collapse"><tbody>' +
      Array.from({ length: 3 })
        .map(
          () =>
            "<tr>" +
            Array.from({ length: 3 })
              .map(() => '<td style="border:1px solid #d1d5db;padding:6px">&nbsp;</td>')
              .join("") +
            "</tr>",
        )
        .join("") +
      "</tbody></table><p><br></p>";
    exec("insertHTML", html);
  }

  return (
    <Field label={label} htmlFor={name} hint={hint} error={error}>
      <div
        className={`overflow-hidden rounded-lg border ${
          error ? "border-red-400" : "border-gray-300"
        } focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500`}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-1.5 py-1">
          <select
            aria-label="Text style"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              applyBlock(e.target.value);
              e.target.value = "";
            }}
            disabled={showSource}
            defaultValue=""
            className="mr-1 h-8 rounded border-0 bg-transparent px-1 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40"
          >
            <option value="" disabled>
              Style
            </option>
            {HEADINGS.map((heading) => (
              <option key={heading.value} value={heading.value}>
                {heading.label}
              </option>
            ))}
          </select>

          <span className="mx-1 h-5 w-px bg-gray-300" />

          <ToolbarButton title="Bold" onClick={() => exec("bold")}>
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => exec("italic")}>
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton title="Underline" onClick={() => exec("underline")}>
            <span className="underline">U</span>
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-gray-300" />

          <ToolbarButton title="Bulleted list" onClick={() => exec("insertUnorderedList")}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 5.5a1 1 0 112 0 1 1 0 01-2 0zm4 .5a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9A.75.75 0 017 6zm-4 4a1 1 0 112 0 1 1 0 01-2 0zm4 .5a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm-4 4a1 1 0 112 0 1 1 0 01-2 0zm4 .5a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Numbered list" onClick={() => exec("insertOrderedList")}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4h1v3H3V4zm4 1.25A.75.75 0 017.75 4.5h9a.75.75 0 010 1.5h-9A.75.75 0 017 5.25zM3 9h2v1H4v.5h1v1H3v-1h1V10H3V9zm4 1.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zM3 13.5h2v3H3v-1h1v-.25H3v-1h1V14H3v-.5zm4 1.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75z" />
            </svg>
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-gray-300" />

          <ToolbarButton title="Insert link" onClick={addLink}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5z" />
              <path d="M7.414 15.414a2 2 0 11-2.828-2.828l3-3a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Remove link" onClick={() => exec("unlink")}>
            <span className="text-xs font-medium">Unlink</span>
          </ToolbarButton>
          <ToolbarButton title="Insert image" onClick={addImage}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-6 3 4 2-2 3 4z"
                clipRule="evenodd"
              />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Insert table" onClick={addTable}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v2h4V5H5zm6 0v2h4V5h-4zM5 9v2h4V9H5zm6 0v2h4V9h-4zm-6 4v2h4v-2H5zm6 0v2h4v-2h-4z"
                clipRule="evenodd"
              />
            </svg>
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-gray-300" />

          <ToolbarButton title="Clear formatting" onClick={() => exec("removeFormat")}>
            <span className="text-xs font-medium">Clear</span>
          </ToolbarButton>
          <ToolbarButton title="Edit HTML" active={showSource} onClick={() => setShowSource((current) => !current)}>
            <span className="font-mono text-xs">{"</>"}</span>
          </ToolbarButton>
        </div>

        {showSource ? (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            spellCheck={false}
            className="block w-full border-0 px-3 py-2 font-mono text-xs text-gray-800 focus:outline-none focus:ring-0"
          />
        ) : (
          <div
            id={name}
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={label}
            data-placeholder={placeholder}
            onInput={push}
            onBlur={push}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text/plain");
              document.execCommand("insertText", false, text);
              push();
            }}
            className="admin-richtext min-h-[12rem] w-full px-3 py-2 text-sm text-gray-900 focus:outline-none"
          />
        )}
      </div>
    </Field>
  );
}
