/* =========================================================================
   apps.js — built-in applications (everything except the real browser and
   the games, which live in their own files). Each app registers itself
   onto AppBuilders[id], declared in state.js.
   ========================================================================= */

/* ---------------------------------------------------------------------
   FILE EXPLORER
--------------------------------------------------------------------- */
const FS = {
  'This PC': {type:'folder', children:['Documents','Pictures','Downloads','Music']},
  'Documents': {type:'folder', parent:'This PC', children:['Resume.docx','Budget.xlsx','Notes.txt']},
  'Pictures': {type:'folder', parent:'This PC', children:['Sunset.jpg','Mountains.jpg','Portrait.png']},
  'Downloads': {type:'folder', parent:'This PC', children:['setup.exe','archive.zip']},
  'Music': {type:'folder', parent:'This PC', children:['Song A.mp3','Song B.mp3']},
  'Resume.docx': {type:'file', ext:'docx', size:'48 KB'},
  'Budget.xlsx': {type:'file', ext:'xlsx', size:'22 KB'},
  'Notes.txt': {type:'file', ext:'txt', size:'2 KB', preview:'Meeting notes:\n- Ship v2\n- Fix bugs\n- Celebrate'},
  'Sunset.jpg': {type:'file', ext:'jpg', size:'3.1 MB', color:'linear-gradient(135deg,#ff6a88,#ffd97d)'},
  'Mountains.jpg': {type:'file', ext:'jpg', size:'4.4 MB', color:'linear-gradient(135deg,#203a43,#2c5364)'},
  'Portrait.png': {type:'file', ext:'png', size:'1.8 MB', color:'linear-gradient(135deg,#8a5cff,#4f8cff)'},
  'setup.exe': {type:'file', ext:'exe', size:'128 MB'},
  'archive.zip': {type:'file', ext:'zip', size:'56 MB'},
  'Song A.mp3': {type:'file', ext:'mp3', size:'4 MB'},
  'Song B.mp3': {type:'file', ext:'mp3', size:'5 MB'}
};
const fileIcon = ext => ({docx:'📄',xlsx:'📊',txt:'📃',jpg:'🖼️',png:'🖼️',exe:'⚙️',zip:'🗜️',mp3:'🎵'}[ext]||'📄');

AppBuilders.explorer = function(){
  const win = createWindow({appId:'explorer', title:'File Explorer', icon:'📁', width:680, height:460, content:`
    <div style="display:flex;flex-direction:column;height:100%">
      <div class="app-toolbar">
        <button id="fx-back">←</button><button id="fx-up">↑</button>
        <input type="text" id="fx-search" placeholder="Search this folder">
      </div>
      <div class="breadcrumb" id="fx-crumb"></div>
      <div class="app-flex" style="flex:1;overflow:hidden">
        <div class="app-sidebar">
          <div class="sec">Quick access</div>
          <button data-nav="This PC">💻 This PC</button>
          <button data-nav="Documents">📁 Documents</button>
          <button data-nav="Pictures">🖼️ Pictures</button>
          <button data-nav="Downloads">⬇️ Downloads</button>
          <button data-nav="Music">🎵 Music</button>
        </div>
        <div style="flex:1;overflow:auto;display:flex;">
          <div class="file-grid" id="fx-grid" style="flex:1"></div>
          <div id="fx-preview" style="width:200px;border-left:1px solid var(--glass-border);padding:14px;display:none;flex:none;"></div>
        </div>
      </div>
    </div>
  `});
  const body = $('.win-body', win.el);
  let history = ['This PC'];
  let histIdx = 0;
  function nav(name, pushHistory=true){
    if(pushHistory){ history = history.slice(0,histIdx+1); history.push(name); histIdx=history.length-1; }
    renderCrumb(name); renderGrid(name);
  }
  function renderCrumb(name){
    const chain=[]; let cur=name;
    while(cur){ chain.unshift(cur); cur = FS[cur].parent; }
    $('#fx-crumb',body).innerHTML = chain.map(c=>`<button data-nav="${c}">${escapeHtml(c)}</button>`).join('<span>›</span>');
    $all('[data-nav]',$('#fx-crumb',body)).forEach(b=> b.addEventListener('click', ()=>nav(b.dataset.nav)));
  }
  function renderGrid(name, filter=''){
    const node = FS[name];
    const items = (node.children||[]).filter(c=> c.toLowerCase().includes(filter.toLowerCase()));
    $('#fx-grid',body).innerHTML = items.length ? items.map(c=>{
      const it = FS[c];
      const icon = it.type==='folder' ? '📁' : fileIcon(it.ext);
      return `<div class="file-item" data-name="${escapeHtml(c)}"><div class="fi">${icon}</div><span>${escapeHtml(c)}</span></div>`;
    }).join('') : '<div style="padding:20px;color:var(--text-dim);font-size:12.5px">This folder is empty</div>';
    $all('.file-item',body).forEach(el=>{
      el.addEventListener('click', ()=>{
        $all('.file-item',body).forEach(f=>f.classList.remove('sel'));
        el.classList.add('sel');
        showPreview(el.dataset.name);
      });
      el.addEventListener('dblclick', ()=>{
        const n = el.dataset.name;
        if(FS[n].type==='folder') nav(n);
        else showToast('Opening file', n+' opened (simulated)', fileIcon(FS[n].ext));
      });
    });
  }
  function showPreview(name){
    const it = FS[name]; const box = $('#fx-preview',body);
    box.style.display='block';
    if(it.type==='folder'){ box.innerHTML = `<div style="font-size:40px;text-align:center">📁</div><p style="font-size:12.5px;text-align:center">${escapeHtml(name)}</p><p style="font-size:11px;color:var(--text-dim);text-align:center">${(it.children||[]).length} items</p>`; return; }
    if(it.color){ box.innerHTML = `<div style="height:100px;border-radius:10px;background:${it.color}"></div><p style="font-size:12px;margin-top:8px">${escapeHtml(name)}</p><p style="font-size:11px;color:var(--text-dim)">${it.size}</p>`; return; }
    if(it.preview){ box.innerHTML = `<div style="font-size:11.5px;white-space:pre-wrap;background:var(--glass-strong);padding:10px;border-radius:8px">${escapeHtml(it.preview)}</div><p style="font-size:11px;color:var(--text-dim);margin-top:6px">${it.size}</p>`; return; }
    box.innerHTML = `<div style="font-size:40px;text-align:center">${fileIcon(it.ext)}</div><p style="font-size:12px;text-align:center">${escapeHtml(name)}</p><p style="font-size:11px;color:var(--text-dim);text-align:center">${it.size}</p>`;
  }
  $all('[data-nav]', body).forEach(b=> b.addEventListener('click', ()=> nav(b.dataset.nav)));
  $('#fx-up',body).addEventListener('click', ()=>{ const cur = history[histIdx]; const p = FS[cur].parent; if(p) nav(p); });
  $('#fx-back',body).addEventListener('click', ()=>{ if(histIdx>0){ histIdx--; renderCrumb(history[histIdx]); renderGrid(history[histIdx]); } });
  $('#fx-search',body).addEventListener('input', e=> renderGrid(history[histIdx], e.target.value));
  nav('This PC');
};

