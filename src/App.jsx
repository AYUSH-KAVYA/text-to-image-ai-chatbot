import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

// ─── Configuration ─────────────────────────────────────────────
const HF_ACCESS_TOKEN = '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';

const HF_IMAGE_MODEL =
  '/api/huggingface/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0';

const HF_TEXT_MODEL =
  '/api/huggingface/v1/chat/completions';

const MAX_CHARS = 1000;

const MODES = {
  IMAGE: 'image',
  TEXT: 'text',
};

const IMAGE_SUGGESTIONS = [
  'A cyberpunk cityscape at sunset',
  'An astronaut riding a horse on Mars',
  'A cozy coffee shop in the rain',
  'A mystical forest with bioluminescent trees',
];

const TEXT_SUGGESTIONS = [
  'Explain quantum computing simply',
  'Write a haiku about the ocean',
  'What is the meaning of life?',
  'Summarize the theory of relativity',
];
const ERROR_TYPES = {
  AUTH: 'auth',
  RATE_LIMIT: 'rate_limit',
  MODEL_LOADING: 'model_loading',
  NETWORK: 'network',
  GENERIC: 'generic',
};

function classifyError(status, parsedBody) {
  if (status === 401 || status === 403) return ERROR_TYPES.AUTH;
  if (status === 429) return ERROR_TYPES.RATE_LIMIT;
  if (parsedBody?.estimated_time || status === 503) return ERROR_TYPES.MODEL_LOADING;
  if (status === 0 || !status) return ERROR_TYPES.NETWORK;
  return ERROR_TYPES.GENERIC;
}
const ERROR_META = {
  [ERROR_TYPES.AUTH]: { label: 'Authentication Error' },
  [ERROR_TYPES.RATE_LIMIT]: { label: 'Rate Limited' },
  [ERROR_TYPES.MODEL_LOADING]: { label: 'Model Loading' },
  [ERROR_TYPES.NETWORK]: { label: 'Network Error' },
  [ERROR_TYPES.GENERIC]: { label: 'Error' },
};
const Icons = {
  Sparkles: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  ),
  Image: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  MessageSquare: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" />
    </svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  ),
  RefreshCw: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
    </svg>
  ),
  Palette: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
  Copy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  ),
};

