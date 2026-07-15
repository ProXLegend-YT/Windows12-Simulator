/* =========================================================================
   games.js — Game Hub: Snake, 2048, Tic-Tac-Toe (vs AI), Memory Match.
   Every game here is fully playable with real logic, keyboard + touch
   controls, scoring, and best-score persistence via localStorage.
   ========================================================================= */

const GAME_LIST = [
  {id:'snake', name:'Snake', icon:'🐍', desc:'Classic grid snake'},
  {id:'g2048', name:'2048', icon:'🔢', desc:'Slide & merge tiles'},
  {id:'ttt', name:'Tic-Tac-Toe', icon:'❌', desc:'Beat the AI'},
  {id:'memory', name:'Memory Match', icon:'🧠', desc:'Find every pair'}
];

AppBuilders.games = function(){
  const win = createWindow({appId:'games', title:'Game Hub', icon:'🎮', width:480, height:560, content:`
    <div class="game-wrap" id="gh-root"></div>
  `});
  const root = $('#gh-root', win.el);
  let cleanup = null; // active game may register a teardown fn (stop timers etc.)

  function showHub(){
    if(cleanup){ cleanup(); cleanup=null; }
    root.innerHTML = `<div class="game-hud"><b>Game Hub</b><span></span></div>
      <div class="game-hub-grid">${GAME_LIST.map(g=>`
        <button class="game-tile" data-g="${g.id}"><div class="gi">${g.icon}</div><b>${g.name}</b><small>${g.desc}</small></button>
      `).join('')}</div>`;
    $all('.game-tile',root).forEach(b=> b.addEventListener('click', ()=> launch(b.dataset.g)));
  }
  function launch(id){
    if(cleanup){ cleanup(); cleanup=null; }
    root.innerHTML='';
    const launchers = {snake:mountSnake, g2048:mount2048, ttt:mountTTT, memory:mountMemory};
    cleanup = launchers[id](root, showHub);
  }
  win.onClose = ()=>{ if(cleanup) cleanup(); };
  showHub();
};

/* ---------------------------------------------------------------------
   SNAKE
--------------------------------------------------------------------- */
function mountSnake(root, backToHub){
  const GRID=16, CELL=18;
  root.innerHTML = `
    <div class="game-hud"><button id="sn-back">← Games</button><span id="sn-score">Score: 0 · Best: ${Store.get('bestSnake',0)}</span><button id="sn-restart">Restart</button></div>
    <div class="game-stage">
      <div>
        <canvas id="snake-canvas" width="${GRID*CELL}" height="${GRID*CELL}"></canvas>
        <div class="game-touch-pad" id="sn-pad">
          <span></span><button data-d="up">▲</button><span></span>
          <button data-d="left">◀</button><span></span><button data-d="right">▶</button>
          <span></span><button data-d="down">▼</button><span></span>
        </div>
      </div>
    </div>`;
  const canvas = $('#snake-canvas',root); const ctx = canvas.getContext('2d');
  let snake, dir, nextDir, food, score, best=Store.get('bestSnake',0), alive, speed, loopId;
  function reset(){
    snake=[{x:7,y:8},{x:6,y:8},{x:5,y:8}]; dir={x:1,y:0}; nextDir=dir; score=0; alive=true; speed=140;
    placeFood(); updateHud(); schedule();
  }
  function placeFood(){
    let ok=false;
    while(!ok){
      food={x:Math.floor(Math.random()*GRID), y:Math.floor(Math.random()*GRID)};
      ok = !snake.some(s=>s.x===food.x&&s.y===food.y);
    }
  }
  function updateHud(){ $('#sn-score',root).textContent = `Score: ${score} · Best: ${best}`; }
  function schedule(){ clearTimeout(loopId); loopId = setTimeout(tick, speed); }
  function tick(){
    if(!alive) return;
    dir = nextDir;
    const head = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
    if(head.x<0||head.y<0||head.x>=GRID||head.y>=GRID||snake.some(s=>s.x===head.x&&s.y===head.y)){
      alive=false; if(score>best){ best=score; Store.set('bestSnake',best); } draw(); drawGameOver(); return;
    }
    snake.unshift(head);
    if(head.x===food.x && head.y===food.y){ score+=10; speed=Math.max(60,speed-2); placeFood(); updateHud(); }
    else snake.pop();
    draw(); schedule();
  }
  function draw(){
    ctx.fillStyle='#11162a'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#ff5b6e'; ctx.fillRect(food.x*CELL+2,food.y*CELL+2,CELL-4,CELL-4);
    snake.forEach((s,i)=>{
      ctx.fillStyle = i===0 ? '#22d3c9' : '#4f8cff';
      ctx.fillRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2);
    });
  }
  function drawGameOver(){
    ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff'; ctx.font='bold 18px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2-8);
    ctx.font='12px sans-serif'; ctx.fillText('Tap Restart to play again', canvas.width/2, canvas.height/2+14);
  }
  function setDir(d){
    if(d==='up' && dir.y!==1) nextDir={x:0,y:-1};
    else if(d==='down' && dir.y!==-1) nextDir={x:0,y:1};
    else if(d==='left' && dir.x!==1) nextDir={x:-1,y:0};
    else if(d==='right' && dir.x!==-1) nextDir={x:1,y:0};
  }
  function onKey(e){
    const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
    if(map[e.key]){ setDir(map[e.key]); e.preventDefault(); }
  }
  document.addEventListener('keydown', onKey);
  $all('#sn-pad button',root).forEach(b=> b.addEventListener('click', ()=> setDir(b.dataset.d)));
  $('#sn-back',root).addEventListener('click', backToHub);
  $('#sn-restart',root).addEventListener('click', reset);
  reset();
  return ()=>{ clearTimeout(loopId); document.removeEventListener('keydown', onKey); };
}

