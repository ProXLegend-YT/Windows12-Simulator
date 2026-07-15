/* =========================================================================
   system.js — boot sequence, lock screen, login screen, theme + wallpaper
   ========================================================================= */

/* ---------------------------------------------------------------------
   Boot sequence
--------------------------------------------------------------------- */
const bootMsgs = ['Starting Windows 12…','Loading system core…','Preparing your device…','Almost there…'];
let bootIdx=0;
const bootInterval = setInterval(()=>{
  bootIdx=(bootIdx+1)%bootMsgs.length;
  $('#boot-text').textContent = bootMsgs[bootIdx];
},850);

setTimeout(()=>{
  clearInterval(bootInterval);
  const boot = $('#boot-screen');
  boot.style.opacity='0';
  setTimeout(()=>{ boot.classList.add('hidden'); startLockScreen(); }, 500);
}, 2600);

/* ---------------------------------------------------------------------
   Lock screen
--------------------------------------------------------------------- */
function startLockScreen(){
  renderLockNotifs();
  updateLockClock();
  Ticker.add(updateLockClock);
  const unlock = ()=>{ document.removeEventListener('keydown',unlock); $('#lock-screen').classList.add('slide-up'); setTimeout(showLogin,450); };
  $('#lock-screen').addEventListener('click', unlock, {once:true});
  document.addEventListener('keydown', unlock, {once:true});
}
function updateLockClock(d){
  const ls = $('#lock-screen');
  if(!ls || ls.classList.contains('hidden')) return;
  d = d || new Date();
  $('#lock-time').textContent = fmtTime(d);
  $('#lock-date').textContent = fmtDateLong(d);
}
function renderLockNotifs(){
  $('#lock-notifs').innerHTML = State.notifications.slice(0,3).map(n=>`
    <div class="lock-notif glass"><div class="ico">${n.icon}</div><div><b style="display:block;font-size:12.5px">${escapeHtml(n.title)}</b><span style="font-size:11.5px;opacity:.85">${escapeHtml(n.body)}</span></div></div>
  `).join('');
}

/* ---------------------------------------------------------------------
   Login screen
--------------------------------------------------------------------- */
function showLogin(){
  $('#lock-screen').classList.add('hidden');
  $('#login-screen').classList.remove('hidden');
  $('#login-name').textContent = State.user.name;
  $('#login-avatar').textContent = State.user.name.charAt(0).toUpperCase();
  $('#login-pass').focus();
  const doLogin = ()=>{
    $('#login-screen').style.transition='opacity .4s, transform .4s';
    $('#login-screen').style.opacity='0';
    $('#login-screen').style.transform='scale(1.04)';
    setTimeout(bootToDesktop,400);
  };
  $('#login-go').onclick = doLogin;
  $('#login-pass').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
}

function bootToDesktop(){
  $('#login-screen').classList.add('hidden');
  $('#desktop').classList.remove('hidden');
  $('#taskbar').classList.remove('hidden');
  initDesktop();
  addNotification('Welcome back', `Signed in as ${State.user.name}`, '👋');
}

/* ---------------------------------------------------------------------
   Theme manager
--------------------------------------------------------------------- */
function applyTheme(){
  let mode = State.theme;
  if(mode==='auto'){
    const h = new Date().getHours();
    mode = (h>=7 && h<19) ? 'light' : 'dark';
  }
  document.documentElement.classList.toggle('light', mode==='light');
  Store.set('theme', State.theme);
}
applyTheme();
setInterval(applyTheme, 60000);

/* ---------------------------------------------------------------------
   Wallpaper
--------------------------------------------------------------------- */
const WALLPAPERS = ['wallpaper-flux','wallpaper-aurora','wallpaper-sunset','wallpaper-forest','wallpaper-mono','wallpaper-bloom'];
function applyWallpaper(){
  const wp = $('#wallpaper');
  WALLPAPERS.forEach(w=>wp.classList.remove(w));
  wp.classList.add(State.wallpaper);
  Store.set('wallpaper', State.wallpaper);
}
applyWallpaper();

function lockNow(){
  if(typeof closeAllPanels==='function') closeAllPanels(null);
  $('#desktop').classList.add('hidden');
  $('#taskbar').classList.add('hidden');
  const ls = $('#lock-screen');
  ls.classList.remove('hidden','slide-up');
  ls.style.transform='';
  startLockScreen();
}
function restartSystem(){ location.reload(); }