/* ---------------------------------------------------------------------
   SETTINGS
--------------------------------------------------------------------- */
AppBuilders.settings = function(){
  const win = createWindow({appId:'settings', title:'Settings', icon:'⚙️', width:640, height:480, content:`
    <div class="app-flex" style="height:100%">
      <div class="app-sidebar">
        <div class="sec">System</div>
        <button data-sec="appearance" class="active">🎨 Personalization</button>
        <button data-sec="system">💻 System info</button>
        <button data-sec="account">👤 Accounts</button>
        <button data-sec="lang">🌐 Language</button>
        <button data-sec="perf">⚡ Performance</button>
      </div>
      <div class="app-main" id="st-main"></div>
    </div>
  `});
  const body = $('.win-body', win.el);
  function renderSection(sec){
    const main = $('#st-main',body);
    if(sec==='appearance'){
      main.innerHTML = `
        <div class="settings-card">
          <div style="font-size:14px;font-weight:600;margin-bottom:10px">Theme</div>
          <div class="theme-toggle-row">
            <div class="theme-opt ${State.theme==='light'?'active':''}" data-th="light">☀️<br>Light</div>
            <div class="theme-opt ${State.theme==='dark'?'active':''}" data-th="dark">🌙<br>Dark</div>
            <div class="theme-opt ${State.theme==='auto'?'active':''}" data-th="auto">🔄<br>Auto</div>
          </div>
        </div>
        <div class="settings-card">
          <div style="font-size:14px;font-weight:600;margin-bottom:10px">Background</div>
          <div class="wallpaper-grid">
            ${WALLPAPERS.map(w=>`<div class="wp-thumb ${w} ${State.wallpaper===w?'active':''}" data-wp="${w}"></div>`).join('')}
          </div>
        </div>`;
      $all('.theme-opt',main).forEach(el=> el.addEventListener('click', ()=>{ State.theme = el.dataset.th; applyTheme(); renderSection('appearance'); }));
      $all('.wp-thumb',main).forEach(el=> el.addEventListener('click', ()=>{ State.wallpaper = el.dataset.wp; applyWallpaper(); renderSection('appearance'); }));
    } else if(sec==='system'){
      main.innerHTML = `
        <div class="settings-card">
          <div class="settings-row"><span>Device name</span><b>WEB-PC-01</b></div>
          <div class="settings-row"><span>Edition</span><b>Windows 12 Web Simulator</b></div>
          <div class="settings-row"><span>Processor</span><b>Virtual JS Runtime</b></div>
          <div class="settings-row"><span>Screen resolution</span><b>${window.innerWidth}×${window.innerHeight}</b></div>
          <div class="settings-row"><span>User agent</span><b style="font-size:10.5px;text-align:right;max-width:220px">${escapeHtml(navigator.userAgent.slice(0,60))}…</b></div>
          <div class="settings-row"><span>Build</span><b>12.0.26200.simulator</b></div>
        </div>`;
    } else if(sec==='account'){
      main.innerHTML = `
        <div class="settings-card" style="display:flex;align-items:center;gap:16px">
          <div class="login-avatar" style="width:64px;height:64px;font-size:26px">${escapeHtml(State.user.name.charAt(0))}</div>
          <div><div style="font-weight:600;font-size:15px">${escapeHtml(State.user.name)}</div><div style="font-size:12px;color:var(--text-dim)">Local account</div></div>
        </div>
        <div class="settings-card">
          <div style="font-size:13px;margin-bottom:8px">Display name</div>
          <input id="st-name" type="text" value="${escapeHtml(State.user.name)}" style="width:100%;padding:9px 12px;border-radius:10px;border:1px solid var(--glass-border);background:var(--glass-strong);color:var(--text)">
          <button id="st-save-name" style="margin-top:10px;padding:8px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff">Save</button>
        </div>`;
      $('#st-save-name',main).addEventListener('click', ()=>{
        const v = $('#st-name',main).value.trim(); if(!v) return;
        State.user.name = v; Store.set('user',State.user);
        $('#sm-username').textContent=v; $('#sm-av').textContent=v.charAt(0).toUpperCase();
        showToast('Profile updated','Your display name was changed','👤');
        renderSection('account');
      });
    } else if(sec==='lang'){
      main.innerHTML = `
        <div class="settings-card">
          <div style="font-size:13px;margin-bottom:10px">Display language</div>
          <select id="st-lang" style="width:100%;padding:9px;border-radius:10px;border:1px solid var(--glass-border);background:var(--glass-strong);color:var(--text)">
            <option>English (United States)</option><option>Español</option><option>Français</option><option>Deutsch</option><option>日本語</option>
          </select>
          <p style="font-size:11.5px;color:var(--text-dim);margin-top:10px">Multi-language framework demo — UI text stays in English in this simulation.</p>
        </div>`;
    } else if(sec==='perf'){
      main.innerHTML = `
        <div class="settings-card">
          <div class="settings-row"><span>Reduce blur / transparency</span><button class="toggle ${Store.get('lowFx',false)?'on':''}" id="st-lowfx"></button></div>
          <div class="settings-row"><span>Open windows</span><b>${State.openWindows.length}</b></div>
        </div>
        <p style="font-size:11.5px;color:var(--text-dim)">Turning on reduced effects lowers blur radius and disables some transitions — useful on older devices.</p>`;
      $('#st-lowfx',main).addEventListener('click', (e)=>{
        const on = !Store.get('lowFx',false); Store.set('lowFx',on);
        document.documentElement.style.setProperty('--blur', on?'0px':'14px');
        e.target.classList.toggle('on',on);
      });
    }
    $all('.app-sidebar button',body).forEach(b=> b.classList.toggle('active', b.dataset.sec===sec));
  }
  $all('.app-sidebar button',body).forEach(b=> b.addEventListener('click', ()=> renderSection(b.dataset.sec)));
  renderSection('appearance');
};

