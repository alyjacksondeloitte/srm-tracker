import { STATUS } from './constants.js';

export function pd(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayDate() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function fmtShort(s) {
  if (!s) return '—';
  return pd(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function daysTo(s) {
  const d = pd(s);
  if (!d) return null;
  return Math.round((d - todayDate()) / 86400000);
}

export function dueCls(s) {
  const n = daysTo(s);
  if (n === null) return 'due-ok';
  if (n < 0)  return 'due-over';
  if (n === 0) return 'due-today';
  if (n <= 3) return 'due-soon';
  return 'due-ok';
}

export function dueLabel(s) {
  const n = daysTo(s);
  if (n === null) return '—';
  if (n < 0)  return `${fmtShort(s)} (${Math.abs(n)}d ago)`;
  if (n === 0) return 'Today';
  return `${fmtShort(s)} (${n}d)`;
}

export function pill(s) {
  const st = STATUS[s] || { label: s, cls: 's-ns' };
  return `<span class="pill ${st.cls}">${st.label}</span>`;
}

export function uid() {
  return 't' + Date.now() + Math.random().toString(36).slice(2, 6);
}

// Sort tasks: active by due-date asc, completed last
export function sortByDue(arr) {
  return [...arr].sort((a, b) => {
    const aDone = a.status === 'complete';
    const bDone = b.status === 'complete';
    if (aDone && !bDone) return 1;
    if (!aDone && bDone) return -1;
    return (a.due || '').localeCompare(b.due || '');
  });
}

export function autoSizeTextareas(root = document) {
  requestAnimationFrame(() => {
    root.querySelectorAll('.notes-inline, .name-inline').forEach(el => {
      if (el.tagName !== 'TEXTAREA') return;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      el.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
      }, { once: false });
    });
  });
}
