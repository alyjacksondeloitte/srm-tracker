import React, { useState, useEffect } from 'react';
import { todayDate, daysTo } from '../utils.js';

export function computeAlerts(tasks) {
  const alerts = [];

  const overdue = tasks.filter(t =>
    !t.isReview && !t.isSubtask &&
    t.status !== 'complete' &&
    t.due && daysTo(t.due) < 0
  );
  if (overdue.length)
    alerts.push({ type: 'error', msg: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`, tasks: overdue });

  const unowned = tasks.filter(t =>
    !t.isReview && !t.isSubtask &&
    t.status !== 'complete' &&
    t.due && daysTo(t.due) >= 0 && daysTo(t.due) <= 7 &&
    !t.owner
  );
  if (unowned.length)
    alerts.push({ type: 'warn', msg: `${unowned.length} task${unowned.length > 1 ? 's' : ''} due this week with no owner`, tasks: unowned });

  const noReview = tasks.filter(t =>
    (t.type === 'milestone-finalize' || t.type === 'milestone-key') &&
    t.status !== 'complete' &&
    !tasks.some(r => r.isReview && r.parentId === t.id)
  );
  // review chain alert removed

  return alerts;
}

export default function AlertBar({ tasks, onOpenEdit }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  // Recompute whenever tasks change
  useEffect(() => {
    if (tasks.length) setAlerts(computeAlerts(tasks));
  }, [tasks]);

  const visible = alerts.filter((_, i) => !dismissed.has(i));
  if (!visible.length) return null;

  return (
    <div className="alert-bar">
      {alerts.map((a, i) => {
        if (dismissed.has(i)) return null;
        return (
          <div key={i} className={`alert-item ${a.type}`}>
            <span>
              {a.type === 'error' ? '🔴' : a.type === 'warn' ? '🟠' : 'ℹ️'}
              &nbsp;{a.msg}
            </span>
            {a.tasks.slice(0, 3).map(t => (
              <span
                key={t.id}
                onClick={() => onOpenEdit(t.id)}
                style={{ marginLeft: 8, textDecoration: 'underline', cursor: 'pointer', fontSize: 11 }}
              >
                {t.name.length > 30 ? t.name.slice(0, 30) + '…' : t.name}
              </span>
            ))}
            {a.tasks.length > 3 && (
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>+{a.tasks.length - 3} more</span>
            )}
            <button className="alert-dismiss" onClick={() => setDismissed(prev => new Set([...prev, i]))}>✕</button>
          </div>
        );
      })}
    </div>
  );
}
