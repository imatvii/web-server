import * as entriesService from '../services/entriesService.js';

export const index = async (req, res) => {
  const entries = await entriesService.listEntries();
  res.set('X-Total-Count', entries.length);
  res.status(200).render('entries', { title: 'My Notes', entries });
};

export const create = async (req, res) => {
  const result = await entriesService.createEntry(req.body);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(201).json(result.value);
};

export const createClassic = async (req, res) => {
  const result = await entriesService.createEntry(req.body);
  if (!result.ok) {
    res.status(result.error.status).send(result.error.message);
    return;
  }
  res.redirect('/entries');
};

export const update = async (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'id must be a number' });
    return;
  }
  const result = await entriesService.updateEntry(id, req.body);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.value);
};

export const destroy = async (req, res) => {
  const id = parseInt(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'id must be a number' });
    return;
  }
  const result = await entriesService.deleteEntry(id);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(204).send();
};
