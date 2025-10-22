const STORAGE_KEY = 'cv_trip_state_v1';

let state = load() || {
  items: [makeItem()],
};

const subs = new Set();

export function subscribe(fn) { subs.add(fn); fn(state); return () => subs.delete(fn); }
function emit() { save(); subs.forEach(fn => fn(state)); }

export function getState() { return structuredClone(state); }
export function getItem(id) { return state.items.find(i => i.id === id); }

export function addRow() {
  state.items.push(makeItem());
  emit();
}

export function updateText(id, text) {
  const it = getItem(id); if (!it) return;
  it.text = text;
  if (it.status === 'ok') it.status = 'idle'; // editing resets status
  emit();
}

export function setStatus(id, status) {
  const it = getItem(id); if (!it) return;
  it.status = status;
  emit();
}

export function confirm(id, { lat, lng, label }) {
  const it = getItem(id); if (!it) return;
  it.coords = { lat, lng };
  it.label = label;
  it.status = 'ok';
  emit();
}

export function removeRow(id) {
  state.items = state.items.filter(i => i.id !== id);
  if (!state.items.length) state.items.push(makeItem());
  emit();
}

export function reorder(idList) {
  const map = new Map(state.items.map(i => [i.id, i]));
  state.items = idList.map(id => map.get(id)).filter(Boolean);
  emit();
}

function makeItem() {
  return { id: crypto.randomUUID(), text: '', status: 'idle', coords: null, label: null };
}

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
