import { initGlobe } from './ui/globe-canvas.js';
import { initHeader } from './ui/header.js';
import { initTripPanel } from './ui/trip-panel.js';

import * as Trip from './state/trip-state.js';
import * as Layers from './state/layers-state.js';

import { computeEmissions } from './lib/emissions.js';
import { routeDistanceKm } from './lib/distance.js';
import { $ } from './lib/dom.js';

const globe = initGlobe(document.getElementById('globe'));
initHeader(document.getElementById('app-header'));
initTripPanel(document.getElementById('trip-panel'));

// Render: pins on globe
Trip.subscribe((state) => {
  const points = state.items
    .filter(i => i.status === 'ok' && i.coords)
    .map(i => ({ lat: i.coords.lat, lng: i.coords.lng, label: i.label || i.text }));
  globe.setPoints(points);
  renderSummary();
});

// Render: summary whenever layers toggle
Layers.subscribe(renderSummary);

// Initial render
renderSummary();

async function renderSummary() {
  const trip = Trip.getState();
  const active = Layers.getState();

  const coords = trip.items
    .filter(i => i.status === 'ok' && i.coords)
    .map(i => i.coords);

  const km = routeDistanceKm(coords);
  const { totals, sources } = await computeEmissions(km, active);

  const el = $('#summary-content');
  el.innerHTML = '';

  if (coords.length < 2) {
    el.innerHTML = `<p class="muted">Confirm at least two locations to compute distance.</p>`;
    return;
  }

  const distRow = document.createElement('div');
  distRow.className = 'summary-row';
  distRow.innerHTML = `<span>Route distance</span><span class="badge">${km.toFixed(1)} km</span>`;
  el.appendChild(distRow);

  let overall = 0;
  for (const [k, v] of Object.entries(totals)) {
    if (!v.enabled) continue;
    overall += v.value;
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.innerHTML = `<span>${v.label}</span><span class="badge">${v.value.toFixed(0)} gCO₂e</span>`;
    el.appendChild(row);
  }

  if (overall === 0) {
    const tip = document.createElement('p');
    tip.className = 'muted';
    tip.textContent = 'Toggle a metric in the header to include its footprint.';
    el.appendChild(tip);
  } else {
    const total = document.createElement('div');
    total.className = 'summary-row total';
    total.innerHTML = `<span>Total</span><span>${overall.toFixed(0)} gCO₂e</span>`;
    el.appendChild(total);
  }

  // Sources
  const enabled = Object.values(totals).filter(v => v.enabled);
  if (enabled.length) {
    const list = document.createElement('div');
    list.className = 'muted';
    list.style.marginTop = '8px';
    list.innerHTML = `<small>Sources: ${enabled.map(v => sources[v.sourceId]?.name || v.sourceId).join(' • ')}</small>`;
    el.appendChild(list);
  }
}
