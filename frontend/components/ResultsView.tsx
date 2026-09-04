"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

type Scan = {
  id: number;
  status: string;
  plagiarism_score: number | null;
  ai_score: number | null;
  plagiarism_details: any;
  ai_details: any;
  error?: string;
};

const VERDICTS: Record<string, { label: string; color: string }> = {
  likely_human: { label: "Likely Human", color: "#3fe0a4" },
  likely_ai: { label: "Likely AI", color: "#ff4d6d" },
  inconclusive: { label: "Inconclusive", color: "#ffb300" },
};

export default function ResultsView({ scanId, token }: { scanId: number; token: string }) {
  const [scan, setScan] = useState<Scan | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"ai" | "plag">("ai");

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const res = await fetch(`${API_URL}/api/scan/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!cancelled) setScan(data);
      if (data.status === "pending" || data.status === "processing") {
        setTimeout(poll, 2000);
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [scanId, token]);

  const copyReport = () => {
    if (!scan || scan.ai_score == null) return;
    const lines = [
      `Plagiarism & AI Detection Report`,
      `Scan #${scan.id}`,
      `AI Likelihood: ${(scan.ai_score * 100).toFixed(0)}%`,
      `Plagiarism: ${((scan.plagiarism_score ?? 0) * 100).toFixed(0)}%`,
    ];
    scan.ai_details?.signals?.forEach((s: any) => {
      lines.push(`  ${s.name}: ${(s.score * 100).toFixed(0)}% (${s.detail})`);
    });
    navigator.clipboard?.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (!scan) {
    return (
      <div className="card glass">
        <div className="loading">
          <span className="pulse" />
          <p>Analyzing document…</p>
        </div>
      </div>
    );
  }
  if (scan.error) return <div className="card glass"><p className="err">Error: {scan.error}</p></div>;

  const aiV = scan.ai_details?.classification ? VERDICTS[scan.ai_details.classification] : null;
  const tips: Record<string, string> = {
    burstiness: "Uniform sentence lengths are a common AI pattern; humans vary rhythm.",
    ngram: "Clusters of AI-flavored phrases (\"delve into\", \"furthermore\").",
    stylometric: "The same sentence opener repeated too often.",
  };

  return (
    <div className="card glass fade-in">
      <div className="head">
        <div>
          <h2>Scan #{scan.id}</h2>
          <p className="sub">Status: <b className="cap">{scan.status}</b></p>
        </div>
        {scan.status === "completed" && (
          <button className="ghost" onClick={copyReport}>{copied ? "✓ Copied" : "Copy report"}</button>
        )}
      </div>

      {scan.status === "completed" && (
        <div>
          <div className="gauges">
            <Gauge label="AI Likelihood" value={scan.ai_score || 0} verdict={aiV} />
            <Gauge label="Plagiarism" value={scan.plagiarism_score || 0} />
          </div>

          <div className="tabs">
            <button className={`tab ${tab === "ai" ? "on" : ""}`} onClick={() => setTab("ai")}>
              AI Signals
            </button>
            <button className={`tab ${tab === "plag" ? "on" : ""}`} onClick={() => setTab("plag")}>
              Plagiarism ({scan.plagiarism_details?.matches?.length ?? 0})
            </button>
          </div>

          {tab === "ai" && scan.ai_details?.signals && (
            <div className="list">
              {scan.ai_details.signals.map((s: any) => (
                <div className="signal" key={s.name}>
                  <div className="sig-top">
                    <b className="cap">{s.name}</b>
                    <span className="mono sig-val">{(s.score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="bar"><span style={{ width: `${s.score * 100}%` }} /></div>
                  <p className="sig-detail">{s.detail} — {tips[s.name] || ""}</p>
                </div>
              ))}
              {(!scan.ai_details.flagged_segments || scan.ai_details.flagged_segments.length === 0) && (
                <p className="none">No flagged segments</p>
              )}
            </div>
          )}

          {tab === "plag" && (
            <div className="list">
              {scan.plagiarism_details?.matches?.length ? (
                scan.plagiarism_details.matches.map((m: any, i: number) => (
                  <div className="signal" key={i}>
                    <div className="sig-top">
                      <b className="cap">{m.match_type}</b>
                      <span className="mono sig-val">{(m.score * 100).toFixed(0)}%</span>
                    </div>
                    <p className="sig-detail">
                      {m.match_type === "web" && m.source ? (
                        <a href={m.source} target="_blank" rel="noreferrer">source ↗</a>
                      ) : (
                        m.match_type === "reference" && "Matched against your reference documents"
                      )}
                    </p>
                    <div className="quote">“{m.text}”</div>
                  </div>
                ))
              ) : (
                <p className="none">No matches found against reference sources.</p>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
        .ghost { background: rgba(0,229,255,0.08); color: #8fe8ff; border: 1px solid rgba(0,229,255,0.35); border-radius: 10px; padding: 0.45rem 0.8rem; cursor: pointer; font-size: 0.82rem; transition: 0.2s; }
        .ghost:hover { background: rgba(0,229,255,0.16); color: #fff; box-shadow: 0 0 12px rgba(0,229,255,0.35); }
        .gauges { display: flex; gap: 1.6rem; margin: 1.1rem 0; }
        .gauge { text-align: center; flex: 1; }
        .ring { position: relative; width: 96px; height: 96px; margin: 0 auto; }
        .ring svg { transform: rotate(-90deg); display: block; }
        .ring .track { stroke: rgba(0,229,255,0.12); }
        .ring .prog { stroke-linecap: round; transition: stroke-dashoffset 1s ease; filter: drop-shadow(0 0 6px rgba(0,229,255,0.6)); }
        .ring .num { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 700; }
        .g-label { margin-top: 0.5rem; font-size: 0.8rem; color: #6fa6b8; }
        .g-verdict { font-weight: 700; font-size: 0.9rem; margin-top: 0.15rem; }

        .tabs { display: flex; gap: 0.5rem; margin: 0.4rem 0 1rem; }
        .tab { flex: 1; background: rgba(0,229,255,0.05); border: 1px solid rgba(0,229,255,0.2); color: #6fa6b8; padding: 0.6rem; border-radius: 12px; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
        .tab.on { background: rgba(0,229,255,0.18); border-color: rgba(0,229,255,0.7); color: #fff; box-shadow: 0 0 14px rgba(0,229,255,0.3); }

        .list { display: flex; flex-direction: column; gap: 0.7rem; }
        .signal { background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.18); border-radius: 14px; padding: 0.9rem; }
        .sig-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .sig-val { font-size: 0.9rem; opacity: 0.9; }
        .bar { height: 8px; background: rgba(0,229,255,0.12); border-radius: 999px; overflow: hidden; }
        .bar span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #00e5ff, #00ffc8); box-shadow: 0 0 10px rgba(0,229,255,0.7); transition: width 1s ease; }
        .sig-detail { margin: 0.5rem 0 0; font-size: 0.78rem; color: #6fa6b8; }
        .sig-detail a { color: #8fe8ff; text-decoration: none; }
        .quote { margin-top: 0.5rem; font-size: 0.85rem; color: #d6f6ff; font-style: italic; }
        .none { color: #6fa6b8; font-size: 0.85rem; text-align: center; padding: 1rem 0; }

        .loading { text-align: center; padding: 2.5rem 1rem; color: #6fa6b8; }
        .pulse { display: inline-block; width: 46px; height: 46px; border-radius: 50%; border: 4px solid rgba(0,229,255,0.2); border-top-color: #00e5ff; animation: rot 1s linear infinite; box-shadow: 0 0 18px rgba(0,229,255,0.35); }
        @keyframes rot { to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

function Gauge({ label, value, verdict }: { label: string; value: number; verdict?: { label: string; color: string } | null }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const color = verdict ? verdict.color : pct > 30 ? "#ff4d6d" : "#3fe0a4";
  const R = 40;
  const C = 2 * Math.PI * R;
  const offset = C - (pct / 100) * C;
  return (
    <div className="gauge">
      <div className="ring">
        <svg width="96" height="96">
          <circle className="track" cx="48" cy="48" r={R} fill="none" strokeWidth="9" />
          <circle
            className="prog"
            cx="48" cy="48" r={R} fill="none"
            stroke={color} strokeWidth="9"
            strokeDasharray={C} strokeDashoffset={offset}
          />
        </svg>
        <div className="num">{pct}%</div>
      </div>
      <div className="g-label">{label}</div>
      {verdict && <div className="g-verdict" style={{ color }}>{verdict.label}</div>}
    </div>
  );
}
