// Laguna Gold — cover render engine. Draws the whole poster on one canvas:
// hero-dominant photo panels, a Vice City colour grade, retro-sun + palm
// furniture and giant poster lettering. No network, no library, canvas only.

export const PHOTOS = {
  hero: { file: 'hero.jpg', label: 'Convertible — golden hour', fx: 0.5, fy: 0.42 },
  captain: { file: 'captain.jpg', label: 'Captain — fishing at sunset', fx: 0.64, fy: 0.3 },
  marina: { file: 'marina.jpg', label: 'Marina — sunset yachts', fx: 0.5, fy: 0.5 },
  neon: { file: 'neon.jpg', label: 'Neon street — laughing couple', fx: 0.5, fy: 0.36 },
  boulevard: { file: 'boulevard.jpg', label: 'Boulevard — red convertible', fx: 0.5, fy: 0.2 },
  pier: { file: 'pier.jpg', label: 'Pier — bright day fishing', fx: 0.32, fy: 0.26 },
};

export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.3) contrast(1.08) brightness(1.02)',
    top: 'rgba(255,122,26,0.20)', bottom: 'rgba(190,20,120,0.24)',
  },
  golden: {
    label: 'Golden Hour',
    filter: 'saturate(1.35) brightness(1.06) sepia(0.16)',
    top: 'rgba(255,190,60,0.20)', bottom: 'rgba(255,110,20,0.18)',
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.5) contrast(1.12) hue-rotate(-14deg)',
    top: 'rgba(255,0,160,0.20)', bottom: 'rgba(0,40,160,0.26)',
  },
  bright: {
    label: 'Bright Day',
    filter: 'saturate(1.18) brightness(1.1) contrast(1.04)',
    top: 'rgba(255,255,255,0.10)', bottom: 'rgba(80,180,255,0.12)',
  },
  halftone: {
    label: 'Pop Art / Halftone',
    filter: 'saturate(1.45) contrast(1.18) brightness(1.16)',
    top: 'rgba(255,0,140,0.10)', bottom: 'rgba(255,200,0,0.10)',
  },
};

export const CAPTION_STYLES = {
  banner: 'Banner — title band with retro sun + palms',
  block: 'Block white',
  outline: 'Outline',
  neon: 'Neon glow',
};

export const LAYOUTS = {
  hero4: { label: 'Hero 4-panel — hero left + 3 stacked', slots: ['hero', 'captain', 'marina', 'neon'] },
  hero6: { label: 'Hero 6-panel — hero left + 2x2 right', slots: ['hero', 'captain', 'marina', 'neon', 'boulevard'] },
  grid9: { label: '9-panel — hero 2x2 + five small', slots: ['hero', 'captain', 'marina', 'neon', 'boulevard', 'pier'] },
  single: { label: 'Single hero — one full scene', slots: ['hero'] },
};

export function defaultState() {
  return {
    layout: 'hero4',
    grade: 'golden',
    intensity: 85,
    title: 'LAGUNA GOLD',
    kicker: 'WELCOME TO LAGUNA',
    tagline: 'golden tides, neon nights',
    pill: 'SUMMER 2026',
    captionStyle: 'banner',
    captionSize: 100,
    captionPos: 'bottom',
    panels: {
      hero: { photo: 'hero', zoom: 1.0, fx: 0.5, fy: 0.42 },
      captain: { photo: 'captain', zoom: 1.0, fx: 0.64, fy: 0.3 },
      marina: { photo: 'marina', zoom: 1.0, fx: 0.5, fy: 0.5 },
      neon: { photo: 'neon', zoom: 1.0, fx: 0.5, fy: 0.36 },
      boulevard: { photo: 'boulevard', zoom: 1.0, fx: 0.5, fy: 0.2 },
      pier: { photo: 'pier', zoom: 1.0, fx: 0.32, fy: 0.26 },
    },
  };
}

