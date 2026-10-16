import { Ok, Err, Some, None } from '../result.js';
import { getAll, save } from '../repositories/entriesRepository.js';
import { toEntryDto } from '../dtos/entryDto.js';

const validateEntry = ({ title, body }) => {
  if (!title || !body || title.length >= 60) return Err({ status: 400, message: 'title and body are required or exceeding character limit' });
  return Ok({ title, body });
};

const findEntryById = (entries, id) => {
  const entry = entries[id];
  return entry ? Some(entry) : None;
};

export const listEntries = async () => {
  const entries = await getAll();
  return entries.map(toEntryDto);
};

export const createEntry = async (data) => {
  const result = validateEntry(data);
  if (!result.ok) return result;

  const entries = await getAll();
  entries.push(result.value);
  await save(entries);
  return Ok(toEntryDto(result.value));
};

export const updateEntry = async (id, data) => {
  const entries = await getAll();
  const found = findEntryById(entries, id);
  if (!found.some) return Err({ status: 404, message: 'Entry not found' });

  const result = validateEntry(data);
  if (!result.ok) return result;

  entries[id] = result.value;
  await save(entries);
  return Ok(toEntryDto(result.value));
};

export const deleteEntry = async (id) => {
  const entries = await getAll();
  const found = findEntryById(entries, id);
  if (!found.some) return Err({ status: 404, message: 'Entry not found' });

  entries.splice(id, 1);
  await save(entries);
  return Ok(null);
};
