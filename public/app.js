const form = document.querySelector('#entry-form');
const list = document.querySelector('#entries');

// Every request gives up after five seconds instead of waiting forever.
const timedFetch = (url, options = {}) =>
  fetch(url, { ...options, signal: AbortSignal.timeout(5000) });

// Send a request and return the JSON the server answered with. Anything
// that goes wrong (no answer within five seconds, no connection, an error
// status, a body that is not JSON) throws one Error whose message can go
// straight to the person using the page.
const fetchJSON = async (url, options) => {
  let response;
  try {
    response = await timedFetch(url, options);
  } catch (error) {
    throw new Error(error.name === 'TimeoutError'
      ? 'The server did not answer within five seconds.'
      : 'Could not reach the server.');
  }

  let body = {};
  try {
    body = await response.json();
  } catch {
    // An empty body, or an error page in HTML: the status still says enough.
  }

  if (!response.ok) {
    throw new Error(body.error || `The server answered ${response.status}.`);
  }
  return body;
};

// htmx waits forever by default. Give its requests the same five seconds.
htmx.config.timeout = 5000;

// Fill an entry's display: a bold title, then the body. textContent, never
// innerHTML: titles and bodies are user input, and innerHTML would run them as
// markup if someone typed a <script> or <img> tag.
const fillDisplay = (display, entry) => {
  const title = document.createElement('strong');
  title.textContent = `${entry.title}:`;
  display.replaceChildren(title, ` ${entry.body}`);
};

const makeButton = (className, label, attributes = {}) => {
  const button = document.createElement('button');
  button.className = className;
  button.type = 'button';
  button.textContent = label;
  Object.entries(attributes).forEach(([name, value]) => {
    button.setAttribute(name, value);
  });
  return button;
};

// Build an entry's <li> the same way the server-rendered page does.
const buildItem = (entry) => {
  const item = document.createElement('li');
  item.dataset.id = entry.id;
  item.dataset.title = entry.title;
  item.dataset.body = entry.body;
  item.dataset.favorite = entry.favorite;

  const display = document.createElement('span');
  display.className = 'entry-display';
  fillDisplay(display, entry);

  const favoriteButton = makeButton('favorite-btn', entry.favorite ? '★' : '☆');
  const deleteButton = makeButton('delete-btn', 'Delete', {
    'hx-delete': `/entries/${entry.id}`,
    'hx-target': 'closest li',
    'hx-swap': 'outerHTML',
    'hx-confirm': 'Delete this entry?',
    'hx-disabled-elt': 'this',
  });
  item.append(display, favoriteButton, makeButton('edit-btn', 'Edit'), deleteButton);
  return item;
};

// Setting .value, not a value="..." attribute in a string, so a quote in the
// title cannot end the attribute early.
const makeInput = (name, value) => {
  const input = document.createElement('input');
  input.type = 'text';
  input.name = name;
  input.value = value;
  return input;
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const entry = Object.fromEntries(data);
  const button = form.querySelector('button');

  // One save at a time: a second click while this one is out does nothing.
  button.disabled = true;
  try {
    const saved = await fetchJSON('/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    const item = buildItem(saved);
    list.append(item);
    htmx.process(item);
    form.reset();
  } catch (error) {
    alert(`Your entry was not saved. ${error.message}`);
  } finally {
    button.disabled = false;
  }
});

const startEdit = (item) => {
  const display = item.querySelector('.entry-display');
  const buttons = item.querySelectorAll('.edit-btn, .delete-btn');

  const editForm = document.createElement('form');
  editForm.className = 'edit-form';
  const save = document.createElement('button');
  save.type = 'submit';
  save.textContent = 'Save';
  editForm.append(
    makeInput('title', item.dataset.title),
    makeInput('body', item.dataset.body),
    save,
    makeButton('cancel-btn', 'Cancel'),
  );

  display.replaceWith(editForm);
  buttons.forEach((button) => { button.hidden = true; });

  editForm.querySelector('.cancel-btn').addEventListener('click', () => {
    editForm.replaceWith(display);
    buttons.forEach((button) => { button.hidden = false; });
  });

  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new FormData(editForm);
    const entry = Object.fromEntries(data);

    // A failed save leaves the form open with the edits still in it.
    save.disabled = true;
    try {
      const saved = await fetchJSON(`/entries/${item.dataset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      item.dataset.title = saved.title;
      item.dataset.body = saved.body;
      fillDisplay(display, saved);
      editForm.replaceWith(display);
      buttons.forEach((button) => { button.hidden = false; });
    } catch (error) {
      alert(`Your changes were not saved. ${error.message}`);
    } finally {
      save.disabled = false;
    }
  });
};

list.addEventListener('click', async (event) => {
  if (event.target.matches('.edit-btn')) {
    startEdit(event.target.closest('li'));
    return;
  }

  if (!event.target.matches('.favorite-btn')) return;

  const button = event.target;
  const item = button.closest('li');

  button.disabled = true;
  try {
    const saved = await fetchJSON(`/entries/${item.dataset.id}/favorite`, { method: 'PATCH' });
    item.dataset.favorite = saved.favorite;
    button.textContent = saved.favorite ? '★' : '☆';
  } catch (error) {
    alert(`The favorite was not changed. ${error.message}`);
  } finally {
    button.disabled = false;
  }
});

// htmx does not swap in an error response, and it tells nobody when a
// request fails. These are the three ways an hx-delete can fail.
// Whatever the outcome, htmx itself re-enables the Delete button
// (hx-disabled-elt) and hides any loading indicator.
list.addEventListener('htmx:responseError', (event) => {
  alert(`That entry was not deleted. The server answered ${event.detail.xhr.status}.`);
});
list.addEventListener('htmx:sendError', () => {
  alert('That entry was not deleted. Could not reach the server.');
});
list.addEventListener('htmx:timeout', () => {
  alert('That entry was not deleted. The server did not answer within five seconds.');
});