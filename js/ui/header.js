import * as Layers from '../state/layers-state.js';
import { LAYERS } from '../layers/registry.js';
import { $ } from '../lib/dom.js';

export function initHeader(root) {
  root.innerHTML = `
    <div class="brand">
      <span class="brand-dot"></span>
      <span>Carbon Footprint — Trip Builder</span>
    </div>
    <div class="toggle-bar" id="toggle-bar"></div>
  `;

  const bar = $('#toggle-bar');
  LAYERS.forEach(layer => {
    const btn = document.createElement('button');
    btn.className = 'toggle';
    btn.dataset.layer = layer.id;
    btn.textContent = layer.label;
    btn.addEventListener('click', () => {
      Layers.toggle(layer.id);
      renderButtons();
    });
    bar.appendChild(btn);
  });

  function renderButtons() {
    const state = Layers.getState();
    bar.querySelectorAll('.toggle').forEach(btn => {
      const id = btn.dataset.layer;
      btn.classList.toggle('active', state[id]);
    });
  }

  // Initial paint
  renderButtons();
}
