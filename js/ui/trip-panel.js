import * as Trip from '../state/trip-state.js';
import { geocode } from '../lib/geocode.js';
import { $ } from '../lib/dom.js';

export function initTripPanel(root) {
  root.innerHTML = `
    <div class="trip-header">
      <h3 class="card-title">Trip locations</h3>
      <button class="add-btn" id="add-loc">+ Add location</button>
    </div>
    <div class="rows" id="rows"></div>
    <p class="muted"><small>Tip: type a city, airport code, or address; press <kbd>Enter</kbd> or click <b>OK</b> to pin it on the globe. Drag the grip to reorder.</small></p>
  `;

  $('#add-loc').addEventListener('click', () => Trip.addRow());
  Trip.subscribe(renderRows);
  renderRows(Trip.getState());
}

function renderRows(state) {
  const rows = $('#rows');
  rows.innerHTML = '';
  state.items.forEach((item, index) => rows.appendChild(makeRow(item, index)));
  wireDnD(rows);
}

function makeRow(item, index) {
  const row = document.createElement('div');
  row.className = 'row';
  row.draggable = true;
  row.dataset.id = item.id;

  row.innerHTML = `
    <button class="handle" title="Drag to reorder">☰</button>
    <input class="input" type="text" placeholder="Location ${index + 1} (e.g., Austin, TX)" value="${escapeHtml(item.text)}" />
    <button class="btn btn-ok">OK</button>
    <button class="btn btn-del" title="Delete">✕</button>
  `;

  const input = row.querySelector('.input');
  const okBtn = row.querySelector('.btn-ok');
  const delBtn = row.querySelector('.btn-del');

  if (item.status === 'searching') row.insertAdjacentHTML('beforeend', `<span class="status searching">searching…</span>`);
  if (item.status === 'error') row.insertAdjacentHTML('beforeend', `<span class="status error">not found</span>`);
  if (item.status === 'ok') okBtn.classList.add('saved');

  // ✅ only this one input listener (silent)
  input.addEventListener('input', (e) =>
    Trip.updateText(item.id, e.target.value, { silent: true })
  );

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmRow(item.id);
  });
  okBtn.addEventListener('click', () => confirmRow(item.id));
  delBtn.addEventListener('click', () => Trip.removeRow(item.id));

  return row;
}


async function confirmRow(id) {
  Trip.setStatus(id, 'searching');
  const text = Trip.getItem(id)?.text?.trim();
  if (!text) { Trip.setStatus(id, 'error'); return; }

  try {
    const res = await geocode(text);
    if (!res) { Trip.setStatus(id, 'error'); return; }
    Trip.confirm(id, res);
  } catch {
    Trip.setStatus(id, 'error');
  }
}

function wireDnD(container) {
  let dragId = null;
  container.addEventListener('dragstart', (e) => {
    const row = e.target.closest('.row');
    if (!row) return;
    dragId = row.dataset.id;
    row.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const after = getRowAfter(container, e.clientY);
    const dragging = container.querySelector('.row.dragging');
    if (!dragging) return;
    if (after == null) container.appendChild(dragging);
    else container.insertBefore(dragging, after);
  });
  container.addEventListener('drop', () => {
    const ids = [...container.querySelectorAll('.row')].map(r => r.dataset.id);
    Trip.reorder(ids);
  });
  container.addEventListener('dragend', () => {
    const dragging = container.querySelector('.row.dragging');
    if (dragging) dragging.classList.remove('dragging');
    dragId = null;
  });
}

function getRowAfter(container, y) {
  const rows = [...container.querySelectorAll('.row:not(.dragging)')];
  return rows.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function escapeHtml(str='') {
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
