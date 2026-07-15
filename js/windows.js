/* =========================================================================
   windows.js — window manager: create/focus/minimize/maximize/close,
   drag + resize (rAF throttled for smoothness), edge snapping, task view.
   ========================================================================= */

function nextZ(){ return ++State.zTop; }

function createWindow({appId, title, icon, width=560, height=420, content, onMount}){
  const id = uid('win');
  const layer = $('#windows-layer');
  const el = document.createElement('div');
  el.className='window glass';
  el.id = id;
  const vw = window.innerWidth, vh = window.innerHeight - 90;
  const w = Math.min(width, vw-24), h = Math.min(height, vh-24);
  const left = Math.max(8, Math.min(vw-w-8, (vw-w)/2 + (Math.random()*60-30)));
  const top = Math.max(8, Math.min(vh-h-8, (vh-h)/2 + (Math.random()*40-20)));
  el.style.width=w+'px'; el.style.height=h+'px'; el.style.left=left+'px'; el.style.top=top+'px'; el.style.zIndex=nextZ();

  el.innerHTML = `
    <div class="win-titlebar">
      <span class="ico">${icon}</span><span class="title">${escapeHtml(title)}</span>
      <div class="win-controls">
        <button class="win-min" title="Minimize" aria-label="Minimize">─</button>
        <button class="win-max" title="Maximize" aria-label="Maximize">▢</button>
        <button class="win-close" title="Close" aria-label="Close">✕</button>
      </div>
    </div>
    <div class="win-body">${content||''}</div>
    <div class="resizer rz-e"></div><div class="resizer rz-w"></div><div class="resizer rz-n"></div><div class="resizer rz-s"></div><div class="resizer rz-se"></div>
  `;
  layer.appendChild(el);

  const win = {id, appId, title, icon, el, minimized:false, maximized:false, prevRect:null};
  State.openWindows.push(win);
  focusWindow(id);
  renderTaskbarRunning();

  /* ---------- Dragging (rAF throttled) ---------- */
  const bar = $('.win-titlebar', el);
  let dragging=false, sx=0, sy=0, ox=0, oy=0, dragRaf=null, pendingLeft=0, pendingTop=0;
  function applyDrag(){ el.style.left=pendingLeft+'px'; el.style.top=pendingTop+'px'; dragRaf=null; }
  bar.addEventListener('mousedown', e=>{
    if(e.target.closest('.win-controls')) return;
    if(win.maximized) return;
    dragging=true; sx=e.clientX; sy=e.clientY; ox=el.offsetLeft; oy=el.offsetTop;
    el.classList.add('dragging'); focusWindow(id);
  });
  window.addEventListener('mousemove', e=>{
    if(!dragging) return;
    pendingLeft = ox + e.clientX-sx; pendingTop = Math.max(0, oy + e.clientY-sy);
    if(!dragRaf) dragRaf = requestAnimationFrame(applyDrag);
    checkSnapPreview(e.clientX,e.clientY);
  });
  window.addEventListener('mouseup', e=>{
    if(dragging){ dragging=false; el.classList.remove('dragging'); applySnapIfNeeded(win, e.clientX, e.clientY); }
    $('#snap-preview').style.display='none';
  });
  bar.addEventListener('touchstart', e=>{
    if(e.target.closest('.win-controls')) return;
    if(win.maximized) return;
    const t=e.touches[0]; dragging=true; sx=t.clientX; sy=t.clientY; ox=el.offsetLeft; oy=el.offsetTop; focusWindow(id);
  },{passive:true});
  bar.addEventListener('touchmove', e=>{
    if(!dragging) return;
    const t=e.touches[0];
    pendingLeft=ox+t.clientX-sx; pendingTop=Math.max(0,oy+t.clientY-sy);
    if(!dragRaf) dragRaf = requestAnimationFrame(applyDrag);
  },{passive:true});
  bar.addEventListener('touchend', ()=> dragging=false);

  /* ---------- Resizing (rAF throttled) ---------- */
  ['e','w','n','s','se'].forEach(dir=>{
    const rz = $('.rz-'+dir, el);
    let resizing=false, rsx=0, rsy=0, rw=0, rh=0, rl=0, rt=0, rRaf=null, pend={};
    function applyResize(){
      if(pend.width!=null) el.style.width=pend.width+'px';
      if(pend.height!=null) el.style.height=pend.height+'px';
      if(pend.left!=null) el.style.left=pend.left+'px';
      if(pend.top!=null) el.style.top=pend.top+'px';
      rRaf=null;
    }
    rz.addEventListener('mousedown', e=>{
      e.stopPropagation(); resizing=true; rsx=e.clientX; rsy=e.clientY;
      rw=el.offsetWidth; rh=el.offsetHeight; rl=el.offsetLeft; rt=el.offsetTop; focusWindow(id);
      el.classList.add('resizing');
    });
    window.addEventListener('mousemove', e=>{
      if(!resizing) return;
      const dx=e.clientX-rsx, dy=e.clientY-rsy;
      pend={};
      if(dir.includes('e')) pend.width=Math.max(300,rw+dx);
      if(dir.includes('s')) pend.height=Math.max(220,rh+dy);
      if(dir.includes('w')){ pend.width=Math.max(300,rw-dx); pend.left=rl+dx; }
      if(dir.includes('n')){ pend.height=Math.max(220,rh-dy); pend.top=rt+dy; }
      if(!rRaf) rRaf = requestAnimationFrame(applyResize);
    });
    window.addEventListener('mouseup', ()=>{ if(resizing){ resizing=false; el.classList.remove('resizing'); } });
  });

  $('.win-min', el).addEventListener('click', ()=> minimizeWindow(id));
  $('.win-max', el).addEventListener('click', ()=> toggleMaximize(id));
  $('.win-close', el).addEventListener('click', ()=> closeWindow(id));
  bar.addEventListener('dblclick', ()=> toggleMaximize(id));
  el.addEventListener('mousedown', ()=> focusWindow(id));

  if(onMount) onMount(el, win);
  return win;
}

