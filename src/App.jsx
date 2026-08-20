import React, { useState, useCallback } from 'react';
import { useTasks } from './hooks/useTasks.js';
import { usePTO } from './hooks/usePTO.js';
import { uid } from './utils.js';
import { WS as INITIAL_WS, WS_LOA14 as INITIAL_WS_LOA14 } from './constants.js';

const ALL_WS_MAP = Object.fromEntries([...INITIAL_WS, ...INITIAL_WS_LOA14].map(w => [w.id, w.label]));
import GanttView from './components/GanttView.jsx';
import DailyView from './components/DailyView.jsx';
import CalendarView from './components/CalendarView.jsx';
import TeamView from './components/TeamView.jsx';
import PrioritiesView from './components/PrioritiesView.jsx';
import TaskModal from './components/TaskModal.jsx';
import WorkstreamModal from './components/WorkstreamModal.jsx';
import AlertBar from './components/AlertBar.jsx';
import AIChatPanel from './components/AIChatPanel.jsx';

const VIEWS = ['gantt', 'daily', 'calendar', 'team', 'priorities'];
const VIEW_LABELS = {
  gantt:      'Gantt',
  daily:      'Daily Digest',
  calendar:   'Calendar',
  team:       'By Person',
  priorities: '⚑ Team Priorities',
};

