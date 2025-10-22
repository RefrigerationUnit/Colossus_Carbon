const STORAGE_KEY = 'cv_layers_v1';
let state = load() || { car: false, flight: false, ship: false };
const subs = new Set();

export function subscribe(fn) { subs.add(fn); fn(state); return () => subs.delete(fn); }
function emit() { save(); subs.forEach(fn => fn(state)); }

export function getState() { return { ...state }; }
export function toggle(id) { state[id] = !state[id]; emit(); }
export function set(id, val) { state[id] = !!val; emit(); }

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; } }