function focusWindow(id){
  State.focusedId = id;
  State.openWindows.forEach(w=>{
    w.el.classList.toggle('focused', w.id===id);
    if(w.id===id) w.el.style.zIndex = nextZ();
  });
  renderTaskbarRunning();
}
function minimizeWindow(id){
  const win = State.openWindows.find(w=>w.id===id);
  if(!win) return;
  win.el.classList.add('minimized'); win.minimized=true;
  renderTaskbarRunning();
}
function restoreWindow(id){
  const win = State.openWindows.find(w=>w.id===id);
  if(!win) return;
  win.el.classList.remove('minimized'); win.minimized=false;
  focusWindow(id);
}
function toggleMaximize(id){
  const win = State.openWindows.find(w=>w.id===id);
  if(!win) return;
  const el = win.el;
  if(!win.maximized){
    win.prevRect = {left:el.style.left, top:el.style.top, width:el.style.width, height:el.style.height};
    el.style.left='0'; el.style.top='0'; el.style.width='100vw'; el.style.height='calc(100vh - var(--taskbar-h))';
    el.classList.add('maximized'); win.maximized=true;
  } else {
    Object.assign(el.style, win.prevRect);
    el.classList.remove('maximized'); win.maximized=false;
  }
  focusWindow(id);
}
function closeWindow(id){
  const win = State.openWindows.find(w=>w.id===id);
  if(!win) return;
  if(typeof win.onClose === 'function'){ try{ win.onClose(); }catch(e){} }
  win.el.classList.add('closing');
  setTimeout(()=>{
    win.el.remove();
    State.openWindows = State.openWindows.filter(w=>w.id!==id);
    renderTaskbarRunning();
  },150);
}

/* Snap preview logic (edge snapping) */
function checkSnapPreview(x,y){
  const preview = $('#snap-preview');
  const vw = window.innerWidth, vh = window.innerHeight - 60;
  const edge = 26;
  let rect=null;
  if(x<edge) rect={left:0,top:0,width:vw/2,height:vh};
  else if(x>vw-edge) rect={left:vw/2,top:0,width:vw/2,height:vh};
  else if(y<edge) rect={left:0,top:0,width:vw,height:vh};
  if(rect){
    preview.style.display='block';
    preview.style.left=rect.left+'px'; preview.style.top=rect.top+'px';
    preview.style.width=rect.width+'px'; preview.style.height=rect.height+'px';
  } else preview.style.display='none';
}
function applySnapIfNeeded(win,x,y){
  const vw = window.innerWidth, vh = window.innerHeight - 60;
  const edge=26; const el=win.el;
  if(x<edge){ el.style.left='0'; el.style.top='0'; el.style.width=(vw/2)+'px'; el.style.height=vh+'px'; }
  else if(x>vw-edge){ el.style.left=(vw/2)+'px'; el.style.top='0'; el.style.width=(vw/2)+'px'; el.style.height=vh+'px'; }
  else if(y<edge){ toggleMaximize(win.id); }
}

