/* =========================================================================
   desktop.js — desktop icons (draggable), widgets, context menus
   ========================================================================= */

function initDesktop(){
  renderDesktopIcons();
  renderWidgets();
  if(typeof renderPinned==='function') renderPinned();
  if(typeof renderRecommended==='function') renderRecommended();
  if(typeof renderNotifications==='function') renderNotifications();
  if(typeof renderQuickSettings==='function') renderQuickSettings();
  if(typeof renderCalendarMini==='function') renderCalendarMini();
  startTaskbarClock();
  if(typeof seedAIChat==='function') seedAIChat();
}

/* ---------------------------------------------------------------------
   Desktop icons
--------------------------------------------------------------------- */
function renderDesktopIcons(){
  const wrap = $('#desktop-icons');
  wrap.innerHTML='';
  const spacingY = 100;
  const positions = Store.get('iconPositions', {});
  APPS.forEach((app,i)=>{
    const el = document.createElement('div');
    el.className='d-icon';
    el.dataset.app = app.id;
    const pos = positions[app.id] || {x:14, y: 14 + i*spacingY};
    el.style.left = pos.x+'px'; el.style.top = pos.y+'px';
    el.innerHTML = `<div class="glyph">${app.icon}</div><span>${escapeHtml(app.name)}</span>`;
    wrap.appendChild(el);
    makeIconDraggable(el, app.id);
    el.addEventListener('dblclick', ()=> openApp(app.id));
    el.addEventListener('click', e=>{
      e.stopPropagation();
      $all('.d-icon').forEach(i2=>i2.classList.remove('selected'));
      el.classList.add('selected');
    });
    let lastTap=0;
    el.addEventListener('touchend', ()=>{
      const now=Date.now();
      if(now-lastTap<380){ openApp(app.id); }
      lastTap=now;
    });
  });
}

function makeIconDraggable(el, appId){
  let dragging=false, sx=0, sy=0, ox=0, oy=0, moved=false, raf=null, pendingX=0, pendingY=0;
  function apply(){
    el.style.left = Math.max(0,pendingX)+'px';
    el.style.top = Math.max(0,pendingY)+'px';
    raf=null;
  }
  const start = (x,y)=>{ dragging=true; moved=false; sx=x; sy=y; ox=el.offsetLeft; oy=el.offsetTop; };
  const move = (x,y)=>{
    if(!dragging) return;
    const dx=x-sx, dy=y-sy;
    if(Math.abs(dx)>3||Math.abs(dy)>3) moved=true;
    pendingX = ox+dx; pendingY = oy+dy;
    if(!raf) raf = requestAnimationFrame(apply);
  };
  const end = ()=>{
    if(!dragging) return;
    dragging=false;
    if(moved){
      const positions = Store.get('iconPositions', {});
      positions[appId] = {x: el.offsetLeft, y: el.offsetTop};
      Store.set('iconPositions', positions);
    }
  };
  el.addEventListener('mousedown', e=>{ start(e.clientX,e.clientY); e.preventDefault(); });
  window.addEventListener('mousemove', e=>move(e.clientX,e.clientY));
  window.addEventListener('mouseup', end);
  el.addEventListener('touchstart', e=>{ const t=e.touches[0]; start(t.clientX,t.clientY); },{passive:true});
  el.addEventListener('touchmove', e=>{ const t=e.touches[0]; move(t.clientX,t.clientY); },{passive:true});
  el.addEventListener('touchend', end);
}

