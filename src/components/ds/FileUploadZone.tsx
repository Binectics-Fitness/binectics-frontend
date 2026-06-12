"use client";

import { useState, useRef, useCallback } from "react";

interface FileUploadZoneProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFiles: (files: File[]) => void;
  children?: React.ReactNode;
}

export function FileUploadZone({
  accept,
  multiple = false,
  maxSizeMB = 10,
  onFiles,
  children,
}: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const arr = Array.from(fileList).filter((f) => f.size <= maxSizeMB * 1024 * 1024);
      setFiles(arr);
      onFiles(arr);
    },
    [maxSizeMB, onFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFiles(updated);
  };

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-(--r-3) border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragOver ? "border-signal bg-signal-soft" : "border-border-2 bg-bg hover:border-fg-4 hover:bg-bg-2"
        }`}
        style={{ transitionDuration: "var(--motion-fast)" }}
      >
        {children || (
          <>
            <svg
              className="mb-3 h-8 w-8 text-fg-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1={12} y1={3} x2={12} y2={15} />
            </svg>
            <p className="text-[13.5px] font-medium text-fg-2">
              Drop files here or click to browse
            </p>
            <p className="mt-1 text-[12px] text-fg-4">
              Max {maxSizeMB} MB{accept ? ` · ${accept}` : ""}
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-(--r-2) border border-border bg-bg-2 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{file.name}</p>
                <p className="font-mono text-[11px] text-fg-3" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-2 shrink-0 text-fg-3 hover:text-danger"
                aria-label={`Remove ${file.name}`}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