/* ---------------------------------------------------------------------
   2048
--------------------------------------------------------------------- */
function mount2048(root, backToHub){
  root.innerHTML = `
    <div class="game-hud"><button id="g2-back">← Games</button><span id="g2-score">Score: 0 · Best: ${Store.get('best2048',0)}</span><button id="g2-restart">Restart</button></div>
    <div class="game-stage"><div class="g2048-grid" id="g2-grid"></div></div>`;
  let board, score, best=Store.get('best2048',0);
  const COLORS = {2:'#3a3f55',4:'#454b68',8:'#4f8cff',16:'#5a6cff',32:'#7a5cff',64:'#8a5cff',128:'#22d3c9',256:'#22c99c',512:'#ffc857',1024:'#ff9d4d',2048:'#ff5b6e'};
  function reset(){ board = Array.from({length:4},()=>Array(4).fill(0)); score=0; addTile(); addTile(); render(); }
  function addTile(){
    const empties=[]; board.forEach((row,y)=>row.forEach((v,x)=>{ if(!v) empties.push({x,y}); }));
    if(!empties.length) return;
    const {x,y} = empties[Math.floor(Math.random()*empties.length)];
    board[y][x] = Math.random()<0.9 ? 2 : 4;
  }
  function render(){
    const grid = $('#g2-grid',root);
    grid.innerHTML='';
    board.forEach(row=>row.forEach(v=>{
      const cell = document.createElement('div'); cell.className='g2048-cell';
      if(v){ cell.textContent=v; cell.style.background = COLORS[v]||'#ff2d55'; cell.style.color = v<=4?'#cfd4ea':'#fff'; }
      grid.appendChild(cell);
    }));
    $('#g2-score',root).textContent = `Score: ${score} · Best: ${best}`;
  }
  function slide(row){
    const arr = row.filter(v=>v);
    for(let i=0;i<arr.length-1;i++){
      if(arr[i]===arr[i+1]){ arr[i]*=2; score+=arr[i]; arr.splice(i+1,1); }
    }
    while(arr.length<4) arr.push(0);
    return arr;
  }
  function rotateCW(m){ const n=m.length; const r=Array.from({length:n},()=>Array(n).fill(0)); for(let y=0;y<n;y++) for(let x=0;x<n;x++) r[x][n-1-y]=m[y][x]; return r; }
  function move(dir){
    let m = board;
    let rotations = {left:0, up:3, right:2, down:1}[dir];
    for(let i=0;i<rotations;i++) m = rotateCW(m);
    const before = JSON.stringify(m);
    m = m.map(slide);
    const after = JSON.stringify(m);
    for(let i=0;i<(4-rotations)%4;i++) m = rotateCW(m);
    board = m;
    if(before!==after){ // board actually changed shape-wise before un-rotating; approximate check via serialization pre-rotate-back
      addTile();
    }
    if(best<score){ best=score; Store.set('best2048',best); }
    render();
    checkGameOver();
  }
  function canMove(){
    for(let y=0;y<4;y++) for(let x=0;x<4;x++){
      if(!board[y][x]) return true;
      if(x<3 && board[y][x]===board[y][x+1]) return true;
      if(y<3 && board[y][x]===board[y+1][x]) return true;
    }
    return false;
  }
  function checkGameOver(){
    if(!canMove()){
      const grid = $('#g2-grid',root);
      const overlay = document.createElement('div');
      overlay.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;border-radius:12px';
      overlay.textContent='Game Over';
      grid.style.position='relative'; grid.appendChild(overlay);
    }
  }
  function onKey(e){
    const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
    if(map[e.key]){ move(map[e.key]); e.preventDefault(); }
  }
  document.addEventListener('keydown', onKey);
  let tsx=0,tsy=0;
  const grid = $('#g2-grid',root);
  grid.addEventListener('touchstart', e=>{ tsx=e.touches[0].clientX; tsy=e.touches[0].clientY; },{passive:true});
  grid.addEventListener('touchend', e=>{
    const dx = e.changedTouches[0].clientX-tsx, dy=e.changedTouches[0].clientY-tsy;
    if(Math.max(Math.abs(dx),Math.abs(dy))<24) return;
    if(Math.abs(dx)>Math.abs(dy)) move(dx>0?'right':'left'); else move(dy>0?'down':'up');
  });
  $('#g2-back',root).addEventListener('click', backToHub);
  $('#g2-restart',root).addEventListener('click', reset);
  reset();
  return ()=>{ document.removeEventListener('keydown', onKey); };
}

