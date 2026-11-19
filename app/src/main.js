// Laguna Gold — editor wiring: load the six sample photos, bind every
// control to live state, drag-to-pan each panel's crop, export PNGs.
// A `?shot=` query stages a fixed scene for screenshots instead.
import { PHOTOS, GRADES, CAPTION_STYLES, LAYOUTS, defaultState, drawCover, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();
const images = {};
let selectedSlot = 'hero';

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  for (const [key, meta] of Object.entries(PHOTOS)) {
    images[key] = await loadImage(`./samples/${meta.file}`);
  }
}

function redraw() {
  drawCover(canvas, images, state);
  const panel = state.panels[selectedSlot];
  document.getElementById('panel-label').textContent =
    `Panel ${selectedSlot.toUpperCase()} — ${PHOTOS[panel.photo].label}`;
  document.getElementById('zoom').value = panel.zoom;
  document.getElementById('zoom-val').textContent = `${Math.round(panel.zoom * 100)}%`;
  document.getElementById('posx').value = Math.round(panel.fx * 100);
  document.getElementById('posy').value = Math.round(panel.fy * 100);
}

function bindControls() {
  const $ = (id) => document.getElementById(id);
  // Layout switcher
  const layoutBox = $('layouts');
  for (const [key, def] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (key === state.layout ? ' on' : '');
    b.textContent = def.label;
    b.addEventListener('click', () => {
      state.layout = key;
      selectedSlot = LAYOUTS[key].slots[0];
      layoutBox.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
      b.classList.add('on');
      buildPanelPicker();
      redraw();
    });
    layoutBox.appendChild(b);
  }
  // Grade picker + intensity
  const gradeBox = $('grades');
  for (const [key, def] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (key === state.grade ? ' on' : '');
    b.textContent = def.label;
    b.addEventListener('click', () => {
      state.grade = key;
      gradeBox.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
      b.classList.add('on');
      redraw();
    });
    gradeBox.appendChild(b);
  }
  $('intensity').addEventListener('input', (e) => {
    state.intensity = Number(e.target.value);
    $('intensity-val').textContent = `${state.intensity}%`;
    redraw();
  });
  // Caption text, style, size, position
  $('title').addEventListener('input', (e) => { state.title = e.target.value.toUpperCase(); redraw(); });
  $('kicker').addEventListener('input', (e) => { state.kicker = e.target.value.toUpperCase(); redraw(); });
  $('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });
  $('pill').addEventListener('input', (e) => { state.pill = e.target.value.toUpperCase(); redraw(); });
  const styleBox = $('caption-styles');
  for (const [key, label] of Object.entries(CAPTION_STYLES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (key === state.captionStyle ? ' on' : '');
    b.textContent = label;
    b.addEventListener('click', () => {
      state.captionStyle = key;
      styleBox.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
      b.classList.add('on');
      redraw();
    });
    styleBox.appendChild(b);
  }
  $('caption-size').addEventListener('input', (e) => {
    state.captionSize = Number(e.target.value);
    $('caption-size-val').textContent = `${state.captionSize}%`;
    redraw();
  });
  $('caption-pos').addEventListener('change', (e) => { state.captionPos = e.target.value; redraw(); });
  // Per-panel photo picker
  const photoSel = $('panel-photo');
  for (const [key, meta] of Object.entries(PHOTOS)) {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = meta.label;
    photoSel.appendChild(o);
  }
  photoSel.addEventListener('change', (e) => {
    const panel = state.panels[selectedSlot];
    panel.photo = e.target.value;
    panel.fx = PHOTOS[panel.photo].fx;
    panel.fy = PHOTOS[panel.photo].fy;
    redraw();
  });
  $('zoom').addEventListener('input', (e) => {
    state.panels[selectedSlot].zoom = Number(e.target.value) / 100;
    redraw();
  });
  $('posx').addEventListener('input', (e) => {
    state.panels[selectedSlot].fx = Number(e.target.value) / 100;
    redraw();
  });
  $('posy').addEventListener('input', (e) => {
    state.panels[selectedSlot].fy = Number(e.target.value) / 100;
    redraw();
  });
  // Upload your own photo into the selected panel (read locally, never sent).
  $('upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = await loadImage(URL.createObjectURL(file));
    const key = `user-${Date.now()}`;
    images[key] = img;
    PHOTOS[key] = { file: file.name, label: `Your photo — ${file.name}`, fx: 0.5, fy: 0.5 };
    const o = document.createElement('option');
    o.value = key;
    o.textContent = PHOTOS[key].label;
    photoSel.appendChild(o);
    photoSel.value = key;
    state.panels[selectedSlot].photo = key;
    state.panels[selectedSlot].fx = 0.5;
    state.panels[selectedSlot].fy = 0.5;
    redraw();
  });
  // Drag on the preview to pan the selected panel's crop.
  let dragging = false;
  let lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const panel = state.panels[selectedSlot];
    const slots = LAYOUTS[state.layout].slots;
    const rects = panelRects(state.layout, canvas.width, canvas.height * 0.8);
    const idx = slots.indexOf(selectedSlot);
    const r = rects[idx];
    panel.fx -= ((e.clientX - lastX) / rect.width) * (canvas.width / r.w) * 0.4;
    panel.fy -= ((e.clientY - lastY) / rect.height) * (canvas.height / r.h) * 0.4;
    panel.fx = Math.min(1, Math.max(0, panel.fx));
    panel.fy = Math.min(1, Math.max(0, panel.fy));
    lastX = e.clientX; lastY = e.clientY;
    redraw();
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  // Export: one click per size, real PNG from the same draw code.
  document.querySelectorAll('[data-export]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [w, h] = btn.dataset.export.split('x').map(Number);
      exportPNG(w, h);
    });
  });
}

function buildPanelPicker() {
  const box = document.getElementById('panel-picker');
  box.innerHTML = '';
  for (const slot of LAYOUTS[state.layout].slots) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (slot === selectedSlot ? ' on' : '');
    b.textContent = slot.toUpperCase();
    b.addEventListener('click', () => {
      selectedSlot = slot;
      box.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
      b.classList.add('on');
      document.getElementById('panel-photo').value = state.panels[slot].photo;
      redraw();
    });
    box.appendChild(b);
  }
}

export function exportPNG(w, h) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, images, state);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `laguna-gold-${w}x${h}.png`;
      a.click();
      status.textContent = `Saved laguna-gold-${w}x${h}.png (${Math.round(blob.size / 1024)} KiB)`;
      resolve(blob);
    }, 'image/png');
  });
}

window.__laguna = {
  state,
  images,
  redraw,
  exportPNG: (w, h) => {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, images, state);
    return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  },
};

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
try {
  await document.fonts.load('16px "Archivo Black"');
  await document.fonts.load('600 16px Oswald');
  await document.fonts.load('16px Pacifico');
  await document.fonts.ready;
} catch { /* fall back to system fonts if a face is slow */ }
await loadSamples();
bindControls();
buildPanelPicker();
if (shot) {
  runShot(shot, params, state, canvas, redraw);
} else {
  redraw();
}
window.__ready = true;
