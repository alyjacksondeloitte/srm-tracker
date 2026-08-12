import React, { useState, useRef, useEffect } from 'react';

const WELCOME = { role: 'assistant', content: 'Hi! I have full context of all your SRM tasks. Ask me anything — task status, what\'s overdue, who\'s overloaded — or tell me to make changes like "mark d11 complete" or "reassign all of Lily\'s tasks to Sam".' };

function parseActions(text) {
  const match = text.match(/<action>([\s\S]*?)<\/action>/);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}

function stripAction(text) {
  return text.replace(/<action>[\s\S]*?<\/action>/, '').trim();
}

export default function AIChatPanel({ open, onClose, tasks, onApplyChanges }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);

    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.filter(m => m.role !== 'system'),
          tasks,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      const rawContent = data.content?.[0]?.text || '';
      const action = parseActions(rawContent);
      const displayText = stripAction(rawContent);

      if (action) {
        onApplyChanges(action);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: displayText || '✓ Done.' }]);
    } catch (e) {
      setError(e.message);
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠ Could not reach the AI. Make sure ANTHROPIC_API_KEY is set in .env.local and the server is running.\n\nError: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`ai-drawer${open ? ' open' : ''}`}>
      <div className="ai-drawer-hd">
        <span className="ai-drawer-title">✦ AI Assistant</span>
        <button className="close-btn" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }} onClick={onClose}>✕</button>
      </div>

      <div className="ai-messages">
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}
            style={{ whiteSpace: 'pre-wrap' }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="ai-msg assistant" style={{ opacity: 0.6 }}>Thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ai-input-row">
        <textarea
          className="ai-input"
          placeholder="Ask about tasks or request changes…"
          value={input}
          rows={1}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}
        />
        <button className="btn" onClick={send} disabled={loading || !input.trim()}>
          {loading ? '…' : '→'}
        </button>
      </div>
    </div>
  );
}