/* ---------------------------------------------------------------------
   NOTEPAD
--------------------------------------------------------------------- */
AppBuilders.notepad = function(){
  const win = createWindow({appId:'notepad', title:'Notepad', icon:'📝', width:560, height:440, content:`
    <div class="notepad-flex">
      <div class="notepad-list" id="np-list"></div>
      <div class="notepad-editor">
        <div class="app-toolbar">
          <button id="np-new">＋ New</button><button id="np-save">💾 Save</button><button id="np-del">🗑️ Delete</button>
          <span id="np-status" style="font-size:11px;color:var(--text-dim);margin-left:auto"></span>
        </div>
        <textarea id="np-text" placeholder="Start typing…"></textarea>
      </div>
    </div>
  `});
  const body = $('.win-body', win.el);
  let notes = Store.get('notepadFiles', {'Welcome.txt':'Welcome to Notepad!\n\nYour notes are saved automatically to this browser via localStorage.'});
  let current = Object.keys(notes)[0];
  function renderList(){
    $('#np-list',body).innerHTML = Object.keys(notes).map(n=>`<button class="${n===current?'active':''}" data-n="${escapeHtml(n)}">📄 ${escapeHtml(n)}</button>`).join('');
    $all('#np-list button',body).forEach(b=> b.addEventListener('click', ()=>{ current=b.dataset.n; load(); }));
  }
  function load(){ $('#np-text',body).value = notes[current]||''; renderList(); $('#np-status',body).textContent = current; }
  $('#np-text',body).addEventListener('input', e=>{ notes[current]=e.target.value; Store.set('notepadFiles',notes); $('#np-status',body).textContent = current+' · Editing'; });
  $('#np-new',body).addEventListener('click', ()=>{
    const name = 'Untitled-'+(Object.keys(notes).length+1)+'.txt';
    notes[name]=''; current=name; Store.set('notepadFiles',notes); load();
  });
  $('#np-save',body).addEventListener('click', ()=>{ Store.set('notepadFiles',notes); showToast('Saved', current+' saved','💾'); $('#np-status',body).textContent=current+' · Saved'; });
  $('#np-del',body).addEventListener('click', ()=>{
    if(Object.keys(notes).length<=1) return showToast('Cannot delete','At least one note must remain','⚠️');
    delete notes[current]; current=Object.keys(notes)[0]; Store.set('notepadFiles',notes); load();
  });
  load();
};

