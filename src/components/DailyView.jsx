import React, { useState, useEffect } from 'react';
import { WS, WS_LOA14 } from '../constants.js';
const ALL_WS = [...WS, ...WS_LOA14];
import { todayDate, pd, dueCls } from '../utils.js';

const STATUS_LABELS = {
  'not-started': { label: 'Not Started', cls: 's-ns' },
  'in-progress':  { label: 'In Progress', cls: 's-ip' },
  'in-review':    { label: 'In Review',   cls: 's-ir' },
  'complete':     { label: 'Complete',    cls: 's-co' },
  'blocked':      { label: 'Blocked',     cls: 's-bl' },
};

function Pill({ status }) {
  const st = STATUS_LABELS[status] || { label: status, cls: 's-ns' };
  return <span className={`pill ${st.cls}`}>{st.label}</span>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DailyView({ tasks, onOpenAdd }) {
  const today = todayDate();
  const fmt = d => d.toISOString().split('T')[0];

  const [from, setFrom] = useState(fmt(today));
  const [to, setTo] = useState(() => {
    const e = new Date(today); e.setDate(today.getDate() + 6); return fmt(e);
  });
  const [hideComplete, setHideComplete] = useState(false);

  const todayStr = fmt(today);

  // Build array of weekday dates in range
  const days = [];
  if (from && to) {
    let cur = pd(from);
    const toD = pd(to);
    while (cur <= toD) {
      if (cur.getDay() !== 0 && cur.getDay() !== 6) days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }

  return (
    <div className="daily-wrap">
      <div className="daily-ctrl">
        <label>From</label>
        <input type="date" className="d-input" value={from} onChange={e => setFrom(e.target.value)} />
        <label>To</label>
        <input type="date" className="d-input" value={to} onChange={e => setTo(e.target.value)} />
        <button className="btn" onClick={onOpenAdd}>+ Add Task</button>
        <label style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={hideComplete} onChange={e => setHideComplete(e.target.checked)} />
          Hide completed
        </label>
      </div>

      <div className="day-grid">
        {days.length === 0 && (
          <div style={{ color: 'var(--text3)', fontStyle: 'italic', padding: 16 }}>No tasks in range.</div>
        )}
        {days.map(day => {
          const ds = fmt(day);
          let dt = tasks.filter(t => t.due === ds);
          if (hideComplete) dt = dt.filter(t => t.status !== 'complete');
          const isToday = ds === todayStr;

          return (
            <div key={ds} className={`day-card${isToday ? ' is-today' : ''}`}>
              <div className="day-hd" style={isToday ? { background: '#001d2e' } : {}}>
                <span className="day-nm" style={isToday ? { color: 'var(--swp-blue)' } : {}}>
                  {DAYS[day.getDay()]}{isToday ? ' — Today' : ''}
                </span>
                <span className="day-dt">
                  {day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                {dt.length > 0 && <span className="day-cnt">{dt.length}</span>}
              </div>

              {dt.length === 0
                ? <div className="no-task">No tasks due</div>
                : dt.map(t => {
                    const ws = ALL_WS.find(w => w.id === t.ws);
                    if (t.isReview) {
                      return (
                        <div key={t.id} className="dtask" style={{ background: '#f0f7ff', borderLeft: '3px solid var(--swp-blue)', paddingLeft: 11 }}>
                          <span className="review-badge">🔍 Review</span>
                          <span className="dtask-nm" style={{ fontStyle: 'italic' }}>{t.name.replace(/^Review: /, '')}</span>
                          <Pill status={t.status} />
                          <span className="dtask-own">{t.owner || '—'}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={t.id} className="dtask">
                        <span className="ws-badge" style={{ background: `${ws?.color || '#666'}1a`, color: ws?.color || '#aaa' }}>
                          {ws?.label || t.ws}
                        </span>
                        <span className="dtask-nm">{t.name}</span>
                        <Pill status={t.status} />
                        <span className="dtask-own">{t.owner || '—'}</span>
                      </div>
                    );
                  })
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