/* ---------------------------------------------------------------------
   TIC-TAC-TOE (perfect-play AI via minimax)
--------------------------------------------------------------------- */
function mountTTT(root, backToHub){
  root.innerHTML = `
    <div class="game-hud"><button id="tt-back">← Games</button><span id="tt-score">W0 · L0 · D0</span><button id="tt-restart">Restart</button></div>
    <div class="game-stage"><div class="ttt-grid" id="tt-grid"></div></div>`;
  let board, over, rec = Store.get('tttRecord',{w:0,l:0,d:0});
  function reset(){ board = Array(9).fill(''); over=false; render(); }
  function render(){
    const grid = $('#tt-grid',root);
    grid.innerHTML = board.map((v,i)=>`<button class="ttt-cell" data-i="${i}">${v}</button>`).join('');
    $all('.ttt-cell',grid).forEach(c=> c.addEventListener('click', ()=> playerMove(+c.dataset.i)));
    $('#tt-score',root).textContent = `W${rec.w} · L${rec.l} · D${rec.d}`;
  }
  function winner(b){
    const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(const [a,c,d] of lines){ if(b[a] && b[a]===b[c] && b[a]===b[d]) return b[a]; }
    if(b.every(v=>v)) return 'draw';
    return null;
  }
  function minimax(b, isMax){
    const w = winner(b);
    if(w==='X') return {score:-10};
    if(w==='O') return {score:10};
    if(w==='draw') return {score:0};
    const moves=[];
    for(let i=0;i<9;i++){
      if(!b[i]){
        const nb = b.slice(); nb[i] = isMax?'O':'X';
        const result = minimax(nb, !isMax);
        moves.push({i, score:result.score});
      }
    }
    let best = isMax ? moves.reduce((a,c)=>c.score>a.score?c:a) : moves.reduce((a,c)=>c.score<a.score?c:a);
    return best;
  }
  function playerMove(i){
    if(over || board[i]) return;
    board[i]='X'; render();
    const w = winner(board);
    if(w){ finish(w); return; }
    setTimeout(()=>{
      const aiMove = minimax(board, true);
      if(aiMove && aiMove.i!=null){ board[aiMove.i]='O'; render(); }
      const w2 = winner(board);
      if(w2) finish(w2);
    }, 260);
  }
  function finish(w){
    over=true;
    if(w==='X'){ rec.w++; showToast('You win!','Nicely played against the AI','🏆'); }
    else if(w==='O'){ rec.l++; showToast('AI wins','Better luck next round','🤖'); }
    else { rec.d++; showToast("It's a draw","Perfectly matched","🤝"); }
    Store.set('tttRecord', rec);
    $('#tt-score',root).textContent = `W${rec.w} · L${rec.l} · D${rec.d}`;
  }
  $('#tt-back',root).addEventListener('click', backToHub);
  $('#tt-restart',root).addEventListener('click', reset);
  reset();
  return ()=>{};
}

