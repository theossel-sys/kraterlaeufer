/* Kraterläufer – ein eigener seitlich scrollender Mond-Rover-Shooter. 80er-Pixeloptik mit modernen Licht-Effekten.
 * Alle Grafiken haben eine Code-Variante; Bilder aus Draw Things (assets/) ersetzen sie, sobald sie geladen sind. */
'use strict';

// ---------------------------------------------------------------- Bildschirm (Querformat, 225 px hoch)
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const H = 225;
let W = 400, SCALE = 1;
function resize() {
  const vw = innerWidth, vh = innerHeight;
  W = Math.round(Math.min(480, Math.max(300, H * vw / vh)));
  cv.width = W; cv.height = H;
  SCALE = Math.min(vw / W, vh / H);
  cv.style.width = Math.floor(W * SCALE) + 'px';
  cv.style.height = Math.floor(H * SCALE) + 'px';
  ctx.imageSmoothingEnabled = false;
  sky = null;                          // Himmel neu rendern
}
let sky = null;
addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------- Hilfen
let seed = 7;
function rnd() {
  seed = (seed + 0x6D2B79F5) >>> 0;
  let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rr = (a, b) => a + rnd() * (b - a);
const ri = (a, b) => Math.floor(rr(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hsh(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

// ---------------------------------------------------------------- Pixelschrift 3x5
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100110101010', 7: '111001010010010', 8: '010101010101010',
  9: '010101011001110', ' ': '000000000000000', ':': '000010000010000', '-': '000000111000000', '!': '010010010000010',
  '.': '000000000000010', 'x': '000101010101000', '/': '001001010100100', '+': '000010111010000',
};
function text(str, x, y, color, scale, align, glow) {
  scale = scale || 1;
  str = String(str).toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE');
  const w = str.length * 4 * scale - scale;
  if (align === 'center') x -= Math.floor(w / 2); else if (align === 'right') x -= w;
  x = Math.round(x); y = Math.round(y);
  for (let pass = 0; pass < 2; pass++) {
    ctx.fillStyle = pass ? color : 'rgba(0,0,0,.8)';
    if (pass && glow) { ctx.shadowColor = color; ctx.shadowBlur = 6; }
    const o = pass ? 0 : scale;
    for (let i = 0; i < str.length; i++) {
      const g = FONT[str[i]] || FONT[' '];
      for (let b = 0; b < 15; b++) if (g[b] === '1') ctx.fillRect(x + i * 4 * scale + (b % 3) * scale + o, y + Math.floor(b / 3) * scale + o, scale, scale);
    }
    ctx.shadowBlur = 0;
  }
}

// ---------------------------------------------------------------- Bilder aus Draw Things (mit Code-Ersatz)
const ART = {};
function flashOf(src) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  return c;
}
['buggy', 'drone', 'bomber', 'crawler', 'rock_small', 'rock_big', 'mine', 'walker', 'bg_far', 'bg_near', 'bg_sky'].forEach(k => {
  const ext = k === 'bg_sky' ? 'jpg' : 'png';
  const im = new Image();
  im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); ART[k] = c; ART[k + '_f'] = flashOf(c); if (k === 'bg_sky') sky = null; };
  im.src = 'assets/' + k + '.' + ext;
});

// ---------------------------------------------------------------- Etappen
const STAGES = [
  { name: 'MARE IMBRIUM', tint: null, ground: ['#8a86a8', '#5f5a80', '#3a3558'], hill: '#4a3f78', far: '#2c2456', skyTop: '#05030f', skyBot: '#2a1450', len: 3200 },
  { name: 'KOPERNIKUS-EBENE', tint: ['#e0a07a', 0.35], ground: ['#a08a7a', '#6e5a58', '#43343c'], hill: '#5a3f5c', far: '#3a2440', skyTop: '#07030c', skyBot: '#3c1838', len: 3600 },
  { name: 'TYCHO-HOCHLAND', tint: ['#8fb0e8', 0.3], ground: ['#9aa0a8', '#646a7a', '#3a3e50'], hill: '#3f4a6e', far: '#232c4c', skyTop: '#03050f', skyBot: '#14284a', len: 3600, boss: true },
  { name: 'SCHATTENKRATER', tint: ['#3a2c5c', 0.62], ground: ['#5a5476', '#3a3456', '#221e38'], hill: '#2a2248', far: '#171230', skyTop: '#020108', skyBot: '#120a26', len: 3800, dark: true },
  { name: 'APENNIN-GRAT', tint: ['#e08a8a', 0.32], ground: ['#b0a088', '#7a6a5e', '#4a3c3a'], hill: '#6a4a52', far: '#3e2a3e', skyTop: '#080308', skyBot: '#46203a', len: 4000 },
  { name: 'MARE NUBIUM', tint: ['#8aa8f0', 0.28], ground: ['#8c94aa', '#5c6280', '#363a58'], hill: '#3c4478', far: '#232a52', skyTop: '#03040f', skyBot: '#1c2456', len: 4200, boss: true },
];
const GROUND = 140;                     // Grundhöhe des Bodens (Bildschirm-y)
function groundAt(wx) {                // Bodenprofil ohne Krater
  return GROUND + Math.sin(wx / 70) * 3 + Math.sin(wx / 23 + 1) * 1.5;
}

// ---------------------------------------------------------------- Spielzustand
let G = null, state = 'title', hiscore = 0, last = 0;
try { hiscore = +localStorage.getItem('kraterlaeufer-hi') || 0; } catch (e) { /* privat */ }
const BX = 74;                          // Bildschirm-x des Rovers bei Normaltempo
function newGame() {
  seed = (Math.random() * 2 ** 32) >>> 0;
  G = {
    t: 0, stage: 0, loop: 0, dist: 0, cam: 0, speed: 70, score: 0, lives: 3, nextLife: 20000,
    p: { wx: 0, y: 0, vy: 0, air: false, jumpHold: 0, cool: 0, dead: 0, inv: 2, tilt: 0, sx: BX },
    craters: [], obs: [], foes: [], shots: [], bombs: [], fx: [], spawnX: 260, waveT: 4, boss: null, bossDone: -1,
    banner: null, shake: 0, flash: 0, stageT: 0, clear: 0,
  };
  G.p.y = groundAt(0);
  banner('ETAPPE 1: ' + STAGES[0].name);
}
const stageDef = () => STAGES[G.stage % STAGES.length];
const level = () => 1 + G.loop * 0.4 + (G.stage % STAGES.length) * 0.07;
function banner(t, sub) { G.banner = { t, sub, life: 2.8 }; }
// Krater: Boden mit Mulde
function craterDepth(wx) {
  for (const c of G.craters) if (wx > c.x && wx < c.x + c.w) {
    const u = (wx - c.x) / c.w;
    return Math.sin(u * Math.PI) * c.d;
  }
  return 0;
}
const groundY = wx => groundAt(wx) + craterDepth(wx);
const inPit = wx => G.craters.find(c => wx > c.x + 4 && wx < c.x + c.w - 4);