// Panel rectangles (fractions of the photo area, which is the cover minus
// the bottom title band). Hero is always the big left panel.
export function panelRects(layout, areaW, areaH) {
  const g = 6; // gutter in px at 1080 scale, scaled below
  const s = areaW / 1080;
  const gap = Math.max(3, g * s);
  const R = (x, y, w, h) => ({ x: x * areaW + gap / 2, y: y * areaH + gap / 2, w: w * areaW - gap, h: h * areaH - gap });
  if (layout === 'hero4') {
    return [
      R(0, 0, 0.55, 1),
      R(0.55, 0, 0.45, 1 / 3),
      R(0.55, 1 / 3, 0.45, 1 / 3),
      R(0.55, 2 / 3, 0.45, 1 / 3),
    ];
  }
  if (layout === 'hero6') {
    return [
      R(0, 0, 0.55, 1),
      R(0.55, 0, 0.225, 0.5),
      R(0.775, 0, 0.225, 0.5),
      R(0.55, 0.5, 0.225, 0.5),
      R(0.775, 0.5, 0.225, 0.5),
    ];
  }
  if (layout === 'grid9') {
    return [
      R(0, 0, 2 / 3, 2 / 3),
      R(2 / 3, 0, 1 / 3, 1 / 3),
      R(2 / 3, 1 / 3, 1 / 3, 1 / 3),
      R(0, 2 / 3, 1 / 3, 1 / 3),
      R(1 / 3, 2 / 3, 1 / 3, 1 / 3),
      R(2 / 3, 2 / 3, 1 / 3, 1 / 3),
    ];
  }
  return [R(0, 0, 1, 1)]; // single
}

// Draw one photo into a rect, cover-fit, focused on (fx, fy) so faces stay
// whole, with the grade filter + warm/cool tint overlay.
function drawPhoto(ctx, img, rect, panel, grade, intensity) {
  const g = GRADES[grade];
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const sc = base * panel.zoom;
  const dw = iw * sc, dh = ih * sc;
  let dx = rect.x + rect.w / 2 - panel.fx * dw;
  let dy = rect.y + rect.h / 2 - panel.fy * dh;
  dx = dw > rect.w ? Math.min(rect.x, Math.max(rect.x + rect.w - dw, dx)) : rect.x + (rect.w - dw) / 2;
  dy = dh > rect.h ? Math.min(rect.y, Math.max(rect.y + rect.h - dh, dy)) : rect.y + (rect.h - dh) / 2;
  ctx.filter = grade === 'halftone' ? g.filter : g.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  const a = (intensity / 100) * 0.9;
  const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  tint.addColorStop(0, g.top);
  tint.addColorStop(1, g.bottom);
  ctx.globalAlpha = a;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Posterise the photo layer into a magenta-yellow duotone, then lay a
// halftone dot screen over it. Runs on the photo canvas only, so the
// lettering drawn later stays crisp.
export function posterizeHalftone(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const ramp = [
    [58, 26, 94], [164, 19, 60], [224, 33, 138], [255, 123, 0], [255, 214, 10], [255, 243, 176],
  ];
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const band = Math.min(5, Math.floor(lum / 43));
    const c = ramp[band];
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
  }
  ctx.putImageData(img, 0, 0);
  const step = Math.max(6, Math.round(W / 150));
  ctx.fillStyle = 'rgba(10,4,20,0.22)';
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      const p = ctx.getImageData(x, y, 1, 1).data;
      const lum = 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
      const r = (1 - lum / 255) * step * 0.42;
      if (r > 0.6) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// Retro striped sun: a gradient disc with horizontal slits cut out of its
// lower half. Drawn as an overlay, about 17% of the cover width.
export function drawRetroSun(ctx, cx, cy, r) {
  ctx.save();
  const grad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  grad.addColorStop(0, '#ffe66d');
  grad.addColorStop(0.55, '#ff9e00');
  grad.addColorStop(1, '#ff2e88');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  let y = cy + r * 0.05, h = r * 0.09;
  while (y < cy + r) {
    ctx.fillRect(cx - r - 2, y, r * 2 + 4, h);
    y += h * 2.4;
    h *= 1.35;
  }
  ctx.restore();
}

// One palm silhouette: curved trunk + seven drooping fronds.
export function drawPalm(ctx, x, y, s, flip) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.strokeStyle = '#160a24';
  ctx.fillStyle = '#160a24';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(10, -52, 26, -88);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = (-160 + i * 26) * (Math.PI / 180);
    const len = 62 - Math.abs(i - 3) * 7;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(26, -88);
    ctx.quadraticCurveTo(
      26 + Math.cos(a) * len * 0.6, -88 + Math.sin(a) * len * 0.5 - 12,
      26 + Math.cos(a) * len, -88 + Math.sin(a) * len + 16,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function fitFont(ctx, text, family, maxW, startPx) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = `${px}px ${family}`;
  }
  return px;
}

