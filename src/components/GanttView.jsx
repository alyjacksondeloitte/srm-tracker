import React, { useState } from 'react';
import { WS, GCOLS } from '../constants.js';
import { todayDate } from '../utils.js';
import DrillPanel from './DrillPanel.jsx';

function loadOrder(workstreams) {
  try {
    const saved = JSON.parse(localStorage.getItem('gantt-ws-order') || 'null');
    if (Array.isArray(saved) && saved.length) {
      const byId = Object.fromEntries(workstreams.map(w => [w.id, w]));
      const ordered = saved.map(id => byId[id]).filter(Boolean);
      const unseen = workstreams.filter(w => !saved.includes(w.id));
      return [...ordered, ...unseen];
    }
  } catch {}
  return workstreams;
}

export default function GanttView({ tasks, workstreams: wsProp, onInline, onUpsertTasks, onDeleteTask, onOpenAdd, onOpenEdit, onOpenWsModal, onUpdateWs }) {
  const source = wsProp?.length ? wsProp : WS;
  const [wsOrder, setWsOrder] = useState(() => loadOrder(source));
  const [selWs, setSelWs] = useState(null);

  function moveWs(id, dir) {
    setWsOrder(prev => {
      const idx = prev.findIndex(w => w.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      localStorage.setItem('gantt-ws-order', JSON.stringify(arr.map(w => w.id)));
      return arr;
    });
  }

  const allWeeks = [];
  GCOLS.forEach(m => m.weeks.forEach(w => allWeeks.push({ ...w, m: m.m })));
  const todayStr = todayDate().toISOString().split('T')[0];

  function clickWs(wsId) {
    setSelWs(prev => prev === wsId ? null : wsId);
  }

  return (
    <div>
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
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={onOpenWsModal}>
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
              const wt = tasks.filter(t => t.ws === ws.id);
              const isSel = selWs === ws.id;
              const dueDates = wt.filter(t => t.due).map(t => t.due).sort();
              const wsFirst = dueDates[0];
              const wsLast = dueDates[dueDates.length - 1];

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
                            if (val && val !== ws.label) onUpdateWs(ws.id, val);
                            else e.target.value = ws.label;
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { e.target.value = ws.label; e.target.blur(); } }}
                        />
                        <div className="ws-cnt">{wt.filter(t => t.status !== 'complete').length} remaining</div>
                      </div>
                    </div>
                  </td>

                  {allWeeks.map((w, wi) => {
                    const nextD = wi < allWeeks.length - 1 ? allWeeks[wi + 1].d : '2026-09-01';
                    const isToday = w.d <= todayStr && todayStr < nextD;
                    const colTasks = wt.filter(t =>
                      t.due && t.due >= w.d && t.due < nextD && !t.isSubtask
                    );
                    const showBar = colTasks.length === 0 && wsFirst && wsLast && w.d >= wsFirst && w.d <= wsLast;

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
          tasks={tasks}
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
  const safe = (t.name || '').replace(/"/g, '&quot;');
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
  // swp-session + anything else
  return <div className="mdiamond" style={{ background: 'var(--swp-blue)' }} title={t.name} />;
}
