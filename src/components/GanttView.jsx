import React, { useState } from 'react';
import { WS, WS_LOA14, GCOLS_LOA12, GCOLS_LOA14 } from '../constants.js';
import { todayDate } from '../utils.js';
import DrillPanel from './DrillPanel.jsx';

const LOA12_CUTOFF = '2026-08-17'; // tasks before this date belong to LOA 12

function loadOrder(workstreams, storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (Array.isArray(saved) && saved.length) {
      const byId = Object.fromEntries(workstreams.map(w => [w.id, w]));
      const ordered = saved.map(id => byId[id]).filter(Boolean);
      const unseen = workstreams.filter(w => !saved.includes(w.id));
      return [...ordered, ...unseen];
    }
  } catch {}
  return workstreams;
}

export default function GanttView({ tasks, workstreams: wsProp, workstreamsLoa14: wsPropLoa14, onInline, onUpsertTasks, onDeleteTask, onOpenAdd, onOpenEdit, onOpenWsModal, onUpdateWs, onOpenWsModalLoa14, onUpdateWsLoa14, onDeleteWs, onDeleteWsLoa14 }) {
  const [loa, setLoa] = useState('loa14');
  const ws12Source = wsProp?.length ? wsProp : WS;
  const ws14Source = wsPropLoa14?.length ? wsPropLoa14 : WS_LOA14;
  const [wsOrder12, setWsOrder12] = useState(() => loadOrder(ws12Source, 'gantt-ws-order-loa12'));
  const [wsOrder14, setWsOrder14] = useState(() => loadOrder(ws14Source, 'gantt-ws-order-loa14'));
  const [selWs, setSelWs] = useState(null);

  const isLoa12 = loa === 'loa12';
  const GCOLS   = isLoa12 ? GCOLS_LOA12 : GCOLS_LOA14;
  const storageKey = isLoa12 ? 'gantt-ws-order-loa12' : 'gantt-ws-order-loa14';

  // Merge any newly added workstreams into the ordered list
  const wsOrder = isLoa12
    ? wsOrder12
    : (() => {
        const known = new Set(wsOrder14.map(w => w.id));
        const unseen = ws14Source.filter(w => !known.has(w.id));
        return unseen.length ? [...wsOrder14, ...unseen] : wsOrder14;
      })();
  const setWsOrder = isLoa12 ? setWsOrder12 : setWsOrder14;

  const loaTasks = isLoa12
    ? tasks.filter(t => t.due && t.due < LOA12_CUTOFF)
    : tasks.filter(t => !t.due || t.due >= LOA12_CUTOFF);

  function moveWs(id, dir) {
    setWsOrder(prev => {
      const idx = prev.findIndex(w => w.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      localStorage.setItem(storageKey, JSON.stringify(arr.map(w => w.id)));
      return arr;
    });
  }

  const allWeeks = [];
  GCOLS.forEach(m => m.weeks.forEach(w => allWeeks.push({ ...w, month: m.m })));
  const lastWeekD = allWeeks[allWeeks.length - 1]?.d ?? '2099-01-01';
  const todayStr = todayDate().toISOString().split('T')[0];

  function clickWs(wsId) {
    setSelWs(prev => prev === wsId ? null : wsId);
  }

  return (
    <div>
      {/* LOA Tab Switcher */}
      <div style={{ display:'flex', gap:8, padding:'10px 16px 0', borderBottom:'2px solid var(--border)' }}>
        {[['loa12','LOA 12  (Mar – Aug 14)'],['loa14','LOA 14  (Aug 17 – Jan 27)']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setLoa(key); setSelWs(null); }}
            style={{
              padding:'6px 18px', borderRadius:'6px 6px 0 0', border:'none', cursor:'pointer', fontWeight:600, fontSize:13,
              background: loa === key ? 'var(--swp-blue)' : 'var(--surface)',
              color: loa === key ? '#fff' : 'var(--text-muted)',
              borderBottom: loa === key ? '2px solid var(--swp-blue)' : '2px solid transparent',
              marginBottom: -2,
            }}
          >{label}</button>
        ))}
      </div>

      {/* Legend */}
      <div className="legend-bar">
        <div className="leg"><div className="leg-diamond" style={{ background: 'var(--swp-blue)' }} />Internal Review</div>
        <div className="leg"><div className="leg-diamond" style={{ background: 'var(--key-navy)' }} />Internal Working Session</div>
        <div className="leg"><div className="leg-diamond" style={{ background: 'var(--srmc-yellow)' }} />SWP Meeting</div>
        <div className="leg"><div className="leg-diamond" style={{ background: 'var(--finalize-orange)', border: '2px solid var(--finalize-orange)', outline: '2px solid white', outlineOffset: -4 }} />Finalize Deliverable</div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <span className="today-chip">
          Today: {todayDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <span className="hint">Click a row to see tasks &amp; drill down</span>
        <button
          className="btn-ghost"
          style={{ marginLeft: 'auto' }}
          onClick={isLoa12 ? onOpenWsModal : onOpenWsModalLoa14}
        >
          + Add Workstream
        </button>
      </div>

      {/* Gantt table */}
      <div className="gantt-wrap">
        <table className="gantt-tbl">
          <thead>
            <tr>
              <th className="col-ws" rowSpan={2}>Workstream</th>
              {GCOLS.map(m => (
                <th key={m.m} className="mhd" colSpan={m.weeks.length}>{m.m}</th>
              ))}
            </tr>
            <tr>
              {allWeeks.map(w => <th key={w.d}>{w.lbl}</th>)}
            </tr>
          </thead>
          <tbody>
            {wsOrder.map((ws, wi) => {
              const wt = loaTasks.filter(t => t.ws === ws.id);
              const isSel = selWs === ws.id;
              // Tasks with a startDate span from startDate→due; tasks without only mark their due week
              const wtActive = wt.filter(t => t.due && !t.isSubtask);

              return (
                <tr
                  key={ws.id}
                  className={`g-row${isSel ? ' sel' : ''}`}
                  onClick={() => clickWs(ws.id)}
                >
                  <td className="ws-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <button
                          className="icon-btn"
                          style={{ fontSize: 9, padding: '0 3px', lineHeight: 1.4, opacity: wi === 0 ? 0.2 : 0.6 }}
                          title="Move up"
                          onClick={e => { e.stopPropagation(); moveWs(ws.id, -1); }}
                          disabled={wi === 0}
                        >▲</button>
                        <button
                          className="icon-btn"
                          style={{ fontSize: 9, padding: '0 3px', lineHeight: 1.4, opacity: wi === wsOrder.length - 1 ? 0.2 : 0.6 }}
                          title="Move down"
                          onClick={e => { e.stopPropagation(); moveWs(ws.id, 1); }}
                          disabled={wi === wsOrder.length - 1}
                        >▼</button>
                      </div>
                      <div>
                        <input
                          className="ws-name"
                          defaultValue={ws.label}
                          style={{ background: 'transparent', border: 'none', outline: 'none', cursor: 'text', width: '100%', padding: 0 }}
                          onClick={e => e.stopPropagation()}
                          onBlur={e => {
                            const val = e.target.value.trim();
                            if (val && val !== ws.label) {
                              if (isLoa12) onUpdateWs(ws.id, val);
                              else if (onUpdateWsLoa14) onUpdateWsLoa14(ws.id, val);
                            } else e.target.value = ws.label;
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { e.target.value = ws.label; e.target.blur(); } }}
                        />
                        {wt.length === 0 && (
                          <button
                            title="Delete empty workstream"
                            onClick={e => {
                              e.stopPropagation();
                              if (window.confirm(`Delete workstream "${ws.label}"?`)) {
                                if (isLoa12 && onDeleteWs) onDeleteWs(ws.id);
                                else if (!isLoa12 && onDeleteWsLoa14) onDeleteWsLoa14(ws.id);
                              }
                            }}
                            style={{ fontSize: 10, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', lineHeight: 1, opacity: 0.5 }}
                          >✕</button>
                        )}
                        <div className="ws-cnt">{wt.filter(t => t.status !== 'complete').length} remaining</div>
                      </div>
                    </div>
                  </td>

                  {allWeeks.map((w, wi) => {
                    const nextD = wi < allWeeks.length - 1 ? allWeeks[wi + 1].d : '2027-02-01';
                    const isToday = w.d <= todayStr && todayStr < nextD;
                    const colTasks = wt.filter(t =>
                      t.due && t.due >= w.d && t.due < nextD && !t.isSubtask
                    );
                    const showBar = wtActive.some(t =>
                      (t.due >= w.d && t.due < nextD) ||
                      (t.startDate && w.d >= t.startDate && w.d <= t.due)
                    );

                    return (
                      <td key={w.d} className={isToday ? 'today-col' : ''}>
                        <div className="gcell">
                          {showBar && <div className="mbar" style={{ background: 'var(--swp-blue)' }} />}
                          {[...new Map(colTasks.filter(t => t.type !== 'task').map(t => [t.type, t])).values()]
                            .map(t => <Diamond key={t.type} task={t} />)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drill panel */}
      {selWs && (
        <DrillPanel
          wsId={selWs}
          tasks={loaTasks}
          onClose={() => setSelWs(null)}
          onInline={onInline}
          onUpsertTasks={onUpsertTasks}
          onDeleteTask={onDeleteTask}
          onOpenAdd={onOpenAdd}
          onOpenEdit={onOpenEdit}
        />
      )}
    </div>
  );
}

function Diamond({ task: t }) {
  if (t.type === 'task') return null;
  if (t.type === 'milestone-finalize') {
    return <div className="mdiamond" style={{ background: 'white', border: '3px solid var(--finalize-orange)' }} title={t.name} />;
  }
  if (t.type === 'milestone-key') {
    return <div className="mdiamond" style={{ background: 'var(--key-navy)' }} title={t.name} />;
  }
  if (t.type === 'meeting') {
    return <div className="mdiamond" style={{ background: 'var(--srmc-yellow)' }} title={t.name} />;
  }
  return <div className="mdiamond" style={{ background: 'var(--swp-blue)' }} title={t.name} />;
}
