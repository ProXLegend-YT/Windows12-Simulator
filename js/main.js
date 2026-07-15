/* =========================================================================
   main.js — loaded last. Nothing here is required for the OS to boot
   (every other module wires itself up as soon as it loads), this file
   just adds a couple of nice-to-haves.
   ========================================================================= */

/* Keep one runtime error from taking down the whole desktop — log it and
   let the user keep working instead of a blank screen. */
window.addEventListener('error', (e)=>{
  console.error('Windows 12 Simulator error:', e.error || e.message);
});

/* Respect the OS-level color scheme as a sensible one-time default the
   first time someone visits, without overriding an explicit choice
   they've already saved. */
if(Store.get('theme', null) === null && window.matchMedia){
  State.theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'auto';
  applyTheme();
}

console.log('%cWindows 12 Web Simulator', 'font-weight:bold;font-size:14px;color:#4f8cff;', '— loaded', APPS.length, 'apps.');