// ---------------------------------------------------------------- Hindernisse erzeugen (immer lösbar)
function spawnAhead() {
  const ahead = G.cam + W + 60;
  const st = stageDef(), stageEnd = stageStart() + st.len;
  while (G.spawnX < ahead) {
    const x = G.spawnX, lv = level();
    if (x > stageEnd - 120) { G.spawnX = Math.max(G.spawnX, stageEnd + 200); break; }
    const k = rnd();
    let gap = rr(110, 190) / Math.min(1.6, lv);
    if (k < 0.32) { const w = ri(22, 40 + Math.min(10, G.loop * 4)); G.craters.push({ x, w, d: 26 }); gap += w; }
    else if (k < 0.5) G.obs.push({ type: 'rock_small', x, hp: 1 });
    else if (k < 0.63) { G.obs.push({ type: 'rock_big', x, hp: 3 }); gap += 10; }
    else if (k < 0.74) G.obs.push({ type: 'mine', x, hp: 999 });
    else if (k < 0.84) G.foes.push({ type: 'crawler', x, y: 0, hp: 2, t: 0, flash: 0 });
    else if (k < 0.92) { G.craters.push({ x, w: 22, d: 24 }); G.obs.push({ type: 'rock_small', x: x + 95, hp: 1 }); gap += 110; }
    else { G.obs.push({ type: 'mine', x, hp: 999 }); G.craters.push({ x: x + 80, w: 26, d: 24 }); gap += 110; }
    G.spawnX += Math.max(95, gap);
  }
  G.craters = G.craters.filter(c => c.x + c.w > G.cam - 40);
  G.obs = G.obs.filter(o => o.x > G.cam - 40 && !o.dead);
}
function stageStart() { let s = 0; for (let i = 0; i < G.stage; i++) s += STAGES[i % STAGES.length].len; return s; }

function spawnWave() {
  const lv = level(), n = Math.min(5, 2 + Math.floor(rnd() * lv * 1.6));
  if (rnd() < 0.7) {
    for (let i = 0; i < n; i++) G.foes.push({ type: 'drone', air: true, x: W + 20 + i * 26, y: rr(32, 72), baseY: 0, t: rr(0, 6), hp: 1, flash: 0, cool: rr(0.8, 2.2), life: rr(7, 10), side: 1 });
  } else G.foes.push({ type: 'bomber', air: true, x: -40, y: rr(24, 40), t: 0, hp: 3, flash: 0, drops: 3, cool: 0.8, vx: 90 });
}
function startBoss() {
  G.boss = { x: W + 60, y: 0, tx: Math.min(W - 64, 290), hp: Math.round(70 * (1 + G.loop * 0.5)), max: 0, t: 0, pat: 0, patT: 0, fireT: 1.5, flash: 0, dying: 0, step: 0 };
  G.boss.max = G.boss.hp;
  banner('WARNUNG', 'KAMPFLAEUFER');
  AUDIO.sfx('alarm'); AUDIO.boss(true);
}

// ---------------------------------------------------------------- Eingabe
const keys = {}, pad = { L: false, R: false, J: false, F: false };
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); keys[k] = true;
  if ((k === 'p' || k === 'escape') && (state === 'play' || state === 'pause')) togglePause();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
[['bL', 'L'], ['bR', 'R'], ['bJ', 'J'], ['bF', 'F']].forEach(([id, k]) => {
  const b = document.getElementById(id);
  const on = v => e => { e.preventDefault(); pad[k] = v; b.classList.toggle('on', v); AUDIO.unlock(); };
  b.addEventListener('pointerdown', on(true));
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => b.addEventListener(t, on(false)));
});
const inp = () => ({
  left: keys.arrowleft || keys.a || pad.L,
  right: keys.arrowright || keys.d || pad.R,
  jump: keys.arrowup || keys.w || keys[' '] || pad.J,
  fire: keys.x || keys.control || keys.z || keys.k || pad.F,
});