/* Taskbar running apps */
function renderTaskbarRunning(){
  const wrap = $('#tb-running');
  wrap.innerHTML = State.openWindows.map(w=>`
    <button class="tb-app-btn ${w.id===State.focusedId && !w.minimized ?'focused':''}" data-id="${w.id}" title="${escapeHtml(w.title)}">${w.icon}</button>
  `).join('');
  $all('.tb-app-btn', wrap).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.id;
      const win = State.openWindows.find(w=>w.id===id);
      if(win.minimized) restoreWindow(id);
      else if(id===State.focusedId) minimizeWindow(id);
      else focusWindow(id);
    });
  });
}

/* Task view (virtual desktops + running windows overview) */
$('#btn-taskview').addEventListener('click', e=>{
  e.stopPropagation();
  const tv = $('#task-view');
  const showing = tv.classList.contains('show');
  if(typeof closeAllPanels==='function') closeAllPanels(null);
  tv.classList.toggle('show', !showing);
  if(!showing) renderTaskView();
});
function renderTaskView(){
  $('#tv-desktops').innerHTML = State.desktops.map((d,i)=>`
    <div class="tv-desk ${i===State.activeDesktop?'active':''}" data-i="${i}">${escapeHtml(d.name)}</div>
  `).join('') + `<div class="tv-desk" id="tv-add" style="cursor:pointer">+ New desktop</div>`;
  $all('.tv-desk[data-i]').forEach(el=> el.addEventListener('click', ()=>{ State.activeDesktop=+el.dataset.i; renderTaskView(); }));
  const addBtn = $('#tv-add'); if(addBtn) addBtn.addEventListener('click', ()=>{ State.desktops.push({name:'Desktop '+(State.desktops.length+1)}); renderTaskView(); });

  $('#tv-windows').innerHTML = State.openWindows.length ? State.openWindows.map(w=>`
    <div class="tv-win glass" data-id="${w.id}"><button class="tv-x" data-id="${w.id}">✕</button><div class="tv-bar">${w.icon} ${escapeHtml(w.title)}</div><div class="tv-body">${w.icon}</div></div>
  `).join('') : '<div style="color:#aab;font-size:13px">No open windows</div>';
  $all('.tv-win').forEach(el=> el.addEventListener('click', e=>{
    if(e.target.closest('.tv-x')) return;
    const id = el.dataset.id; restoreWindow(id); $('#task-view').classList.remove('show');
  }));
  $all('.tv-x').forEach(el=> el.addEventListener('click', e=>{ e.stopPropagation(); closeWindow(el.dataset.id); renderTaskView(); }));
}

/* Keyboard shortcuts */
document.addEventListener('keydown', e=>{
  if(e.altKey && e.key==='F4' && State.focusedId){ closeWindow(State.focusedId); e.preventDefault(); }
  if(e.ctrlKey && e.key==='Escape'){ if(typeof togglePanel==='function') togglePanel('start-menu'); e.preventDefault(); }
  if(e.ctrlKey && e.key==='l'){ lockNow(); e.preventDefault(); }
  if(e.key==='Escape'){ if(typeof closeAllPanels==='function') closeAllPanels(null); }
});

window.addEventListener('resize', ()=>{
  State.openWindows.forEach(w=>{
    const el = w.el;
    if(parseInt(el.style.left)+100 > window.innerWidth) el.style.left = Math.max(0,window.innerWidth-el.offsetWidth-10)+'px';
    if(parseInt(el.style.top)+50 > window.innerHeight) el.style.top = Math.max(0,window.innerHeight-el.offsetHeight-70)+'px';
  });
});

/* ---------------------------------------------------------------------
   App launcher — router
--------------------------------------------------------------------- */
function openApp(appId){
  if(appId==='recycle'){ showToast('Recycle Bin', 'The bin is empty.', '🗑️'); return; }
  const existing = State.openWindows.find(w=>w.appId===appId);
  if(existing && ['settings','calculator','terminal','aihub','store','paint','media','games','weather','maps'].includes(appId)){
    if(existing.minimized) restoreWindow(existing.id); else focusWindow(existing.id);
    return;
  }
  const app = APPS.find(a=>a.id===appId);
  const builder = AppBuilders[appId];
  if(!builder){ showToast('Not available', 'This app is not implemented.', '⚠️'); return; }
  builder(app);
}