/* ---------------------------------------------------------------------
   CALCULATOR
--------------------------------------------------------------------- */
AppBuilders.calculator = function(){
  const win = createWindow({appId:'calculator', title:'Calculator', icon:'🧮', width:330, height:520, content:`
    <div class="calc-wrap">
      <div class="app-toolbar"><button id="calc-mode">Scientific</button></div>
      <div class="calc-display"><div class="calc-expr" id="calc-expr">&nbsp;</div><div class="calc-result" id="calc-result">0</div></div>
      <div class="calc-sci hidden" id="calc-sci-row">
        <button data-fn="sin">sin</button><button data-fn="cos">cos</button><button data-fn="tan">tan</button><button data-fn="sqrt">√</button><button data-fn="pow2">x²</button>
        <button data-fn="log">log</button><button data-fn="ln">ln</button><button data-fn="pi">π</button><button data-fn="fact">n!</button><button data-fn="inv">1/x</button>
      </div>
      <div class="calc-grid">
        <button class="fn" data-k="C">C</button><button class="fn" data-k="±">±</button><button class="fn" data-k="%">%</button><button class="op" data-k="/">÷</button>
        <button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button><button class="op" data-k="*">×</button>
        <button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button><button class="op" data-k="-">−</button>
        <button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button><button class="op" data-k="+">+</button>
        <button data-k="0" style="grid-column:span 2">0</button><button data-k=".">.</button><button class="eq" data-k="=">=</button>
      </div>
    </div>
  `});
  const body = $('.win-body', win.el);
  let expr = '';
  function updateDisplay(){
    $('#calc-expr',body).textContent = expr || '\u00A0';
    let val;
    try{ val = expr ? evalExpr(expr) : 0; }catch(e){ val='Error'; }
    $('#calc-result',body).textContent = val;
  }
  function evalExpr(e){
    const safe = e.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/π/g,'Math.PI');
    const test = safe.replace(/Math\.PI/g,'');
    if(!/^[0-9+\-*/().\s]*$/.test(test)) return 'Error';
    // eslint-disable-next-line no-eval
    return Math.round((eval(safe)+Number.EPSILON)*1e10)/1e10;
  }
  $('#calc-mode',body).addEventListener('click', (e)=>{
    $('#calc-sci-row',body).classList.toggle('hidden');
    e.target.textContent = $('#calc-sci-row',body).classList.contains('hidden') ? 'Scientific' : 'Standard';
  });
  $all('.calc-grid button',body).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const k = btn.dataset.k;
      if(k==='C'){ expr=''; }
      else if(k==='='){ try{ expr = String(evalExpr(expr)); }catch(e){ expr='Error'; } }
      else if(k==='±'){ expr = expr.startsWith('-')?expr.slice(1):'-'+expr; }
      else if(k==='%'){ try{ expr = String(evalExpr(expr)/100); }catch(e){} }
      else expr += k;
      updateDisplay();
    });
  });
  $all('[data-fn]',body).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const fn = btn.dataset.fn;
      let cur; try{ cur = evalExpr(expr||'0'); }catch(e){ cur=0; }
      let out;
      switch(fn){
        case 'sin': out=Math.sin(cur); break;
        case 'cos': out=Math.cos(cur); break;
        case 'tan': out=Math.tan(cur); break;
        case 'sqrt': out=Math.sqrt(cur); break;
        case 'pow2': out=cur*cur; break;
        case 'log': out=Math.log10(cur); break;
        case 'ln': out=Math.log(cur); break;
        case 'pi': out=Math.PI; break;
        case 'fact': out = (function f(n){return n<=1?1:n*f(n-1);})(Math.round(cur)); break;
        case 'inv': out = 1/cur; break;
      }
      expr = String(Math.round((out+Number.EPSILON)*1e8)/1e8);
      updateDisplay();
    });
  });
  win.el.addEventListener('keydown', e=>{
    if(/[0-9+\-*/.]/.test(e.key)){ expr+=e.key; updateDisplay(); }
    else if(e.key==='Enter'){ try{expr=String(evalExpr(expr));}catch(err){expr='Error';} updateDisplay(); }
    else if(e.key==='Backspace'){ expr=expr.slice(0,-1); updateDisplay(); }
    else if(e.key==='Escape'){ expr=''; updateDisplay(); }
  });
  win.el.tabIndex = -1; win.el.focus();
  updateDisplay();
};

/* ---------------------------------------------------------------------
   PAINT
--------------------------------------------------------------------- */
AppBuilders.paint = function(){
  const win = createWindow({appId:'paint', title:'Paint', icon:'🎨', width:640, height:480, content:`
    <div class="paint-wrap">
      <div class="paint-toolbar">
        <button class="paint-tool-btn active" data-tool="brush">🖌️ Brush</button>
        <button class="paint-tool-btn" data-tool="eraser">🧽 Eraser</button>
        <button class="paint-tool-btn" data-tool="line">📏 Line</button>
        <button class="paint-tool-btn" data-tool="rect">▭ Rect</button>
        <input type="range" id="pt-size" min="1" max="40" value="6">
        <input type="color" id="pt-color" value="#4f8cff">
        <div class="paint-swatches" id="pt-swatches"></div>
        <button class="paint-tool-btn" id="pt-clear">Clear</button>
        <button class="paint-tool-btn" id="pt-save">💾 Save PNG</button>
      </div>
      <div class="paint-canvas-wrap"><canvas id="pt-canvas" width="900" height="600" style="background:#fff;display:block"></canvas></div>
    </div>
  `});
  const body = $('.win-body', win.el);
  const canvas = $('#pt-canvas',body);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
  let tool='brush', color='#4f8cff', size=6, drawing=false, startX=0, startY=0, snapshot=null;
  const colors = ['#000000','#ffffff','#4f8cff','#8a5cff','#22d3c9','#ff5b6e','#ffc857','#3ddc97'];
  $('#pt-swatches',body).innerHTML = colors.map(c=>`<div class="paint-swatch" style="background:${c}" data-c="${c}"></div>`).join('');
  $all('.paint-swatch',body).forEach(s=> s.addEventListener('click', ()=>{ color=s.dataset.c; $('#pt-color',body).value=color; }));
  $('#pt-color',body).addEventListener('input', e=> color=e.target.value);
  $('#pt-size',body).addEventListener('input', e=> size=+e.target.value);
  $all('.paint-tool-btn[data-tool]',body).forEach(b=> b.addEventListener('click', ()=>{
    $all('.paint-tool-btn[data-tool]',body).forEach(x=>x.classList.remove('active')); b.classList.add('active'); tool=b.dataset.tool;
  }));
  $('#pt-clear',body).addEventListener('click', ()=>{ ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); });
  $('#pt-save',body).addEventListener('click', ()=>{
    const link = document.createElement('a'); link.download='painting.png'; link.href = canvas.toDataURL('image/png'); link.click();
    showToast('Saved', 'Image downloaded as painting.png', '💾');
  });
  function getPos(e){
    const r = canvas.getBoundingClientRect();
    const cx = (e.touches? e.touches[0].clientX : e.clientX) - r.left;
    const cy = (e.touches? e.touches[0].clientY : e.clientY) - r.top;
    return {x: cx*(canvas.width/r.width), y: cy*(canvas.height/r.height)};
  }
  function down(e){
    drawing=true; const p=getPos(e); startX=p.x; startY=p.y;
    if(tool==='line'||tool==='rect') snapshot = ctx.getImageData(0,0,canvas.width,canvas.height);
    ctx.beginPath(); ctx.moveTo(p.x,p.y);
  }
  function move(e){
    if(!drawing) return;
    const p = getPos(e);
    if(tool==='brush'||tool==='eraser'){
      ctx.lineWidth=size; ctx.lineCap='round'; ctx.strokeStyle= tool==='eraser'?'#ffffff':color;
      ctx.lineTo(p.x,p.y); ctx.stroke();
    } else if(tool==='line'){
      ctx.putImageData(snapshot,0,0);
      ctx.beginPath(); ctx.moveTo(startX,startY); ctx.lineTo(p.x,p.y); ctx.strokeStyle=color; ctx.lineWidth=size; ctx.stroke();
    } else if(tool==='rect'){
      ctx.putImageData(snapshot,0,0);
      ctx.strokeStyle=color; ctx.lineWidth=size; ctx.strokeRect(startX,startY,p.x-startX,p.y-startY);
    }
  }
  function up(){ drawing=false; }
  canvas.addEventListener('mousedown',down); canvas.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
  canvas.addEventListener('touchstart',down,{passive:true}); canvas.addEventListener('touchmove',move,{passive:true}); canvas.addEventListener('touchend',up);
};

