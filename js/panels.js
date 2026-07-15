/* =========================================================================
   panels.js — floating panels: start menu, notification center,
   quick settings, search, AI side panel. Plus their taskbar triggers.
   ========================================================================= */

const PANEL_IDS = ['start-menu','notif-center','quick-settings','search-panel','ai-side-panel'];
function closeAllPanels(except){
  PANEL_IDS.forEach(id=>{ if(id!==except) $('#'+id).classList.remove('open'); });
  $('#task-view').classList.remove('show');
}
function togglePanel(id){
  const el = $('#'+id);
  const wasOpen = el.classList.contains('open');
  closeAllPanels(id);
  el.classList.toggle('open', !wasOpen);
}
document.addEventListener('click', e=>{
  const clickedPanel = e.target.closest('.panel');
  const clickedTrigger = e.target.closest('#btn-start,#btn-search,#btn-notif,#btn-quicksettings,#btn-ai,#btn-clock,#btn-widgets');
  if(!clickedPanel && !clickedTrigger) closeAllPanels(null);
});

$('#btn-start').addEventListener('click', e=>{ e.stopPropagation(); togglePanel('start-menu'); $('#sm-search-input').value=''; });
$('#btn-search').addEventListener('click', e=>{ e.stopPropagation(); togglePanel('search-panel'); setTimeout(()=>$('#search-input').focus(),50); renderSearchResults(''); });
$('#btn-notif').addEventListener('click', e=>{ e.stopPropagation(); togglePanel('notif-center'); });
$('#btn-clock').addEventListener('click', e=>{ e.stopPropagation(); togglePanel('notif-center'); });
$('#btn-quicksettings').addEventListener('click', e=>{ e.stopPropagation(); togglePanel('quick-settings'); });
$('#btn-ai').addEventListener('click', e=>{ e.stopPropagation(); togglePanel('ai-side-panel'); });
$('#btn-widgets').addEventListener('click', e=>{ e.stopPropagation(); showToast('Widgets','Desktop widgets are shown on your desktop.','🧩'); });

/* ---------------------------------------------------------------------
   Start menu
--------------------------------------------------------------------- */
function renderPinned(){
  $('#sm-pinned').innerHTML = APPS.filter(a=>a.id!=='recycle').map(a=>`
    <button class="sm-app" data-app="${a.id}"><div class="glyph">${a.icon}</div>${escapeHtml(a.name.split(' ')[0])}</button>
  `).join('');
  $all('.sm-app').forEach(b=> b.addEventListener('click', ()=>{ openApp(b.dataset.app); closeAllPanels(null); }));
}
function renderRecommended(){
  const recs = [
    {t:'Design Review.txt', s:'Notepad · Edited 2m ago', app:'notepad', ic:'📝'},
    {t:'Live weather', s:'Weather · Real data', app:'weather', ic:'⛅'},
    {t:'Snake / 2048 / more', s:'Game Hub · New', app:'games', ic:'🎮'},
    {t:'Copilot suggestion', s:'AI Hub · Just now', app:'aihub', ic:'✨'}
  ];
  $('#sm-rec').innerHTML = recs.map(r=>`
    <button class="sm-rec-item" data-app="${r.app}"><div class="glyph">${r.ic}</div><div class="meta"><b>${escapeHtml(r.t)}</b><small>${escapeHtml(r.s)}</small></div></button>
  `).join('');
  $all('.sm-rec-item').forEach(b=> b.addEventListener('click', ()=>{ openApp(b.dataset.app); closeAllPanels(null); }));
}
$('#sm-username').textContent = State.user.name;
$('#sm-av').textContent = State.user.name.charAt(0).toUpperCase();
$('#sm-search-input').addEventListener('input', e=>{
  const q = e.target.value.toLowerCase();
  if(!q){ $('#sm-body').innerHTML = `<div class="sm-section-title">Pinned <span>All apps ›</span></div><div class="sm-pinned" id="sm-pinned"></div><div class="sm-section-title">Recommended</div><div class="sm-rec" id="sm-rec"></div>`; renderPinned(); renderRecommended(); return; }
  const matches = APPS.filter(a=>a.name.toLowerCase().includes(q));
  $('#sm-body').innerHTML = `<div class="sm-section-title">Results for "${escapeHtml(e.target.value)}"</div><div class="sm-rec">${
    matches.length ? matches.map(a=>`<button class="sm-rec-item" data-app="${a.id}"><div class="glyph">${a.icon}</div><div class="meta"><b>${escapeHtml(a.name)}</b><small>App</small></div></button>`).join('')
    : '<div class="sr-empty">No results found</div>'
  }</div>`;
  $all('.sm-rec-item').forEach(b=> b.addEventListener('click', ()=>{ openApp(b.dataset.app); closeAllPanels(null); }));
});
$('#pw-settings').addEventListener('click', ()=>{ openApp('settings'); closeAllPanels(null); });
$('#pw-lock').addEventListener('click', lockNow);
$('#pw-power').addEventListener('click', ()=>{
  openContextMenu(window.innerWidth/2-100, window.innerHeight-260,[
    {label:'Sleep', icon:'🌙', action:()=>showToast('Sleep','Simulated sleep mode','🌙')},
    {label:'Restart', icon:'🔁', action:restartSystem},
    {label:'Shut down', icon:'⏻', action:()=>showToast('Shut down','This is a simulation — nothing was shut down','⏻')}
  ]);
});

