import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const QUICK_PROMPTS = [
  'Where am I overspending?',
  'How can I save ₹3,000 this month?',
  'Analyze my food spending habits',
  'Am I on track with my budget?',
  'Give me a weekly summary',
  'What are my top 3 expenses?',
  'Tips to reduce transport costs',
  'Compare this week vs last week',
];

function renderMessage(text) {
  // Convert markdown-like text to formatted HTML
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;margin:10px 0 4px;color:var(--accent4)">$1</h3>')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:15px;margin:12px 0 6px;">$1</h3>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>)/gs, '<ul style="padding-left:16px;margin:6px 0">$1</ul>')
    .replace(/\n/g, '<br/>');
}

export default function AIPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi! I\'m your SpendWise AI advisor. I have full access to your expense data and budget. Ask me anything — spending analysis, saving tips, budget status, or generate a full report!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== 'ai' || messages.indexOf(m) !== 0) // skip welcome
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));

      const res = await api.post('/ai/insights', {
        message: msg,
        conversationHistory: history
      });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.message }]);
    } catch (err) {
      toast.error('AI unavailable. Check your API key.');
      setMessages(prev => [...prev, { role: 'ai', content: '⚠️ I\'m having trouble connecting right now. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="top-bar" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>✦</div>
          <div>
            <h1 className="page-title" style={{ fontSize: 20 }}>AI Financial Advisor</h1>
            <p className="page-subtitle">Powered by SpendWise · Knows your full financial data</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setMessages([{
          role: 'ai',
          content: 'Hi! I\'m your SpendWise AI advisor. I have full access to your expense data and budget. Ask me anything!'
        }])}>
          Clear chat
        </button>
      </div>

      {/* Quick prompts (only when few messages) */}
      {messages.length <= 2 && (
        <div style={{ flexShrink: 0, marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Quick questions:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {QUICK_PROMPTS.map(q => (
              <button
                key={q}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12 }}
                onClick={() => send(q)}
                disabled={loading}
              >{q}</button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
        paddingRight: 4, marginBottom: 16
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'ai' && (
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, marginRight: 8, marginTop: 2
              }}>✦</div>
            )}
            <div
              className={`chat-bubble ${m.role === 'ai' ? 'ai' : 'user'}`}
              dangerouslySetInnerHTML={{ __html: renderMessage(m.content) }}
            />
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
            }}>✦</div>
            <div className="chat-bubble ai" style={{ padding: '12px 16px' }}>
              <div className="dot-loader"><span/><span/><span/></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0 }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              className="form-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your spending, budget, or request a report... (Enter to send)"
              rows={2}
              style={{ flex: 1, minHeight: 0, resize: 'none', border: 'none', background: 'transparent', padding: '2px 0' }}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{ flexShrink: 0, padding: '10px 16px' }}
            >↑</button>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 6 }}>
          AI has access to your real expense data · Powered by SpendWise
        </p>
      </div>
    </div>
  );
}
