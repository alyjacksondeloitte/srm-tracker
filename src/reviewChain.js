import { uid, fmtShort } from './utils.js';

export function addWeekdays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d.toISOString().split('T')[0];
}

export function buildReviewTasks(parentId, parentWs, parentName, parentDue, reviewers) {
  if (!reviewers.length) return [];
  return reviewers.map((r) => {
    const sendDate = r.sendDate || '';
    const endDate = sendDate ? addWeekdays(sendDate, r.days || 5) : '';
    const exceedsDeadline = !!(parentDue && endDate && endDate > parentDue);
    return {
      id: uid(),
      ws: parentWs,
      name: `Review: "${parentName}" — ${r.reviewer}`,
      notes: `Send on: ${sendDate ? fmtShort(sendDate) : '—'} · Days to review: ${r.days || 5}${exceedsDeadline ? ' · ⚠ Exceeds deadline' : ''}`,
      due: sendDate || endDate || '',
      sendDate,
      reviewDays: r.days || 5,
      reviewEndDate: endDate,
      owner: r.reviewer,
      status: 'not-started',
      type: 'swp-session',
      parentId,
      isReview: true,
      exceedsDeadline,
    };
  });
}

export function buildSubtasks(parentId, parentWs, subtasks) {
  return subtasks.map(s => ({
    id: uid(),
    ws: parentWs,
    name: s.name,
    notes: s.notes || '',
    startDate: s.startDate || '',
    due: s.due || '',
    owner: s.owner || '',
    status: 'not-started',
    type: 'subtask',
    parentId,
    isSubtask: true,
  }));
}
