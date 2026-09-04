"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

type ScanRow = {
  id: number;
  document_id: number;
  filename?: string;
  status: string;
  plagiarism_score: number | null;
  ai_score: number | null;
  created_at?: string;
};

export default function HistoryView({
  token,
  onSelect,
  selectedId,
}: {
  token: string;
  onSelect: (id: number) => void;
  selectedId: number | null;
}) {
  const [rows, setRows] = useState<ScanRow[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/scan`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows)
      .catch(() => {});
  }, [token]);

  return (
    <div className="card glass">
      <h2>History</h2>
      <p className="sub">{rows.length} scan{rows.length === 1 ? "" : "s"} this session</p>

      {rows.length === 0 ? (
        <div className="empty">
          <span className="e-icon">🗂</span>
          <p>No scans yet. Upload a document to begin.</p>
        </div>
      ) : (
        <ul className="hist">
          {rows.map((s) => (
            <li key={s.id}>
              <button className={`hist-item ${selectedId === s.id ? "sel" : ""}`} onClick={() => onSelect(s.id)}>
                <span className="h-id mono">#{s.id}</span>
                <span className="h-center">
                  <span className="h-status cap">{pill(s.status)}</span>
                  <span className="h-meta">
                    <i>AI</i> {(s.ai_score ?? 0) * 100 | 0}% · <i>Plag</i> {(s.plagiarism_score ?? 0) * 100 | 0}%
                  </span>
                </span>
                {selectedId === s.id && <span className="viewing">viewing</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .hist { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.55rem; }
        .hist-item {
          width: 100%;
          display: flex; align-items: center; gap: 0.8rem;
          background: rgba(109,198,255,0.05);
          border: 1px solid rgba(109,198,255,0.18);
          color: #efe9ff;
          border-radius: 14px;
          padding: 0.75rem 0.9rem;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .hist-item:hover { background: rgba(109,198,255,0.1); transform: translateY(-1px); border-color: rgba(109,198,255,0.4); box-shadow: 0 0 16px rgba(109,198,255,0.2); }
        .hist-item.sel { border-color: rgba(109,198,255,0.8); background: rgba(109,198,255,0.14); box-shadow: 0 0 18px rgba(109,198,255,0.3); }
        .h-id { color: #6dc6ff; font-weight: 600; text-shadow: 0 0 8px rgba(109,198,255,0.6); }
        .h-center { display: flex; flex-direction: column; align-items: flex-start; gap: 0.15rem; }
        .h-meta { font-size: 0.75rem; color: #a594d6; }
        .h-meta i { font-style: normal; color: #ffd98a; }
        .viewing { margin-left: auto; font-size: 0.7rem; color: #3fe0a4; }
        .empty { text-align: center; padding: 2rem 1rem; color: #a594d6; }
        .empty p { margin: 0.5rem 0 0; font-size: 0.88rem; }
        .e-icon { font-size: 1.8rem; }
        .pill { font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid rgba(109,198,255,0.35); }
        .pill.ok { color: #3fe0a4; }
        .pill.run { color: #ffb300; }
        .pill.bad { color: #ff7b7b; }
      `}</style>
    </div>
  );
}

function pill(status: string) {
  const map: Record<string, { text: string; cls: string }> = {
    completed: { text: "✓ done", cls: "ok" },
    processing: { text: "… running", cls: "run" },
    pending: { text: "queued", cls: "run" },
    failed: { text: "✕ failed", cls: "bad" },
  };
  const p = map[status] || { text: status, cls: "" };
  return <span className={`pill ${p.cls}`}>{p.text}</span>;
}