// ---------------------------------------------------------------- Update
function update(dt) {
  G.t += dt; G.stageT += dt;
  const p = G.p, I = inp(), st = stageDef();
  // Tempo
  const target = I.right ? 108 : I.left ? 44 : 70;
  G.speed += (target - G.speed) * Math.min(1, dt * 2.5);
  const sxT = BX + (G.speed - 70) * 0.9;
  p.sx += (sxT - p.sx) * Math.min(1, dt * 3);
  const bossHold = G.boss && !G.boss.dying;
  const v = bossHold ? G.speed * 0.5 : G.speed;
  if (!p.dead) { p.wx += v * dt; G.dist += v * dt; addScore(Math.floor(v * dt / 6)); }
  G.cam = p.wx - p.sx;
  spawnAhead();
  // Etappenende / Endgegner
  const end = stageStart() + st.len;
  if (p.wx > end - W * 0.5 && st.boss && G.bossDone !== G.stage && !G.boss) startBoss();
  if (p.wx > end && (!st.boss || G.bossDone === G.stage) && !G.clear) {
    G.clear = 2.6;
    const bonus = Math.max(0, Math.round((90 - G.stageT) * 50)) + 2000;
    addScore(bonus);
    banner('ETAPPE GESCHAFFT', 'BONUS ' + bonus);
    AUDIO.sfx('power');
  }
  if (G.clear) {
    G.clear -= dt;
    if (G.clear <= 0) {
      G.clear = 0; G.stage++; G.stageT = 0;
      if (G.stage % STAGES.length === 0) G.loop++;
      banner('ETAPPE ' + (G.stage + 1) + ': ' + stageDef().name);
    }
  }
  // Rover
  if (p.dead > 0) {
    p.dead -= dt;
    if (p.dead <= 0) {
      p.dead = 0;
      if (G.lives <= 0) { gameOver(); return; }
      // sicherer Neustart: Hindernisse direkt vor dem Rover weg
      G.craters = G.craters.filter(c => c.x > p.wx + 160 || c.x + c.w < p.wx - 30);
      G.obs = G.obs.filter(o => o.x > p.wx + 160 || o.x < p.wx - 30);
      G.foes = G.foes.filter(f => f.air || f.x > p.wx + 160);
      G.bombs = [];
      p.y = groundAt(p.wx); p.vy = 0; p.air = false; p.inv = 2.2;
    }
  } else {
    p.inv = Math.max(0, p.inv - dt);
    const gyHere = groundY(p.wx);
    if (I.jump && !p.jumpWas) p.buffer = 0.15;
    p.jumpWas = I.jump;
    p.buffer = Math.max(0, (p.buffer || 0) - dt);
    if (!p.air) {
      if (p.buffer > 0) { p.air = true; p.vy = -128; p.jumpHold = 0.2; p.buffer = 0; AUDIO.sfx('jump'); dust(p.sx, p.y, 8); }
      else {
        // Krater: hineinfallen
        if (inPit(p.wx) && inPit(p.wx - 10)) { die('KRATER'); }
        p.y = gyHere;
      }
    } else {
      if (I.jump && p.jumpHold > 0) { p.vy -= 260 * dt; p.jumpHold -= dt; }
      p.vy += 300 * dt;
      p.y += p.vy * dt;
      const gl = groundAt(p.wx) + (inPit(p.wx) && inPit(p.wx - 10) ? 60 : 0);
      if (p.y >= gl && p.vy > 0) {
        if (gl > groundAt(p.wx) + 5) die('KRATER');
        else { p.y = gl; p.air = false; p.vy = 0; dust(p.sx, p.y, 10); G.shake = Math.max(G.shake, 0.08); AUDIO.sfx('land'); }
      }
    }
    // Neigung nach Gelände
    const ahead = groundY(p.wx + 10), behind = groundY(p.wx - 10);
    const tiltT = p.air ? clamp(p.vy / 600, -0.25, 0.25) : Math.atan2(ahead - behind, 20);
    p.tilt += (tiltT - p.tilt) * Math.min(1, dt * 8);
    // Feuer: nach vorn und nach oben
    p.cool -= dt;
    if (I.fire && p.cool <= 0) {
      p.cool = 0.24;
      G.shots.push({ x: p.sx + 18, y: p.y - 7, vx: 300, vy: 0, life: 1.1, up: false });
      G.shots.push({ x: p.sx - 2, y: p.y - 20, vx: 0, vy: -280, life: 0.8, up: true });
      AUDIO.sfx('shot');
    }
    if (!p.air && Math.floor(G.t * 20) % 3 === 0) dust(p.sx - 14, p.y, 1, true);
  }
  // Schüsse
  G.shots.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; });
  // Hindernisse (Welt-x) treffen
  G.shots.forEach(s => {
    if (s.up || s.gone) return;
    const wx = s.x + G.cam;
    G.obs.forEach(o => {
      if (o.dead || o.type === 'mine') return;
      const sz = o.type === 'rock_big' ? 9 : 6;
      if (Math.abs(wx - o.x) < sz + 2 && s.y > groundAt(o.x) - (o.type === 'rock_big' ? 18 : 12)) { s.gone = true; o.hp--; o.flash = 0.06; if (o.hp <= 0) { o.dead = true; boom(o.x - G.cam, groundAt(o.x) - sz, 7, '#c9b8ff'); addScore(o.type === 'rock_big' ? 100 : 50); AUDIO.sfx('crack'); } else AUDIO.sfx('hit'); }
    });
  });
  G.shots = G.shots.filter(s => s.life > 0 && !s.gone);
  // Zusammenstoß mit Hindernissen
  if (!p.dead && p.inv <= 0) G.obs.forEach(o => {
    if (o.dead) return;
    const sx = o.x - G.cam, sz = o.type === 'rock_big' ? 9 : o.type === 'mine' ? 4 : 6;
    const top = groundAt(o.x) - (o.type === 'rock_big' ? 16 : o.type === 'mine' ? 5 : 10);
    if (Math.abs(sx - p.sx) < 12 + sz && p.y > top + 3) die(o.type === 'mine' ? 'MINE' : 'FELS');
  });
  // Gegner
  if (!G.boss && !G.clear) { G.waveT -= dt; if (G.waveT <= 0) { spawnWave(); G.waveT = rr(4.5, 8) / level(); } }
  G.foes.forEach(f => {
    f.t += dt; f.flash = Math.max(0, (f.flash || 0) - dt);
    if (f.type === 'drone') {
      f.life -= dt;
      const tx = f.life > 0 ? p.sx + 40 + Math.sin(f.t * 0.9) * 90 : -60;
      f.x += clamp(tx - f.x, -90, 90) * dt * 1.2;
      f.y = clamp(f.y + Math.sin(f.t * 2.2) * 26 * dt, 26, 82);
      f.cool -= dt * level();
      if (f.cool <= 0 && f.x > 20 && f.x < W - 20 && !p.dead) { f.cool = rr(1.6, 2.8); G.bombs.push({ x: f.x, y: f.y + 6, vx: -G.speed * 0.2, vy: 30 }); AUDIO.sfx('drop'); }
    } else if (f.type === 'bomber') {
      f.x += f.vx * dt;
      f.cool -= dt;
      if (f.drops > 0 && f.cool <= 0 && f.x > p.sx + 20) { f.drops--; f.cool = 0.35; G.bombs.push({ x: f.x, y: f.y + 8, vx: 10, vy: 40, big: true }); AUDIO.sfx('drop'); }
    } else if (f.type === 'crawler') {
      f.x -= 22 * dt;
      f.y = groundAt(f.x) - 6;
      if (!p.dead && p.inv <= 0 && Math.abs(f.x - G.cam - p.sx) < 16 && p.y > f.y - 2) die('KRIECHER');
    }
    // Treffer
    G.shots.forEach(s => {
      if (s.gone || f.dead) return;
      const fx = f.air ? f.x : f.x - G.cam;
      const r = f.type === 'bomber' ? 14 : 8;
      if (Math.abs(s.x - fx) < r && Math.abs(s.y - f.y) < r * 0.8) {
        s.gone = true; f.hp--; f.flash = 0.06;
        if (f.hp <= 0) { f.dead = true; boom(fx, f.y, f.type === 'bomber' ? 16 : 9, '#ff7a3c'); addScore(f.type === 'bomber' ? 400 : f.type === 'crawler' ? 200 : 150); AUDIO.sfx('boom'); }
        else AUDIO.sfx('hit');
      }
    });
  });
  G.foes = G.foes.filter(f => !f.dead && (f.air ? f.x > -80 && f.x < W + 120 : f.x > G.cam - 40));
  // Bomben: reißen Krater in den Weg
  G.bombs.forEach(b => {
    b.vy += 140 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    const wx = b.x + G.cam;
    if (!p.dead && p.inv <= 0 && Math.abs(b.x - p.sx) < 10 && Math.abs(b.y - (p.y - 9)) < 8) { b.gone = true; die('BOMBE'); }
    if (b.y >= groundY(wx)) {
      b.gone = true; boom(b.x, b.y, b.big ? 12 : 8, '#ffb13c'); AUDIO.sfx('boom');
      if (wx > p.wx + 95 && !inPit(wx) && !G.obs.some(o => Math.abs(o.x - wx) < 30)) G.craters.push({ x: wx - (b.big ? 13 : 10), w: b.big ? 26 : 20, d: 18 });
    }
    // abschießen
    G.shots.forEach(s => { if (s.up && !s.gone && Math.abs(s.x - b.x) < 6 && Math.abs(s.y - b.y) < 8) { s.gone = true; b.gone = true; boom(b.x, b.y, 5, '#ffd23f'); addScore(30); } });
  });
  G.bombs = G.bombs.filter(b => !b.gone && b.y < H + 10);
  // Endgegner
  if (G.boss) updateBoss(dt);
  // Effekte
  G.fx.forEach(e => { e.t += dt; if (e.k === 'p') { e.x += e.vx * dt; e.y += e.vy * dt; e.vy += (e.g || 0) * dt; e.vx *= 0.96; } if (e.k === 'ring') e.r = e.max * (e.t / e.life); });
  G.fx = G.fx.filter(e => e.t < e.life);
  if (G.banner) { G.banner.life -= dt; if (G.banner.life <= 0) G.banner = null; }
  G.shake = Math.max(0, G.shake - dt); G.flash = Math.max(0, G.flash - dt);
}
function updateBoss(dt) {
  const b = G.boss, p = G.p;
  b.t += dt; b.flash = Math.max(0, b.flash - dt);
  b.y = GROUND - 34;
  if (b.dying) {
    b.dying -= dt;
    if (rnd() < 0.5) boom(b.x + rr(-30, 30), b.y + rr(-30, 20), rr(8, 16), '#ff7a3c');
    if (b.dying <= 0) { boom(b.x, b.y, 34, '#fff1b0'); G.shake = 0.7; G.flash = 0.3; AUDIO.sfx('bigboom'); addScore(10000 * (1 + G.loop)); G.boss = null; G.bossDone = G.stage; AUDIO.boss(false); }
    return;
  }
  b.x += (b.tx + Math.sin(b.t * 0.6) * 18 - b.x) * Math.min(1, dt * 1.5);
  b.step += dt * 4;
  if (b.x > W - 10) return;
  b.patT += dt; if (b.patT > 4) { b.patT = 0; b.pat = (b.pat + 1) % 3; }
  b.fireT -= dt * (b.hp < b.max * 0.4 ? 1.4 : 1) * level();
  if (b.fireT <= 0 && !p.dead) {
    if (b.pat === 0) { for (let k = 0; k < 3; k++) G.bombs.push({ x: b.x - 10, y: b.y - 30, vx: -60 - k * 30, vy: -110, big: true }); b.fireT = 1.8; AUDIO.sfx('drop'); }
    if (b.pat === 1) { G.foes.push({ type: 'missile', air: true, x: b.x - 20, y: GROUND - 12, t: 0, hp: 1, flash: 0, vx: -120 }); b.fireT = 1.4; AUDIO.sfx('eshot'); }
    if (b.pat === 2) { G.foes.push({ type: 'drone', air: true, x: b.x, y: b.y - 40, baseY: 0, t: 0, hp: 1, flash: 0, cool: 1, life: 6, side: 1 }); b.fireT = 2.2; }
  }
  // Raketen fliegen in Bodenhöhe: drüberspringen oder abschießen
  G.foes.forEach(f => { if (f.type === 'missile') { f.x += f.vx * dt; if (!p.dead && p.inv <= 0 && Math.abs(f.x - p.sx) < 14 && p.y > f.y - 4) { f.dead = true; die('RAKETE'); } } });
  G.shots.forEach(s => { if (!s.gone && s.x > b.x - 32 && s.x < b.x + 32 && s.y > b.y - 44 && s.y < GROUND + 4) { s.gone = true; b.hp--; b.flash = 0.05; AUDIO.sfx('hit'); if (b.hp <= 0) { b.dying = 2; G.bombs = []; } } });
}
function die(why) {
  const p = G.p;
  if (p.dead || p.inv > 0) return;
  p.dead = 2; G.lives--; G.shake = 0.6; G.flash = 0.2;
  boom(p.sx, p.y - 8, 22, '#ff7a3c'); AUDIO.sfx('bigboom');
  banner(why === 'KRATER' ? 'ABGESTUERZT!' : 'ZERSTOERT!');
}
function addScore(n) {
  G.score += n;
  if (G.score >= G.nextLife) { G.lives++; G.nextLife += 30000; banner('EXTRALEBEN!'); AUDIO.sfx('power'); }
}
function boom(x, y, size, col) {
  G.fx.push({ k: 'ring', x, y, r: 2, max: size * 1.8, life: 0.4, t: 0, c: col });
  G.fx.push({ k: 'glow', x, y, r: size * 2.4, life: 0.35, t: 0, c: col });
  const n = Math.min(30, 8 + size);
  for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, s = rr(30, 70 + size * 5); G.fx.push({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, g: 120, life: rr(0.3, 0.9), t: 0, c: [col, '#ffd23f', '#fff3c0', '#7a6a8a'][ri(0, 3)] }); }
}
function dust(x, y, n, small) {
  for (let i = 0; i < n; i++) G.fx.push({ k: 'p', x: x + rr(-6, 6), y: y - 1, vx: rr(-50, -10) - (small ? G.speed * 0.3 : 0), vy: rr(-40, -8), g: 60, life: rr(0.3, 0.7), t: 0, c: 'rgba(200,190,230,.7)', dust: true });
}

