const form = document.querySelector('#entry-form');
const list = document.querySelector('#entries');

// Safely create single list item node using DOM API (prevents XSS vs innerHTML)
const buildItem = (entry) => {
  const item = document.createElement('li');
  item.dataset.id = list.children.length;

  const text = document.createElement('span');
  const title = document.createElement('strong');
  title.textContent = `${entry.title}:`;
  text.append(title, ` ${entry.body}`);

  const button = document.createElement('button');
  button.className = 'delete-btn';
  button.type = 'button';
  button.textContent = 'Delete';

  item.append(text, button);
  return item;
};

// Keep data-id attributes synced with array indices after deletion
const renumber = () => {
  [...list.children].forEach((item, index) => {
    item.dataset.id = index;
  });
};

// Handle client-side fetch form submission (AJAX)
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const entry = Object.fromEntries(data);
  const button = form.querySelector('button');

  // Disable submission button during in-flight request
  button.disabled = true;

  try {
    const response = await fetch('/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const { error } = await response.json();
      alert(error);
      return;
    }

    const saved = await response.json();
    list.append(buildItem(saved));
    form.reset();
  } catch {
    alert('Your entry was not saved: the server did not answer properly. Please try again.');
  } finally {
    button.disabled = false;
  }
});

// Event delegation for delete buttons with pending state handling
list.addEventListener('click', async (event) => {
  if (!event.target.matches('.delete-btn')) return;

  const button = event.target;
  const item = button.closest('li');
  const id = item.dataset.id;

  // Disable delete button while request is pending
  button.disabled = true;

  try {
    const response = await fetch(`/entries/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const { error } = await response.json();
      alert(error);
      button.disabled = false;
      return;
    }

    item.remove();
    renumber();
  } catch {
    alert('That entry was not deleted: the server did not answer properly. Please try again.');
    button.disabled = false;
  }
});