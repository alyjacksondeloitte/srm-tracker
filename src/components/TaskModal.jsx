import React, { useState, useEffect, useCallback } from 'react';
import { WS, WS_LOA14 as WS_LOA14_DEFAULT, TEAM, REVIEWERS } from '../constants.js';
import { uid, fmtShort, pd } from '../utils.js';
import { addWeekdays, buildReviewTasks, buildSubtasks } from '../reviewChain.js';

const EMPTY_TASK = {
  ws: WS[0].id,
  name: '',
  notes: '',
  due: '',
  startDate: '',
  owner: '',
  status: 'not-started',
  type: 'task',
  priority: false,
};

export default function TaskModal({ open, editId, tasks, defaultWsId, workstreamsLoa14, onSave, onClose }) {
  const ALL_WS = [
    { label: 'LOA 12', options: WS },
    { label: 'LOA 14', options: workstreamsLoa14?.length ? workstreamsLoa14 : WS_LOA14_DEFAULT },
  ];
  const [form, setForm] = useState(EMPTY_TASK);
  const [customOwner, setCustomOwner] = useState('');
  const [showCustomOwner, setShowCustomOwner] = useState(false);
  const [hasReviewers, setHasReviewers] = useState(false);
  const [reviewerRows, setReviewerRows] = useState([]);
  const [hasSubtasks, setHasSubtasks] = useState(false);
  const [subtaskRows, setSubtaskRows] = useState([]);
  const [chainWarning, setChainWarning] = useState(null); // { text, isOk }

  const isEditing = !!editId;
  const editingTask = editId ? tasks.find(t => t.id === editId) : null;
  const isReviewOrSub = editingTask?.isReview || editingTask?.isSubtask;

  // Populate form when modal opens
  useEffect(() => {
    if (!open) return;
    if (isEditing && editingTask) {
      const t = editingTask;
      const ownerIsCustom = t.owner && !TEAM.includes(t.owner);
      setForm({
        ws: t.ws, name: t.name, notes: t.notes || '', due: t.due || '',
        startDate: t.startDate || '',
        owner: ownerIsCustom ? '__c' : (t.owner || ''),
        status: t.status || 'not-started',
        type: t.type || 'task',
        priority: t.priority ?? false,
      });
      setCustomOwner(ownerIsCustom ? t.owner : '');
      setShowCustomOwner(ownerIsCustom);

      // Populate existing subtasks
      const existingSubs = tasks.filter(t2 => t2.isSubtask && t2.parentId === editId);
      if (existingSubs.length) {
        setHasSubtasks(true);
        setSubtaskRows(existingSubs.map(s => ({ id: s.id, name: s.name, startDate: s.startDate || '', due: s.due || '', notes: s.notes || '', owner: s.owner || '' })));
      } else {
        setHasSubtasks(false);
        setSubtaskRows([]);
      }
      setHasReviewers(false);
      setReviewerRows([]);
      setChainWarning(null);
    } else {
      setForm({ ...EMPTY_TASK, ws: defaultWsId || WS[0].id });
      setCustomOwner('');
      setShowCustomOwner(false);
      setHasReviewers(false);
      setReviewerRows([]);
      setHasSubtasks(false);
      setSubtaskRows([]);
      setChainWarning(null);
    }
  }, [open, editId]);

  // Recalculate the review chain whenever rows or due date change
  const cascadeReviewDates = useCallback((rows, due) => {
    if (!rows.length) { setChainWarning(null); return rows; }

    let prevEndDate = null;
    const updated = rows.map((row, i) => {
      let sendDate = row.sendDate;

      // Non-first rows auto-cascade from previous end date unless manually overridden
      if (i > 0 && !row.overridden && prevEndDate) {
        sendDate = prevEndDate;
      }

      const days = row.days || 5;
      const endDate = sendDate ? addWeekdays(sendDate, days) : '';
      const exceeds = !!(due && endDate && endDate > due);
      prevEndDate = endDate || null;

      return { ...row, sendDate, endDate, exceeds };
    });

    // Chain-level warning
    const last = updated[updated.length - 1];
    if (last?.endDate && due) {
      if (last.endDate > due) {
        const buffer = Math.round((pd(due) - pd(last.endDate)) / 86400000);
        setChainWarning({ text: `⚠ Review chain ends ${fmtShort(last.endDate)} — ${Math.abs(buffer)} day(s) past the deadline`, isOk: false });
      } else {
        const buffer = Math.round((pd(due) - pd(last.endDate)) / 86400000);
        setChainWarning({ text: `✓ Chain fits — ${buffer} day(s) buffer before deadline`, isOk: true });
      }
    } else {
      setChainWarning(null);
    }

    return updated;
  }, []);

  function updateReviewerRows(newRows) {
    const cascaded = cascadeReviewDates(newRows, form.due);
    setReviewerRows(cascaded);
  }

  function handleDueChange(val) {
    setForm(f => ({ ...f, due: val }));
    if (hasReviewers) {
      const cascaded = cascadeReviewDates(reviewerRows, val);
      setReviewerRows(cascaded);
    }
  }

  function addReviewerRow() {
    const newRow = { _key: uid(), reviewer: '', sendDate: '', days: 5, overridden: true, endDate: '', exceeds: false };
    updateReviewerRows([...reviewerRows, newRow]);
  }

  function removeReviewerRow(key) {
    updateReviewerRows(reviewerRows.filter(r => r._key !== key));
  }

  function updateReviewerField(key, field, val) {
    const updated = reviewerRows.map(r => {
      if (r._key !== key) return r;
      const next = { ...r, [field]: val };
      if (field === 'sendDate') next.overridden = true;
      if (field === 'days') next.overridden = false;
      return next;
    });
    updateReviewerRows(updated);
  }

  function addSubtaskRow() {
    setSubtaskRows(prev => [...prev, { _key: uid(), name: '', startDate: '', due: '', notes: '', owner: '' }]);
  }

  function removeSubtaskRow(key) {
    setSubtaskRows(prev => prev.filter(s => s._key !== key));
  }

  function updateSubtaskField(key, field, val) {
    setSubtaskRows(prev => prev.map(s => s._key === key ? { ...s, [field]: val } : s));
  }

  function handleSave() {
    const name = form.name.trim();
    if (!name) { alert('Task name is required.'); return; }

    const owner = form.owner === '__c' ? customOwner.trim() : form.owner;
    const status = form.status === 'complete'
      ? 'complete'
      : (isEditing ? (editingTask?.status || 'not-started') : 'not-started');

    const baseTask = {
      id: isEditing ? editId : uid(),
      ws: form.ws, name, notes: form.notes.trim(),
      startDate: form.startDate,
      due: form.due, owner, status,
      type: form.type,
      priority: form.priority,
      // preserve relationship fields when editing a child task
      ...(isEditing && editingTask?.parentId  ? { parentId:  editingTask.parentId  } : {}),
      ...(isEditing && editingTask?.isReview  ? { isReview:  true                  } : {}),
      ...(isEditing && editingTask?.isSubtask ? { isSubtask: true                  } : {}),
    };

    const revTaskList = hasReviewers
      ? buildReviewTasks(baseTask.id, baseTask.ws, baseTask.name, baseTask.due,
          reviewerRows.filter(r => r.reviewer).map(r => ({ reviewer: r.reviewer, sendDate: r.sendDate, days: r.days })))
      : [];

    const subTaskList = hasSubtasks
      ? buildSubtasks(baseTask.id, baseTask.ws,
          subtaskRows.filter(s => s.name.trim()).map(s => ({ name: s.name, startDate: s.startDate, due: s.due, notes: s.notes, owner: s.owner })))
      : [];

    onSave({ task: baseTask, reviewTasks: revTaskList, subtasks: subTaskList, isEditing, managedReviews: hasReviewers, managedSubtasks: hasSubtasks });
    onClose();
  }

  if (!open) return null;

  return (
    <div className="overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{isEditing ? 'Edit Task' : 'Add Task'}</h2>

        {/* Workstream */}
        <div className="fg">
          <label>Workstream</label>
          <select className="fi" value={form.ws} onChange={e => setForm(f => ({ ...f, ws: e.target.value }))}>
            {ALL_WS.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Name */}
        <div className="fg">
          <label>Task Name *</label>
          <input className="fi" value={form.name} placeholder="e.g. Send pre-read to SRMC"
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        {/* Notes */}
        <div className="fg">
          <label>Notes / Details</label>
          <textarea className="fi" value={form.notes} placeholder="Context, dependencies, links..."
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        {/* Due */}
        <div className="fg">
          <label>Due Date</label>
          <input type="date" className="fi" value={form.due} onChange={e => handleDueChange(e.target.value)} />
        </div>

        {/* Owner */}
        <div className="fg">
          <label>Owner</label>
          <select className="fi" value={form.owner}
            onChange={e => {
              setForm(f => ({ ...f, owner: e.target.value }));
              setShowCustomOwner(e.target.value === '__c');
              if (e.target.value !== '__c') setCustomOwner('');
            }}>
            <option value="">— Unassigned —</option>
            {TEAM.map(m => <option key={m}>{m}</option>)}
            <option value="__c">Other…</option>
          </select>
        </div>
        {showCustomOwner && (
          <div className="fg">
            <label>Custom Name</label>
            <input className="fi" value={customOwner} onChange={e => setCustomOwner(e.target.value)} />
          </div>
        )}

        {/* Completed */}
        <div className="fg">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 13, height: 13 }}
              checked={form.status === 'complete'}
              onChange={e => setForm(f => ({ ...f, status: e.target.checked ? 'complete' : 'not-started' }))} />
            <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>
              Mark as completed
            </span>
          </label>
        </div>

        {/* Priority */}
        <div className="fg">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: 13, height: 13, accentColor: 'var(--due-priority)' }}
              checked={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.checked }))} />
            <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 700 }}>
              ⚑ Flag as priority
            </span>
          </label>
        </div>

        {/* Start Date */}
        <div className="fg">
          <label>Start Date</label>
          <input type="date" className="fi" value={form.startDate}
            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
        </div>

        {/* Type */}
        <div className="fg">
          <label>Type</label>
          <select className="fi" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="task">Internal Task</option>
            <option value="swp-session">Internal Review</option>
            <option value="milestone-key">Internal Working Session</option>
            <option value="meeting">SWP Meeting</option>
            <option value="milestone-finalize">Finalize Deliverable</option>
          </select>
        </div>

        {/* Review chain toggle */}
        {!isReviewOrSub && (
          <div className="fg">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
              <input type="checkbox" checked={hasReviewers}
                onChange={e => {
                  setHasReviewers(e.target.checked);
                  if (e.target.checked && reviewerRows.length === 0) {
                    updateReviewerRows([{ _key: uid(), reviewer: '', sendDate: '', days: 5, overridden: true, endDate: '', exceeds: false }]);
                  }
                }} />
              Add review chain
            </label>
          </div>
        )}

        {/* Review chain section */}
        {hasReviewers && (
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--key-navy)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                Review Chain
              </div>
            </div>

            {chainWarning && (
              <div style={{
                fontSize: 11, fontWeight: 600, padding: '5px 8px', borderRadius: 4, marginBottom: 8,
                background: chainWarning.isOk ? '#e6f4e6' : 'var(--warn-bg)',
                color: chainWarning.isOk ? '#2e7d32' : 'var(--warn-text)',
              }}>
                {chainWarning.text}
              </div>
            )}

            {reviewerRows.map((row, i) => (
              <ReviewerRow
                key={row._key}
                row={row}
                index={i}
                onUpdate={(field, val) => updateReviewerField(row._key, field, val)}
                onRemove={() => removeReviewerRow(row._key)}
              />
            ))}

            <button type="button" className="btn-ghost" style={{ fontSize: 11, marginTop: 8 }} onClick={addReviewerRow}>
              + Add Reviewer
            </button>
          </div>
        )}

        {/* Subtask toggle */}
        {!isReviewOrSub && (
          <div className="fg" id="subtaskToggleFg">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
              <input type="checkbox" checked={hasSubtasks}
                onChange={e => {
                  setHasSubtasks(e.target.checked);
                  if (e.target.checked && subtaskRows.length === 0) {
                    setSubtaskRows([{ _key: uid(), name: '', due: '', notes: '', owner: '' }]);
                  }
                }} />
              Add subtasks
            </label>
          </div>
        )}

        {/* Subtasks section */}
        {hasSubtasks && (
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--key-navy)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
              Subtasks
            </div>
            {subtaskRows.map(s => (
              <SubtaskInputRow
                key={s._key}
                row={s}
                onUpdate={(field, val) => updateSubtaskField(s._key, field, val)}
                onRemove={() => removeSubtaskRow(s._key)}
              />
            ))}
            <button type="button" className="btn-ghost" style={{ fontSize: 11, marginTop: 8 }} onClick={addSubtaskRow}>
              + Add Subtask
            </button>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ReviewerRow({ row, index, onUpdate, onRemove }) {
  const isCustom = row.reviewer && !REVIEWERS.includes(row.reviewer);
  const [showCustom, setShowCustom] = useState(isCustom);
  const [customName, setCustomName] = useState(isCustom ? row.reviewer : '');

  return (
    <div className="reviewer-row" style={{ alignItems: 'flex-start' }}>
      <div className="row-col-main">
        <select
          className="fi"
          style={{ width: '100%' }}
          value={showCustom ? '__custom' : (row.reviewer || '')}
          onChange={e => {
            if (e.target.value === '__custom') {
              setShowCustom(true);
            } else {
              setShowCustom(false);
              setCustomName('');
              onUpdate('reviewer', e.target.value);
            }
          }}
        >
          <option value="">— Select reviewer —</option>
          {REVIEWERS.map(m => <option key={m} value={m}>{m}</option>)}
          <option value="__custom">Other…</option>
        </select>
        {showCustom && (
          <input
            type="text"
            className="fi"
            placeholder="Reviewer name"
            value={customName}
            onChange={e => { setCustomName(e.target.value); onUpdate('reviewer', e.target.value); }}
            style={{ marginTop: 4 }}
          />
        )}
      </div>

      <div className="row-col-dates">
        <div className="row-date-pair">
          <span className="row-lbl">Send on</span>
          <input
            type="date"
            className="fi fi-sm"
            value={row.sendDate || ''}
            style={{ flex: 1 }}
            onChange={e => onUpdate('sendDate', e.target.value)}
          />
        </div>
        <div className="row-date-pair">
          <span className="row-lbl">Days to review</span>
          <input
            type="number"
            className="fi fi-sm fi-days"
            value={row.days}
            min={1}
            max={60}
            onChange={e => onUpdate('days', parseInt(e.target.value) || 5)}
          />
        </div>
        {row.endDate && (
          <span className="rev-end-date">Done by: {fmtShort(row.endDate)}</span>
        )}
        {row.exceeds && (
          <span className="rev-warn" style={{ display: 'inline' }}>⚠ Exceeds due date</span>
        )}
      </div>

      <button type="button" className="remove-rev" onClick={onRemove}>✕</button>
    </div>
  );
}

function SubtaskInputRow({ row, onUpdate, onRemove }) {
  const isCustomOwner = row.owner && !TEAM.includes(row.owner);
  const [showCustom, setShowCustom] = useState(isCustomOwner);
  const [customOwner, setCustomOwner] = useState(isCustomOwner ? row.owner : '');

  return (
    <div className="subtask-row">
      <div className="row-col-main">
        <input type="text" className="fi fi-sm" placeholder="Subtask name *"
          value={row.name} onChange={e => onUpdate('name', e.target.value)} />
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>Start</span>
            <input type="date" className="fi fi-sm" value={row.startDate || ''}
              onChange={e => onUpdate('startDate', e.target.value)} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>Due</span>
            <input type="date" className="fi fi-sm" value={row.due}
              onChange={e => onUpdate('due', e.target.value)} />
          </div>
        </div>
        <select className="fi fi-sm"
          value={showCustom ? '__c' : (row.owner || '')}
          onChange={e => {
            if (e.target.value === '__c') {
              setShowCustom(true);
            } else {
              setShowCustom(false);
              setCustomOwner('');
              onUpdate('owner', e.target.value);
            }
          }}>
          <option value="">— Owner —</option>
          {TEAM.map(m => <option key={m} value={m}>{m}</option>)}
          <option value="__c">Other…</option>
        </select>
        {showCustom && (
          <input type="text" className="fi fi-sm" placeholder="Owner name"
            value={customOwner}
            onChange={e => { setCustomOwner(e.target.value); onUpdate('owner', e.target.value); }} />
        )}
        <textarea className="fi" placeholder="Notes / details"
          style={{ fontSize: 11, minHeight: 40, resize: 'vertical' }}
          value={row.notes} onChange={e => onUpdate('notes', e.target.value)} />
      </div>
      <button type="button" className="remove-rev" onClick={onRemove}>✕</button>
    </div>
  );
}