// ---------------------------------------------------------------- Zeichnen
function renderSky() {
  const st = stageDef(), c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  if (ART.bg_sky) { x.drawImage(ART.bg_sky, 0, 0, W, H); }
  else {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, st.skyTop); g.addColorStop(0.75, st.skyBot); g.addColorStop(1, st.skyBot);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) { const b = hsh(i, 3); x.fillStyle = `rgba(255,255,255,${0.25 + b * 0.7})`; x.fillRect(Math.floor(hsh(i, 1) * W), Math.floor(hsh(i, 2) * H * 0.75), b > 0.9 ? 2 : 1, b > 0.9 ? 2 : 1); }
    // Erde
    const ex = W * 0.72, ey = 46, er = 20;
    const eg = x.createRadialGradient(ex - 6, ey - 6, 2, ex, ey, er); eg.addColorStop(0, '#9fd6ff'); eg.addColorStop(0.55, '#2f72c8'); eg.addColorStop(1, '#0e2a5c');
    x.fillStyle = 'rgba(80,160,255,.18)'; x.beginPath(); x.arc(ex, ey, er + 6, 0, 7); x.fill();
    x.fillStyle = eg; x.beginPath(); x.arc(ex, ey, er, 0, 7); x.fill();
    x.fillStyle = 'rgba(80,170,90,.8)'; x.beginPath(); x.ellipse(ex - 5, ey - 2, 7, 4, 0.4, 0, 7); x.fill(); x.beginPath(); x.ellipse(ex + 6, ey + 7, 5, 3, -0.3, 0, 7); x.fill();
    x.fillStyle = 'rgba(0,0,10,.55)'; x.beginPath(); x.arc(ex + 9, ey + 4, er, 0, 7); x.fill();
    // Nebel
    const ng = x.createRadialGradient(W * 0.25, 60, 4, W * 0.25, 60, 90); ng.addColorStop(0, 'rgba(255,63,164,.16)'); ng.addColorStop(1, 'rgba(255,63,164,0)');
    x.fillStyle = ng; x.fillRect(0, 0, W, H);
  }
  sky = { c, stage: G ? G.stage : 0 };
}
function layer(img, speed, y, fallback) {
  if (img) {
    const w = img.width, off = ((G.cam * speed) % w + w) % w;
    for (let x = -off; x < W; x += w) ctx.drawImage(img, Math.round(x), y);
    return;
  }
  fallback();
}
function mountains(speed, base, amp, col, seedN) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) {
    const wx = (x + G.cam * speed) / 40;
    const i = Math.floor(wx), f = wx - i, s = f * f * (3 - 2 * f);
    const h1 = hsh(i, seedN), h2 = hsh(i + 1, seedN);
    const y = base - (h1 + (h2 - h1) * s) * amp - Math.abs(Math.sin(wx * 2.1)) * amp * 0.25;
    ctx.lineTo(x, Math.round(y));
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
}
function draw() {
  const st = stageDef(), p = G.p;
  if (!sky || sky.stage !== G.stage) renderSky();
  ctx.save();
  if (G.shake > 0) ctx.translate(Math.round(rr(-3, 3) * G.shake * 3), Math.round(rr(-2, 2) * G.shake * 3));
  ctx.drawImage(sky.c, 0, 0);
  // funkelnde Sterne
  for (let i = 0; i < 6; i++) { const k = Math.floor(G.t * 2) + i * 13; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(Math.floor(hsh(k, 5) * W), Math.floor(hsh(k, 6) * 120), 1, 1); }
  // Parallax-Gebirge
  layer(ART.bg_far, 0.15, GROUND - 14 - (ART.bg_far ? ART.bg_far.height : 0), () => mountains(0.15, GROUND - 22, 46, st.far, 11));
  layer(ART.bg_near, 0.4, GROUND + 6 - (ART.bg_near ? ART.bg_near.height : 0), () => mountains(0.4, GROUND - 4, 26, st.hill, 23));
  // Farbstimmung der Etappe über Himmel und Gebirge (die Bilder sind in allen Etappen gleich)
  if (st.tint) {
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = st.tint[1];
    ctx.fillStyle = st.tint[0]; ctx.fillRect(0, 0, W, GROUND + 8);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  // Boden
  drawGround(st);
  // Hindernisse
  G.obs.forEach(o => {
    if (o.dead) return;
    const sx = o.x - G.cam, gy = groundAt(o.x); if (sx < -30 || sx > W + 30) return;
    const img = ART[o.type], fl = o.flash > 0 && (o.flash -= 1 / 60) > 0;
    if (img) { ctx.drawImage(fl ? ART[o.type + '_f'] : img, Math.round(sx - img.width / 2), Math.round(gy - img.height + 2)); return; }
    if (o.type === 'mine') {
      ctx.fillStyle = '#2a2a33'; ctx.fillRect(Math.round(sx) - 4, Math.round(gy) - 4, 8, 4);
      const on = Math.floor(G.t * 4) % 2; ctx.fillStyle = on ? '#ff3f3f' : '#5a1010'; ctx.fillRect(Math.round(sx) - 1, Math.round(gy) - 6, 2, 2);
      if (on) glow(sx, gy - 5, 8, 'rgba(255,60,60,.6)');
    } else {
      const s = o.type === 'rock_big' ? 9 : 6, h = o.type === 'rock_big' ? 16 : 10;
      ctx.fillStyle = fl ? '#fff' : '#6c6488'; ctx.beginPath(); ctx.moveTo(sx - s, gy + 1); ctx.lineTo(sx - s + 2, gy - h * 0.6); ctx.lineTo(sx - 1, gy - h); ctx.lineTo(sx + s - 2, gy - h * 0.7); ctx.lineTo(sx + s, gy + 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = fl ? '#fff' : '#9a92b8'; ctx.beginPath(); ctx.moveTo(sx - s + 2, gy - h * 0.6); ctx.lineTo(sx - 1, gy - h); ctx.lineTo(sx, gy - h * 0.4); ctx.closePath(); ctx.fill();
    }
  });
  // Bodengegner
  G.foes.forEach(f => {
    if (f.type !== 'crawler') return;
    const sx = f.x - G.cam;
    if (ART.crawler) { ctx.drawImage(f.flash > 0 ? ART.crawler_f : ART.crawler, Math.round(sx - ART.crawler.width / 2), Math.round(f.y + 6 - ART.crawler.height)); return; }
    const fl = f.flash > 0, leg = Math.floor(f.t * 8) % 2;
    ctx.fillStyle = fl ? '#fff' : '#4a3a6a'; ctx.fillRect(Math.round(sx) - 8, Math.round(f.y) - 6, 16, 8);
    ctx.fillStyle = fl ? '#fff' : '#ff3fa4'; ctx.fillRect(Math.round(sx) - 6, Math.round(f.y) - 4, 3, 2);
    glow(sx - 5, f.y - 3, 6, 'rgba(255,63,164,.5)');
    ctx.fillStyle = '#2a2040'; for (let k = -1; k <= 1; k++) ctx.fillRect(Math.round(sx) + k * 6 - 1, Math.round(f.y) + 2 + (leg ^ (k & 1)), 2, 3);
  });
  // Endgegner
  if (G.boss) drawBoss(G.boss);
  // Rover
  if (!p.dead) drawBuggy(p);
  // Schüsse mit Leuchten
  ctx.globalCompositeOperation = 'lighter';
  G.shots.forEach(s => {
    const col = s.up ? '#3ff2ff' : '#ff3fa4';
    glow(s.x, s.y, 7, s.up ? 'rgba(63,242,255,.55)' : 'rgba(255,63,164,.55)');
    ctx.fillStyle = col; if (s.up) ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 4, 2, 7); else ctx.fillRect(Math.round(s.x) - 5, Math.round(s.y) - 1, 8, 2);
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
  });
  ctx.globalCompositeOperation = 'source-over';
  // Luftgegner
  G.foes.forEach(f => { if (f.air) drawAir(f); });
  // Bomben
  G.bombs.forEach(b => {
    glow(b.x, b.y, b.big ? 9 : 7, 'rgba(255,177,60,.5)');
    ctx.fillStyle = '#ffb13c'; ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 2, 4, 4); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
  });
  // Effekte
  G.fx.forEach(e => {
    const a = 1 - e.t / e.life;
    if (e.k === 'p') { ctx.globalAlpha = e.dust ? a * 0.6 : a; ctx.fillStyle = e.c; ctx.fillRect(Math.round(e.x), Math.round(e.y), e.dust ? 1 : 2, e.dust ? 1 : 2); ctx.globalAlpha = 1; }
    else if (e.k === 'ring') { ctx.strokeStyle = `rgba(255,240,200,${a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Math.round(e.x), Math.round(e.y), e.r, 0, 7); ctx.stroke(); }
    else if (e.k === 'glow') { ctx.globalCompositeOperation = 'lighter'; glow(e.x, e.y, e.r * (0.6 + a * 0.4), `rgba(255,150,60,${a * 0.7})`); ctx.globalCompositeOperation = 'source-over'; }
  });
  // dunkle Etappe: Vignette
  if (st.dark) { const vg = ctx.createRadialGradient(p.sx + 40, p.y - 20, 30, p.sx + 40, p.y - 20, W * 0.8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,8,.75)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,240,220,${G.flash * 2})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
  hud();
}
function glow(x, y, r, col) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function drawGround(st) {
  const [c0, c1, c2] = st.ground;
  // Profil
  ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 2) ctx.lineTo(x, groundY(x + G.cam));
  ctx.lineTo(W, H); ctx.closePath();
  const g = ctx.createLinearGradient(0, GROUND - 6, 0, H); g.addColorStop(0, c0); g.addColorStop(0.25, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fill();
  // Kieselsteine und Struktur
  for (let x = 0; x < W; x += 3) {
    const wx = Math.floor((x + G.cam) / 3);
    const h = hsh(wx, 9); if (h > 0.22) continue;
    const yy = groundY(x + G.cam) + 4 + hsh(wx, 4) * (H - GROUND - 8);
    ctx.fillStyle = h < 0.07 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.22)';
    ctx.fillRect(x, Math.round(yy), h < 0.05 ? 2 : 1, 1);
  }
  // heller Rand (Streiflicht)
  ctx.strokeStyle = 'rgba(230,220,255,.55)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x <= W; x += 2) { const y = groundY(x + G.cam) + 0.5; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.stroke();
  // Kraterränder
  G.craters.forEach(c => {
    const a = c.x - G.cam, b = a + c.w; if (b < 0 || a > W) return;
    ctx.strokeStyle = 'rgba(10,6,24,.55)'; ctx.lineWidth = 3;
    ctx.beginPath(); for (let x = a; x <= b; x += 2) { const y = groundY(x + G.cam) + 1.5; if (x === a) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
    ctx.fillStyle = c1; ctx.fillRect(Math.round(a) - 3, Math.round(groundAt(c.x)) - 2, 4, 2); ctx.fillRect(Math.round(b) - 1, Math.round(groundAt(c.x + c.w)) - 2, 4, 2);
  });
}
function drawBuggy(p) {
  const blink = p.inv > 0 && Math.floor(G.t * 14) % 2 === 0;
  ctx.save();
  ctx.translate(Math.round(p.sx), Math.round(p.y));
  ctx.rotate(p.tilt);
  if (blink) ctx.globalAlpha = 0.45;
  // Scheinwerferkegel (modern)
  ctx.globalCompositeOperation = 'lighter';
  const lg = ctx.createLinearGradient(14, 0, 110, 0); lg.addColorStop(0, 'rgba(255,240,200,.32)'); lg.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(110, -26); ctx.lineTo(110, 6); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  const bob = !p.air ? Math.round(Math.sin(G.t * 18) * 0.6) : 0;
  if (ART.buggy) {
    const im = ART.buggy;
    ctx.drawImage(im, -Math.round(im.width / 2), -im.height + 1 + bob);
  } else {
    // Rumpf
    ctx.fillStyle = '#d9d4ec'; ctx.fillRect(-16, -14 + bob, 32, 7);
    ctx.fillStyle = '#9a92c0'; ctx.fillRect(-16, -8 + bob, 32, 2);
    ctx.fillStyle = '#ff3fa4'; ctx.fillRect(-14, -12 + bob, 10, 2);
    ctx.fillStyle = '#3ff2ff'; ctx.fillRect(4, -18 + bob, 8, 4); ctx.fillStyle = '#fff'; ctx.fillRect(5, -18 + bob, 2, 1);
    ctx.fillStyle = '#5a5480'; ctx.fillRect(-6, -18 + bob, 10, 4);
    // Kanonen
    ctx.fillStyle = '#2a2640'; ctx.fillRect(14, -12 + bob, 6, 2); ctx.fillRect(-4, -24 + bob, 2, 7);
    // Antenne
    ctx.fillStyle = '#9a92c0'; ctx.fillRect(-14, -22 + bob, 1, 8); ctx.fillStyle = '#ff3fa4'; ctx.fillRect(-15, -23 + bob, 3, 2);
    // Räder (drehen sich)
    [-12, 0, 12].forEach((wx, i) => {
      const yy = -3 + (p.air ? 1 : Math.round(Math.sin(G.t * 20 + i) * 0.7));
      ctx.fillStyle = '#1c1830'; ctx.beginPath(); ctx.arc(wx, yy, 4, 0, 7); ctx.fill();
      ctx.fillStyle = '#7a72a0'; const a = G.t * 14 + i; ctx.fillRect(Math.round(wx + Math.cos(a) * 2) - 1, Math.round(yy + Math.sin(a) * 2) - 1, 2, 2);
    });
  }
  // Rücklicht
  glow(-17, -10 + bob, 5, 'rgba(255,40,80,.7)');
  ctx.restore();
}
function drawAir(f) {
  const fl = f.flash > 0, x = Math.round(f.x), y = Math.round(f.y);
  if (f.type === 'missile') {
    glow(x + 8, y, 8, 'rgba(255,120,40,.6)');
    ctx.fillStyle = '#d0d0e0'; ctx.fillRect(x - 6, y - 2, 12, 4); ctx.fillStyle = '#ff3f3f'; ctx.fillRect(x - 8, y - 1, 3, 2); ctx.fillStyle = '#ffb13c'; ctx.fillRect(x + 6, y - 1, 3 + Math.floor(G.t * 20) % 3, 2);
    return;
  }
  const img = ART[f.type];
  if (img) { ctx.drawImage(fl ? ART[f.type + '_f'] : img, x - Math.round(img.width / 2), y - Math.round(img.height / 2)); }
  else if (f.type === 'drone') {
    ctx.fillStyle = fl ? '#fff' : '#3a3458'; ctx.beginPath(); ctx.ellipse(x, y, 9, 3.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = fl ? '#fff' : '#5a5480'; ctx.beginPath(); ctx.ellipse(x, y - 3, 5, 3, 0, Math.PI, 0); ctx.fill();
    const on = Math.floor(G.t * 8 + f.t) % 3;
    for (let k = -1; k <= 1; k++) { ctx.fillStyle = on === k + 1 ? '#3ff2ff' : '#1a5a66'; ctx.fillRect(x + k * 5 - 1, y, 2, 1); }
  } else if (f.type === 'bomber') {
    ctx.fillStyle = fl ? '#fff' : '#4a3a6a'; ctx.beginPath(); ctx.moveTo(x + 16, y); ctx.lineTo(x - 14, y - 6); ctx.lineTo(x - 16, y + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = fl ? '#fff' : '#ff3fa4'; ctx.fillRect(x - 4, y - 2, 8, 2);
  }
  // Antriebsleuchten (modern)
  ctx.globalCompositeOperation = 'lighter'; glow(x, y + 3, f.type === 'bomber' ? 12 : 8, 'rgba(63,242,255,.35)'); ctx.globalCompositeOperation = 'source-over';
}
function drawBoss(b) {
  const x = Math.round(b.x), y = Math.round(b.y), fl = b.flash > 0 && Math.floor(G.t * 60) % 3 === 0;
  if (ART.walker) { const im = ART.walker; ctx.drawImage(fl ? ART.walker_f : im, x - Math.round(im.width / 2), Math.round(groundAt(b.x + G.cam)) - im.height + 2 + Math.round(Math.sin(b.step) * 1.5)); }
  else {
    const gy = groundAt(b.x + G.cam), lift = Math.sin(b.step) * 2;
    // Beine
    ctx.strokeStyle = '#2a2440'; ctx.lineWidth = 4;
    [[-18, 0], [18, Math.PI]].forEach(([dx, ph]) => { const k = Math.sin(b.step + ph) * 6; ctx.beginPath(); ctx.moveTo(x + dx * 0.6, y + 4); ctx.lineTo(x + dx + k, y + 20); ctx.lineTo(x + dx + k * 0.5, gy); ctx.stroke(); });
    ctx.fillStyle = fl ? '#fff' : '#4a4068'; ctx.fillRect(x - 28, y - 22 + lift, 56, 26);
    ctx.fillStyle = fl ? '#fff' : '#6a6090'; ctx.fillRect(x - 24, y - 30 + lift, 40, 10);
    ctx.fillStyle = '#ff3fa4'; ctx.fillRect(x - 20, y - 26 + lift, 12, 3); glow(x - 14, y - 25 + lift, 10, 'rgba(255,63,164,.6)');
    ctx.fillStyle = '#2a2440'; ctx.fillRect(x - 40, y - 12 + lift, 14, 4); ctx.fillRect(x - 10, y - 38 + lift, 4, 10);
  }
  // Lebensbalken
  const w = 120; ctx.fillStyle = '#000'; ctx.fillRect(W / 2 - w / 2 - 1, 18, w + 2, 5); ctx.fillStyle = '#ff3fa4'; ctx.fillRect(W / 2 - w / 2, 19, w * Math.max(0, b.hp) / b.max, 3);
}
function hud() {
  const st = stageDef();
  text(String(G.score).padStart(7, '0'), 6, 5, '#fff');
  text('HI ' + String(Math.max(hiscore, G.score)).padStart(7, '0'), W / 2, 5, '#ffc53d', 1, 'center');
  // Fortschritt der Etappe
  const s0 = stageStart(), prog = clamp((G.p.wx - s0) / st.len, 0, 1), bw = 90, bx = 6, by = 14;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(bx, by, bw, 3); ctx.fillStyle = '#3ff2ff'; ctx.fillRect(bx, by, Math.round(bw * prog), 3);
  ctx.fillStyle = '#fff'; ctx.fillRect(bx + Math.round(bw * prog) - 1, by - 1, 2, 5);
  text('ETAPPE ' + (G.stage + 1), bx + bw + 6, by - 1, '#c9b8ff');
  // Leben
  for (let i = 0; i < Math.min(G.lives, 6); i++) { ctx.fillStyle = '#d9d4ec'; ctx.fillRect(W - 54 + i * 8, 6, 6, 3); ctx.fillStyle = '#3ff2ff'; ctx.fillRect(W - 52 + i * 8, 4, 2, 2); ctx.fillStyle = '#1c1830'; ctx.fillRect(W - 54 + i * 8, 9, 2, 2); ctx.fillRect(W - 50 + i * 8, 9, 2, 2); }
  if (G.banner) {
    ctx.globalAlpha = Math.min(1, G.banner.life * 2);
    text(G.banner.t, W / 2, 64, '#3ff2ff', 2, 'center', true);
    if (G.banner.sub) text(G.banner.sub, W / 2, 80, '#ffc53d', 1, 'center');
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- Klang (eigene Synthwave-Chiptunes)
const AUDIO = (() => {
  let ac = null, master, musicG, sfxG, noise, on = true, timer = null, bossMode = false, lastShot = 0;
  try { on = localStorage.getItem('kraterlaeufer-ton') !== 'aus'; } catch (e) { /* privat */ }
  function unlock() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ac = new AC(); master = ac.createGain(); master.gain.value = on ? 0.7 : 0; master.connect(ac.destination);
      musicG = ac.createGain(); musicG.gain.value = 0.3; musicG.connect(master);
      sfxG = ac.createGain(); sfxG.gain.value = 0.55; sfxG.connect(master);
      noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
  }
  const mid = n => 440 * Math.pow(2, (n - 69) / 12);
  function tone(type, f0, f1, t, dur, vol, bus, cut) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (cut) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(cut, t); f.frequency.exponentialRampToValueAtTime(cut * 0.25, t + dur); o.connect(f); f.connect(g); } else o.connect(g);
    g.connect(bus || sfxG); o.start(t); o.stop(t + dur + 0.02);
  }
  function hiss(t, dur, vol, freq, bus) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; f.type = 'lowpass'; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(80, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function sfx(k) {
    if (!ac || !on || ac.state !== 'running') return;
    const t = ac.currentTime;
    if (k === 'shot') { if (t - lastShot < 0.1) return; lastShot = t; tone('square', 1200, 300, t, 0.07, 0.04); tone('square', 900, 1800, t, 0.06, 0.025); }
    if (k === 'jump') tone('square', 300, 700, t, 0.15, 0.05);
    if (k === 'land') hiss(t, 0.1, 0.12, 900);
    if (k === 'hit') tone('square', 260, 180, t, 0.04, 0.03);
    if (k === 'crack') { hiss(t, 0.2, 0.25, 3000); tone('triangle', 200, 80, t, 0.15, 0.15); }
    if (k === 'boom') { hiss(t, 0.4, 0.4, 2400); tone('triangle', 150, 45, t, 0.35, 0.25); }
    if (k === 'bigboom') { hiss(t, 1.1, 0.6, 1800); tone('triangle', 100, 28, t, 1, 0.4); }
    if (k === 'drop') tone('sine', 900, 300, t, 0.35, 0.04);
    if (k === 'eshot') tone('sawtooth', 500, 200, t, 0.2, 0.04);
    if (k === 'power') [69, 73, 76, 81].forEach((n, i) => tone('square', mid(n), 0, t + i * 0.07, 0.14, 0.06));
    if (k === 'alarm') for (let i = 0; i < 4; i++) tone('sawtooth', 700, 520, t + i * 0.32, 0.26, 0.05);
  }
  // Musik: Synthwave in a-Moll (Am F C G), Bass-Arpeggio, Lead, Kick, Snare, Hi-Hat
  const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const LEAD = [76, 0, 74, 72, 0, 71, 72, 0, 69, 0, 72, 0, 74, 0, 72, 71, 67, 0, 71, 72, 74, 0, 76, 0, 79, 0, 76, 0, 74, 72, 71, 0];
  function startMusic() {
    if (!ac || timer || !on) return;
    let step = 0, next = ac.currentTime + 0.1;
    timer = setInterval(() => {
      const spb = bossMode ? 0.1 : 0.115;
      while (next < ac.currentTime + 0.3) {
        const bar = Math.floor(step / 16) % 4, ch = CH[bar], s16 = step % 16;
        tone('sawtooth', mid(ch[s16 % 3] - 24 + (bossMode ? 1 : 0)), 0, next, spb * 0.9, 0.12, musicG, 900);
        if (s16 % 4 === 0) tone('sine', 140, 40, next, 0.18, 0.5, musicG);
        if (s16 % 8 === 4) hiss(next, 0.12, 0.22, 4000, musicG);
        if (s16 % 2 === 1) hiss(next, 0.03, 0.06, 9000, musicG);
        const l = LEAD[step % 32];
        if (l && Math.floor(step / 64) % 2 === 1) tone('square', mid(l + (bossMode ? 1 : 0)), 0, next, spb * 1.8, 0.05, musicG, 3000);
        if (s16 === 0) ch.forEach(n => tone('triangle', mid(n), 0, next, spb * 15, 0.03, musicG));
        next += spb; step++;
      }
    }, 60);
  }
  return {
    unlock, sfx,
    play() { unlock(); startMusic(); },
    stop() { clearInterval(timer); timer = null; },
    boss(b) { bossMode = b; },
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem('kraterlaeufer-ton', on ? 'an' : 'aus'); } catch (e) { /* privat */ } if (master) master.gain.value = on ? 0.7 : 0; if (on && state === 'play') startMusic(); else if (!on) this.stop(); return on; },
  };
})();

// ---------------------------------------------------------------- Ablauf
const $ = id => document.getElementById(id);
function show(id) {
  ['title', 'pause', 'over'].forEach(k => { $(k).hidden = k !== id; });
  $('pad').style.display = id ? 'none' : 'block';
  $('pauseBtn').style.display = id ? 'none' : 'block';
}
function start() { AUDIO.unlock(); newGame(); state = 'play'; show(null); AUDIO.boss(false); AUDIO.play(); last = performance.now(); }
function togglePause() {
  if (state === 'play') { state = 'pause'; show('pause'); AUDIO.stop(); }
  else if (state === 'pause') { state = 'play'; show(null); AUDIO.play(); last = performance.now(); }
}
function gameOver() {
  state = 'over'; AUDIO.stop();
  if (G.score > hiscore) { hiscore = G.score; try { localStorage.setItem('kraterlaeufer-hi', hiscore); } catch (e) { /* privat */ } }
  $('finalScore').textContent = String(G.score).padStart(7, '0');
  $('hiOver').textContent = 'REKORD ' + String(hiscore).padStart(7, '0') + ' · ETAPPE ' + (G.stage + 1);
  show('over');
}
function titleHi() { $('hiTitle').textContent = hiscore ? 'REKORD ' + String(hiscore).padStart(7, '0') : ''; $('sound').textContent = 'TON: ' + (AUDIO.on ? 'AN' : 'AUS'); }
$('start').onclick = start; $('again').onclick = start; $('resume').onclick = togglePause;
$('quit').onclick = () => { state = 'title'; titleHi(); show('title'); };
$('sound').onclick = () => { AUDIO.unlock(); AUDIO.toggle(); titleHi(); };
$('pauseBtn').onclick = togglePause;
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') togglePause(); });
titleHi();

// Titel: der Rover fährt im Hintergrund von selbst
function attract(dt) {
  if (!G) newGame();
  G.t += dt; G.p.wx += 60 * dt; G.cam = G.p.wx - G.p.sx; spawnAhead();
  G.p.y = groundY(G.p.wx); G.p.inv = 0; G.banner = null;
  // Krater automatisch überspringen
  G.craters = G.craters.filter(c => c.x > G.p.wx + 30 || c.x + c.w < G.p.wx - 10);
  G.obs = G.obs.filter(o => o.x > G.p.wx + 20 || o.x < G.p.wx - 30); G.foes = [];
  draw();
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (state === 'play') { update(dt); if (state === 'play') draw(); }
  else if (state === 'title') attract(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Testzugang für automatische Prüfungen
window.__kl = { get G() { return G; }, get state() { return state; }, start, update: dt => update(dt), pad, keys };