function drawTitleText(ctx, state, cx, topY, maxW, unit, startPx) {
  const sizeScale = state.captionSize / 100;
  const titlePx = fitFont(ctx, state.title, '"Archivo Black", sans-serif', maxW, startPx);
  const grad = ctx.createLinearGradient(cx - maxW / 2, topY, cx + maxW / 2, topY + titlePx);
  grad.addColorStop(0, '#fff3b0');
  grad.addColorStop(0.45, '#ffb703');
  grad.addColorStop(0.75, '#ff5e78');
  grad.addColorStop(1, '#ff2e88');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const style = state.captionStyle;
  if (style === 'neon') {
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = 26 * unit;
  }
  if (style === 'block') {
    const pad = 14 * unit;
    const tw = ctx.measureText(state.title).width;
    ctx.fillStyle = '#fff8ec';
    ctx.shadowBlur = 0;
    roundRect(ctx, cx - tw / 2 - pad, topY - titlePx * 0.92, tw + pad * 2, titlePx * 1.18, 10 * unit);
    ctx.fill();
    ctx.fillStyle = '#160a24';
  } else if (style === 'outline') {
    ctx.lineWidth = Math.max(3, titlePx * 0.09);
    ctx.strokeStyle = '#fff3b0';
    ctx.lineJoin = 'round';
    ctx.strokeText(state.title, cx, topY);
    ctx.fillStyle = 'rgba(22,10,36,0.25)';
    ctx.fillText(state.title, cx, topY);
  } else {
    ctx.lineWidth = Math.max(3, titlePx * 0.07);
    ctx.strokeStyle = '#160a24';
    ctx.lineJoin = 'round';
    ctx.strokeText(state.title, cx, topY);
    ctx.fillStyle = grad;
    ctx.fillText(state.title, cx, topY);
    if (style === 'neon') {
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12 * unit;
      ctx.fillText(state.title, cx, topY);
    }
  }
  ctx.shadowBlur = 0;
  return titlePx;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The full title block: kicker, giant title, script tagline, pill.
// Sized to fit inside the band it is given (never clipped at the bottom).
function drawTitleBlock(ctx, state, W, bandY, bandH) {
  const unit = W / 1080;
  const cx = W / 2;
  const maxW = W * 0.66;
  const ss = state.captionSize / 100;
  let kickerPx = 26 * unit * ss;
  let titlePx = 84 * unit * ss;
  let tagPx = 32 * unit;
  let pillPx = 26 * unit;
  let pillH = 36 * unit;
  const gap = 8 * unit;
  const need = gap + kickerPx + gap + titlePx + gap + tagPx + 10 * unit + pillH + gap;
  const fit = Math.min(1, (bandH * 0.97) / need);
  kickerPx *= fit; titlePx *= fit; tagPx *= fit; pillPx *= fit; pillH *= fit;
  const g = gap * fit;
  let y = bandY + g + kickerPx;
  // Kicker
  ctx.font = `600 ${Math.round(kickerPx)}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffe66d';
  ctx.fillText(state.kicker, cx, y);
  // Giant title (baseline = previous baseline + gap + cap height)
  y += g + titlePx;
  drawTitleText(ctx, state, cx, y, maxW, unit, titlePx);
  // Tagline in script
  y += g + tagPx * 0.7;
  ctx.font = `${Math.round(tagPx)}px Pacifico, cursive`;
  ctx.fillStyle = '#ff8fb8';
  ctx.fillText(state.tagline, cx, y);
  // Pill
  y += 10 * unit * fit + pillH;
  ctx.font = `600 ${Math.round(pillPx)}px Oswald, sans-serif`;
  const pw = ctx.measureText(state.pill).width + 36 * unit;
  ctx.fillStyle = '#ff2e88';
  roundRect(ctx, cx - pw / 2, y - pillH, pw, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#fff8ec';
  ctx.fillText(state.pill, cx, y - pillH * 0.28);
  return y - bandY;
}

// Main entry: draw the cover for `state` onto `canvas` at its own size.
export function drawCover(canvas, images, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const unit = W / 1080;
  const bandH = Math.round(H * 0.2);
  const areaH = H - bandH;
  ctx.fillStyle = '#12061f';
  ctx.fillRect(0, 0, W, H);

  // Photo layer on its own canvas so halftone can posterise photos only.
  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = W;
  photoCanvas.height = areaH;
  const pctx = photoCanvas.getContext('2d');
  pctx.fillStyle = '#12061f';
  pctx.fillRect(0, 0, W, areaH);
  const slots = LAYOUTS[state.layout].slots;
  const rects = panelRects(state.layout, W, areaH);
  slots.forEach((slot, i) => {
    const panel = state.panels[slot];
    const img = images[panel.photo];
    if (img) drawPhoto(pctx, img, rects[i], panel, state.grade, state.intensity);
  });
  if (state.grade === 'halftone') posterizeHalftone(photoCanvas);
  ctx.drawImage(photoCanvas, 0, 0);

  // Retro sun overlay, top-right corner of the photo area (~15% of width),
  // tucked into open sky so it never covers a face.
  const sunR = W * 0.075;
  drawRetroSun(ctx, W - sunR * 0.8, sunR * 1.25, sunR);

  const style = state.captionStyle;
  if (style === 'banner') {
    // Bottom band with gradient, palms flanking the title block.
    const band = ctx.createLinearGradient(0, areaH, 0, H);
    band.addColorStop(0, '#2b0a3d');
    band.addColorStop(0.5, '#5b1042');
    band.addColorStop(1, '#160a24');
    ctx.fillStyle = band;
    ctx.fillRect(0, areaH, W, bandH);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(0, areaH, W, Math.max(3, 4 * unit));
    drawPalm(ctx, W * 0.075, H - 6, 1.15 * unit, false);
    drawPalm(ctx, W * 0.925, H - 6, 1.15 * unit, true);
    drawTitleBlock(ctx, state, W, areaH, bandH);
  } else {
    // Overlay title block over the photos, at the chosen position.
    const blockH = bandH * 1.35;
    let bandY;
    if (state.captionPos === 'top') bandY = H * 0.04;
    else if (state.captionPos === 'center') bandY = areaH / 2 - blockH / 2;
    else bandY = areaH - blockH - H * 0.03;
    if (style === 'block') {
      ctx.fillStyle = 'rgba(18,6,31,0.35)';
      ctx.fillRect(0, bandY - 10, W, blockH + 20);
    }
    // Dim a strip behind overlay text so it stays readable on busy photos.
    const dim = ctx.createLinearGradient(0, bandY, 0, bandY + blockH);
    dim.addColorStop(0, 'rgba(18,6,31,0)');
    dim.addColorStop(0.5, 'rgba(18,6,31,0.45)');
    dim.addColorStop(1, 'rgba(18,6,31,0)');
    ctx.fillStyle = dim;
    ctx.fillRect(0, bandY, W, blockH);
    drawTitleBlock(ctx, state, W, bandY, blockH);
  }
}