/* ---------------------------------------------------------------------
   Notification center
--------------------------------------------------------------------- */
function renderNotifications(){
  const list = $('#nc-list');
  if(!State.notifications.length){ list.innerHTML = '<div class="nc-empty">✨ You are all caught up</div>'; return; }
  list.innerHTML = State.notifications.map(n=>`
    <div class="nc-item" data-id="${n.id}"><div class="ico">${n.icon}</div><div class="body"><b>${escapeHtml(n.title)}</b><p>${escapeHtml(n.body)}</p></div><button class="close" data-id="${n.id}">✕</button></div>
  `).join('');
  $all('.close',list).forEach(b=> b.addEventListener('click', e=>{
    e.stopPropagation();
    State.notifications = State.notifications.filter(n=>n.id!==b.dataset.id);
    Store.set('notifications', State.notifications);
    renderNotifications();
  }));
}
$('#nc-clear').addEventListener('click', ()=>{ State.notifications=[]; Store.set('notifications',[]); renderNotifications(); });

/* ---------------------------------------------------------------------
   Quick settings
--------------------------------------------------------------------- */
function renderQuickSettings(){
  const tiles = [
    {key:'wifi', label:'Wi-Fi', sub: State.wifi?'Home-Network-5G':'Disconnected', icon:'📶'},
    {key:'bluetooth', label:'Bluetooth', sub: State.bluetooth?'2 devices':'Off', icon:'🔷'},
    {key:'airplane', label:'Airplane mode', sub: State.airplane?'On':'Off', icon:'✈️'},
    {key:'theme', label:'Night light', sub: State.theme==='dark'?'On':'Off', icon:'🌙'},
    {key:'focus', label:'Focus', sub:'Off', icon:'🌱'},
    {key:'hotspot', label:'Hotspot', sub:'Off', icon:'📡'}
  ];
  $('#qs-tiles').innerHTML = tiles.map(t=>`
    <button class="qs-tile ${(t.key==='theme'? State.theme==='dark' : State[t.key])?'on':''}" data-key="${t.key}">
      <div class="ico">${t.icon}</div><div class="meta"><b>${t.label}</b><small>${t.sub}</small></div>
    </button>
  `).join('');
  $all('.qs-tile').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const key = btn.dataset.key;
      if(key==='theme'){ State.theme = State.theme==='dark'?'light':'dark'; applyTheme(); }
      else if(key in State){ State[key] = !State[key]; Store.set(key, State[key]); }
      else showToast('Quick settings', btn.querySelector('b').textContent+' toggled', '⚙️');
      renderQuickSettings();
    });
  });
  $('#qs-battery-txt').textContent = '🔋 '+State.battery+'%';
}
$('#qs-brightness').value = State.brightness;
$('#qs-volume').value = State.volume;
$('#qs-b-val').textContent = State.brightness+'%';
$('#qs-v-val').textContent = State.volume+'%';
$('#qs-brightness').addEventListener('input', e=>{
  State.brightness = +e.target.value; Store.set('brightness',State.brightness);
  $('#qs-b-val').textContent = State.brightness+'%';
  document.body.style.filter = `brightness(${State.brightness/100})`;
});
$('#qs-volume').addEventListener('input', e=>{
  State.volume = +e.target.value; Store.set('volume',State.volume);
  $('#qs-v-val').textContent = State.volume+'%';
});

