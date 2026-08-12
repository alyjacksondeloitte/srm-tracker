import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getTasks, saveTasks, getPTO, savePTO } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ── Serve built React app in production ───────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist');
  app.use(express.static(distPath));
}

// ── Tasks ─────────────────────────────────────────────────────────

app.get('/api/tasks', async (req, res) => {
  try { res.json(await getTasks()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const incoming = Array.isArray(req.body) ? req.body : [req.body];
    const tasks = await getTasks();
    const map = new Map(tasks.map(t => [t.id, t]));
    incoming.forEach(t => map.set(t.id, t));
    await saveTasks(Array.from(map.values()));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/tasks', async (req, res) => {
  try {
    const { id, ids } = req.body;
    const toDelete = new Set(ids || (id ? [id] : []));
    await saveTasks((await getTasks()).filter(t => !toDelete.has(t.id)));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PTO ───────────────────────────────────────────────────────────

app.get('/api/pto', async (req, res) => {
  try { res.json(await getPTO()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pto', async (req, res) => {
  try {
    const records = await getPTO();
    records.push(req.body);
    await savePTO(records);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/pto', async (req, res) => {
  try {
    const { id } = req.body;
    await savePTO((await getPTO()).filter(p => p.id !== id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── AI chat proxy ─────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in .env.local' });
  }

  const { messages, tasks } = req.body;

  const systemPrompt = `You are a project management assistant for the SRM engagement at DWR/State Water Project.
You have full context of all tasks. Answer questions concisely and accurately based on the task data.

When the user asks you to make changes to tasks, respond with a JSON action block followed by a plain-English confirmation.

Supported action types:
- UPDATE_TASK: { type: "UPDATE_TASK", id: "...", changes: { field: value } }
- BULK_UPDATE: { type: "BULK_UPDATE", ids: ["..."], changes: { field: value } }
- CREATE_TASK: { type: "CREATE_TASK", task: { ws, name, notes, startDate, due, owner, status, type, priority } }
- DELETE_TASK: { type: "DELETE_TASK", id: "..." }

Wrap the action JSON in <action>...</action> tags. Example:
<action>
{"type": "UPDATE_TASK", "id": "e001", "changes": {"status": "complete"}}
</action>
Done — marked the task as complete.

Current tasks:
${JSON.stringify(tasks, null, 2)}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Catch-all: send React app for any non-API route ───────────────
if (process.env.NODE_ENV === 'production') {
  app.get('/*splat', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

// ─────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
