import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Setup SQLite Database
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
const db = new Database(path.join(dbDir, 'contacts.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    company TEXT,
    notes TEXT,
    photo TEXT,
    pos_x INTEGER DEFAULT 100,
    pos_y INTEGER DEFAULT 100,
    border_color TEXT DEFAULT '#4CAF50',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API Routes
app.get('/api/contacts', (req, res) => {
  try {
    const contacts = db.prepare('SELECT * FROM contacts').all();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

app.post('/api/contacts', (req, res) => {
  try {
    const { name, phone, whatsapp, email, company, notes, photo, pos_x, pos_y, border_color } = req.body;
    const stmt = db.prepare(`
      INSERT INTO contacts (name, phone, whatsapp, email, company, notes, photo, pos_x, pos_y, border_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, phone, whatsapp, email, company, notes, photo, pos_x || 100, pos_y || 100, border_color || '#4CAF50');
    const newContact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

app.put('/api/contacts/:id', (req, res) => {
  try {
    const { name, phone, whatsapp, email, company, notes, photo, border_color } = req.body;
    const stmt = db.prepare(`
      UPDATE contacts 
      SET name = ?, phone = ?, whatsapp = ?, email = ?, company = ?, notes = ?, photo = ?, border_color = ?
      WHERE id = ?
    `);
    stmt.run(name, phone, whatsapp, email, company, notes, photo, border_color, req.params.id);
    const updatedContact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    res.json(updatedContact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

app.patch('/api/contacts/:id/position', (req, res) => {
  try {
    const { pos_x, pos_y } = req.body;
    const stmt = db.prepare('UPDATE contacts SET pos_x = ?, pos_y = ? WHERE id = ?');
    stmt.run(pos_x, pos_y, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update position' });
  }
});

app.delete('/api/contacts/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