/* ---------------------------------------------------------------------
   Search panel (instant search)
--------------------------------------------------------------------- */
function buildSearchIndex(){
  return [
    ...APPS.map(a=>({type:'App', name:a.name, icon:a.icon, action:()=>openApp(a.id)})),
    {type:'Setting', name:'Change wallpaper', icon:'🖼️', action:()=>openApp('settings')},
    {type:'Setting', name:'Dark mode', icon:'🌙', action:()=>{ State.theme='dark'; applyTheme(); }},
    {type:'Setting', name:'Light mode', icon:'☀️', action:()=>{ State.theme='light'; applyTheme(); }},
    {type:'Web', name:'Search the web', icon:'🌐', action:()=>openApp('browser')}
  ];
}
function renderSearchResults(q){
  const res = $('#search-results');
  if(!q){
    res.innerHTML = '<div class="sr-group-title">Quick launch</div>' + APPS.slice(0,6).map(a=>`<button class="sr-item" data-app="${a.id}"><div class="glyph">${a.icon}</div>${escapeHtml(a.name)}</button>`).join('');
    $all('.sr-item',res).forEach(el=> el.addEventListener('click', ()=>{ openApp(el.dataset.app); closeAllPanels(null); }));
    return;
  }
  const matches = buildSearchIndex().filter(i=> i.name.toLowerCase().includes(q.toLowerCase()));
  res.innerHTML = matches.length ? ('<div class="sr-group-title">Best match</div>' + matches.map((m,i)=>`<button class="sr-item" data-idx="${i}"><div class="glyph">${m.icon}</div><div><div>${escapeHtml(m.name)}</div><small style="color:var(--text-dim)">${m.type}</small></div></button>`).join(''))
    : `<div class="sr-empty">No results for "${escapeHtml(q)}"</div>`;
  $all('.sr-item',res).forEach((el,i)=> el.addEventListener('click', ()=>{ matches[i].action(); closeAllPanels(null); }));
}
$('#search-input').addEventListener('input', e=> renderSearchResults(e.target.value));

/* ---------------------------------------------------------------------
   AI assistant (shared brain — also used by the AI Hub app window)
--------------------------------------------------------------------- */
function aiRespond(prompt){
  const p = prompt.toLowerCase();
  if(p.includes('time')) return `It's currently ${fmtTime12(new Date())}.`;
  if(p.includes('date')) return `Today is ${fmtDateLong(new Date())}.`;
  if(p.includes('wallpaper')) return 'You can change your wallpaper from Settings → Personalization → Background.';
  if(p.includes('weather')) return 'Open the Weather app for live conditions at your location — it uses a real, free weather API.';
  if(p.includes('game')) return 'Try the Game Hub — Snake, 2048, Tic-Tac-Toe and Memory Match are all fully playable.';
  if(p.includes('hello')||p.includes('hi')) return `Hey ${State.user.name.split(' ')[0]}! What can I help you with today?`;
  if(p.includes('joke')) return 'Why did the developer go broke? Because they used up all their cache.';
  if(p.includes('open')){
    const found = APPS.find(a=> p.includes(a.name.toLowerCase()) || p.includes(a.id));
    if(found){ openApp(found.id); return `Opening ${found.name} for you now.`; }
  }
  if(p.includes('who are you')) return "I'm Copilot, your on-device assistant for this simulated Windows 12 desktop.";
  const generic = [
    "That's a great question — here's a general thought: break it into smaller steps and it gets easier fast.",
    "I've noted that down. Anything else you'd like me to help you with?",
    "Here's an idea: try checking Settings or File Explorer, they usually have what you need.",
    "I can help with system tasks, quick facts, or just chatting — what's on your mind?"
  ];
  return generic[Math.floor(Math.random()*generic.length)];
}
function seedAIChat(){
  const body = $('#ai-side-body');
  body.innerHTML = `<div class="ai-msg bot">Hi ${escapeHtml(State.user.name.split(' ')[0])}, I'm Copilot. Ask me about your system, the time, weather, or say "open notepad".</div>`;
}
function sendAISide(){
  const input = $('#ai-side-input');
  const text = input.value.trim();
  if(!text) return;
  const body = $('#ai-side-body');
  body.insertAdjacentHTML('beforeend', `<div class="ai-msg user">${escapeHtml(text)}</div>`);
  input.value='';
  body.scrollTop = body.scrollHeight;
  setTimeout(()=>{
    body.insertAdjacentHTML('beforeend', `<div class="ai-msg bot">${escapeHtml(aiRespond(text))}</div>`);
    body.scrollTop = body.scrollHeight;
  },380);
}
$('#ai-side-send').addEventListener('click', sendAISide);
$('#ai-side-input').addEventListener('keydown', e=>{ if(e.key==='Enter') sendAISide(); });
