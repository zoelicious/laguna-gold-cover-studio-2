// Fixed screenshot scenes. Each one stages the same live app (same state,
// same draw code as the editor) so every screenshot is the app's own output.
export function runShot(shot, params, state, canvas, redraw) {
  document.body.classList.add('shot');
  state.title = 'LAGUNA GOLD';
  state.kicker = 'WELCOME TO LAGUNA';
  state.tagline = 'golden tides, neon nights';
  state.pill = 'SUMMER 2026';
  state.captionStyle = 'banner';
  state.captionPos = 'bottom';
  if (shot === 'cover') {
    state.layout = 'hero4';
    state.grade = 'golden';
    state.intensity = 85;
    canvas.width = 1080;
    canvas.height = 1080;
    canvas.style.width = '1024px';
    canvas.style.height = '1024px';
  } else if (shot === 'halftone') {
    state.layout = 'hero4';
    state.grade = 'halftone';
    state.intensity = 90;
    canvas.width = 1080;
    canvas.height = 1080;
    canvas.style.width = '1024px';
    canvas.style.height = '1024px';
  } else if (shot === 'portrait') {
    state.layout = 'hero4';
    state.grade = 'golden';
    state.intensity = 85;
    canvas.width = 1080;
    canvas.height = 1350;
    canvas.style.width = '1024px';
    canvas.style.height = '1280px';
  } else if (shot === 'editor') {
    document.body.classList.remove('shot');
    state.layout = 'hero4';
    state.grade = 'golden';
    state.intensity = 85;
    canvas.width = 1080;
    canvas.height = 1080;
    // Shrink the preview so the whole cover (title band included) fits in
    // a 1280x960 editor screenshot beside the controls, top-aligned.
    canvas.style.width = '480px';
    canvas.style.height = '480px';
    document.querySelector('.preview').style.alignItems = 'flex-start';
  }
  redraw();
}
