import React, { useState, useEffect, useRef } from 'react';
import { WS, TEAM } from '../constants.js';
import { sortByDue, fmtShort, dueCls, autoSizeTextareas } from '../utils.js';

const STATUS_LABELS = {
  'not-started': { label: 'Not Started', cls: 's-ns' },
  'in-progress':  { label: 'In Progress', cls: 's-ip' },
  'in-review':    { label: 'In Review',   cls: 's-ir' },
  'complete':     { label: 'Complete',    cls: 's-co' },
  'blocked':      { label: 'Blocked',     cls: 's-bl' },
};

export default function DrillPanel({ wsId, tasks, onClose, onInline, onUpsertTasks, onDeleteTask, onOpenAdd, onOpenEdit }) {
  const [collapsed, setCollapsed] = useState(new Set());
  const [pendingDel, setPendingDel] = useState(null);
  const bodyRef = useRef(null);
  const ws = WS.find(w => w.id === wsId);

  // Auto-size textareas after render
  useEffect(() => {
    if (bodyRef.current) autoSizeTextareas(bodyRef.current);
  });

  // Reset pending delete after 3s
  useEffect(() => {
    if (!pendingDel) return;
    const timer = setTimeout(() => setPendingDel(null), 3000);
    return () => clearTimeout(timer);
  }, [pendingDel]);

  function toggleCollapse(id) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleDelete(id) {
    if (pendingDel === id) {
      setPendingDel(null);
      // Delete the task and all its children
      const childIds = tasks.filter(t => t.parentId === id).map(t => t.id);
      [id, ...childIds].forEach(tid => onDeleteTask(tid));
    } else {
      setPendingDel(id);
    }
  }

  const parents = sortByDue(tasks.filter(t => t.ws === wsId && !t.isReview && !t.isSubtask));

  return (
    <div className="drill open">
      <div className="drill-hd">
        <span className="drill-title" style={{ color: ws?.color }}>
          {ws?.label} — Tasks
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn" onClick={() => onOpenAdd(wsId)}>+ Add Task</button>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      <table className="ttbl">
        <thead>
          <tr>
            <th style={{ width: '26%' }}>Task</th>
            <th style={{ width: '12%' }}>Owner</th>
            <th style={{ width: '30%' }}>Notes</th>
            <th style={{ width: '8%' }}>Due</th>
            <th style={{ width: '7%', textAlign: 'center' }}>Done?</th>
            <th style={{ width: '13%' }}>Actions</th>
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {!parents.length ? (
            <tr><td colSpan={6} style={{ padding: 12, color: 'var(--text3)', fontStyle: 'italic', fontSize: 12 }}>
              No tasks yet — click + Add Task.
            </td></tr>
          ) : parents.map(t => (
            <ParentRows
              key={t.id}
              task={t}
              tasks={tasks}
              collapsed={collapsed}
              pendingDel={pendingDel}
              onToggleCollapse={toggleCollapse}
              onInline={onInline}
              onDelete={handleDelete}
              onOpenEdit={onOpenEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParentRows({ task: t, tasks, collapsed, pendingDel, onToggleCollapse, onInline, onDelete, onOpenEdit }) {
  const children = tasks
    .filter(c => c.parentId === t.id && (c.isReview || c.isSubtask))
    .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));

  const hasChildren = children.length > 0;
  const isCollapsed = collapsed.has(t.id);
  const fade = t.status === 'complete' ? { opacity: 0.35 } : {};

  return (
    <>
      {/* Parent row */}
      <tr className="trow" style={{ background: t.status === 'complete' ? '#f4f4f4' : 'var(--bg)', ...fade }}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {hasChildren ? (
              <button
                className="icon-btn"
                style={{ fontSize: 10, color: 'var(--text3)', padding: '1px 4px', border: '1px solid var(--border)', borderRadius: 3, lineHeight: 1.4 }}
                title={isCollapsed ? 'Show details' : 'Hide details'}
                onClick={() => onToggleCollapse(t.id)}
              >
                {isCollapsed ? '▶' : '▾'}
              </button>
            ) : <span style={{ display: 'inline-block', width: 22 }} />}
            <div>
              <textarea
                className="name-inline"
                defaultValue={t.name}
                style={t.status === 'complete' ? { textDecoration: 'line-through', color: 'var(--text3)' } : {}}
                onBlur={e => onInline(t.id, 'name', e.target.value)}
              />
              {children.length > 0 && (
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
                  {children.length} item{children.length > 1 ? 's' : ''} {isCollapsed ? '(hidden)' : ''}
                </div>
              )}
            </div>
          </div>
        </td>
        <td><OwnerSelect task={t} onInline={onInline} /></td>
        <td>
          <textarea
            className="notes-inline"
            defaultValue={t.notes || ''}
            onBlur={e => onInline(t.id, 'notes', e.target.value)}
          />
        </td>
        <DueCell task={t} onInline={onInline} />
        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            title="Completed?"
            defaultChecked={t.status === 'complete'}
            style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--key-navy)' }}
            onChange={e => onInline(t.id, 'status', e.target.checked ? 'complete' : 'not-started')}
          />
          <span
            title={t.priority ? 'Remove priority flag' : 'Flag as priority'}
            onClick={() => onInline(t.id, 'priority', !t.priority)}
            style={{ cursor: 'pointer', fontSize: 13, marginLeft: 4, userSelect: 'none' }}
            className={`pri-flag ${t.priority ? 'pri-on' : 'pri-off'}`}
          >⚑</span>
        </td>
        <ActionBtns task={t} pendingDel={pendingDel} onDelete={onDelete} onOpenEdit={onOpenEdit} />
      </tr>

      {/* Child rows — subtasks and reviews interleaved, sorted by due date */}
      {!isCollapsed && children.map(c => c.isReview ? (
        <ReviewRow
          key={c.id}
          task={c}
          tasks={tasks}
          pendingDel={pendingDel}
          onInline={onInline}
          onDelete={onDelete}
          onOpenEdit={onOpenEdit}
        />
      ) : (
        <SubtaskRow
          key={c.id}
          task={c}
          pendingDel={pendingDel}
          onInline={onInline}
          onDelete={onDelete}
          onOpenEdit={onOpenEdit}
        />
      ))}
    </>
  );
}

function SubtaskRow({ task: s, pendingDel, onInline, onDelete, onOpenEdit }) {
  const fade = s.status === 'complete' ? { opacity: 0.35 } : {};
  return (
    <tr className="trow" style={{ background: '#f9f9f9', ...fade }}>
      <td style={{ paddingLeft: 42 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text3)', fontSize: 14, lineHeight: 1 }}>↳</span>
          <textarea
            className="name-inline"
            defaultValue={s.name}
            style={{ fontSize: 11, fontWeight: 600 }}
            onBlur={e => onInline(s.id, 'name', e.target.value)}
          />
        </div>
      </td>
      <td><OwnerSelect task={s} onInline={onInline} /></td>
      <td>
        <textarea className="notes-inline" defaultValue={s.notes || ''} onBlur={e => onInline(s.id, 'notes', e.target.value)} />
      </td>
      <DueCell task={s} onInline={onInline} />
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          title="Completed?"
          defaultChecked={s.status === 'complete'}
          style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--key-navy)' }}
          onChange={e => onInline(s.id, 'status', e.target.checked ? 'complete' : 'not-started')}
        />
      </td>
      <ActionBtns task={s} pendingDel={pendingDel} onDelete={onDelete} onOpenEdit={onOpenEdit} />
    </tr>
  );
}

function ReviewRow({ task: r, tasks, pendingDel, onInline, onDelete, onOpenEdit }) {
  const fade = r.status === 'complete' ? { opacity: 0.35 } : {};
  return (
    <tr className="trow" style={{ background: '#f5faff', ...fade }}>
      <td style={{ paddingLeft: 42 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--swp-blue)', fontSize: 14, lineHeight: 1 }}>↳</span>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>🔍 Review</div>
        </div>
      </td>
      <td><OwnerSelect task={r} onInline={onInline} /></td>
      <td>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>
          {r.sendDate && <>Send: <b>{fmtShort(r.sendDate)}</b></>}
          {r.reviewDays && <> · {r.reviewDays} days</>}
          {r.reviewEndDate && <> · Done: <b>{fmtShort(r.reviewEndDate)}</b></>}
          {r.exceedsDeadline && <> · <span style={{ color: 'var(--warn-text)', fontWeight: 700 }}>⚠</span></>}
        </div>
        <textarea className="notes-inline" defaultValue={r.notes || ''} onBlur={e => onInline(r.id, 'notes', e.target.value)} />
      </td>
      <DueCell task={r} onInline={onInline} />
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          title="Completed?"
          defaultChecked={r.status === 'complete'}
          style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--key-navy)' }}
          onChange={e => onInline(r.id, 'status', e.target.checked ? 'complete' : 'not-started')}
        />
      </td>
      <ActionBtns task={r} pendingDel={pendingDel} onDelete={onDelete} onOpenEdit={onOpenEdit} />
    </tr>
  );
}

function OwnerSelect({ task: t, onInline }) {
  return (
    <select
      className="sel-sm"
      defaultValue={t.owner || ''}
      onChange={e => onInline(t.id, 'owner', e.target.value)}
    >
      <option value="">—</option>
      {TEAM.map(m => <option key={m}>{m}</option>)}
      {t.owner && !TEAM.includes(t.owner) && <option value={t.owner}>{t.owner}</option>}
    </select>
  );
}

function DueCell({ task: t, onInline }) {
  const [editing, setEditing] = useState(false);
  const cl = t.status === 'complete' ? 'due-ok' : dueCls(t.due);
  const lbl = t.due
    ? new Date(t.due + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  return (
    <td className="due-cell">
      {editing ? (
        <input
          type="date"
          className={`due-inline ${cl}`}
          defaultValue={t.due || ''}
          autoFocus
          onBlur={e => { onInline(t.id, 'due', e.target.value); setEditing(false); }}
          onChange={e => onInline(t.id, 'due', e.target.value)}
        />
      ) : (
        <span className={`due-display ${cl}`} onClick={() => setEditing(true)}>{lbl}</span>
      )}
    </td>
  );
}

function ActionBtns({ task: t, pendingDel, onDelete, onOpenEdit }) {
  const isPending = pendingDel === t.id;
  return (
    <td style={{ whiteSpace: 'nowrap' }}>
      <button className="icon-btn" title="Edit" onClick={() => onOpenEdit(t.id)}>✎</button>
      <button
        className="icon-btn"
        style={isPending ? { color: '#fff', background: '#3a0000', padding: '2px 7px' } : { color: '#ff6b6b' }}
        title={isPending ? 'Click again to confirm' : 'Delete'}
        onClick={() => onDelete(t.id)}
      >
        {isPending ? 'Sure?' : '✕'}
      </button>
    </td>
  );
}