export default function App() {
  const { tasks, syncStatus, syncOk, upsertTask, upsertTasks, deleteTask, deleteTasks } = useTasks();
  const { ptoRecords, addPTO, removePTO, isOnPTO, getPTORecord } = usePTO();

  const [activeView, setActiveView]         = useState('gantt');
  const [workstreams, setWorkstreams]        = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('workstreams') || 'null');
      if (Array.isArray(saved) && saved.length) {
        // Merge: saved labels over INITIAL_WS, preserving any new entries in INITIAL_WS
        const savedMap = Object.fromEntries(saved.map(w => [w.id, w]));
        const merged = INITIAL_WS.map(w => savedMap[w.id] ? { ...w, label: savedMap[w.id].label } : w);
        const extra = saved.filter(w => !INITIAL_WS.find(i => i.id === w.id));
        return [...merged, ...extra];
      }
    } catch {}
    return INITIAL_WS;
  });

  const [workstreamsLoa14, setWorkstreamsLoa14] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('workstreams-loa14') || 'null');
      if (Array.isArray(saved) && saved.length) {
        const savedMap = Object.fromEntries(saved.map(w => [w.id, w]));
        const merged = INITIAL_WS_LOA14.map(w => savedMap[w.id] ? { ...w, label: savedMap[w.id].label } : w);
        const extra = saved.filter(w => !INITIAL_WS_LOA14.find(i => i.id === w.id));
        return [...merged, ...extra];
      }
    } catch {}
    return INITIAL_WS_LOA14;
  });

  // Modal state
  const [modalOpen, setModalOpen]           = useState(false);
  const [modalEditId, setModalEditId]       = useState(null);
  const [modalDefaultWs, setModalDefaultWs] = useState(null);
  const [wsModalOpen, setWsModalOpen]       = useState(false);
  const [wsModalLoa14Open, setWsModalLoa14Open] = useState(false);
  const [aiPanelOpen, setAiPanelOpen]       = useState(false);

  // ── Inline field edit ──────────────────────────────────────────
  const handleInline = useCallback(async (id, field, val) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await upsertTask({ ...task, [field]: val });
  }, [tasks, upsertTask]);

  // ── Task modal ─────────────────────────────────────────────────
  function handleOpenAdd(wsId) {
    setModalEditId(null);
    setModalDefaultWs(wsId || null);
    setModalOpen(true);
  }
  function handleOpenEdit(taskId) {
    setModalEditId(taskId);
    setModalDefaultWs(null);
    setModalOpen(true);
  }
  const handleSave = useCallback(async ({ task, reviewTasks, subtasks, isEditing, managedReviews, managedSubtasks }) => {
    if (isEditing) {
      const toDelete = tasks
        .filter(t => t.parentId === task.id)
        .filter(t => (t.isReview && managedReviews) || (t.isSubtask && managedSubtasks))
        .map(t => t.id);
      if (toDelete.length) await deleteTasks(toDelete);
    }
    await upsertTasks([task, ...reviewTasks, ...subtasks]);
  }, [tasks, upsertTasks, deleteTasks]);

  // ── Workstream modal ───────────────────────────────────────────
  function handleSaveWs(ws) {
    setWorkstreams(prev => {
      const next = [...prev, ws];
      localStorage.setItem('workstreams', JSON.stringify(next));
      return next;
    });
  }

  function handleUpdateWs(id, label) {
    setWorkstreams(prev => {
      const next = prev.map(w => w.id === id ? { ...w, label } : w);
      localStorage.setItem('workstreams', JSON.stringify(next));
      return next;
    });
  }

  function handleSaveWsLoa14(ws) {
    setWorkstreamsLoa14(prev => {
      const next = [...prev, ws];
      localStorage.setItem('workstreams-loa14', JSON.stringify(next));
      return next;
    });
  }

  function handleUpdateWsLoa14(id, label) {
    setWorkstreamsLoa14(prev => {
      const next = prev.map(w => w.id === id ? { ...w, label } : w);
      localStorage.setItem('workstreams-loa14', JSON.stringify(next));
      return next;
    });
  }

  // ── Export / Import ───────────────────────────────────────────
  function handleExport() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `srm-tasks-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportCSV() {
    const STATUS_LABELS = { 'not-started':'Not Started', 'in-progress':'In Progress', 'in-review':'In Review', 'complete':'Complete', 'blocked':'Blocked' };
    const TYPE_LABELS   = { 'task':'Task', 'meeting':'SWP Meeting', 'swp-session':'Internal Review', 'milestone-key':'Internal Working Session', 'milestone-finalize':'Finalize Deliverable' };

    const headers = ['Workstream','Task Name','Notes','Start Date','Due Date','Owner','Status','Type','Priority'];
    const rows = tasks
      .filter(t => !t.isReview && !t.isSubtask)
      .map(t => [
        ALL_WS_MAP[t.ws] || t.ws,
        t.name || '',
        (t.notes || '').replace(/,/g, ';'),
        t.startDate || '',
        t.due || '',
        t.owner || '',
        STATUS_LABELS[t.status] || t.status || '',
        TYPE_LABELS[t.type] || t.type || '',
        t.priority ? 'Yes' : 'No',
      ]);

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `srm-tasks-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (!Array.isArray(imported)) { alert('Invalid file — expected a JSON array of tasks.'); return; }
        await fetch('/api/tasks/replace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imported),
        });
        window.location.reload();
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    input.click();
  }

  // ── AI action handler ──────────────────────────────────────────
  const handleAIChanges = useCallback(async (action) => {
    if (!action) return;

    // Never let AI updates overwrite relationship fields
    const PROTECTED = ['parentId', 'isReview', 'isSubtask', 'id', 'ws'];
    const safeChanges = c => Object.fromEntries(Object.entries(c).filter(([k]) => !PROTECTED.includes(k)));

    if (action.type === 'UPDATE_TASK') {
      const task = tasks.find(t => t.id === action.id);
      if (task) await upsertTask({ ...task, ...safeChanges(action.changes) });
    }

    if (action.type === 'BULK_UPDATE') {
      const changed = tasks
        .filter(t => action.ids.includes(t.id))
        .map(t => ({ ...t, ...safeChanges(action.changes) }));
      if (changed.length) await upsertTasks(changed);
    }

    if (action.type === 'CREATE_TASK') {
      const newTask = { id: uid(), status: 'not-started', type: 'task', duration: 1, priority: false, ...action.task };
      await upsertTask(newTask);
    }

    if (action.type === 'DELETE_TASK') {
      const childIds = tasks.filter(t => t.parentId === action.id).map(t => t.id);
      await deleteTasks([action.id, ...childIds]);
    }
  }, [tasks, upsertTask, upsertTasks, deleteTasks]);

  const sharedProps = {
    tasks,
    workstreams,
    onInline: handleInline,
    onOpenAdd: handleOpenAdd,
    onOpenEdit: handleOpenEdit,
  };

  return (
    <>
      {/* ── Header ── */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo" />
            <div>
              <div className="header-title">SRM Project Tracker</div>
              <div className="header-sub">DWR / State Water Project &nbsp;·&nbsp; Feb – Aug 2026</div>
            </div>
          </div>
          <div className="tabs">
            {VIEWS.map(v => (
              <button key={v} className={`tab${activeView === v ? ' active' : ''}`} onClick={() => setActiveView(v)}>
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn-ghost" style={{ fontSize: 12, color: '#a8c8f0', borderColor: '#a8c8f0' }} onClick={handleExportCSV} title="Download tasks as spreadsheet">⬇ Spreadsheet</button>
          <button className="btn-ghost" style={{ fontSize: 12, color: '#a8c8f0', borderColor: '#a8c8f0' }} onClick={handleExport} title="Download tasks as JSON">⬇ JSON</button>
          <button className="btn-ghost" style={{ fontSize: 12, color: '#a8c8f0', borderColor: '#a8c8f0' }} onClick={handleImport} title="Upload tasks from JSON">⬆ Import</button>
          <span className={`sync${syncOk ? ' ok' : ''}`}>{syncStatus}</span>
        </div>
      </div>

      {/* ── Alert bar ── */}
      <AlertBar tasks={tasks} onOpenEdit={handleOpenEdit} />

      {/* ── Views ── */}
      {activeView === 'gantt' && (
        <GanttView
          {...sharedProps}
          workstreamsLoa14={workstreamsLoa14}
          onUpsertTasks={upsertTasks}
          onDeleteTask={deleteTask}
          onOpenWsModal={() => setWsModalOpen(true)}
          onUpdateWs={handleUpdateWs}
          onOpenWsModalLoa14={() => setWsModalLoa14Open(true)}
          onUpdateWsLoa14={handleUpdateWsLoa14}
        />
      )}
      {activeView === 'daily' && (
        <DailyView tasks={tasks} onOpenAdd={() => handleOpenAdd(null)} />
      )}
      {activeView === 'calendar' && (
        <CalendarView tasks={tasks} />
      )}
      {activeView === 'team' && (
        <TeamView
          tasks={tasks}
          ptoRecords={ptoRecords}
          onAddPTO={addPTO}
          onRemovePTO={removePTO}
          isOnPTO={isOnPTO}
          getPTORecord={getPTORecord}
        />
      )}
      {activeView === 'priorities' && (
        <PrioritiesView {...sharedProps} />
      )}

      {/* ── Modals ── */}
      <TaskModal
        open={modalOpen}
        editId={modalEditId}
        tasks={tasks}
        defaultWsId={modalDefaultWs}
        workstreamsLoa14={workstreamsLoa14}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />
      <WorkstreamModal
        open={wsModalOpen}
        onSave={handleSaveWs}
        onClose={() => setWsModalOpen(false)}
      />
      <WorkstreamModal
        open={wsModalLoa14Open}
        onSave={handleSaveWsLoa14}
        onClose={() => setWsModalLoa14Open(false)}
      />

      {/* ── AI Chat Panel ── */}
      <AIChatPanel
        open={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        tasks={tasks}
        onApplyChanges={handleAIChanges}
      />
    </>
  );
}
