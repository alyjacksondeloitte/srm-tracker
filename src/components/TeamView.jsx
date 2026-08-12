import React, { useState } from 'react';
import { WS, TEAM, REVIEWERS } from '../constants.js';
import { todayDate, pd, fmtShort, dueCls } from '../utils.js';

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

const AVATAR_COLORS = ['#1F3864','#00A3E0','#E91E8C','#FB8C00','#66BB6A','#7B68EE','#26C6DA','#78909C'];

export default function TeamView({ tasks, ptoRecords, onAddPTO, onRemovePTO, isOnPTO, getPTORecord }) {
  const today = todayDate();
  const fmt = d => d.toISOString().split('T')[0];

  const [from, setFrom] = useState(fmt(today));
  const [to, setTo] = useState(() => {
    const e = new Date(today); e.setDate(today.getDate() + 13); return fmt(e);
  });
  const [hideComplete, setHideComplete] = useState(false);
  const [ptoPerson, setPtoPerson] = useState('');
  const [ptoFrom, setPtoFrom] = useState('');
  const [ptoTo, setPtoTo] = useState('');

  const allPeople = [...new Set([...TEAM, ...REVIEWERS])].sort();

  function handleAddPTO() {
    if (!ptoPerson || !ptoFrom || !ptoTo) { alert('Please select a person and both dates.'); return; }
    if (ptoFrom > ptoTo) { alert('Start date must be before end date.'); return; }
    onAddPTO(ptoPerson, ptoFrom, ptoTo);
    setPtoPerson(''); setPtoFrom(''); setPtoTo('');
  }

  // Build per-person data for the date range
  let rangeTasks = tasks.filter(t => t.due && t.due >= from && t.due <= to);
  if (hideComplete) rangeTasks = rangeTasks.filter(t => t.status !== 'complete');

  const ownerPeople = rangeTasks.map(t => t.owner).filter(Boolean);
  const reviewerPeople = rangeTasks.filter(t => t.isReview).map(t => t.owner).filter(Boolean);
  const displayPeople = [...new Set([...TEAM, ...REVIEWERS, ...ownerPeople, ...reviewerPeople])].sort();

  return (
    <div className="team-wrap">
      {/* PTO Manager */}
      <div className="pto-bar">
        <span className="pto-label">🏖 PTO Manager</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <select className="d-input" value={ptoPerson} onChange={e => setPtoPerson(e.target.value)}>
            <option value="">— Select person —</option>
            {allPeople.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" className="d-input" value={ptoFrom} onChange={e => setPtoFrom(e.target.value)} />
          <span style={{ fontSize: 11, color: 'var(--text2)' }}>to</span>
          <input type="date" className="d-input" value={ptoTo} onChange={e => setPtoTo(e.target.value)} />
          <button className="btn" onClick={handleAddPTO}>Add PTO</button>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ptoRecords.length === 0
            ? <span style={{ fontSize: 11, color: 'var(--text3)' }}>No PTO scheduled</span>
            : ptoRecords.map(p => (
                <div key={p.id} className="pto-chip">
                  🏖 {p.person}: {fmtShort(p.from)} – {fmtShort(p.to)}
                  <button onClick={() => onRemovePTO(p.id)}>✕</button>
                </div>
              ))
          }
        </div>
      </div>

      {/* Date range controls */}
      <div className="daily-ctrl" style={{ padding: '12px 24px 0' }}>
        <label>From</label>
        <input type="date" className="d-input" value={from} onChange={e => setFrom(e.target.value)} />
        <label>To</label>
        <input type="date" className="d-input" value={to} onChange={e => setTo(e.target.value)} />
        <label style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text2)' }}>
          <input type="checkbox" checked={hideComplete} onChange={e => setHideComplete(e.target.checked)} />
          Hide completed
        </label>
      </div>

      <div style={{ padding: '12px 24px' }}>
        {displayPeople.map((person, pi) => {
          const ownedTasks = rangeTasks
            .filter(t => t.owner === person && !t.isReview && !t.isSubtask)
            .sort((a, b) => (a.due || '').localeCompare(b.due || ''));
          const subtaskItems = rangeTasks
            .filter(t => t.isSubtask && t.owner === person)
            .sort((a, b) => (a.due || '').localeCompare(b.due || ''));
          const reviewerTasks = rangeTasks
            .filter(t => t.isReview && t.owner === person)
            .sort((a, b) => (a.due || '').localeCompare(b.due || ''));

          const ptoInRange = ptoRecords.filter(p =>
            p.person === person && p.from <= to && p.to >= from
          );
          const hasActivePTO = ptoInRange.length > 0;
          const allPersonTasks = [...ownedTasks, ...subtaskItems, ...reviewerTasks];
          const conflictTasks = allPersonTasks.filter(t => t.due && isOnPTO(person, t.due));

          if (allPersonTasks.length === 0 && !hasActivePTO) return null;

          const initials = person.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
          const avatarColor = AVATAR_COLORS[pi % AVATAR_COLORS.length];
          const totalCount = ownedTasks.length + reviewerTasks.length;
          const countLabel = [
            ownedTasks.length   ? `${ownedTasks.length} task${ownedTasks.length !== 1 ? 's' : ''}`       : '',
            subtaskItems.length ? `${subtaskItems.length} subtask${subtaskItems.length !== 1 ? 's' : ''}` : '',
            reviewerTasks.length ? `${reviewerTasks.length} review${reviewerTasks.length !== 1 ? 's' : ''}` : '',
          ].filter(Boolean).join(', ');

          return (
            <div key={person} className="person-card">
              <div className="person-card-hd">
                <div className="person-avatar" style={{ background: avatarColor }}>{initials}</div>
                <div>
                  <div className="person-name">{person}</div>
                  <div className="person-task-count">
                    {countLabel || 'No tasks'}
                    {conflictTasks.length > 0 && (
                      <span style={{ color: 'var(--warn-text)', fontWeight: 700 }}>
                        &nbsp;·&nbsp; ⚠ {conflictTasks.length} PTO conflict{conflictTasks.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                {ptoInRange.map(p => (
                  <span key={p.id} className="pto-active-badge">🏖 PTO: {fmtShort(p.from)}–{fmtShort(p.to)}</span>
                ))}
              </div>

              {totalCount === 0
                ? <div className="no-tasks-person">No tasks due in this range</div>
                : (
                  <div className="person-tasks">
                    {ownedTasks.map(t => <OwnedRow key={t.id} task={t} person={person} isOnPTO={isOnPTO} getPTORecord={getPTORecord} />)}
                    {subtaskItems.map(s => <SubtaskRow key={s.id} task={s} tasks={tasks} person={person} isOnPTO={isOnPTO} getPTORecord={getPTORecord} />)}
                    {reviewerTasks.map(r => <ReviewRow key={r.id} task={r} tasks={tasks} person={person} isOnPTO={isOnPTO} getPTORecord={getPTORecord} />)}
                  </div>
                )
              }
            </div>
          );
        })}
        {displayPeople.every(person => {
          const rt = rangeTasks.filter(t => t.owner === person);
          return rt.length === 0 && !ptoRecords.some(p => p.person === person);
        }) && (
          <div style={{ color: 'var(--text3)', fontStyle: 'italic', padding: 16 }}>
            No tasks assigned in this range.
          </div>
        )}
      </div>
    </div>
  );
}

function OwnedRow({ task: t, person, isOnPTO, getPTORecord }) {
  const ws = WS.find(w => w.id === t.ws);
  const conflict = t.due && isOnPTO(person, t.due);
  const ptoRec = conflict ? getPTORecord(person, t.due) : null;
  return (
    <div className={`person-task-row${conflict ? ' pto-conflict' : ''}`}>
      <span className="ws-badge" style={{ background: `${ws?.color || '#666'}1a`, color: ws?.color || '#aaa' }}>
        {ws?.label || t.ws}
      </span>
      <span style={{ flex: 1, fontSize: 12, ...(t.status === 'complete' ? { textDecoration: 'line-through', color: 'var(--text3)' } : {}) }}>
        {t.name}
      </span>
      <Pill status={t.status} />
      <span className={dueCls(t.due)} style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtShort(t.due)}</span>
      {conflict && (
        <span className="conflict-flag" title={`On PTO ${fmtShort(ptoRec.from)}–${fmtShort(ptoRec.to)}`}>⚠ PTO</span>
      )}
    </div>
  );
}

function SubtaskRow({ task: s, tasks, person, isOnPTO, getPTORecord }) {
  const parentTask = tasks.find(p => p.id === s.parentId);
  const ws = WS.find(w => w.id === s.ws);
  const conflict = s.due && isOnPTO(person, s.due);
  const ptoRec = conflict ? getPTORecord(person, s.due) : null;
  return (
    <div className={`person-task-row${conflict ? ' pto-conflict' : ''}`} style={{ background: '#fafafa' }}>
      <span className="ws-badge" style={{ background: '#f0f0f0', color: '#888', border: '1px solid #ddd' }}>
        ◦ Subtask: {ws?.label || s.ws}
      </span>
      <span style={{ flex: 1, fontSize: 12, ...(s.status === 'complete' ? { textDecoration: 'line-through', color: 'var(--text3)' } : {}) }}>
        {s.name}
        {parentTask && <span style={{ fontSize: 10, color: 'var(--text3)' }}> ↳ {parentTask.name}</span>}
      </span>
      <Pill status={s.status} />
      <span className={dueCls(s.due)} style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtShort(s.due)}</span>
      {conflict && (
        <span className="conflict-flag" title={`On PTO ${fmtShort(ptoRec.from)}–${fmtShort(ptoRec.to)}`}>⚠ PTO</span>
      )}
    </div>
  );
}

function ReviewRow({ task: r, tasks, person, isOnPTO, getPTORecord }) {
  const parent = tasks.find(t => t.id === r.parentId);
  const conflict = r.due && isOnPTO(person, r.due);
  const ptoRec = conflict ? getPTORecord(person, r.due) : null;
  return (
    <div className={`person-task-row${conflict ? ' pto-conflict' : ''}`} style={{ background: '#f5faff' }}>
      <span className="review-badge">🔍 Review</span>
      <span style={{ flex: 1, fontSize: 12 }}>
        <span style={{ fontStyle: 'italic', color: 'var(--text2)' }}>
          {r.name.replace(/^Review: "|" —.*$/g, '').replace(/^"/, '')}
        </span>
        <span style={{ color: 'var(--text3)', fontSize: 10 }}> &nbsp;↳ for: {parent?.name || '—'}</span>
      </span>
      <Pill status={r.status} />
      <span className={dueCls(r.due)} style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtShort(r.due)}</span>
      {conflict && (
        <span className="conflict-flag" title={`On PTO ${fmtShort(ptoRec.from)}–${fmtShort(ptoRec.to)}`}>⚠ PTO</span>
      )}
    </div>
  );
}