// ─── API Functions ─────────────────────────────────────────────
async function generateImage(prompt, signal) {
  let response;
  try {
    response = await fetch(HF_IMAGE_MODEL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HF_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ inputs: prompt }),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    const e = new Error('Network error — check your connection and try again.');
    e.errorType = ERROR_TYPES.NETWORK;
    throw e;
  }

  if (!response.ok) {
    const body = await response.text();
    let msg = `API error (${response.status})`;
    let parsed = {};
    try {
      parsed = JSON.parse(body);
      if (parsed.error) msg = parsed.error;
      if (parsed.estimated_time)
        msg = `Model is loading, please try again in ~${Math.ceil(parsed.estimated_time)}s.`;
    } catch { /* non-JSON */ }
    const e = new Error(msg);
    e.errorType = classifyError(response.status, parsed);
    throw e;
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

async function generateText(prompt, signal) {
  let response;
  try {
    response = await fetch(HF_TEXT_MODEL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${HF_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'allenai/Olmo-3-7B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 512,
      }),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    const e = new Error('Network error — check your connection and try again.');
    e.errorType = ERROR_TYPES.NETWORK;
    throw e;
  }

  if (!response.ok) {
    const body = await response.text();
    let msg = `API error (${response.status})`;
    let parsed = {};
    try {
      parsed = JSON.parse(body);
      if (parsed.error) msg = parsed.error;
      if (parsed.estimated_time)
        msg = `Model is loading, please try again in ~${Math.ceil(parsed.estimated_time)}s.`;
    } catch { /* non-JSON */ }
    const e = new Error(msg);
    e.errorType = classifyError(response.status, parsed);
    throw e;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return text.trim();
}

export default function App() {
  const [mode, setMode] = useState(MODES.IMAGE);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);
  const timerRef = useRef(null);

  const charCount = prompt.length;
  const suggestions = mode === MODES.IMAGE ? IMAGE_SUGGESTIONS : TEXT_SUGGESTIONS;

  useEffect(() => {
    if (isGenerating) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isGenerating]);

  useEffect(() => {
    if (error && error.type !== ERROR_TYPES.AUTH) {
      const id = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(id);
    }
  }, [error]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setIsGenerating(true);
    setResult(null);

    try {
      if (mode === MODES.IMAGE) {
        const imageUrl = await generateImage(prompt.trim(), controller.signal);
        setResult({ type: 'image', imageUrl, prompt: prompt.trim() });
      } else {
        const text = await generateText(prompt.trim(), controller.signal);
        setResult({ type: 'text', text, prompt: prompt.trim() });
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError({
        message: err.message || 'Something went wrong.',
        type: err.errorType || ERROR_TYPES.GENERIC,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, mode]);

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleSuggestionClick = (s) => {
    setPrompt(s);
    textareaRef.current?.focus();
  };

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setResult(null);
    setError(null);
    setPrompt('');
  };

  const handleDownload = async () => {
    if (!result?.imageUrl) return;
    try {
      const res = await fetch(result.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagine-ai-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError({ message: 'Failed to download.', type: ERROR_TYPES.GENERIC });
    }
  };

  const handleCopy = async () => {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError({ message: 'Failed to copy.', type: ERROR_TYPES.GENERIC });
    }
  };

  const handleNew = () => {
    setResult(null);
    setPrompt('');
    textareaRef.current?.focus();
  };

  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  return (
    <div className="app">
      {/* ─── Header ─── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={handleNew} role="button" tabIndex={0} aria-label="Home">
            <div className="logo-icon"><Icons.Sparkles /></div>
            <span className="logo-text">Imagine AI</span>
          </div>

          <div className="mode-toggle" role="tablist" aria-label="Generation mode">
            <button
              className={`mode-btn ${mode === MODES.IMAGE ? 'active' : ''}`}
              onClick={() => handleModeSwitch(MODES.IMAGE)}
              role="tab"
              aria-selected={mode === MODES.IMAGE}
              id="tab-image"
            >
              <Icons.Image />
              <span>Text to Image</span>
            </button>
            <button
              className={`mode-btn ${mode === MODES.TEXT ? 'active' : ''}`}
              onClick={() => handleModeSwitch(MODES.TEXT)}
              role="tab"
              aria-selected={mode === MODES.TEXT}
              id="tab-text"
            >
              <Icons.MessageSquare />
              <span>Text to Text</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="main-content">
        {/* Hero */}
        <section className="hero">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            {mode === MODES.IMAGE ? 'AI Image Generation' : 'AI Text Generation'}
          </div>
          <h1>
            {mode === MODES.IMAGE ? (
              <>Transform Words Into <span className="gradient-text">Stunning Visuals</span></>
            ) : (
              <>Ask Anything, Get <span className="gradient-text">Intelligent Answers</span></>
            )}
          </h1>
          <p className="hero-sub">
            {mode === MODES.IMAGE
              ? 'Describe any scene or concept — Stable Diffusion XL brings it to life.'
              : 'Ask questions, brainstorm ideas, or generate creative text with Olmo 3 7B.'}
          </p>
        </section>

        {/* Prompt Card */}
        <div className="prompt-card" id="prompt-card">
          <label className="prompt-label" htmlFor="prompt-input">
            {mode === MODES.IMAGE ? <Icons.Image /> : <Icons.MessageSquare />}
            Your Prompt
          </label>

          <textarea
            ref={textareaRef}
            id="prompt-input"
            className="prompt-textarea"
            placeholder={mode === MODES.IMAGE
              ? 'Describe the image you want to create…'
              : 'Ask a question or describe what you need…'}
            value={prompt}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) setPrompt(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            aria-label={mode === MODES.IMAGE ? 'Image prompt' : 'Text prompt'}
          />

          <div className="prompt-controls">
            <span className={`char-count ${charCount > MAX_CHARS * 0.9 ? 'at-limit' : charCount > MAX_CHARS * 0.7 ? 'near-limit' : ''}`}>
              {charCount} / {MAX_CHARS}
            </span>

            <button
              id="generate-btn"
              className="generate-btn"
              onClick={handleGenerate}
              disabled={!canGenerate}
              title="Generate (⌘ + Enter)"
            >
              {isGenerating ? (
                <><Icons.RefreshCw /> Generating…</>
              ) : (
                <><Icons.Send /> Generate</>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={`error-toast error-toast--${error.type}`} id="error-toast" role="alert">
            <span className="error-toast-icon"><Icons.AlertTriangle /></span>
            <div className="error-toast-body">
              <span className="error-toast-label">{ERROR_META[error.type]?.label || 'Error'}</span>
              <span className="error-toast-message">{error.message}</span>
            </div>
            <div className="error-toast-actions">
              {error.type !== ERROR_TYPES.AUTH && prompt.trim() && (
                <button className="error-retry-btn" id="retry-btn" onClick={handleGenerate}>Retry</button>
              )}
              <button className="error-dismiss-btn" id="dismiss-error-btn" onClick={() => setError(null)} aria-label="Dismiss">
                <Icons.X />
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isGenerating && (
          <section className="loading-section" id="loading-section" aria-live="polite">
            <div className="loading-spinner" />
            <p className="loading-text">
              {mode === MODES.IMAGE ? 'Generating your image…' : 'Thinking…'}
            </p>
            <div className="loading-meta">
              <span className="loading-elapsed">{elapsedTime}s elapsed</span>
              <div className="loading-progress"><div className="loading-progress-bar" /></div>
            </div>
            {elapsedTime >= 5 && (
              <p className="loading-tip">
                {mode === MODES.IMAGE
                  ? 'SDXL models can take 15–30s on first request while warming up.'
                  : 'The model may take a moment to load on first use.'}
              </p>
            )}
            <button className="cancel-btn" id="cancel-btn" onClick={handleCancel}>Cancel</button>
          </section>
        )}

        {/* Image Result */}
        {!isGenerating && result?.type === 'image' && (
          <section className="result-section" id="result-section">
            <div className="result-header">
              <div className="result-title">
                <Icons.Image /> Generated Image
              </div>
              <div className="result-actions">
                <button className="action-btn" id="download-btn" onClick={handleDownload}>
                  <Icons.Download /> Download
                </button>
                <button className="action-btn" id="new-btn" onClick={handleNew}>
                  <Icons.Plus /> New
                </button>
              </div>
            </div>
            <div className="result-image-frame">
              <img src={result.imageUrl} alt={result.prompt} />
              <div className="result-prompt-strip">
                <Icons.MessageSquare />
                <span>{result.prompt}</span>
              </div>
            </div>
          </section>
        )}

        {/* Text Result */}
        {!isGenerating && result?.type === 'text' && (
          <section className="result-section" id="result-section">
            <div className="result-header">
              <div className="result-title">
                <Icons.MessageSquare /> AI Response
              </div>
              <div className="result-actions">
                <button className="action-btn" id="copy-btn" onClick={handleCopy}>
                  <Icons.Copy /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button className="action-btn" id="new-btn" onClick={handleNew}>
                  <Icons.Plus /> New
                </button>
              </div>
            </div>
            <div className="text-result-card">
              <div className="text-result-body">{result.text}</div>
              <div className="result-prompt-strip">
                <Icons.MessageSquare />
                <span>{result.prompt}</span>
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isGenerating && !result && (
          <section className="empty-state" id="empty-state">
            <div className="empty-icon">
              {mode === MODES.IMAGE ? <Icons.Palette /> : <Icons.MessageSquare />}
            </div>
            <h3>{mode === MODES.IMAGE ? 'Your Canvas Awaits' : 'Start a Conversation'}</h3>
            <p>
              {mode === MODES.IMAGE
                ? 'Enter a prompt above to generate stunning AI images.'
                : 'Ask a question or give an instruction to get started.'}
            </p>
            <div className="suggestions">
              {suggestions.map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => handleSuggestionClick(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

    </div>
  );
}
