"use client";

import { useState, useEffect } from "react";
import UploadForm from "../components/UploadForm";
import ResultsView from "../components/ResultsView";
import HistoryView from "../components/HistoryView";
import LoginPage from "./login";
import { API_URL, getToken, getEmail, clearSession } from "../lib/api";

export default function Home() {
  const [scanId, setScanId] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setToken(getToken());
    setEmail(getEmail());
    setMounted(true);
  }, []);

  const startScan = async (docId: number, tk: string) => {
    const res = await fetch(`${API_URL}/api/scan/${docId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tk}` },
    });
    if (!res.ok) return;
    const scan = await res.json();
    setScanId(scan.id);
  };

  const logout = () => {
    clearSession();
    setToken("");
    setEmail("");
    setScanId(null);
  };

  if (!mounted) return null;
  if (!token) return <LoginPage onAuthed={(t) => { setToken(t); setEmail(getEmail()); }} />;

  return (
    <div className="app">
      <div className="blobs" aria-hidden>
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="blob b4" />
        <span className="stars" />
        <span className="grid" />
      </div>

      <header className="nav glass">
        <div className="brand">
          <span className="logo">✦</span>
          <h1>Plagiarism &amp; AI Detector</h1>
        </div>
        <div className="nav-right">
          <span className="who mono">{email}</span>
          <a className="link" href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
            API Docs <span aria-hidden>↗</span>
          </a>
          <button className="badge-btn" onClick={logout} title="Sign out">⏻</button>
        </div>
      </header>

      <main className="layout">
        <div className="col">
          <UploadForm token={token} onUploaded={startScan} />
          {scanId && <ResultsView scanId={scanId} token={token} />}
        </div>
        <HistoryView token={token} onSelect={setScanId} selectedId={scanId} />
      </main>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          min-height: 100vh;
          font-family: "SF Pro Display", -apple-system, system-ui, "Segoe UI", sans-serif;
          color: #d6f6ff;
          background: #05090f;
          overflow-x: hidden;
        }
        .app { position: relative; min-height: 100vh; padding: 1.5rem; max-width: 1200px; margin: 0 auto; }

        /* sci-fi animated backdrop */
        .blobs { position: fixed; inset: 0; z-index: 0; overflow: hidden; background:
          radial-gradient(1200px 800px at 15% -10%, #04222e 0%, transparent 55%),
          radial-gradient(1000px 700px at 100% 10%, #021a22 0%, transparent 55%),
          radial-gradient(900px 700px at 50% 120%, #031016 0%, transparent 55%),
          #05090f; }
        .blob { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.5; mix-blend-mode: screen; animation: drift 30s ease-in-out infinite; }
        .b1 { width: 520px; height: 520px; background: radial-gradient(circle, #00e5ff, transparent 70%); top: -140px; left: -120px; }
        .b2 { width: 460px; height: 460px; background: radial-gradient(circle, #00ffc8, transparent 70%); bottom: -160px; right: -100px; animation-delay: -9s; }
        .b3 { width: 380px; height: 380px; background: radial-gradient(circle, #00b3d6, transparent 70%); top: 35%; left: 55%; animation-delay: -16s; }
        .b4 { width: 300px; height: 300px; background: radial-gradient(circle, #00e5a8, transparent 70%); top: -40px; left: 45%; animation-delay: -5s; opacity: 0.35; }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -40px) scale(1.1); }
          66% { transform: translate(-40px, 35px) scale(0.9); }
        }
        /* starfield */
        .stars { position: fixed; inset: 0; z-index: 0; background-image:
          radial-gradient(1px 1px at 20px 30px, #fff, transparent),
          radial-gradient(1px 1px at 140px 90px, #cfe7ff, transparent),
          radial-gradient(1.5px 1.5px at 220px 170px, #fff, transparent),
          radial-gradient(1px 1px at 320px 40px, #9fd0ff, transparent),
          radial-gradient(1.5px 1.5px at 80px 200px, #fff, transparent),
          radial-gradient(1px 1px at 400px 130px, #d9ecff, transparent),
          radial-gradient(1px 1px at 480px 220px, #fff, transparent),
          radial-gradient(1.5px 1.5px at 160px 260px, #bcdcff, transparent),
          radial-gradient(1px 1px at 520px 60px, #fff, transparent),
          radial-gradient(1px 1px at 280px 240px, #eaf4ff, transparent),
          radial-gradient(1.5px 1.5px at 60px 120px, #fff, transparent);
        background-size: 560px 300px; opacity: 0.55; animation: twinkle 6s ease-in-out infinite; }
        @keyframes twinkle { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        /* perspective grid floor */
        .grid { position: fixed; left: 50%; bottom: -10%; transform: translateX(-50%) perspective(600px) rotateX(60deg); z-index: 0; width: 180%; height: 60%;
          background-image: linear-gradient(rgba(0,229,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.22) 1px, transparent 1px);
          background-size: 48px 48px; mask-image: linear-gradient(to top, #000 0%, transparent 90%); -webkit-mask-image: linear-gradient(to top, #000 0%, transparent 90%);
          animation: gridmove 3s linear infinite; }
        @keyframes gridmove { from { background-position: 0 0, 0 0; } to { background-position: 0 48px, 0 0; } }

        /* glass surface */
        .glass {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }

        header.nav {
          position: relative; z-index: 2;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.6rem; margin-bottom: 1.6rem; gap: 1rem;
        }
        .brand { display: flex; align-items: center; gap: 0.8rem; }
        .logo { font-size: 1.6rem; background: linear-gradient(135deg,#00e5ff,#00ffc8); -webkit-background-clip: text; background-clip: text; color: transparent; }
        header.nav h1 { font-size: 1.25rem; margin: 0; font-weight: 600; letter-spacing: -0.02em; }
        .link { color: #8fe8ff; text-decoration: none; font-size: 0.95rem; padding: 0.55rem 1rem; border-radius: 999px; border: 1px solid rgba(0,229,255,0.35); transition: 0.2s; }
        .link:hover { background: rgba(0,229,255,0.12); color: #fff; border-color: rgba(0,229,255,0.7); box-shadow: 0 0 14px rgba(0,229,255,0.35); }
        .nav-right { display: flex; align-items: center; gap: 0.7rem; }
        .who { font-size: 0.8rem; color: #6fa6b8; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .badge-btn { background: rgba(0,229,255,0.08); color: #8fe8ff; border: 1px solid rgba(0,229,255,0.35); border-radius: 999px; width: 38px; height: 38px; font-size: 1.05rem; cursor: pointer; transition: 0.2s; }
        .badge-btn:hover { background: rgba(255,123,123,0.15); color: #ff7b7b; border-color: rgba(255,123,123,0.6); box-shadow: 0 0 12px rgba(255,123,123,0.3); }

        .layout { position: relative; z-index: 2; display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; }
        .col { flex: 1 1 380px; display: flex; flex-direction: column; gap: 1.5rem; }

        .card { position: relative; z-index: 2; padding: 1.6rem; }
        .card h2 { margin: 0 0 0.3rem; font-size: 1.15rem; font-weight: 600; }
        .card .sub { margin: 0 0 1.1rem; color: #6fa6b8; font-size: 0.85rem; }

        button.primary {
          position: relative; overflow: hidden;
          border: none; cursor: pointer; color: #03222b;
          padding: 0.85rem 1.2rem; border-radius: 14px; width: 100%;
          font-size: 1rem; font-weight: 700;
          background: linear-gradient(135deg, #00e5ff, #00ffc8);
          transition: transform 0.15s ease, box-shadow 0.25s ease, filter 0.2s;
          box-shadow: 0 0 22px rgba(0,229,255,0.45), 0 6px 20px rgba(0,229,255,0.3);
        }
        button.primary:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 0 34px rgba(0,229,255,0.65), 0 10px 28px rgba(0,255,200,0.4); }
        button.primary:active:not(:disabled) { transform: translateY(0) scale(0.99); }
        button.primary:disabled { opacity: 0.6; cursor: not-allowed; }

        input[type="file"] { display: none; }
        .ok { color: #3fe0a4; } .err { color: #ff7b7b; }
        .cap { text-transform: capitalize; }
        .mono { font-family: ui-monospace, "SF Mono", monospace; }
      `}</style>
    </div>
  );
}