/* ---------------------------------------------------------------------
   MEDIA PLAYER — plays real, freely-licensed demo tracks with a live
   Web Audio analyser driving the visualizer bars.
--------------------------------------------------------------------- */
AppBuilders.media = function(){
  const win = createWindow({appId:'media', title:'Media Player', icon:'🎬', width:420, height:520, content:`
    <div class="media-wrap">
      <div class="media-stage">
        <div class="media-viz" id="mp-viz"></div>
        <div class="media-info"><b id="mp-title">Select a track</b><small id="mp-artist">Real streamed audio</small></div>
      </div>
      <div class="media-controls">
        <audio id="mp-audio" crossorigin="anonymous" preload="none"></audio>
        <input type="range" class="media-seek" id="mp-seek" min="0" max="100" value="0">
        <div class="media-btns">
          <button id="mp-prev">⏮</button><button class="play" id="mp-play">▶</button><button id="mp-next">⏭</button>
          <button id="mp-mute">🔊</button>
        </div>
        <div class="media-playlist" id="mp-list"></div>
        <p style="font-size:10.5px;color:var(--text-dim);margin:0">Streaming real public-domain demo tracks — needs internet access.</p>
      </div>
    </div>
  `});
  const body = $('.win-body', win.el);
  $('#mp-viz',body).innerHTML = Array.from({length:24}).map(()=>`<span></span>`).join('');
  const playlist = [
    {t:'SoundHelix Song 1', a:'SoundHelix (demo stream)', src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'},
    {t:'SoundHelix Song 2', a:'SoundHelix (demo stream)', src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'},
    {t:'SoundHelix Song 3', a:'SoundHelix (demo stream)', src:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'}
  ];
  const audio = $('#mp-audio',body);
  let idx=0, ac=null, analyser=null, dataArr=null, vizRaf=null;
  function renderList(){
    $('#mp-list',body).innerHTML = playlist.map((p,i)=>`<button class="${i===idx?'playing':''}" data-i="${i}"><span>${escapeHtml(p.t)}</span><span style="color:var(--text-dim)">${escapeHtml(p.a)}</span></button>`).join('');
    $all('#mp-list button',body).forEach(b=> b.addEventListener('click', ()=>{ idx=+b.dataset.i; loadTrack(true); }));
  }
  function loadTrack(autoplay){
    $('#mp-title',body).textContent = playlist[idx].t;
    $('#mp-artist',body).textContent = playlist[idx].a;
    audio.src = playlist[idx].src;
    renderList();
    if(autoplay) audio.play().catch(()=> showToast('Playback blocked','Tap play again — your browser needs a direct interaction first','⚠️'));
  }
  function setupAnalyser(){
    if(ac) return;
    try{
      ac = new (window.AudioContext||window.webkitAudioContext)();
      const src = ac.createMediaElementSource(audio);
      analyser = ac.createAnalyser(); analyser.fftSize=64;
      src.connect(analyser); analyser.connect(ac.destination);
      dataArr = new Uint8Array(analyser.frequencyBinCount);
    }catch(e){ /* Web Audio unsupported/blocked — bars stay static, playback still works */ }
  }
  function drawViz(){
    vizRaf = requestAnimationFrame(drawViz);
    const bars = $all('#mp-viz span',body);
    if(analyser){
      analyser.getByteFrequencyData(dataArr);
      bars.forEach((b,i)=>{ const v = dataArr[i % dataArr.length]||0; b.style.height = Math.max(6, (v/255)*110)+'px'; });
    } else {
      bars.forEach(b=>{ b.style.height = (10+Math.random()*(audio.paused?0:70))+'px'; });
    }
  }
  audio.addEventListener('timeupdate', ()=>{ if(audio.duration) $('#mp-seek',body).value = (audio.currentTime/audio.duration)*100; });
  audio.addEventListener('ended', ()=>{ idx=(idx+1)%playlist.length; loadTrack(true); });
  $('#mp-seek',body).addEventListener('input', e=>{ if(audio.duration) audio.currentTime = (e.target.value/100)*audio.duration; });
  $('#mp-play',body).addEventListener('click', ()=>{
    setupAnalyser();
    if(!audio.src) loadTrack(false);
    if(audio.paused){ ac && ac.resume(); audio.play().then(()=> $('#mp-play',body).textContent='⏸').catch(()=> showToast('Playback blocked','Your browser needs a direct tap to start audio','⚠️')); }
    else { audio.pause(); $('#mp-play',body).textContent='▶'; }
  });
  $('#mp-next',body).addEventListener('click', ()=>{ idx=(idx+1)%playlist.length; loadTrack(!audio.paused); });
  $('#mp-prev',body).addEventListener('click', ()=>{ idx=(idx-1+playlist.length)%playlist.length; loadTrack(!audio.paused); });
  $('#mp-mute',body).addEventListener('click', (e)=>{ audio.muted=!audio.muted; e.target.textContent = audio.muted?'🔇':'🔊'; });
  audio.addEventListener('play', ()=> $('#mp-play',body).textContent='⏸');
  audio.addEventListener('pause', ()=> $('#mp-play',body).textContent='▶');
  renderList();
  drawViz();
  win.onClose = ()=>{ cancelAnimationFrame(vizRaf); audio.pause(); if(ac) ac.close(); };
};

/* ---------------------------------------------------------------------
   TERMINAL
--------------------------------------------------------------------- */
AppBuilders.terminal = function(){
  const win = createWindow({appId:'terminal', title:'Terminal', icon:'⌨️', width:560, height:400, content:`
    <div class="term-wrap" id="term-out">
      <div class="term-line">Windows 12 Web Terminal [Simulator v1.1]</div>
      <div class="term-line">Type 'help' to see available commands.</div>
      <div class="term-input-row"><span class="prompt">C:\\Users\\Guest&gt;</span><input id="term-input" autocomplete="off" spellcheck="false"></div>
    </div>
  `});
  const body = $('.win-body', win.el);
  const out = $('#term-out',body);
  const input = $('#term-input',body);
  const COMMANDS = {
    help: ()=> 'Available commands: help, about, date, time, echo [text], clear, whoami, ver, dir, color, apps, open [app]',
    about: ()=> 'Windows 12 Web Simulator — a multi-file HTML/CSS/JS desktop environment demo.',
    date: ()=> new Date().toLocaleDateString(),
    time: ()=> new Date().toLocaleTimeString(),
    whoami: ()=> 'guest\\'+State.user.name.toLowerCase().replace(' ','.'),
    ver: ()=> 'Windows 12 [Version 12.0.26200.simulator]',
    dir: ()=> Object.keys(FS).filter(k=>FS[k].parent==='This PC').join('   '),
    apps: ()=> APPS.map(a=>a.name).join(', '),
    color: ()=> { State.theme = State.theme==='dark'?'light':'dark'; applyTheme(); return 'Theme toggled.'; },
    open: (rest)=>{ const name = rest.join(' ').toLowerCase(); const found = APPS.find(a=>a.id===name||a.name.toLowerCase().includes(name)); if(found){ openApp(found.id); return 'Opening '+found.name+'…'; } return 'App not found: '+name; }
  };
  function printLine(html){ const l=document.createElement('div'); l.className='term-line'; l.innerHTML=html; out.insertBefore(l, out.lastElementChild); out.scrollTop = out.scrollHeight; }
  input.addEventListener('keydown', e=>{
    if(e.key!=='Enter') return;
    const raw = input.value; input.value='';
    printLine(`<span style="color:#4f8cff">C:\\Users\\Guest&gt;</span> ${escapeHtml(raw)}`);
    const [cmd,...rest] = raw.trim().split(' ');
    if(cmd==='clear'){ $all('.term-line',out).forEach((l,i)=>{ if(i>1) l.remove(); }); return; }
    if(cmd==='echo'){ printLine(escapeHtml(rest.join(' '))); return; }
    if(cmd===''){ return; }
    if(COMMANDS[cmd]) printLine(escapeHtml(String(COMMANDS[cmd](rest))));
    else printLine(`'${escapeHtml(cmd)}' is not recognized as an internal or external command.`);
  });
  win.el.addEventListener('click', ()=> input.focus());
  setTimeout(()=>input.focus(),80);
};

/* ---------------------------------------------------------------------
   STORE
--------------------------------------------------------------------- */
AppBuilders.store = function(){
  const win = createWindow({appId:'store', title:'Store', icon:'🛍️', width:640, height:480, content:`
    <div class="app-main">
      <div class="store-hero"><h2>Discover great apps</h2><p>Curated picks for productivity, creativity, and fun.</p></div>
      <input type="text" id="store-search" placeholder="Search apps" style="width:100%;padding:10px 14px;border-radius:12px;border:1px solid var(--glass-border);background:var(--glass);margin-bottom:14px">
      <div class="store-grid" id="store-grid"></div>
    </div>
  `});
  const body = $('.win-body', win.el);
  const catalog = [
    {name:'PixelForge Studio', icon:'🎨', desc:'Advanced photo editing suite'},
    {name:'CodeNest IDE', icon:'💻', desc:'Lightweight code editor'},
    {name:'TaskFlow', icon:'✅', desc:'Task & project manager'},
    {name:'SoundWave Pro', icon:'🎧', desc:'High-fidelity music player'},
    {name:'CloudSync', icon:'☁️', desc:'File backup & sync'},
    {name:'ChatterBox', icon:'💬', desc:'Team chat & video calls'},
    {name:'ChronoPlan', icon:'🗓️', desc:'Smart calendar assistant'},
    {name:'VaultKey', icon:'🔐', desc:'Password manager'}
  ];
  let installed = Store.get('installedApps', []);
  function renderGrid(filter=''){
    const items = catalog.filter(c=> c.name.toLowerCase().includes(filter.toLowerCase()));
    $('#store-grid',body).innerHTML = items.map(c=>{
      const isIn = installed.includes(c.name);
      const safeId = c.name.replace(/\s/g,'');
      return `<div class="store-card"><div class="top"><div class="ic">${c.icon}</div><div><b>${escapeHtml(c.name)}</b><br><small>${escapeHtml(c.desc)}</small></div></div>
        <div class="store-progress" id="pg-${safeId}"><span></span></div>
        <button data-app="${escapeHtml(c.name)}" class="${isIn?'installed':''}">${isIn?'Open':'Install'}</button></div>`;
    }).join('');
    $all('.store-card button',body).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const name = btn.dataset.app;
        if(installed.includes(name)){ showToast(name, 'Launching '+name+' (simulated)', '🚀'); return; }
        const pg = $('#pg-'+name.replace(/\s/g,''),body); pg.classList.add('show');
        const bar = $('span',pg); let p=0;
        btn.disabled=true; btn.textContent='Installing…';
        const t = setInterval(()=>{
          p+=Math.random()*22; if(p>=100){ p=100; clearInterval(t); installed.push(name); Store.set('installedApps',installed);
            btn.disabled=false; btn.textContent='Open'; btn.classList.add('installed');
            addNotification('Installed', name+' is ready to use', '📦');
          }
          bar.style.width=p+'%';
        },200);
      });
    });
  }
  $('#store-search',body).addEventListener('input', e=> renderGrid(e.target.value));
  renderGrid();
};

