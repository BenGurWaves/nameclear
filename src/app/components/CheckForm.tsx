import { useEffect, useRef, useState } from "react";

const NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9 \-']{0,59}$/;

export function CheckForm({
  onSubmit,
  busy,
}: {
  onSubmit: (name: string) => void;
  busy: boolean;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (!trimmed) {
      setError("Type a name first.");
      return;
    }
    if (!NAME_RE.test(trimmed) || trimmed.length > 60) {
      setError("Use 1-60 letters, numbers, spaces, or hyphens.");
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  return (
    <form className="console" onSubmit={submit} aria-label="Check brand name availability">
      <div className="console-bar">
        <span>name-inspector · live checks</span>
        <span className="console-dots" aria-hidden="true">
          <span className="console-dot flame" />
          <span className="console-dot" />
          <span className="console-dot" />
        </span>
      </div>
      <div className="console-input-row">
        <span className="console-prompt" aria-hidden="true">
          <span className="caret">~/nameclear</span> $ check --name
        </span>
        <input
          ref={inputRef}
          className="console-input"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          aria-label="Brand name"
          placeholder="e.g. lucidmoss"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          disabled={busy}
        />
      </div>
      <div className="console-footer">
        <div className="console-hints" aria-hidden="true">
          <span>→ .com .co .io .net .app</span>
          <span>→ uspto tmsearch</span>
          <span>→ x · ig · tt · yt</span>
        </div>
        <button type="submit" className="btn btn-flame" disabled={busy}>
          {busy ? "Checking…" : "Check availability →"}
        </button>
      </div>
      {error && <p className="console-error" style={{ margin: "0 18px 14px" }}>{error}</p>}
    </form>
  );
}
