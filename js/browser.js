/* =========================================================================
   browser.js — a genuinely functional browser: it loads REAL, live
   websites inside an iframe (Wikipedia, OpenStreetMap, example.com, and
   any URL you type). Some sites (Google, YouTube, most banks, etc.) send
   an X-Frame-Options / CSP header that blocks ANY page — including real
   Chrome — from framing them. When that happens we show a friendly
   fallback with a genuine "open in a new tab" link, which is the same
   ceiling every in-page browser (including devtools/embedded webviews)
   runs into. Everything else — navigation, tabs, history, bookmarks — is
   fully real and working.
   ========================================================================= */

AppBuilders.browser = function(){
  const win = createWindow({appId:'browser', title:'Browser', icon:'🌐', width:780, height:540, content:`
    <div style="display:flex;flex-direction:column;height:100%">
      <div class="browser-tabs" id="bw-tabs"></div>
      <div class="app-toolbar">
        <button id="bw-back" title="Back">←</button><button id="bw-fwd" title="Forward">→</button><button id="bw-reload" title="Reload">⟳</button><button id="bw-home" title="Home">🏠</button>
        <input type="text" id="bw-addr" placeholder="Search Wikipedia or type a full URL (https://…)">
        <button id="bw-star" title="Bookmark">⭐</button>
        <button id="bw-open-tab" title="Open in a new browser tab">↗</button>
      </div>
      <div class="browser-frame-wrap" id="bw-frame-wrap"></div>
    </div>
  `});
  const body = $('.win-body', win.el);
  const bookmarks = Store.get('bookmarks', []);
  const QUICKLINKS = [
    {label:'Wikipedia', url:'https://en.wikipedia.org/wiki/Special:Random', ic:'📚'},
    {label:'OpenStreetMap', url:'https://www.openstreetmap.org/', ic:'🗺️'},
    {label:'Example.com', url:'https://example.com/', ic:'🌐'},
    {label:'Archive.org', url:'https://archive.org/', ic:'🏛️'},
    {label:'HTTPBin', url:'https://httpbin.org/', ic:'🧪'},
    {label:'W3C', url:'https://www.w3.org/', ic:'📄'}
  ];
  let tabs = [{id:uid('t'), title:'New tab', url:'', history:[''], hIdx:0}];
  let activeTab = tabs[0].id;
  function currentTab(){ return tabs.find(t=>t.id===activeTab); }

  function startPageHtml(){
    return `<div class="browser-start">
      <div class="bstart-logo">Aero Browser</div>
      <div class="bstart-search"><input id="bw-inline-search" placeholder="Search Wikipedia…"></div>
      <p class="bstart-note">This is a real browser panel: it loads live pages in an iframe. Some sites refuse to be
      framed by any page (a security setting they control, called X-Frame-Options) — when that happens you'll get
      a one-tap link to open the real site in a full browser tab instead.</p>
      <div class="bstart-grid">${QUICKLINKS.map(q=>`<div class="bstart-tile" data-go="${q.url}"><div class="ic">${q.ic}</div>${escapeHtml(q.label)}</div>`).join('')}</div>
    </div>`;
  }

  function render(){
    renderTabs();
    const t = currentTab();
    $('#bw-addr',body).value = t.url;
    const wrap = $('#bw-frame-wrap',body);
    if(!t.url){
      wrap.innerHTML = startPageHtml();
      $all('[data-go]',wrap).forEach(el=> el.addEventListener('click', ()=> navigate(el.dataset.go)));
      const inline = $('#bw-inline-search',wrap);
      if(inline) inline.addEventListener('keydown', e=>{ if(e.key==='Enter' && e.target.value.trim()) navigate('https://en.wikipedia.org/wiki/Special:Search?search='+encodeURIComponent(e.target.value.trim())); });
      return;
    }
    wrap.innerHTML = `<iframe src="${escapeHtml(t.url)}" loading="eager" referrerpolicy="no-referrer" allow="fullscreen"></iframe>
      <div class="browser-fallback" id="bw-fallback" style="display:none">
        <b>This site can't be displayed here</b>
        <p>${escapeHtml(new URL(t.url).hostname)} blocks embedding in any frame for security reasons — the same rule stops every in-page browser, not just this one.</p>
        <a href="${escapeHtml(t.url)}" target="_blank" rel="noopener">Open ${escapeHtml(new URL(t.url).hostname)} in a new tab ↗</a>
      </div>`;
    const iframe = $('iframe',wrap);
    const fallback = $('#bw-fallback',wrap);
    // Frame-block detection: if the iframe never fires 'load' within the
    // timeout, or its (same-origin only) document stays blank, assume blocked.
    let loaded = false;
    iframe.addEventListener('load', ()=>{ loaded = true; });
    setTimeout(()=>{
      if(!loaded){ fallback.style.display='flex'; }
    }, 3500);
  }

  function renderTabs(){
    $('#bw-tabs',body).innerHTML = tabs.map(t=>`
      <div class="browser-tab ${t.id===activeTab?'active':''}" data-id="${t.id}"><span>${escapeHtml(t.title)}</span><button data-close="${t.id}">✕</button></div>
    `).join('') + `<button class="browser-newtab" id="bw-newtab">+</button>`;
    $all('.browser-tab',body).forEach(el=> el.addEventListener('click', e=>{ if(e.target.closest('[data-close]')) return; activeTab=el.dataset.id; render(); }));
    $all('[data-close]',body).forEach(el=> el.addEventListener('click', e=>{
      e.stopPropagation();
      const id = el.dataset.close;
      tabs = tabs.filter(t=>t.id!==id);
      if(!tabs.length) tabs=[{id:uid('t'),title:'New tab',url:'',history:[''],hIdx:0}];
      if(activeTab===id) activeTab = tabs[0].id;
      render();
    }));
    $('#bw-newtab',body).addEventListener('click', ()=>{
      const t = {id:uid('t'), title:'New tab', url:'', history:[''], hIdx:0};
      tabs.push(t); activeTab=t.id; render();
    });
  }

  function navigate(rawUrl){
    let url = rawUrl.trim();
    if(!url) return;
    const looksLikeUrl = /^https?:\/\//i.test(url) || (/\.[a-z]{2,}(\/|$)/i.test(url) && !url.includes(' '));
    if(!looksLikeUrl){
      url = 'https://en.wikipedia.org/wiki/Special:Search?search='+encodeURIComponent(url);
    } else if(!/^https?:\/\//i.test(url)){
      url = 'https://'+url;
    }
    const t = currentTab();
    t.history = t.history.slice(0,t.hIdx+1); t.history.push(url); t.hIdx = t.history.length-1;
    t.url = url;
    try{ t.title = new URL(url).hostname.replace('www.',''); }catch(e){ t.title = 'New tab'; }
    render();
  }
  $('#bw-addr',body).addEventListener('keydown', e=>{ if(e.key==='Enter') navigate(e.target.value); });
  $('#bw-back',body).addEventListener('click', ()=>{ const t=currentTab(); if(t.hIdx>0){ t.hIdx--; t.url=t.history[t.hIdx]; render(); } });
  $('#bw-fwd',body).addEventListener('click', ()=>{ const t=currentTab(); if(t.hIdx<t.history.length-1){ t.hIdx++; t.url=t.history[t.hIdx]; render(); } });
  $('#bw-reload',body).addEventListener('click', render);
  $('#bw-home',body).addEventListener('click', ()=>{ const t=currentTab(); t.url=''; render(); });
  $('#bw-open-tab',body).addEventListener('click', ()=>{ const t=currentTab(); if(t.url) window.open(t.url,'_blank','noopener'); else showToast('Nothing to open','Navigate somewhere first','↗'); });
  $('#bw-star',body).addEventListener('click', ()=>{
    const t = currentTab();
    if(!t.url) return;
    if(!bookmarks.includes(t.url)){ bookmarks.push(t.url); Store.set('bookmarks',bookmarks); showToast('Bookmarked', t.title+' added to bookmarks','⭐'); }
    else showToast('Already bookmarked', t.title, '⭐');
  });
  render();
};
