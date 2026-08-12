import React, { useState } from 'react';
import { WS } from '../constants.js';
import { todayDate, pd } from '../utils.js';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

function reviewLabel(task, tasks) {
  const owner = task.owner || '?';
  const parent = tasks.find(p => p.id === task.parentId);
  const parentName = parent ? parent.name : (task.name || '');
  return `→ ${owner} Review ${parentName}`;
}

function typeColor(type) {
  if (type === 'milestone-finalize') return { bg:'#fff3e8', border:'var(--finalize-orange)', dot:'var(--finalize-orange)' };
  if (type === 'milestone-key')      return { bg:'#e8ecf5', border:'var(--key-navy)',        dot:'var(--key-navy)' };
  if (type === 'meeting')            return { bg:'#fff9e6', border:'var(--srmc-yellow)',      dot:'var(--srmc-yellow)' };
  if (type === 'swp-session')        return { bg:'#e8f4fb', border:'var(--swp-blue)',         dot:'var(--swp-blue)' };
  return                                     { bg:'#f4f4f4', border:'#aaa',                   dot:'#aaa' };
}

// Returns weekday date strings the task occupies (for span/duration rendering)
function getTaskDays(t, hideComplete) {
  if (!t.due) return [];
  if (hideComplete && t.status === 'complete') return [];

  if (t.isReview) {
    const revDays = t.reviewDays || 1;
    if (revDays <= 1) return t.sendDate ? [t.sendDate] : (t.due ? [t.due] : []);
    const revEnd = pd(t.reviewEndDate || t.due);
    if (!revEnd) return t.due ? [t.due] : [];
    const days = [];
    for (let i = 0; days.length < revDays; i++) {
      const d = new Date(revEnd);
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      days.unshift(d.toISOString().split('T')[0]);
    }
    return days.length ? days : (t.due ? [t.due] : []);
  }

  const dur = Math.max(1, parseInt(t.duration) || 1);
  if (dur === 1) return [t.due];

  const endD = pd(t.due);
  const days = [];
  for (let i = 0; days.length < dur; i++) {
    const d = new Date(endD);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    days.unshift(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function CalendarView({ tasks }) {
  const now = todayDate();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [hideComplete, setHideComplete] = useState(false);

  function prev() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }
  function next() { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }
  function goToday() { setCalYear(now.getFullYear()); setCalMonth(now.getMonth()); }

  const todayStr = now.toISOString().split('T')[0];
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // Build Mon–Fri week structure
  const weeks = [];
  let week = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calYear, calMonth, d);
    const dow = date.getDay();
    if (dow >= 1 && dow <= 5) {
      const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      week.push({ ds, dow, date });
      if (dow === 5) { weeks.push(week); week = []; }
    }
  }
  if (week.length) weeks.push(week);

  const weekStartDates = new Set(weeks.map(wk => wk[0].ds));

  // Categorise tasks into span (duration>1) and point (single day)
  const spanTasks = [];
  const pointTasks = [];
  tasks.forEach(t => {
    if (!t.due) return;
    if (hideComplete && t.status === 'complete') return;
    if (t.isSubtask) return;
    const days = getTaskDays(t, hideComplete);
    if (!days.length) return;
    if (days.length > 1) spanTasks.push({ t, days, dur: days.length });
    else pointTasks.push({ t, day: days[0] });
  });

  // Sort span tasks longest first — greedy lane assignment
  spanTasks.sort((a, b) => b.dur - a.dur);

  const taskLanes = new Map();
  const dayLaneUsed = {};
  spanTasks.forEach(({ t, days }) => {
    let lane = 0;
    while (days.some(ds => dayLaneUsed[ds]?.has(lane))) lane++;
    taskLanes.set(t.id, lane);
    days.forEach(ds => {
      if (!dayLaneUsed[ds]) dayLaneUsed[ds] = new Set();
      dayLaneUsed[ds].add(lane);
    });
  });
  const maxLanes = taskLanes.size ? Math.max(...taskLanes.values()) + 1 : 0;

  // Build per-day span lookup
  const spansByDay = {};
  spanTasks.forEach(({ t, days }) => {
    const lane = taskLanes.get(t.id);
    days.forEach((ds, si) => {
      if (!spansByDay[ds]) spansByDay[ds] = [];
      spansByDay[ds].push({
        t, lane,
        isStart:  si === 0,
        isEnd:    si === days.length - 1,
        showName: si === 0 || weekStartDates.has(ds),
      });
    });
  });

  // Float single-day tasks into free lanes; overflow the rest
  const laneSlots = {};
  const overflowDay = {};
  pointTasks.forEach(({ t, day }) => {
    if (!laneSlots[day]) laneSlots[day] = {};
    const used = new Set([
      ...Object.keys(laneSlots[day]).map(Number),
      ...(spansByDay[day] || []).map(e => e.lane),
    ]);
    let lane = 0;
    while (used.has(lane)) lane++;
    if (lane < maxLanes) {
      laneSlots[day][lane] = t;
    } else {
      if (!overflowDay[day]) overflowDay[day] = [];
      overflowDay[day].push(t);
    }
  });

  return (
    <div className="cal-wrap">
      <div className="cal-ctrl">
        <button className="btn-ghost" onClick={prev}>‹ Prev</button>
        <span className="cal-month-label">{MONTHS[calMonth]} {calYear}</span>
        <button className="btn-ghost" onClick={next}>Next ›</button>
        <button className="btn" style={{ marginLeft: 12 }} onClick={goToday}>Today</button>
        <label style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text2)' }}>
          <input type="checkbox" checked={hideComplete} onChange={e => setHideComplete(e.target.checked)} />
          Hide completed
        </label>
      </div>

      <table className="cal-grid" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {WEEKDAYS.map(d => <th key={d} style={{ width: '20%' }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {weeks.map((wk, wi) => (
            <tr key={wi}>
              {[1, 2, 3, 4, 5].map(dow => {
                const cell = wk.find(c => c.dow === dow);
                if (!cell) {
                  return (
                    <td key={dow} style={{ background: 'var(--panel)' }}>
                      <div className="cal-day-inner">
                        {Array.from({ length: maxLanes }, (_, l) => (
                          <div key={l} style={{ height: 22, marginBottom: 2 }} />
                        ))}
                      </div>
                    </td>
                  );
                }

                const { ds, date } = cell;
                const isToday = ds === todayStr;
                const cellSpans = (spansByDay[ds] || []).sort((a, b) => a.lane - b.lane);

                return (
                  <td key={dow} className={isToday ? 'is-today' : ''} style={{ width: '20%', verticalAlign: 'top', padding: 0 }}>
                    <div className="cal-day-inner">
                      <div className="cal-day-header">
                        <span className={`cal-day-num${isToday ? ' today' : ''}`}
                          style={isToday ? { background: 'var(--key-navy)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}>
                          {date.getDate()}
                        </span>
                      </div>
                      <div className="cal-events" style={{ overflow: 'visible' }}>
                        {Array.from({ length: maxLanes }, (_, lane) => {
                          const spanEntry = cellSpans.find(e => e.lane === lane);
                          const floatTask = laneSlots[ds]?.[lane];

                          if (spanEntry) {
                            return <SpanBar key={lane} entry={spanEntry} tasks={tasks} />;
                          }
                          if (floatTask) {
                            return <PointEvent key={lane} task={floatTask} tasks={tasks} />;
                          }
                          return <div key={lane} style={{ height: 20, marginBottom: 2 }} />;
                        })}
                        {(overflowDay[ds] || []).map((t, i) => (
                          <PointEvent key={`ov${i}`} task={t} tasks={tasks} />
                        ))}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SpanBar({ entry: { t, isStart, isEnd, showName }, tasks }) {
  const ws = WS.find(w => w.id === t.ws);
  const fade = t.status === 'complete' ? 0.35 : 1;
  const strike = t.status === 'complete';
  const c = t.isReview ? { bg: '#e8f4fb', border: 'var(--swp-blue)', dot: 'var(--swp-blue)' } : typeColor(t.type);

  const brl = isStart ? 3 : 0;
  const brr = isEnd   ? 3 : 0;
  const bl  = isStart ? `2px solid ${c.border}` : 'none';
  const br  = isEnd   ? `2px solid ${c.border}` : 'none';
  const ml  = isStart ? 0 : -1;
  const mr  = isEnd   ? 0 : -1;

  let label = '';
  if (showName) {
    label = t.isReview ? reviewLabel(t, tasks) : t.name;
  }

  const titleText = t.isReview
    ? reviewLabel(t, tasks)
    : `${t.name} · ${ws?.label || ''} · ${t.owner || '—'}`;

  return (
    <div
      className="cal-event cal-span-bar"
      style={{
        height: 20, marginBottom: 2, boxSizing: 'border-box',
        background: c.bg,
        borderTop: `2px solid ${c.border}`, borderBottom: `2px solid ${c.border}`,
        borderLeft: bl, borderRight: br,
        borderRadius: `${brl}px ${brr}px ${brr}px ${brl}px`,
        marginLeft: ml, marginRight: mr,
        opacity: fade,
      }}
      title={titleText}
    >
      {isStart && (
        t.isReview
          ? <span style={{ fontSize: 10, flexShrink: 0, lineHeight: 1 }}>🔍</span>
          : <span className="cal-event-dot" style={{ background: c.dot, flexShrink: 0 }} />
      )}
      {showName && (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: strike ? 'line-through' : 'none', fontStyle: !isStart ? 'italic' : 'normal', opacity: !isStart ? 0.8 : 1 }}>
          {!isStart ? '↳ ' : ''}{label}
        </span>
      )}
    </div>
  );
}

function PointEvent({ task: t, tasks = [] }) {
  const ws = WS.find(w => w.id === t.ws);
  const fade = t.status === 'complete' ? 0.35 : 1;
  const strike = t.status === 'complete';
  const c = t.isReview ? { bg: '#e8f4fb', border: 'var(--swp-blue)', dot: 'var(--swp-blue)' } : typeColor(t.type);
  const isMilestone = ['milestone-finalize', 'milestone-key', 'meeting', 'swp-session'].includes(t.type);
  const displayName = t.isReview ? reviewLabel(t, tasks) : t.name;
  const titleText = t.isReview ? displayName : `${t.name} · ${ws?.label || ''} · ${t.owner || '—'}`;

  return (
    <div
      className="cal-event"
      style={{ height: 20, marginBottom: 2, boxSizing: 'border-box', borderLeft: `3px solid ${c.border}`, background: c.bg, opacity: fade }}
      title={titleText}
    >
      {t.isReview ? (
        <span style={{ fontSize: 10, flexShrink: 0, lineHeight: 1 }}>🔍</span>
      ) : isMilestone ? (
        <span style={{
          width: 9, height: 9, transform: 'rotate(45deg)', borderRadius: 1, flexShrink: 0, display: 'inline-block',
          background: t.type === 'milestone-finalize' ? 'white' : c.dot,
          ...(t.type === 'milestone-finalize' ? { border: '2px solid var(--finalize-orange)' } : {}),
        }} />
      ) : null}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: strike ? 'line-through' : 'none' }}>
        {displayName}
      </span>
    </div>
  );
}
