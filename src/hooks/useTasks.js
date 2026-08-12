import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULTS } from '../constants.js';

async function fetchWithRetry(url, options, retries = 3, delayMs = 800) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
      } else {
        throw e;
      }
    }
  }
}

export function useTasks() {
  const [tasks, setTasks]           = useState([]);
  const [syncStatus, setSyncStatus] = useState('● loading…');
  const [syncOk, setSyncOk]         = useState(false);

  // Keep a ref to latest tasks for the auto-save
  const tasksRef = useRef(tasks);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // Serialize saves through a queue so rapid edits don't race
  const saveQueue = useRef(Promise.resolve());
  function enqueue(fn) {
    saveQueue.current = saveQueue.current.then(fn).catch(() => {});
  }

  useEffect(() => { loadTasks(); }, []);

  // Auto-save every 30 seconds as a safety net
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!syncOk || tasksRef.current.length === 0) return;
      try {
        await fetchWithRetry('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tasksRef.current),
        });
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [syncOk]);

  async function loadTasks() {
    try {
      const res = await fetchWithRetry('/api/tasks', {});
      let data = await res.json();

      if (data.length === 0) {
        await fetchWithRetry('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(DEFAULTS),
        });
        data = DEFAULTS.map(t => ({ ...t }));
      }

      setTasks(data);
      setSyncStatus('● synced');
      setSyncOk(true);
    } catch (e) {
      console.warn('Server unavailable, using in-memory defaults:', e.message);
      setTasks(DEFAULTS.map(t => ({ ...t })));
      setSyncStatus('● offline');
      setSyncOk(false);
    }
  }

  const upsertTask = useCallback(async (task) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id);
      return idx >= 0 ? prev.map(t => t.id === task.id ? task : t) : [...prev, task];
    });
    setSyncStatus('● saving…'); setSyncOk(false);
    enqueue(async () => {
      try {
        await fetchWithRetry('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        });
        setSyncStatus('● synced'); setSyncOk(true);
      } catch (e) {
        console.error('Save error:', e);
        setSyncStatus('● save failed — check connection'); setSyncOk(false);
      }
    });
  }, []);

  const upsertTasks = useCallback(async (newTasks) => {
    setTasks(prev => {
      const map = new Map(prev.map(t => [t.id, t]));
      newTasks.forEach(t => map.set(t.id, t));
      return Array.from(map.values());
    });
    setSyncStatus('● saving…'); setSyncOk(false);
    enqueue(async () => {
      try {
        await fetchWithRetry('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTasks),
        });
        setSyncStatus('● synced'); setSyncOk(true);
      } catch (e) {
        console.error('Bulk save error:', e);
        setSyncStatus('● save failed — check connection'); setSyncOk(false);
      }
    });
  }, []);

  const deleteTask = useCallback(async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    enqueue(async () => {
      try {
        await fetchWithRetry('/api/tasks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      } catch (e) { console.error('Delete error:', e); }
    });
  }, []);

  const deleteTasks = useCallback(async (ids) => {
    setTasks(prev => prev.filter(t => !ids.includes(t.id)));
    enqueue(async () => {
      try {
        await fetchWithRetry('/api/tasks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
      } catch (e) { console.error('Bulk delete error:', e); }
    });
  }, []);

  return { tasks, setTasks, syncStatus, syncOk, upsertTask, upsertTasks, deleteTask, deleteTasks };
}
