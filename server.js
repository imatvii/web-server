import express from 'express';
import { readFile, writeFile } from 'fs/promises';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'entries.json';

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/entries', async (req, res) => {
  try {
    const data = await readFile(DATA_FILE, 'utf-8');
    const entries = JSON.parse(data);
    res.set('X-Total-Count', entries.length);
    res.status(200).render('entries', { title: 'My Notes', entries });
  } catch {
    res.status(200).render('entries', { title: 'My Notes', entries: [] });
  }
});

app.post('/entries', async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    res.status(400).json({ error: 'title and body are required' });
    return;
  }
  
  let entries = [];
  try {
    const data = await readFile(DATA_FILE, 'utf-8');
    entries = JSON.parse(data);
  } catch {
    entries = [];
  }

  const newEntry = { title, body };
  entries.push(newEntry);
  await writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
  res.status(201).json(newEntry);
});

app.post('/entries/classic', async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    res.status(400).send('title and body are required');
    return;
  }

  let entries = [];
  try {
    const data = await readFile(DATA_FILE, 'utf-8');
    entries = JSON.parse(data);
  } catch {
    entries = [];
  }

  entries.push({ title, body });
  await writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
  res.redirect('/entries');
});

app.delete('/entries/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  let entries = [];
  
  try {
    const data = await readFile(DATA_FILE, 'utf-8');
    entries = JSON.parse(data);
  } catch {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  if (Number.isNaN(id) || id < 0 || id >= entries.length) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  entries.splice(id, 1);
  await writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).send('Page not found.');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});