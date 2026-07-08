"use client";

import { useRef, useState } from "react";

type UploadPanelProps = {
  onFiles: (files: File[], batchLabel: string) => void;
  disconnectedCount: number;
};

function defaultBatchLabel() {
  const now = new Date();
  return `Upload ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function UploadPanel({ onFiles, disconnectedCount }: UploadPanelProps) {
  const [batchLabel, setBatchLabel] = useState(defaultBatchLabel);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const acceptFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const files = Array.from(list).filter((file) => file.type.startsWith("image/"));
    if (files.length > 0) onFiles(files, batchLabel.trim() || defaultBatchLabel());
  };

  return (
    <section className="studio-upload" aria-labelledby="studio-upload-title">
      <h3 id="studio-upload-title">Add photos from your computer</h3>
      <div
        className={`studio-upload__drop${dragOver ? " is-over" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          acceptFiles(event.dataTransfer.files);
        }}
      >
        <p>Drag photos here, or</p>
        <div className="studio-upload__buttons">
          <button type="button" className="studio-button studio-button--ghost" onClick={() => fileInputRef.current?.click()}>
            Choose files
          </button>
          <button type="button" className="studio-button studio-button--ghost" onClick={() => folderInputRef.current?.click()}>
            Choose a folder
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            acceptFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          hidden
          multiple
          // Non-standard but widely supported directory picker.
          {...({ webkitdirectory: "" } as Record<string, string>)}
          onChange={(event) => {
            acceptFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <label className="studio-upload__batch">
        <span>Batch label</span>
        <input
          type="text"
          value={batchLabel}
          maxLength={60}
          onChange={(event) => setBatchLabel(event.target.value)}
        />
      </label>

      <p className="studio-upload__note">
        Uploaded photos stay on this computer — only their names and your decisions are saved.
        After restoring a report on another day, re-upload the same folder so previews reconnect.
      </p>
      {disconnectedCount > 0 ? (
        <p className="studio-upload__reconnect" role="status">
          {disconnectedCount.toLocaleString()} uploaded photo{disconnectedCount === 1 ? "" : "s"} need re-uploading to show previews.
          Decisions for them are safe.
        </p>
      ) : null}
    </section>
  );
}
