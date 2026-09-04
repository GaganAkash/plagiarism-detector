"use client";

import { useState } from "react";
import { API_URL, apiPost, saveSession } from "../lib/api";
import { Flute } from "../components/KrishnaDeco";

export default function LoginPage({ onAuthed }: { onAuthed: (token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const submit = async () => {
    if (!email || !password) return setError("Enter email and password");
    setBusy(true);
    setError("");
    setOk("");
    try {
      let token: string;
      if (mode === "register") {
        const r = await apiPost("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.detail || "Registration failed");
        token = j.access_token;
        setOk("Account created — welcome!");
      } else {
        const body = new URLSearchParams();
        body.set("username", email);
        body.set("password", password);
        const r = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.detail || "Login failed");
        token = j.access_token;
      }
      saveSession(token, email);
      onAuthed(token);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap">
      <div className="blobs" aria-hidden>
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
        <span className="stars" /><span className="grid" />
        <img className="krishna-art" src="/krishna.jpg" alt="" aria-hidden />
      </div>

      <div className="card glass">
        <div className="brand">
          <span className="logo"><Flute className="flute" />✦</span>
          <h1>Plagiarism &amp; AI Detector</h1>
          <p className="sub">Sign in to manage documents &amp; scans</p>
        </div>

        <div className="tabs">
          <button className={`tab ${mode === "login" ? "on" : ""}`} onClick={() => { setMode("login"); setError(""); }}>Login</button>
          <button className={`tab ${mode === "register" ? "on" : ""}`} onClick={() => { setMode("register"); setError(""); }}>Register</button>
        </div>

        <label>Email</label>
        <input
          type="email" placeholder="you@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label>Password</label>
        <input
          type="password" placeholder="••••••••" value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        <button className="primary" onClick={submit} disabled={busy}>
          {busy ? <span className="spin">⟳</span> : mode === "login" ? "Sign in" : "Create account"}
        </button>

        {ok && <p className="ok">{ok}</p>}
        {error && <p className="err">{error}</p>}
      </div>

      <style jsx>{`
        .wrap { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .card { width: 100%; max-width: 400px; padding: 2.2rem 2rem; }
        .brand { text-align: center; margin-bottom: 1.5rem; }
        .logo { font-size: 2rem; background: linear-gradient(135deg,#6dc6ff,#ffd54a); -webkit-background-clip: text; background-clip: text; color: transparent; display: block; }
        .brand h1 { font-size: 1.3rem; margin: 0.4rem 0 0.2rem; }
        .brand .sub { color: #a594d6; font-size: 0.85rem; margin: 0; }
        .tabs { display: flex; gap: 0.5rem; margin-bottom: 1.2rem; }
        .tab { flex: 1; background: rgba(109,198,255,0.05); border: 1px solid rgba(109,198,255,0.2); color: #a594d6; padding: 0.6rem; border-radius: 12px; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
        .tab.on { background: rgba(109,198,255,0.18); border-color: rgba(109,198,255,0.7); color: #fff; box-shadow: 0 0 14px rgba(109,198,255,0.3); }
        label { display: block; font-size: 0.78rem; color: #a594d6; margin: 0.9rem 0 0.35rem; }
        input { width: 100%; padding: 0.75rem 0.9rem; border-radius: 12px; border: 1px solid rgba(109,198,255,0.3); background: rgba(4,10,16,0.6); color: #efe9ff; font-size: 0.95rem; outline: none; transition: 0.2s; }
        input:focus { border-color: #6dc6ff; box-shadow: 0 0 12px rgba(109,198,255,0.35); }
        .primary { margin-top: 1.4rem; }
        .ok { color: #3fe0a4; margin-top: 1rem; text-align: center; }
        .err { color: #ff7b7b; margin-top: 1rem; text-align: center; }
        .spin { display: inline-block; animation: rot 0.9s linear infinite; margin-right: 0.4rem; }
        @keyframes rot { to { transform: rotate(360deg); } }
      `}</style>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100vh; font-family: "SF Pro Display", -apple-system, system-ui, "Segoe UI", sans-serif; color: #efe9ff; background: #0a0618; }
        .blobs { position: fixed; inset: 0; z-index: 0; overflow: hidden; background:
          radial-gradient(1200px 800px at 15% -10%, #150b33 0%, transparent 55%),
          radial-gradient(1000px 700px at 100% 10%, #100a2b 0%, transparent 55%),
          radial-gradient(900px 700px at 50% 120%, #0b0720 0%, transparent 55%),
          #0a0618; }
        .blob { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.5; mix-blend-mode: screen; animation: drift 30s ease-in-out infinite; }
        .b1 { width: 520px; height: 520px; background: radial-gradient(circle, #6dc6ff, transparent 70%); top: -140px; left: -120px; }
        .b2 { width: 460px; height: 460px; background: radial-gradient(circle, #ffd54a, transparent 70%); bottom: -160px; right: -100px; animation-delay: -9s; }
        .b3 { width: 380px; height: 380px; background: radial-gradient(circle, #4a7bd6, transparent 70%); top: 35%; left: 55%; animation-delay: -16s; }
        @keyframes drift { 0%,100% { transform: translate(0,0) scale(1);} 33% { transform: translate(50px,-40px) scale(1.1);} 66% { transform: translate(-40px,35px) scale(0.9);} }
        .stars { position: fixed; inset: 0; z-index: 0; background-image:
          radial-gradient(1px 1px at 20px 30px, #fff, transparent),
          radial-gradient(1px 1px at 140px 90px, #cfe7ff, transparent),
          radial-gradient(1.5px 1.5px at 220px 170px, #fff, transparent),
          radial-gradient(1px 1px at 80px 200px, #fff, transparent); background-size: 560px 300px; opacity: 0.5; animation: twinkle 6s ease-in-out infinite; }
        @keyframes twinkle { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        .grid { position: fixed; left: 50%; bottom: -10%; transform: translateX(-50%) perspective(600px) rotateX(60deg); z-index: 0; width: 180%; height: 60%;
          background-image: linear-gradient(rgba(109,198,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(109,198,255,0.22) 1px, transparent 1px);
          background-size: 48px 48px; mask-image: linear-gradient(to top, #000 0%, transparent 90%); -webkit-mask-image: linear-gradient(to top, #000 0%, transparent 90%); animation: gridmove 3s linear infinite; }
        @keyframes gridmove { from { background-position: 0 0, 0 0; } to { background-position: 0 48px, 0 0; } }
        .krishna-art { position: fixed; right: 4vw; top: 6vh; z-index: 0; height: 68vh; opacity: 0.10; pointer-events: none; filter: saturate(1.15) drop-shadow(0 0 40px rgba(255,213,74,0.12)); border-radius: 18px; }
        .logo .flute { width: 2.3rem; height: 0.8rem; margin-right: 0.2rem; vertical-align: 0.05rem; }
        .glass { background: rgba(255,255,255,0.06); backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%); border: 1px solid rgba(109,198,255,0.18); border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.35); }
        .primary { position: relative; overflow: hidden; border: none; cursor: pointer; color: #1c0f33; padding: 0.85rem 1.2rem; border-radius: 14px; width: 100%; font-size: 1rem; font-weight: 700; background: linear-gradient(135deg,#6dc6ff,#ffd54a); transition: transform 0.15s ease, box-shadow 0.25s ease, filter 0.2s; box-shadow: 0 0 22px rgba(109,198,255,0.45); }
        .primary:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
        .primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .ok { color: #3fe0a4; } .err { color: #ff7b7b; }
      `}</style>
    </div>
  );
}