/* ---------------------------------------------------------------------
   AI HUB
--------------------------------------------------------------------- */
AppBuilders.aihub = function(){
  const win = createWindow({appId:'aihub', title:'AI Hub', icon:'✨', width:620, height:500, content:`
    <div class="aihub-wrap">
      <div class="aihub-hist" id="ai-hist"></div>
      <div class="aihub-chat">
        <div class="ai-body" id="aihub-body"></div>
        <div class="ai-input-row">
          <input id="aihub-input" placeholder="Message AI Hub…">
          <button id="aihub-send">➤</button>
        </div>
      </div>
    </div>
  `});
  const body = $('.win-body', win.el);
  let convos = Store.get('aiConversations', {'General': [{role:'bot', text:'Hi! I am your AI Hub assistant. Ask me anything about your simulated desktop.'}]});
  let current = Object.keys(convos)[0];
  function renderHist(){
    $('#ai-hist',body).innerHTML = Object.keys(convos).map(c=>`<button class="${c===current?'active':''}" data-c="${escapeHtml(c)}">💬 ${escapeHtml(c)}</button>`).join('') + `<button id="ai-new-chat">＋ New chat</button>`;
    $all('#ai-hist button[data-c]',body).forEach(b=> b.addEventListener('click', ()=>{ current=b.dataset.c; renderChat(); renderHist(); }));
    $('#ai-new-chat',body).addEventListener('click', ()=>{
      const name = 'Chat '+(Object.keys(convos).length+1);
      convos[name] = [{role:'bot', text:'New conversation started. How can I help?'}];
      current=name; Store.set('aiConversations',convos); renderHist(); renderChat();
    });
  }
  function renderChat(){
    $('#aihub-body',body).innerHTML = convos[current].map(m=>`<div class="ai-msg ${m.role}">${escapeHtml(m.text)}</div>`).join('');
    $('#aihub-body',body).scrollTop = 999999;
  }
  function send(){
    const input = $('#aihub-input',body); const text = input.value.trim(); if(!text) return;
    convos[current].push({role:'user', text}); input.value=''; renderChat();
    setTimeout(()=>{ convos[current].push({role:'bot', text:aiRespond(text)}); Store.set('aiConversations',convos); renderChat(); },380);
  }
  $('#aihub-send',body).addEventListener('click', send);
  $('#aihub-input',body).addEventListener('keydown', e=>{ if(e.key==='Enter') send(); });
  renderHist(); renderChat();
};

