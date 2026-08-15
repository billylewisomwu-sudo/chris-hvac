"use client";
import { useRef, useState, useEffect } from "react";

type Msg = { role: "user" | "assistant"; content: string; images?: string[] };

const QUICK = [
  "No cooling", "No heat", "Electrical", "Refrigerant / charge",
  "Airflow", "Thermostat", "Condensate / drain", "Read this data plate",
];

// Compress a photo to a smaller JPEG data URL before sending (saves data + cost).
async function compress(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.7);
}

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [needCode, setNeedCode] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeErr, setCodeErr] = useState(false);
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const thread = useRef<HTMLDivElement>(null);

  useEffect(() => { setCode(localStorage.getItem("hvac-code") || ""); }, []);
  useEffect(() => { thread.current?.scrollTo(0, 1e9); }, [messages]);

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    const out: string[] = [];
    for (const f of Array.from(files).slice(0, 4 - images.length)) {
      try { out.push(await compress(f)); } catch { /* skip */ }
    }
    setImages((p) => [...p, ...out].slice(0, 4));
  }

  async function send(text?: string) {
    const body = (text ?? input).trim();
    if ((!body && images.length === 0) || busy) return;

    const userMsg: Msg = { role: "user", content: body || "(see photos)", images };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput(""); const sent = images; setImages([]); setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-access-code": code },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content, images: m.images })),
        }),
      });
      if (res.status === 401) { setNeedCode(true); setBusy(false); popLast(); return; }
      if (!res.ok || !res.body) { finishLast("⚠️ " + (await res.text().catch(() => "Error"))); return; }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        finishLast(acc, false);
      }
      void sent;
    } catch {
      finishLast("⚠️ Connection lost. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function finishLast(content: string, stop = true) {
    setMessages((p) => {
      const c = [...p];
      for (let i = c.length - 1; i >= 0; i--)
        if (c[i].role === "assistant") { c[i] = { ...c[i], content }; break; }
      return c;
    });
    if (stop) setBusy(false);
  }
  function popLast() { setMessages((p) => p.slice(0, -1)); }

  function submitCode() {
    if (!codeInput.trim()) return;
    localStorage.setItem("hvac-code", codeInput.trim());
    setCode(codeInput.trim()); setNeedCode(false); setCodeErr(false);
  }

  if (needCode) {
    return (
      <div className="wrap">
        <div className="gate">
          <img src="/icons/icon-192.png" alt="" style={{ width: 56, height: 56, borderRadius: 14 }} />
          <h1 style={{ color: "#fff" }}>Chris HVAC</h1>
          <p style={{ color: "var(--muted)" }}>Enter the team access code to continue.</p>
          <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Access code" onKeyDown={(e) => e.key === "Enter" && submitCode()} />
          {codeErr && <p className="err">That code didn’t work. Ask Chris for the code.</p>}
          <button onClick={submitCode}>Continue</button>
        </div>
      </div>
    );
  }

  const started = messages.length > 0;
  return (
    <div className="wrap">
      <div className="top">
        <img src="/icons/icon-192.png" alt="" />
        <div>
          <h1>Chris the Master HVAC Tech</h1>
          <p>Your field HVAC expert · Glacier Air Inc.</p>
        </div>
      </div>

      <div className="thread" ref={thread}>
        {!started && (
          <>
            <div className="intro">
              <b>What are you working on?</b><br />
              Describe the problem, or snap a photo of the unit, data plate, or gauges.
            </div>
            <div className="quick">
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q === "Read this data plate"
                  ? "Read this equipment data plate and tell me the key specs."
                  : `I've got a ${q.toLowerCase()} problem — help me diagnose it. Ask me what you need.`)}>
                  {q}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6,
            alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.images && m.images.length > 0 && (
              <div className="imgs">{m.images.map((s, k) => <img key={k} src={s} alt="" />)}</div>
            )}
            <div className={`msg ${m.role === "user" ? "me" : "ai"} ${
              m.role === "assistant" && !m.content && busy ? "think" : ""}`}>
              {m.content || (m.role === "assistant" && busy ? "Chris is looking at this…" : "")}
            </div>
          </div>
        ))}
      </div>

      {images.length > 0 && (
        <div className="previews">
          {images.map((s, i) => (
            <div key={i}>
              <img src={s} alt="" />
              <button onClick={() => setImages((p) => p.filter((_, k) => k !== i))}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="composer">
        <div className="tools">
          <button onClick={() => cam.current?.click()}>📷 Take photo</button>
          <button onClick={() => gal.current?.click()}>🖼️ Upload</button>
        </div>
        <div className="row">
          <textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 3-ton heat pump, contactor pulled in but compressor won't start"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} />
          <button className="send" onClick={() => send()} disabled={busy}>Send</button>
        </div>
      </div>

      <input ref={cam} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => addPhotos(e.target.files)} />
      <input ref={gal} type="file" accept="image/*" multiple hidden
        onChange={(e) => addPhotos(e.target.files)} />
    </div>
  );
}