/* ---------------------------------------------------------------------
   Widgets
--------------------------------------------------------------------- */
function renderWidgets(){
  const row = $('#widgets-row');
  const d = new Date();
  row.innerHTML = `
    <div class="widget glass w-clock"><h4>Clock</h4><div class="big" id="wg-clock">--:--</div><div class="sub" id="wg-date">--</div></div>
    <div class="widget glass w-weather"><h4>Weather<span>📍 <span id="wg-place">Locating…</span></span></h4><div><div class="temp" id="wg-temp">--°</div><div class="place" id="wg-cond">Fetching live data…</div></div><div style="font-size:36px" id="wg-icon">⛅</div></div>
    <div class="widget glass w-cal"><h4>Calendar<span id="wg-cal-month"></span></h4><div class="grid" id="wg-cal-grid"></div></div>
    <div class="widget glass w-notes"><h4>Quick Notes</h4><textarea id="wg-notes" placeholder="Jot something down…"></textarea></div>
  `;
  $('#wg-notes').value = Store.get('quickNote','');
  $('#wg-notes').addEventListener('input', e=> Store.set('quickNote', e.target.value));
  buildCalendarGrid($('#wg-cal-grid'));
  $('#wg-cal-month').textContent = d.toLocaleDateString(undefined,{month:'short'});
  updateWidgetClock(new Date());
  Ticker.add(updateWidgetClock);
  if(typeof fetchLiveWeather==='function') fetchLiveWeather('widget');
}
function updateWidgetClock(d){
  const el = $('#wg-clock'); if(!el) return;
  d = d || new Date();
  el.textContent = fmtTime12(d);
  $('#wg-date').textContent = fmtDateLong(d);
}
function buildCalendarGrid(container){
  const d = new Date();
  const year=d.getFullYear(), month=d.getMonth();
  const first = new Date(year,month,1).getDay();
  const days = new Date(year,month+1,0).getDate();
  let html = ['S','M','T','W','T','F','S'].map(x=>`<div style="opacity:.5">${x}</div>`).join('');
  for(let i=0;i<first;i++) html+='<div></div>';
  for(let day=1; day<=days; day++){
    html += `<div class="${day===d.getDate()?'today':''}">${day}</div>`;
  }
  container.innerHTML = html;
}
function renderCalendarMini(){
  buildCalendarGrid($('#nc-cal-grid'));
  $('#nc-cal-title').textContent = new Date().toLocaleDateString(undefined,{month:'long',year:'numeric'});
}

/* ---------------------------------------------------------------------
   Taskbar clock
--------------------------------------------------------------------- */
function startTaskbarClock(){
  const tick=(d)=>{
    d = d || new Date();
    $('#tb-time').textContent = fmtTime(d);
    $('#tb-date-small').textContent = fmtDateShort(d);
  };
  tick(new Date());
  Ticker.add(tick);
}

/* ---------------------------------------------------------------------
   Generic context menu
--------------------------------------------------------------------- */
function openContextMenu(x,y,items){
  const menu = $('#ctx-menu');
  menu.innerHTML = items.map((it)=>{
    if(it.sep) return '<div class="ctx-sep"></div>';
    return `<button class="ctx-item">${it.icon||''} <span>${escapeHtml(it.label)}</span></button>`;
  }).join('');
  menu.classList.add('show');
  const vw = window.innerWidth, vh = window.innerHeight;
  menu.style.left = Math.min(x, vw-menu.offsetWidth-10)+'px';
  menu.style.top = Math.min(y, vh-menu.offsetHeight-10)+'px';
  const buttons = $all('.ctx-item',menu);
  let bi=0;
  items.forEach(it=>{
    if(it.sep) return;
    const btn = buttons[bi++];
    btn.onclick = ()=>{ closeContextMenu(); if(it.action) it.action(); };
  });
}
function closeContextMenu(){ $('#ctx-menu').classList.remove('show'); }
document.addEventListener('click', e=>{ if(!e.target.closest('#ctx-menu')) closeContextMenu(); });

$('#desktop').addEventListener('contextmenu', e=>{
  e.preventDefault();
  const iconEl = e.target.closest('.d-icon');
  if(iconEl){
    const appId = iconEl.dataset.app;
    openContextMenu(e.clientX,e.clientY,[
      {label:'Open', icon:'📂', action:()=>openApp(appId)},
      {sep:true},
      {label:'Pin to taskbar', icon:'📌', action:()=>showToast('Pinned', 'App pinned to taskbar','📌')},
      {label:'Rename', icon:'✏️', action:()=>showToast('Rename', 'Renaming is simulated in this demo','✏️')},
      {sep:true},
      {label:'Delete', icon:'🗑️', action:()=>showToast('Deleted', 'Moved to Recycle Bin','🗑️')}
    ]);
  } else {
    openContextMenu(e.clientX,e.clientY,[
      {label:'View', icon:'🖼️'},
      {label:'Sort by', icon:'↕️'},
      {label:'Refresh', icon:'🔄', action:()=>showToast('Refreshed','Desktop refreshed','🔄')},
      {sep:true},
      {label:'New folder', icon:'📁', action:()=>showToast('New folder','Folder created','📁')},
      {label:'New text document', icon:'📝', action:()=>openApp('notepad')},
      {sep:true},
      {label:'Personalize', icon:'🎨', action:()=>openApp('settings')}
    ]);
  }
});