/* ---------------------------------------------------------------------
   WEATHER — real, live data via Open-Meteo (no API key required)
--------------------------------------------------------------------- */
const WMO = {0:['Clear sky','☀️'],1:['Mainly clear','🌤️'],2:['Partly cloudy','⛅'],3:['Overcast','☁️'],
  45:['Fog','🌫️'],48:['Depositing fog','🌫️'],51:['Light drizzle','🌦️'],61:['Slight rain','🌧️'],
  63:['Rain','🌧️'],65:['Heavy rain','🌧️'],71:['Slight snow','🌨️'],75:['Heavy snow','❄️'],
  80:['Rain showers','🌦️'],95:['Thunderstorm','⛈️']};
function wmoInfo(code){ return WMO[code] || ['Unknown','🌡️']; }

function fetchLiveWeather(target){
  function withCoords(lat, lon, place){
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`)
      .then(r=>r.json())
      .then(data=>{
        const cur = data.current;
        const [desc,icon] = wmoInfo(cur.weather_code);
        if(target==='widget'){
          const t = $('#wg-temp'); if(t) t.textContent = Math.round(cur.temperature_2m)+'°';
          const c = $('#wg-cond'); if(c) c.textContent = desc;
          const ic = $('#wg-icon'); if(ic) ic.textContent = icon;
          const pl = $('#wg-place'); if(pl) pl.textContent = place;
        } else if(target==='app'){
          renderWeatherApp({place, temp:Math.round(cur.temperature_2m), desc, icon, humidity:cur.relative_humidity_2m, wind:cur.wind_speed_10m, hi:Math.round(data.daily.temperature_2m_max[0]), lo:Math.round(data.daily.temperature_2m_min[0])});
        }
      })
      .catch(()=>{ if(target==='app') renderWeatherError(); });
  }
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      pos=> withCoords(pos.coords.latitude.toFixed(3), pos.coords.longitude.toFixed(3), 'Your location'),
      ()=> withCoords(40.71, -74.01, 'New York (default)'),
      {timeout:5000}
    );
  } else withCoords(40.71, -74.01, 'New York (default)');
}
function renderWeatherError(){
  const main = $('#wx-main'); if(!main) return;
  main.innerHTML = `<p style="text-align:center;color:var(--text-dim);padding:30px">Could not reach the live weather service. Check your internet connection and try again.</p><div style="text-align:center"><button id="wx-retry" style="padding:8px 16px;border-radius:10px;border:none;background:var(--accent);color:#fff">Retry</button></div>`;
  $('#wx-retry').addEventListener('click', ()=> fetchLiveWeather('app'));
}
function renderWeatherApp(w){
  const main = $('#wx-main'); if(!main) return;
  main.innerHTML = `
    <div class="wx-hero"><div><div style="font-size:13px;opacity:.85">📍 ${escapeHtml(w.place)}</div><div class="t">${w.temp}°C</div><div>${escapeHtml(w.desc)}</div></div><div style="font-size:56px">${w.icon}</div></div>
    <div class="wx-grid">
      <div class="wx-card"><div class="ic">🔺</div><b>${w.hi}°</b><div style="font-size:11px;color:var(--text-dim)">High</div></div>
      <div class="wx-card"><div class="ic">🔻</div><b>${w.lo}°</b><div style="font-size:11px;color:var(--text-dim)">Low</div></div>
      <div class="wx-card"><div class="ic">💧</div><b>${w.humidity}%</b><div style="font-size:11px;color:var(--text-dim)">Humidity</div></div>
      <div class="wx-card"><div class="ic">💨</div><b>${w.wind} km/h</b><div style="font-size:11px;color:var(--text-dim)">Wind</div></div>
    </div>
    <div class="wx-status">Live data from Open-Meteo · updates each time you open this app</div>`;
}
AppBuilders.weather = function(){
  const win = createWindow({appId:'weather', title:'Weather', icon:'⛅', width:420, height:440, content:`
    <div class="app-main" id="wx-main"><p style="text-align:center;color:var(--text-dim);padding:40px">Locating you for live weather…</p></div>
  `});
  fetchLiveWeather('app');
};

/* ---------------------------------------------------------------------
   MAPS — real, live OpenStreetMap embed + free Nominatim geocoding
--------------------------------------------------------------------- */
AppBuilders.maps = function(){
  const win = createWindow({appId:'maps', title:'Maps', icon:'🗺️', width:640, height:480, content:`
    <div style="display:flex;flex-direction:column;height:100%">
      <div class="map-toolbar">
        <input type="text" id="map-search" placeholder="Search a place (e.g. Paris, Tokyo Tower)">
        <button id="map-go" style="border:none;background:var(--accent);color:#fff;padding:0 14px;border-radius:10px">Go</button>
        <button id="map-locate" style="border:none;background:var(--glass-strong);color:var(--text);padding:0 12px;border-radius:10px">📍</button>
      </div>
      <div class="map-frame-wrap"><iframe id="map-iframe" title="Map" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=-9.0,35.9,3.4,44.0&layer=mapnik"></iframe></div>
    </div>
  `});
  const body = $('.win-body', win.el);
  function setBBox(lat,lon,zoomSpan){
    const iframe = $('#map-iframe',body);
    const d = zoomSpan||0.03;
    iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-d},${lat-d},${lon+d},${lat+d}&layer=mapnik&marker=${lat},${lon}`;
  }
  $('#map-go',body).addEventListener('click', doSearch);
  $('#map-search',body).addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch(); });
  function doSearch(){
    const q = $('#map-search',body).value.trim();
    if(!q) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`)
      .then(r=>r.json())
      .then(res=>{
        if(!res.length){ showToast('Not found', 'No results for "'+q+'"', '🗺️'); return; }
        setBBox(parseFloat(res[0].lat), parseFloat(res[0].lon));
      })
      .catch(()=> showToast('Map search failed', 'Check your internet connection', '⚠️'));
  }
  $('#map-locate',body).addEventListener('click', ()=>{
    if(!navigator.geolocation) return showToast('Unavailable','Geolocation is not supported here','⚠️');
    navigator.geolocation.getCurrentPosition(
      pos=> setBBox(pos.coords.latitude, pos.coords.longitude, 0.02),
      ()=> showToast('Location blocked','Allow location access to use this','⚠️')
    );
  });
};
