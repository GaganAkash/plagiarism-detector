"use client";

import { useRef, useState } from "react";
import { API_URL } from "../lib/api";

export default function UploadForm({
  token,
  onUploaded,
}: {
  token: string;
  onUploaded: (docId: number, token: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return setError("Choose a file first");
    if (!token) return setError("You must be signed in first");
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || "Upload failed");
      }
      const doc = await res.json();
      setMessage(`Uploaded "${doc.filename}" — ${doc.word_count} words`);
      onUploaded(doc.id, token);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div className="card glass">
      <h2>Upload document</h2>
      <p className="sub">Drop a file or browse to run a scan</p>

      <div
        className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="file-chip">
            <span className="f-icon">📄</span>
            <div className="f-meta">
              <div className="f-name">{file.name}</div>
              <div className="f-sub">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <span className="f-x" onClick={(e) => { e.stopPropagation(); setFile(null); }}>✕</span>
          </div>
        ) : (
          <>
            <span className="dz-icon">⬆</span>
            <div className="dz-title">Drag &amp; drop your file</div>
            <div className="dz-sub">or click to browse · pdf, docx, txt</div>
          </>
        )}
      </div>

      <button className="primary" onClick={handleUpload} disabled={busy || !file}>
        {busy ? <span className="spin">⟳</span> : "Scan"} {busy ? "Analyzing…" : "document"}
      </button>

      {message && <p className="ok msg">{message}</p>}
      {error && <p className="err msg">{error}</p>}

      <style jsx>{`
        .dropzone {
          border: 2px dashed rgba(109,198,255,0.35);
          border-radius: 16px;
          padding: 2rem 1.2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(109,198,255,0.04);
          margin-bottom: 1rem;
        }
        .dropzone:hover { border-color: rgba(109,198,255,0.7); background: rgba(109,198,255,0.08); }
        .dropzone.dragging { border-color: #ffd54a; background: rgba(255,213,74,0.14); box-shadow: 0 0 22px rgba(109,198,255,0.35); transform: scale(1.01); }
        .dz-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; color: #ffd98a; }
        .dz-title { font-size: 1.02rem; font-weight: 600; }
        .dz-sub { font-size: 0.82rem; color: #a594d6; margin-top: 0.2rem; }
        .file-chip { display: flex; align-items: center; gap: 0.8rem; text-align: left; }
        .f-icon { font-size: 1.6rem; }
        .f-name { font-weight: 600; font-size: 0.95rem; word-break: break-all; }
        .f-sub { font-size: 0.8rem; color: #a594d6; }
        .f-x { margin-left: auto; cursor: pointer; color: #a594d6; padding: 0.3rem 0.6rem; border-radius: 8px; }
        .f-x:hover { color: #ff7b7b; background: rgba(255,255,255,0.08); }
        .spin { display: inline-block; animation: rot 0.9s linear infinite; margin-right: 0.4rem; }
        @keyframes rot { to { transform: rotate(360deg); } }
        .msg { margin: 0.8rem 0 0; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
