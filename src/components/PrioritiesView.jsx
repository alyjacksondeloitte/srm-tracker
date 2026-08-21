import React, { useState, useEffect, useRef } from 'react';
import { WS, WS_LOA14, TEAM } from '../constants.js';

const ALL_WS = [...WS, ...WS_LOA14];
import { sortByDue, dueCls, fmtShort, autoSizeTextareas } from '../utils.js';

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

const SORTABLE = ['Task', 'Workstream', 'Owner', 'Due'];

function sortFn(col, dir, allWs) {
  return (a, b) => {
    let va, vb;
    if (col === 'Task')        { va = (a.name || '').toLowerCase();                          vb = (b.name || '').toLowerCase(); }
    if (col === 'Workstream')  { va = (allWs.find(w => w.id === a.ws)?.label || a.ws).toLowerCase(); vb = (allWs.find(w => w.id === b.ws)?.label || b.ws).toLowerCase(); }
    if (col === 'Owner')       { va = (a.owner || '').toLowerCase();                         vb = (b.owner || '').toLowerCase(); }
    if (col === 'Due')         { va = a.due || '9999'; vb = b.due || '9999'; }
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  };
}

export default function PrioritiesView({ tasks, workstreams, workstreamsLoa14, onInline, onOpenAdd, onOpenEdit }) {
  const allWs = [...(workstreams?.length ? workstreams : WS), ...(workstreamsLoa14?.length ? workstreamsLoa14 : WS_LOA14)];
  const [hideComplete, setHideComplete] = useState(false);
  const [sortCol, setSortCol] = useState('Due');
  const [sortDir, setSortDir] = useState('asc');
  const tableRef = useRef(null);

  useEffect(() => {
    if (tableRef.current) autoSizeTextareas(tableRef.current);
  });

  function handleSort(col) {
    if (!SORTABLE.includes(col)) return;
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  let flagged = tasks.filter(t => t.priority === true && !t.isReview && !t.isSubtask);
  if (hideComplete) flagged = flagged.filter(t => t.status !== 'complete');
  flagged = [...flagged].sort(sortFn(sortCol, sortDir, allWs));

  const COLS = ['Task', 'Workstream', 'Owner', 'Notes', 'Due', 'Done', 'Actions'];

  return (
    <div className="team-wrap">
      <div className="daily-ctrl" style={{ padding: '14px 24px 0' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--key-navy)' }}>⚑ Team Priorities</span>
        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 10 }}>All flagged tasks across workstreams</span>
        <button className="btn" style={{ marginLeft: 'auto' }} onClick={onOpenAdd}>+ Add Task</button>
        <label style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text2)' }}>
          <input type="checkbox" checked={hideComplete} onChange={e => setHideComplete(e.target.checked)} />
          Hide completed
        </label>
      </div>

      <div style={{ padding: '12px 24px' }} ref={tableRef}>
        {flagged.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontStyle: 'italic' }}>
            No priority tasks flagged yet.<br />
            <span style={{ fontSize: 11 }}>Open a workstream drill-down and click ⚑ on any task to flag it here.</span>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {COLS.map(h => {
                  const sortable = SORTABLE.includes(h);
                  const active = sortCol === h;
                  return (
                    <th
                      key={h}
                      onClick={() => handleSort(h)}
                      style={{
                        textAlign: h === 'Done' || h === 'Actions' ? 'center' : 'left',
                        padding: '8px 10px',
                        fontSize: 11,
                        color: active ? 'var(--key-navy)' : 'var(--text3)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '.5px',
                        cursor: sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                      {sortable && (
                        <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: 10 }}>
                          {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {flagged.map(t => <PriorityRow key={t.id} task={t} allWs={allWs} onInline={onInline} onOpenEdit={onOpenEdit} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PriorityRow({ task: t, allWs, onInline, onOpenEdit }) {
  const ws = allWs.find(w => w.id === t.ws);
  const done = t.status === 'complete';
  const dueCl = done ? 'due-ok' : dueCls(t.due);
  const [editing, setEditing] = useState(false);

  return (
    <tr className="trow" style={{ background: done ? '#f4f4f4' : 'var(--bg)', opacity: done ? 0.4 : 1 }}>
      <td style={{ padding: '6px 10px' }}>
        <textarea
          className="name-inline"
          style={done ? { textDecoration: 'line-through', color: 'var(--text3)' } : {}}
          defaultValue={t.name}
          onBlur={e => onInline(t.id, 'name', e.target.value)}
        />
      </td>
      <td style={{ padding: '6px 10px' }}>
        <span className="ws-badge" style={{ background: `${ws?.color || '#666'}1a`, color: ws?.color || '#aaa' }}>
          {ws?.label || t.ws}
        </span>
      </td>
      <td style={{ padding: '6px 10px' }}>
        <select className="sel-sm" defaultValue={t.owner || ''} onChange={e => onInline(t.id, 'owner', e.target.value)}>
          <option value="">—</option>
          {TEAM.map(m => <option key={m}>{m}</option>)}
          {t.owner && !TEAM.includes(t.owner) && <option value={t.owner}>{t.owner}</option>}
        </select>
      </td>
      <td style={{ padding: '6px 10px' }}>
        <textarea className="notes-inline" defaultValue={t.notes || ''} onBlur={e => onInline(t.id, 'notes', e.target.value)} />
      </td>
      <td className="due-cell" style={{ padding: '6px 10px' }}>
        {editing ? (
          <input
            type="date"
            className={`due-inline ${dueCl}`}
            defaultValue={t.due || ''}
            autoFocus
            onBlur={e => { onInline(t.id, 'due', e.target.value); setEditing(false); }}
            onChange={e => onInline(t.id, 'due', e.target.value)}
          />
        ) : (
          <span className={`due-display ${dueCl}`} onClick={() => setEditing(true)}>
            {t.due ? new Date(t.due + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
          </span>
        )}
      </td>
      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
        <input
          type="checkbox"
          defaultChecked={done}
          style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--key-navy)' }}
          onChange={e => onInline(t.id, 'status', e.target.checked ? 'complete' : 'not-started')}
        />
      </td>
      <td style={{ padding: '6px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
        <button className="icon-btn" title="Edit in modal" onClick={() => onOpenEdit(t.id)}>✎</button>
        <span
          title="Remove priority flag"
          onClick={() => onInline(t.id, 'priority', false)}
          style={{ cursor: 'pointer', fontSize: 14, color: 'var(--due-priority)', userSelect: 'none', padding: '2px 4px' }}
        >⚑</span>
      </td>
    </tr>
  );
}
