/* =========================================================================
   state.js — thin persistence layer, global state, shared utilities,
   and the master list of apps (every other module just registers a
   builder function for the ids declared here).
   ========================================================================= */

/* ---------------------------------------------------------------------
   Store — localStorage wrapper
--------------------------------------------------------------------- */
const Store = {
  get(key, fallback){
    try{ const v = localStorage.getItem('w12_'+key); return v===null?fallback:JSON.parse(v); }
    catch(e){ return fallback; }
  },
  set(key, val){ try{ localStorage.setItem('w12_'+key, JSON.stringify(val)); }catch(e){} }
};

/* ---------------------------------------------------------------------
   Global state
--------------------------------------------------------------------- */
const State = {
  theme: Store.get('theme','auto'),
  wallpaper: Store.get('wallpaper','wallpaper-flux'),
  user: Store.get('user',{name:'Alex Morgan', pin:''}),
  notifications: Store.get('notifications', [
    {id:'n1', title:'Windows Update', body:'Feature update 25H2 is ready to install.', icon:'⬆️'},
    {id:'n2', title:'Copilot', body:'I found 3 ways to speed up your PC today.', icon:'✨'},
    {id:'n3', title:'Calendar', body:'Design review starts in 30 minutes.', icon:'📅'}
  ]),
  volume: Store.get('volume',70),
  brightness: Store.get('brightness',100),
  wifi: Store.get('wifi', true),
  airplane: Store.get('airplane', false),
  bluetooth: Store.get('bluetooth', true),
  battery: 92,
  zTop: 100,
  openWindows: [],
  focusedId: null,
  desktops: [{name:'Desktop 1'},{name:'Desktop 2'}],
  activeDesktop: 0
};

/* ---------------------------------------------------------------------
   Master app registry (icon/name only — each id's window is built by
   an AppBuilders[id] function registered from apps.js / browser.js / games.js)
--------------------------------------------------------------------- */
const APPS = [
  {id:'explorer', name:'File Explorer', icon:'📁'},
  {id:'settings', name:'Settings', icon:'⚙️'},
  {id:'browser', name:'Browser', icon:'🌐'},
  {id:'notepad', name:'Notepad', icon:'📝'},
  {id:'calculator', name:'Calculator', icon:'🧮'},
  {id:'paint', name:'Paint', icon:'🎨'},
  {id:'media', name:'Media Player', icon:'🎬'},
  {id:'terminal', name:'Terminal', icon:'⌨️'},
  {id:'store', name:'Store', icon:'🛍️'},
  {id:'aihub', name:'AI Hub', icon:'✨'},
  {id:'weather', name:'Weather', icon:'⛅'},
  {id:'maps', name:'Maps', icon:'🗺️'},
  {id:'games', name:'Game Hub', icon:'🎮'},
  {id:'recycle', name:'Recycle Bin', icon:'🗑️'}
];

/* Every app module pushes its window-builder function onto this object,
   keyed by app id. windows.js / desktop.js call AppBuilders[id](app). */
const AppBuilders = {};

/* ---------------------------------------------------------------------
   Utilities
--------------------------------------------------------------------- */
function $(sel,root=document){ return root.querySelector(sel); }
function $all(sel,root=document){ return [...root.querySelectorAll(sel)]; }
function uid(prefix='id'){ return prefix+'_'+Math.random().toString(36).slice(2,9); }
function pad(n){ return n.toString().padStart(2,'0'); }
function fmtTime(d){ return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function fmtTime12(d){ let h=d.getHours()%12; if(h===0)h=12; return h+':'+pad(d.getMinutes())+' '+(d.getHours()<12?'AM':'PM'); }
function fmtDateLong(d){ return d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}); }
function fmtDateShort(d){ return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function showToast(title, body, icon='🔔'){
  const layer = $('#toast-layer');
  const t = document.createElement('div');
  t.className='toast glass';
  t.innerHTML = `<div class="ico">${icon}</div><div><b>${escapeHtml(title)}</b><p>${escapeHtml(body)}</p></div>`;
  layer.appendChild(t);
  setTimeout(()=>{ t.style.transition='opacity .25s,transform .25s'; t.style.opacity='0'; t.style.transform='translateX(24px)'; setTimeout(()=>t.remove(),260); }, 4200);
}

function addNotification(title, body, icon='🔔'){
  State.notifications.unshift({id:uid('n'), title, body, icon});
  Store.set('notifications', State.notifications);
  if(typeof renderNotifications==='function') renderNotifications();
  showToast(title, body, icon);
}

/* ---------------------------------------------------------------------
   Central 1-second ticker — every clock in the app subscribes to this
   instead of running its own setInterval (fewer timers = less jank).
--------------------------------------------------------------------- */
const Ticker = {
  listeners: [],
  add(fn){ this.listeners.push(fn); },
};
setInterval(()=>{
  const d = new Date();
  for(const fn of Ticker.listeners){ try{ fn(d); }catch(e){ /* keep other listeners alive */ } }
}, 1000);
