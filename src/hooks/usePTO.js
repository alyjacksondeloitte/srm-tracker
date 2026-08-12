import { useState, useEffect, useCallback } from 'react';
import { uid } from '../utils.js';

export function usePTO() {
  const [ptoRecords, setPtoRecords] = useState([]);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => { loadPTO(); }, []);

  async function loadPTO() {
    try {
      const res = await fetch('/api/pto');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      setPtoRecords(rows.map(r => ({
        id:     r.id,
        person: r.person,
        from:   (r.from_date || r.from || '').toString().slice(0, 10),
        to:     (r.to_date   || r.to   || '').toString().slice(0, 10),
      })));
      setDbReady(true);
    } catch (e) {
      console.warn('PTO load failed, using local state:', e.message);
    }
  }

  const addPTO = useCallback(async (person, from, to) => {
    const record = { id: uid(), person, from, to };
    setPtoRecords(prev => [...prev, record]);
    if (!dbReady) return;
    try {
      await fetch('/api/pto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch (e) { console.error('PTO insert error:', e); }
  }, [dbReady]);

  const removePTO = useCallback(async (id) => {
    setPtoRecords(prev => prev.filter(p => p.id !== id));
    if (!dbReady) return;
    try {
      await fetch('/api/pto', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) { console.error('PTO delete error:', e); }
  }, [dbReady]);

  const isOnPTO = useCallback((person, dateStr) =>
    ptoRecords.some(p => p.person === person && dateStr >= p.from && dateStr <= p.to),
  [ptoRecords]);

  const getPTORecord = useCallback((person, dateStr) =>
    ptoRecords.find(p => p.person === person && dateStr >= p.from && dateStr <= p.to),
  [ptoRecords]);

  return { ptoRecords, addPTO, removePTO, isOnPTO, getPTORecord };
}