/* ---------------------------------------------------------------------
   MEMORY MATCH
--------------------------------------------------------------------- */
function mountMemory(root, backToHub){
  const EMOJI = ['🐶','🐱','🦊','🐼','🐸','🦁','🐵','🐷'];
  root.innerHTML = `
    <div class="game-hud"><button id="mm-back">← Games</button><span id="mm-stats">Moves: 0 · Time: 0s</span><button id="mm-restart">Restart</button></div>
    <div class="game-stage"><div class="mem-grid" id="mm-grid"></div></div>`;
  let cards, flipped, matched, moves, seconds, timerId, locked;
  function reset(){
    const pairs = [...EMOJI, ...EMOJI];
    for(let i=pairs.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pairs[i],pairs[j]]=[pairs[j],pairs[i]]; }
    cards = pairs; flipped=[]; matched=new Set(); moves=0; seconds=0; locked=false;
    clearInterval(timerId); timerId = setInterval(()=>{ seconds++; updateStats(); },1000);
    render(); updateStats();
  }
  function updateStats(){ $('#mm-stats',root).textContent = `Moves: ${moves} · Time: ${seconds}s`; }
  function render(){
    $('#mm-grid',root).innerHTML = cards.map((e,i)=>{
      const isUp = flipped.includes(i) || matched.has(i);
      return `<button class="mem-card ${isUp?'flipped':''} ${matched.has(i)?'matched':''}" data-i="${i}">${isUp?e:'❔'}</button>`;
    }).join('');
    $all('.mem-card',root).forEach(c=> c.addEventListener('click', ()=> flip(+c.dataset.i)));
  }
  function flip(i){
    if(locked || flipped.includes(i) || matched.has(i)) return;
    flipped.push(i); render();
    if(flipped.length===2){
      moves++; updateStats(); locked=true;
      const [a,b] = flipped;
      if(cards[a]===cards[b]){
        matched.add(a); matched.add(b); flipped=[]; locked=false; render();
        if(matched.size===cards.length){
          clearInterval(timerId);
          const bestMoves = Store.get('bestMemoryMoves', null);
          if(bestMoves===null || moves<bestMoves) Store.set('bestMemoryMoves', moves);
          showToast('You matched them all!', `Finished in ${moves} moves and ${seconds}s`, '🧠');
        }
      } else {
        setTimeout(()=>{ flipped=[]; locked=false; render(); }, 700);
      }
    }
  }
  $('#mm-back',root).addEventListener('click', backToHub);
  $('#mm-restart',root).addEventListener('click', reset);
  reset();
  return ()=>{ clearInterval(timerId); };
}
