(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var world = $("world"), mapEl = $("map"), ctx = mapEl.getContext("2d");
  var overEl = $("over"), bannerEl = $("banner"), fadeEl = $("fade"), infoEl = $("info"), hpEl = $("hp");

  /* ============================================================
     PIXEL ART: text maps turned into crisp SVG pictures
     ============================================================ */
  function pix(map, pal, s) {
    var W = 0, i;
    for (i = 0; i < map.length; i++) W = Math.max(W, map[i].length);
    var h = map.length, out = "";
    for (var y = 0; y < h; y++) {
      var row = map[y] + new Array(W - map[y].length + 1).join(".");
      var x = 0;
      while (x < W) {
        var c = row[x];
        if (c === ".") { x++; continue; }
        var x2 = x;
        while (x2 < W && row[x2] === c) x2++;
        out += '<rect x="' + x + '" y="' + y + '" width="' + (x2 - x) + '" height="1" fill="' + pal[c] + '"/>';
        x = x2;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (W * s) + '" height="' + (h * s) +
      '" viewBox="0 0 ' + W + ' ' + h + '" shape-rendering="crispEdges">' + out + '</svg>';
  }
  function svgImage(svg) {
    var img = new Image();
    img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
    return img;
  }

  var PAL = {
    k: "#1a1426", s: "#f2c9a0", S: "#d9a273", h: "#5a3216", H: "#8a5a2b", e: "#1a1426", w: "#ffffff",
    a: "#3b6fd4", A: "#264a99", B: "#7fa8ff", g: "#ffd84a", G: "#c9a227",
    n: "#2e3560", N: "#1f2447", l: "#7a4a26", L: "#4a2a12", r: "#d23b43", R: "#8f2229",
    f: "#f4f8fc", F: "#a9b6c8"
  };
  var BODY = [
    "...kkkkkk...", "..khhhhhhk..", ".khHhhhhhhk.", ".khhhhssssk.", ".khhssswesk.", "..ksssssssk.",
    "...ksssssk..", "....kssk....", ".kaBBaaaaAk.", ".kaBaaggaAk.", ".kaaaaggaAk.", ".kaaaaaaaAk.",
    ".kgggGggggk.", ".knnnnnnnnk."
  ];
  var LEG = ["knnnnk.", "knnnNk.", "knnnNk.", "kllllk.", "kllllk.", "kllllLk", "kLLLLLk", "kkkkkkk"];
  var CAPE = ["krrRRk", "krrRRk", "krrRRk", "krrRRk", "krrRRk", "krRRRk", "krRRRk", "kRRRRk", "kRRRk.", "kkkk.."];
  var ARM = ["kBak", "kaak", "kaAk", "kaAk", "kssk", "kkkk"];
  var SWORD = ["...kk..."];
  for (var i = 0; i < 15; i++) SWORD.push("..kfFk..");
  SWORD.push("kggggggk", "..klLk..", "..klLk..", "..klLk..", "..kggk..");
  var PISTOL = ["kkkkkkkk", "kfFFFFfk", "kkkkkkkk", "kllk....", "kLLk....", "kkkk...."];

  var HEART = [".kkk.kkk.", "kwRRkRRRk", "kRRRRRRDk", "kRRRRRRDk", ".kRRRRDk.", "..kRRDk..", "...kRk...", "....k...."];
  var HEART_SVG = pix(HEART, { k: "#000000", R: "#ff3b3b", D: "#c21414", w: "#ffd0d0" }, 4);

  /* zombie: drawn from the sprite sheet zombie.png (see game.css) */

  $("heart").innerHTML = HEART_SVG;
  $("ldheart").innerHTML = HEART_SVG;

  /* ============================================================
     SHARED STATE
     ============================================================ */
  var CASTLES = [
    { name: "Castle of Limits",        map: 0, tx: 14, ty: 29, waves: [4, 6],          speed: [40, 62],   hp: 3, tier: 0, theme: "" },
    { name: "Castle of Slopes",        map: 0, tx: 30, ty: 12, waves: [5, 8, 10],      speed: [48, 72],   hp: 3, tier: 0, theme: "" },
    { name: "Castle of Integrals",     map: 0, tx: 50, ty: 29, waves: [6, 10, 14, 18], speed: [55, 88],   hp: 4, tier: 1, theme: "" },
    { name: "Castle of Series",        map: 1, tx: 14, ty: 23, waves: [8, 12, 16],     speed: [60, 95],   hp: 5, tier: 1, theme: "ice" },
    { name: "Castle of Sequences",     map: 1, tx: 52, ty: 33, waves: [10, 14, 18],    speed: [64, 100],  hp: 5, tier: 2, theme: "ice" },
    { name: "Castle of Chains",        map: 2, tx: 14, ty: 15, waves: [10, 15, 20],    speed: [66, 105],  hp: 6, tier: 2, theme: "sand" },
    { name: "Castle of Optima",        map: 2, tx: 46, ty: 31, waves: [12, 16, 20, 24], speed: [70, 110], hp: 6, tier: 3, theme: "sand" },
    { name: "Castle of Differentials", map: 3, tx: 12, ty: 33, waves: [12, 18, 24],    speed: [72, 112],  hp: 7, tier: 3, theme: "swamp" },
    { name: "Castle of Fourier",       map: 3, tx: 40, ty: 19, waves: [14, 20, 26],    speed: [75, 118],  hp: 8, tier: 4, theme: "swamp" },
    { name: "Castle of Infinity",      map: 4, tx: 36, ty: 23, waves: [14, 20],        speed: [80, 120],  hp: 8, tier: 5, theme: "lava", boss: true, bossHp: 60 }
  ];
  var NC = CASTLES.length, FINAL = NC - 1, THEMES = ["ice", "sand", "swamp", "lava"];
  var cleared = [];
  for (var cz = 0; cz < NC; cz++) cleared.push(false);
  var SV = { coins: 0, up: {}, chests: {}, talked: {}, q: {} };
  try {
    var sv = JSON.parse(localStorage.getItem("mk-save4") || "{}"); for (var qk in sv) SV[qk] = sv[qk];
    var sc = JSON.parse(localStorage.getItem("mk-cleared4") || "[]"); for (var ci = 0; ci < NC; ci++) cleared[ci] = !!sc[ci];
  } catch (e) {}
  if (!SV.q) SV.q = {};
  function save() { try { localStorage.setItem("mk-save4", JSON.stringify(SV)); } catch (e) {} }
  function saveCleared() { try { localStorage.setItem("mk-cleared4", JSON.stringify(cleared)); } catch (e) {} }
  function lv(k) { return SV.up[k] || 0; }
  function maxhp() { return 100 + 20 * lv("hp"); }
  function magSize() { return 12 + 4 * lv("mag"); }

  var mode = "map";                // "map" or "castle"
  var started = false;             // set when the loading screen is dismissed
  var keys = { left: false, right: false, up: false, down: false };
  var MAXHP = 100;
  var P = { x: 80, y: 0, vy: 0, dir: 1, hp: 100, max: 100, inv: 0, atk: 0, ammo: 12, mag: 12, reload: 0, aimT: 0, flashT: 0, shotCd: 0 };
  var zombies = [], bullets = [];
  var C = null;                    // current castle fight
  var stepT = 0, over = false, time = 0;

  function sfx(name) { if (window.SFX) SFX.play(name); }
  function isDark() {
    var r = document.documentElement, t = r.getAttribute("data-theme");
    return t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  /* ---------- health bar: heart + 4 segments ---------- */
  function drawHealth() {
    var segs = $("bar").children, per = P.max / segs.length;
    for (var i = 0; i < segs.length; i++) {
      var f = Math.max(0, Math.min(1, (P.hp - i * per) / per));
      segs[i].firstChild.style.width = (f * 100) + "%";
    }
    hpEl.classList.toggle("low", P.hp > 0 && P.hp <= P.max * 0.25);
    hpEl.setAttribute("aria-label", "Health " + Math.ceil(P.hp) + " of " + P.max);
  }

  function banner(text) {
    bannerEl.textContent = text;
    bannerEl.classList.remove("show");
    void bannerEl.offsetWidth;
    bannerEl.classList.add("show");
  }

  /* ============================================================
     OVERWORLD MAP
     ============================================================ */
  var T = 32, COLS = 64, ROWS = 42;
  var GRASS = 0, WATER = 1, TREE = 2, PATH = 3, ROCK = 4, BRIDGE = 6, DOOR = 7, WALL = 8;
  var tiles = [], doorAt = {};
  var curMap = 0, BM, ui = null, talk = null, warp = false, ents = [], nearE = null, mini = null, showMini = true;
  /* five biomes, each 64 x 42 tiles. roads are [x1, y1, x2, y2]; lakes are [x, y, radius] (lava in the Ember Peaks) */
  var BIOMES = [
    { name: "Greenlands", kind: "green", g1: "#4caf3a", g2: "#47a736", w1: "#2f7fd6", w2: "#3589dd", foam: "#e8f6ff", wave: "rgba(255,255,255,.35)", sea: "#1d5fae",
      path: "#d9ad6e", pdot: "#bd8c4d", trees: 0.22, seed: 7, cols: 64, rows: 42, start: { x: 4, y: 21 }, mm: "#2a7a34",
      roads: [[4, 21, 4, 30], [4, 30, 60, 30], [30, 30, 30, 13]],
      lakes: [[12, 8, 3], [22, 20, 2.6], [40, 8, 3.2], [58, 14, 3], [10, 38, 2.6], [34, 38, 3], [48, 22, 2.4], [24, 6, 2]] },
    { name: "Frozen Tundra", kind: "snow", g1: "#eef5fa", g2: "#e1ecf5", w1: "#3f86c4", w2: "#4a92cf", foam: "#e8f6ff", wave: "rgba(255,255,255,.4)", sea: "#2a6aa6",
      path: "#bfae96", pdot: "#a89a82", trees: 0.22, seed: 21, cols: 64, rows: 42, start: { x: 6, y: 24 }, mm: "#1f6a46",
      roads: [[4, 24, 30, 24], [30, 24, 30, 34], [30, 34, 60, 34]],
      lakes: [[10, 10, 3.2], [22, 14, 2.6], [40, 12, 3], [56, 18, 3.2], [14, 36, 3], [44, 26, 2.4], [58, 38, 2.6], [8, 30, 2]] },
    { name: "Scorched Desert", kind: "sand", g1: "#e6c878", g2: "#e0c070", w1: "#2f9fd0", w2: "#38aadb", foam: "#fff6d8", wave: "rgba(255,255,255,.35)", sea: "#2488bd",
      path: "#b98a52", pdot: "#9c7140", trees: 0.12, seed: 33, cols: 64, rows: 42, start: { x: 6, y: 16 }, mm: "#3f9a4a",
      roads: [[4, 16, 28, 16], [28, 16, 28, 32], [28, 32, 60, 32]],
      lakes: [[40, 12, 2.6], [16, 26, 2.2], [52, 20, 2.4], [10, 36, 2.4], [36, 38, 2], [58, 8, 2]] },
    { name: "Haunted Swamp", kind: "swamp", g1: "#4a6b3a", g2: "#436234", w1: "#3a5a3f", w2: "#406646", foam: "#8fb08a", wave: "rgba(170,210,150,.28)", sea: "#2d4a35",
      path: "#8a7a52", pdot: "#6f6040", trees: 0.24, seed: 45, cols: 64, rows: 42, start: { x: 6, y: 34 }, mm: "#2f4a2a",
      roads: [[4, 34, 20, 34], [20, 34, 20, 20], [20, 20, 58, 20]],
      lakes: [[10, 10, 3.4], [30, 10, 3], [50, 10, 3.4], [8, 24, 3], [30, 28, 3.6], [46, 30, 3], [56, 38, 3], [20, 38, 2.6]] },
    { name: "Ember Peaks", kind: "lava", g1: "#3b3338", g2: "#352e32", w1: "#e8501a", w2: "#ff7a1f", foam: "#ffd34a", wave: "rgba(255,225,90,.55)", sea: "#a93510",
      path: "#6b5a52", pdot: "#54463f", trees: 0.12, seed: 57, cols: 64, rows: 42, start: { x: 6, y: 24 }, mm: "#2a2226",
      roads: [[4, 24, 56, 24], [56, 24, 56, 10]],
      lakes: [[14, 12, 3.4], [24, 34, 3.4], [44, 32, 3.4], [48, 12, 3.4], [10, 34, 3], [30, 8, 2.6], [60, 30, 2]] }
  ];
  var MAPOBJ = [
    { chests: [[9, 25], [24, 25], [40, 24], [36, 16], [24, 36], [46, 35], [56, 26], [20, 12], [8, 35]], npcs: [
      { tx: 8, ty: 27, name: "Blacksmith Gauss", col: "#c0504d", hair: "#444", shop: true, q: ["gear"], lines: ["Welcome, hero! Bring coins and I will make you stronger.", "I can upgrade your armor, boots, sword and pistol."] },
      { tx: 22, ty: 27, name: "Villager Euler", col: "#3aa845", hair: "#8a5a2b", gift: 10, q: ["hello", "zombies", "tour"], lines: ["Zombies drop coins. Collect them to buy upgrades!", "Chests hide around the map. Press E next to one."] },
      { tx: 38, ty: 27, name: "Prof. Newton", col: "#7a4ad1", hair: "#eeeeee", gift: 20, q: ["treasure", "c0", "c1", "c2"], lines: ["The derivative is the slope at a single point.", "Clear all three castles to open the portal in the east."] }
    ] },
    { chests: [[9, 21], [22, 27], [36, 28], [42, 20], [56, 30], [48, 38], [20, 38], [28, 12]], npcs: [
      { tx: 8, ty: 27, name: "Frost Smith Taylor", col: "#4a8fd1", hair: "#ffffff", shop: true, q: ["forge"], lines: ["Brrr! Even forges freeze here.", "Upgrade yourself before the next castle."] },
      { tx: 24, ty: 27, name: "Hermit Maclaurin", col: "#8a6a4a", hair: "#cccccc", gift: 25, q: ["c3", "c4"], lines: ["Every smooth curve is a sum of tiny pieces.", "Two ice castles guard the road to the desert."] },
      { tx: 40, ty: 31, name: "Explorer Fourier", col: "#d18a3a", hair: "#5a3216", gift: 15, q: ["ice_kill", "ice_chest"], lines: ["I walked here from the green hills. My toes are still frozen!", "Waves and cycles are everywhere in the snow."] }
    ] },
    { chests: [[9, 13], [22, 19], [36, 20], [42, 26], [56, 28], [50, 38], [12, 30], [40, 6]], npcs: [
      { tx: 8, ty: 19, name: "Smith Cauchy", col: "#b0663a", hair: "#222", shop: true, q: ["sandsmith"], lines: ["Hot forge, hot deals. Buy something shiny.", "The sand wears out your boots quickly."] },
      { tx: 22, ty: 22, name: "Nomad Leibniz", col: "#c9a227", hair: "#6b4425", gift: 30, q: ["c5", "c6"], lines: ["The sun never sets on a good proof.", "The desert castles test your chain rule and your nerves."] },
      { tx: 40, ty: 29, name: "Wanderer Descartes", col: "#3a8ad1", hair: "#444", gift: 20, q: ["sand_kill", "sand_coin"], lines: ["I think, therefore I run from zombies.", "Plot your path before you enter any castle."] }
    ] },
    { chests: [[8, 30], [14, 26], [36, 24], [44, 24], [54, 24], [48, 36], [16, 38], [34, 14]], npcs: [
      { tx: 7, ty: 31, name: "Smith Laplace", col: "#5a8a6a", hair: "#333", shop: true, q: [], lines: ["Careful, the mud ruins good armor.", "Take an upgrade. You will need it."] },
      { tx: 24, ty: 26, name: "Witch Hazel", col: "#8a3ad1", hair: "#2a1a3a", gift: 35, q: ["swamp_kill", "c7", "c8"], lines: ["Eee hee! A living visitor!", "The zombies here rose from the bog. They are angry."] },
      { tx: 50, ty: 25, name: "Herbalist Bernoulli", col: "#6aa84a", hair: "#aaa", gift: 25, q: ["swamp_chest"], lines: ["Mushrooms, moss and mystery. I love it here.", "Some chests sink in the mud. Look carefully."] }
    ] },
    { chests: [[10, 21], [22, 28], [30, 18], [44, 28], [54, 11], [59, 11], [54, 17], [59, 17]], npcs: [
      { tx: 8, ty: 27, name: "Forge Master Riemann", col: "#d1503a", hair: "#222", shop: true, q: ["lava_forge"], lines: ["This forge never goes out.", "Last chance to upgrade before Lord Infinity."] },
      { tx: 20, ty: 21, name: "Elder Cantor", col: "#e0e0ff", hair: "#ffffff", gift: 50, q: ["boss"], lines: ["Some infinities are bigger than others.", "Lord Infinity waits in the great castle. Be ready."] },
      { tx: 50, ty: 27, name: "Ash Wanderer Godel", col: "#8a8a9a", hair: "#555", gift: 30, q: ["lava_kill"], lines: ["The ash never stops falling.", "Treasure rooms hide at the end of the northern road."] }
    ] }
  ];
  var NPCN = {};
  MAPOBJ.forEach(function (o, m) { o.npcs.forEach(function (n, i) { n.id = "n" + m + "_" + i; NPCN[n.id] = { name: n.name, map: m }; }); });
  /* portals: "need" lists the castles that must be cleared first */
  var PORTALS = [
    { map: 0, tx: 60, ty: 30, to: 1, sx: 6,  sy: 24, need: [0, 1, 2], push: -56, label: "Frozen Tundra" },
    { map: 1, tx: 4,  ty: 24, to: 0, sx: 58, sy: 30, push: 0, label: "Greenlands" },
    { map: 1, tx: 60, ty: 34, to: 2, sx: 6,  sy: 16, need: [3, 4], push: -56, label: "Scorched Desert" },
    { map: 2, tx: 4,  ty: 16, to: 1, sx: 58, sy: 34, push: 0, label: "Frozen Tundra" },
    { map: 2, tx: 60, ty: 32, to: 3, sx: 6,  sy: 34, need: [5, 6], push: -56, label: "Haunted Swamp" },
    { map: 3, tx: 4,  ty: 34, to: 2, sx: 58, sy: 32, push: 0, label: "Scorched Desert" },
    { map: 3, tx: 58, ty: 20, to: 4, sx: 6,  sy: 24, need: [7, 8], push: -56, label: "Ember Peaks" },
    { map: 4, tx: 4,  ty: 24, to: 3, sx: 56, sy: 20, push: 0, label: "Haunted Swamp" }
  ];
  var START = BIOMES[0].start;

  function buildMap(m) {
    BM = BIOMES[m]; COLS = BM.cols; ROWS = BM.rows; tiles = []; doorAt = {};
    var seed = BM.seed;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    var x, y;
    for (y = 0; y < ROWS; y++) {
      tiles[y] = [];
      for (x = 0; x < COLS; x++) {
        var d = Math.min(x, y, COLS - 1 - x, ROWS - 1 - y);
        tiles[y][x] = (d < 2 || (d === 2 && rnd() < 0.5)) ? WATER : GRASS;
      }
    }
    BM.lakes.forEach(function (l) {
      for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
        var dx = x - l[0], dy = y - l[1];
        if (Math.sqrt(dx * dx + dy * dy) < l[2] + rnd() * 0.6) tiles[y][x] = WATER;
      }
    });
    /* castle footprints: 5 wide, 4 tall, door in the bottom middle */
    var keep = {};
    CASTLES.forEach(function (c, idx) {
      if (c.map !== m) return;
      for (y = c.ty - 3; y <= c.ty; y++) for (x = c.tx - 2; x <= c.tx + 2; x++) tiles[y][x] = WALL;
      tiles[c.ty][c.tx] = DOOR;
      doorAt[c.tx + "," + c.ty] = idx;
      for (y = c.ty - 4; y <= c.ty + 2; y++) for (x = c.tx - 3; x <= c.tx + 3; x++) keep[x + "," + y] = true;
    });
    /* roads (2 tiles wide) with bridges where they cross water */
    function put(px, py) {
      if (px < 1 || py < 1 || px >= COLS - 1 || py >= ROWS - 1) return;
      var t = tiles[py][px];
      if (t === WALL || t === DOOR) return;
      tiles[py][px] = (t === WATER) ? BRIDGE : PATH;
      keep[px + "," + py] = true;
    }
    function lay(x1, y1, x2, y2) {
      var sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
      for (x = x1; x !== x2 + sx; x += sx) { put(x, y1); put(x, y1 + 1); }
      for (y = y1; y !== y2 + sy; y += sy) { put(x2, y); put(x2 + 1, y); }
    }
    BM.roads.forEach(function (r) { lay(r[0], r[1], r[2], r[3]); });
    /* keep the arrival spot walkable */
    for (y = BM.start.y - 1; y <= BM.start.y + 1; y++) for (x = BM.start.x - 1; x <= BM.start.x + 1; x++) {
      if (tiles[y][x] === WATER) tiles[y][x] = GRASS;
      keep[x + "," + y] = true;
    }
    /* trees and rocks */
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
      if (tiles[y][x] !== GRASS || keep[x + "," + y]) continue;
      if (Math.abs(x - BM.start.x) < 3 && Math.abs(y - BM.start.y) < 3) continue;
      var r = rnd();
      if (r < BM.trees) tiles[y][x] = TREE; else if (r < BM.trees + 0.035) tiles[y][x] = ROCK;
    }
    var o = MAPOBJ[m];
    ents = o.chests.map(function (p, i) { return { tx: p[0], ty: p[1], id: "c" + m + "_" + i, chest: true }; })
      .concat(o.npcs);
    ents.forEach(function (e) {
      [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) {
        var tx = e.tx + dd[0], ty = e.ty + dd[1], t = tiles[ty][tx];
        if (t === WATER || t === TREE || t === ROCK) tiles[ty][tx] = GRASS;
      });
    });
    /* make sure every chest and villager can be reached on foot: carve a path to the road if one is cut off */
    function passable(px, py) {
      if (px < 1 || py < 1 || px >= COLS - 1 || py >= ROWS - 1) return false;
      var t = tiles[py][px];
      return t === GRASS || t === PATH || t === BRIDGE || t === DOOR;
    }
    function reach() {
      var seen = {}, st = [[BM.start.x, BM.start.y]];
      seen[BM.start.x + "," + BM.start.y] = 1;
      while (st.length) {
        var p = st.pop();
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) {
          var nx = p[0] + dd[0], ny = p[1] + dd[1], k = nx + "," + ny;
          if (!seen[k] && passable(nx, ny)) { seen[k] = 1; st.push([nx, ny]); }
        });
      }
      return seen;
    }
    function touches(seen, e) {
      return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (dd) { return seen[(e.tx + dd[0]) + "," + (e.ty + dd[1])]; });
    }
    ents.forEach(function (e) {
      var seen = reach();
      if (touches(seen, e)) return;
      var cx = e.tx, cy = e.ty, g = 0;
      while (g++ < 400) {
        var dx = BM.start.x - cx, dy = BM.start.y - cy;
        if (!dx && !dy) break;
        var horiz = Math.abs(dx) >= Math.abs(dy);
        var nx = cx + (horiz ? Math.sign(dx) : 0), ny = cy + (horiz ? 0 : Math.sign(dy));
        var tt = tiles[ny] && tiles[ny][nx];
        if (tt === WALL || tt === DOOR || tt === undefined) { nx = cx + (horiz ? 0 : (Math.sign(dx) || 1)); ny = cy + (horiz ? (Math.sign(dy) || 1) : 0); }
        cx = nx; cy = ny; put(cx, cy);
        if (seen[cx + "," + cy]) break;
      }
    });
    /* tiny map picture for the corner */
    mini = document.createElement("canvas"); mini.width = COLS; mini.height = ROWS;
    var mc = mini.getContext("2d");
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
      var tl = tiles[y][x];
      mc.fillStyle = tl === WATER ? BM.w1 : tl === BRIDGE ? "#8a5a33" : tl === PATH || tl === DOOR ? BM.path : tl === TREE ? BM.mm : tl === ROCK ? "#8d8f94" : tl === WALL ? "#555a66" : BM.g1;
      mc.fillRect(x, y, 1, 1);
    }
  }
  buildMap(0);

  function solidTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
    for (var ei = 0; ei < ents.length; ei++) if (ents[ei].tx === tx && ents[ei].ty === ty) return true;
    var t = tiles[ty][tx];
    return t === WATER || t === TREE || t === ROCK || t === WALL;
  }

  var hero = { x: START.x * T + 16, y: START.y * T + 28, dir: 1, walk: 0, moving: false };
  var heroImgs = { body: svgImage(pix(BODY, PAL, 1)), leg: svgImage(pix(LEG, PAL, 1)), cape: svgImage(pix(CAPE, PAL, 1)) };

  function hash(x, y) { var h = (x * 73856093) ^ (y * 19349663); h = (h ^ (h >>> 13)) >>> 0; return h; }

  function drawTile(x, y, px, py) {
    var t = tiles[y][x], h = hash(x, y), c = ctx, i, K = BM.kind;
    var isWaterish = (t === WATER || t === BRIDGE);
    if (isWaterish) {
      c.fillStyle = ((x + y) & 1) ? BM.w1 : BM.w2;
      c.fillRect(px, py, T, T);
      var wv = Math.floor(time * 6 + (h % 8)) % 8;
      c.fillStyle = BM.wave;
      c.fillRect(px + 4 + wv * 2, py + 8 + (h % 3) * 8, 8, 2);
      c.fillRect(px + 16 - wv, py + 22, 6, 2);
      c.fillStyle = BM.foam;
      if (t === WATER) {
        if (y > 0 && !isW(x, y - 1)) c.fillRect(px, py, T, 3);
        if (y < ROWS - 1 && !isW(x, y + 1)) c.fillRect(px, py + T - 3, T, 3);
        if (x > 0 && !isW(x - 1, y)) c.fillRect(px, py, 3, T);
        if (x < COLS - 1 && !isW(x + 1, y)) c.fillRect(px + T - 3, py, 3, T);
        if (K === "swamp" && h % 11 === 0) { c.fillStyle = "#6b9a4a"; c.fillRect(px + 8, py + 10, 10, 6); c.fillRect(px + 11, py + 8, 4, 2); }
        if (K === "lava" && h % 5 === 0) { c.fillStyle = "rgba(255,240,140," + (0.35 + 0.35 * Math.sin(time * 3 + h)) + ")"; c.fillRect(px + (h % 20) + 2, py + ((h >> 4) % 20) + 2, 6, 6); }
      }
      if (t === BRIDGE) {
        var b1 = K === "lava" ? "#4a3a36" : K === "swamp" ? "#6b5a3a" : "#8a5a33", b2 = K === "lava" ? "#2e2220" : K === "swamp" ? "#4a3d26" : "#6b4425", b3 = K === "lava" ? "#6a524a" : K === "swamp" ? "#86724a" : "#a87445";
        c.fillStyle = b1; c.fillRect(px, py + 2, T, T - 4);
        c.fillStyle = b2;
        for (i = 0; i < 4; i++) c.fillRect(px + i * 8 + 6, py + 2, 2, T - 4);
        c.fillStyle = b3; c.fillRect(px, py + 2, T, 3); c.fillRect(px, py + T - 5, T, 3);
      }
      return;
    }
    if (t === PATH || t === DOOR) {
      c.fillStyle = BM.path; c.fillRect(px, py, T, T);
      c.fillStyle = BM.pdot;
      c.fillRect(px + (h % 20) + 2, py + ((h >> 5) % 20) + 2, 4, 4);
      c.fillRect(px + ((h >> 3) % 22) + 2, py + ((h >> 8) % 22) + 2, 3, 3);
      return;
    }
    /* ground base for everything else */
    c.fillStyle = ((x + y) & 1) ? BM.g1 : BM.g2;
    c.fillRect(px, py, T, T);
    if (t === WALL) return;
    if (t === GRASS || t === TREE || t === ROCK) {
      if (K === "green" || K === "snow") {
        if (h % 7 === 0) { c.fillStyle = K === "snow" ? "#c5d6e4" : "#357f27"; c.fillRect(px + (h % 18) + 4, py + ((h >> 4) % 18) + 6, 3, 6); c.fillRect(px + (h % 18) + 8, py + ((h >> 4) % 18) + 8, 3, 4); }
        if (K === "green" && h % 19 === 0 && t === GRASS) { c.fillStyle = (h & 1) ? "#ffd84a" : "#ff8fc1"; c.fillRect(px + 10, py + 12, 4, 4); c.fillStyle = "#fff"; c.fillRect(px + 11, py + 13, 2, 2); }
        if (K === "snow" && h % 13 === 0 && t === GRASS) { c.fillStyle = "#fff"; c.fillRect(px + 12, py + 10, 2, 2); c.fillRect(px + 11, py + 11, 4, 0.1); }
      } else if (K === "sand") {
        if (h % 5 === 0) { c.fillStyle = "#d2b062"; c.fillRect(px + (h % 14) + 2, py + ((h >> 4) % 18) + 6, 12, 2); c.fillRect(px + (h % 14) + 6, py + ((h >> 4) % 18) + 9, 8, 2); }
        if (h % 17 === 0 && t === GRASS) { c.fillStyle = "#bfa059"; c.fillRect(px + 8, py + 20, 4, 3); c.fillRect(px + 20, py + 8, 3, 3); }
        if (h % 41 === 0 && t === GRASS) { c.fillStyle = "#e9e2cf"; c.fillRect(px + 8, py + 14, 14, 3); c.fillRect(px + 6, py + 12, 4, 7); c.fillRect(px + 20, py + 12, 4, 7); }
      } else if (K === "swamp") {
        if (h % 6 === 0 && t === GRASS) { c.fillStyle = "#33502f"; c.fillRect(px + (h % 14) + 4, py + ((h >> 4) % 14) + 8, 14, 7); c.fillStyle = "#3d6a46"; c.fillRect(px + (h % 14) + 6, py + ((h >> 4) % 14) + 9, 5, 2); }
        if (h % 9 === 0) { c.fillStyle = "#6b8a3a"; c.fillRect(px + 8 + (h % 8), py + 10, 2, 12); c.fillRect(px + 12 + (h % 8), py + 12, 2, 10); c.fillRect(px + 16 + (h % 6), py + 14, 2, 8); }
        if (h % 23 === 0 && t === GRASS) { c.fillStyle = "#e8dcc8"; c.fillRect(px + 14, py + 18, 3, 6); c.fillStyle = "#d23b43"; c.fillRect(px + 11, py + 14, 9, 5); c.fillStyle = "#fff"; c.fillRect(px + 13, py + 15, 2, 2); }
      } else if (K === "lava") {
        if (h % 5 === 0 && t === GRASS) { c.fillStyle = "rgba(255,122,31," + (0.45 + 0.35 * Math.sin(time * 2.5 + h)) + ")"; c.fillRect(px + (h % 14) + 4, py + ((h >> 4) % 18) + 6, 10, 2); c.fillRect(px + (h % 14) + 10, py + ((h >> 4) % 18) + 8, 2, 8); }
        if (h % 7 === 0) { c.fillStyle = "#554a4f"; c.fillRect(px + (h % 20) + 3, py + ((h >> 3) % 20) + 3, 3, 3); }
      }
    }
    if (t === TREE) {
      c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(px + 4, py + 26, 24, 5);
      if (K === "snow") {
        c.fillStyle = "#5a3a22"; c.fillRect(px + 14, py + 22, 5, 8);
        c.fillStyle = "#1f6a46"; c.fillRect(px + 13, py + 1, 7, 6); c.fillRect(px + 9, py + 7, 15, 6); c.fillRect(px + 5, py + 13, 23, 9);
        c.fillStyle = "#f4f8fc"; c.fillRect(px + 13, py + 1, 7, 3); c.fillRect(px + 9, py + 7, 15, 3); c.fillRect(px + 5, py + 13, 23, 3);
      } else if (K === "sand") {
        c.fillStyle = "#2f7a3a"; c.fillRect(px + 13, py + 6, 7, 23); c.fillRect(px + 6, py + 13, 7, 4); c.fillRect(px + 6, py + 8, 4, 9); c.fillRect(px + 20, py + 16, 7, 4); c.fillRect(px + 23, py + 11, 4, 9);
        c.fillStyle = "#4cae58"; c.fillRect(px + 14, py + 7, 2, 21); c.fillRect(px + 7, py + 9, 1, 7); c.fillRect(px + 24, py + 12, 1, 7);
        c.fillStyle = "#ff8fc1"; c.fillRect(px + 15, py + 3, 4, 4);
      } else if (K === "swamp") {
        c.fillStyle = "#3a2e22"; c.fillRect(px + 13, py + 12, 6, 18); c.fillRect(px + 8, py + 10, 6, 3); c.fillRect(px + 18, py + 8, 7, 3); c.fillRect(px + 7, py + 7, 3, 4);
        c.fillStyle = "#2f4a2a"; c.fillRect(px + 6, py + 2, 20, 8); c.fillRect(px + 9, py + 0, 14, 4);
        c.fillStyle = "#6b8a3a"; c.fillRect(px + 8, py + 10, 2, 8); c.fillRect(px + 14, py + 10, 2, 11); c.fillRect(px + 22, py + 10, 2, 7);
      } else if (K === "lava") {
        c.fillStyle = "#1e1a1d"; c.fillRect(px + 14, py + 10, 5, 20); c.fillRect(px + 8, py + 12, 7, 3); c.fillRect(px + 19, py + 7, 7, 3); c.fillRect(px + 7, py + 8, 3, 6); c.fillRect(px + 24, py + 4, 3, 5);
        c.fillStyle = "rgba(255,122,31," + (0.6 + 0.4 * Math.sin(time * 5 + h)) + ")"; c.fillRect(px + 15, py + 18, 2, 3); c.fillRect(px + 8, py + 13, 2, 2); c.fillRect(px + 24, py + 6, 2, 2);
      } else {
        c.fillStyle = "#825330"; c.fillRect(px + 13, py + 19, 6, 11);
        c.fillStyle = "#2a7a34";
        c.fillRect(px + 9, py + 1, 14, 7); c.fillRect(px + 5, py + 7, 22, 8); c.fillRect(px + 7, py + 14, 18, 7);
        c.fillStyle = "#3d9a48"; c.fillRect(px + 10, py + 3, 6, 3); c.fillRect(px + 8, py + 9, 5, 3);
        c.fillStyle = "#1d5a26"; c.fillRect(px + 17, py + 15, 8, 4);
        if (h % 3 === 0) { c.fillStyle = "#d23b43"; c.fillRect(px + 11, py + 11, 3, 3); c.fillRect(px + 19, py + 17, 3, 3); }
      }
    } else if (t === ROCK) {
      c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(px + 4, py + 24, 24, 5);
      var r1 = "#8d8f94", r2 = "#b5b7bd", r3 = "#62646a";
      if (K === "sand") { r1 = "#c9a466"; r2 = "#e6cb92"; r3 = "#9a7a46"; }
      else if (K === "swamp") { r1 = "#6a7a60"; r2 = "#8a9a7c"; r3 = "#47543f"; }
      else if (K === "lava") { r1 = "#2a2630"; r2 = "#4a4458"; r3 = "#16131a"; }
      c.fillStyle = r1; c.fillRect(px + 6, py + 12, 20, 14); c.fillRect(px + 10, py + 8, 12, 6);
      c.fillStyle = r2; c.fillRect(px + 10, py + 9, 6, 3); c.fillRect(px + 8, py + 14, 4, 3);
      c.fillStyle = r3; c.fillRect(px + 18, py + 20, 8, 6);
      if (K === "lava") { c.fillStyle = "rgba(255,122,31," + (0.5 + 0.4 * Math.sin(time * 3 + h)) + ")"; c.fillRect(px + 14, py + 18, 6, 2); }
    }
  }
  function isW(x, y) { var t = tiles[y][x]; return t === WATER || t === BRIDGE; }

  function drawCastle(idx, camX, camY) {
    var cs = CASTLES[idx], c = ctx;
    var ox = (cs.tx - 2) * T - camX, oy = (cs.ty - 3) * T - camY;
    var PALS = { "": ["#9aa0aa", "#6c727d", "#bcc2cc"], ice: ["#a9c4de", "#6d8fb3", "#dcecfa"], sand: ["#d9b878", "#a98648", "#f0d9a2"], swamp: ["#6f8068", "#46564a", "#93a58b"], lava: ["#4a4350", "#2a2530", "#6a6075"] };
    var pl = PALS[cs.theme] || PALS[""], stone = pl[0], dark = pl[1], light = pl[2];
    /* shadow */
    c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(ox + 6, oy + 4 * T - 4, 5 * T - 6, 10);
    /* main wall */
    c.fillStyle = stone; c.fillRect(ox + 24, oy + 40, 5 * T - 48, 3 * T - 14);
    c.fillStyle = light; c.fillRect(ox + 24, oy + 40, 5 * T - 48, 4);
    /* bricks */
    c.fillStyle = dark;
    for (var by = 0; by < 5; by++) for (var bx = 0; bx < 8; bx++) {
      c.fillRect(ox + 30 + bx * 12 + (by & 1) * 6, oy + 50 + by * 12, 8, 2);
    }
    /* towers */
    [0, 5 * T - 40].forEach(function (tx) {
      c.fillStyle = stone; c.fillRect(ox + tx, oy + 14, 40, 4 * T - 18);
      c.fillStyle = light; c.fillRect(ox + tx, oy + 14, 5, 4 * T - 18);
      c.fillStyle = dark; c.fillRect(ox + tx + 35, oy + 14, 5, 4 * T - 18);
      for (var m = 0; m < 3; m++) { c.fillStyle = stone; c.fillRect(ox + tx + m * 16, oy + 4, 8, 12); c.fillStyle = dark; c.fillRect(ox + tx + m * 16 + 6, oy + 4, 2, 12); }
      c.fillStyle = "#1c2233"; c.fillRect(ox + tx + 16, oy + 40, 8, 16);
      c.fillStyle = "#ffcf4d"; c.fillRect(ox + tx + 18, oy + 44, 4, 6);
    });
    /* wall battlements */
    for (var m2 = 0; m2 < 4; m2++) { c.fillStyle = stone; c.fillRect(ox + 44 + m2 * 18, oy + 30, 10, 10); }
    /* gate */
    var gx = ox + 2 * T + 2, gy = oy + 3 * T - 10;
    c.fillStyle = "#2b2118"; c.fillRect(gx, gy + 8, T - 4, T + 2); c.fillRect(gx + 4, gy + 2, T - 12, 8);
    c.fillStyle = "#4a3a28"; c.fillRect(gx + 14, gy + 8, 2, T + 2);
    /* flag */
    var fx = ox + 2 * T + 14, fy = oy - 20, wave = Math.sin(time * 4) * 2;
    c.fillStyle = "#4a3a28"; c.fillRect(fx, fy, 3, 34);
    c.fillStyle = cleared[idx] ? "#3aa845" : "#d23b43";
    c.fillRect(fx + 3, fy + 2, 18, 5); c.fillRect(fx + 3, fy + 7 + wave * 0.5, 14, 5); c.fillRect(fx + 3, fy + 12 + wave, 9, 4);
    /* name */
    c.font = "8px 'Press Start 2P', monospace"; c.textAlign = "center";
    var label = cs.name + (cleared[idx] ? " \u2713" : "");
    var lx = ox + 2.5 * T, ly = oy - 26;
    c.fillStyle = "#1b2a3a"; c.fillText(label, lx + 1, ly + 1);
    c.fillStyle = cleared[idx] ? "#8cff9a" : "#ffd84a"; c.fillText(label, lx, ly);
  }

  function drawHero(camX, camY) {
    var c = ctx, s = 1.5, hx = hero.x - camX, hy = hero.y - camY;
    var swing = hero.moving ? Math.sin(hero.walk * 10) : 0;
    var bob = hero.moving ? Math.abs(Math.sin(hero.walk * 10)) * -2 : 0;
    c.save();
    c.translate(Math.round(hx), Math.round(hy));
    c.scale(hero.dir, 1);
    c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(-9, -3, 18, 5);
    /* legs */
    c.drawImage(heroImgs.leg, -9 * 1 + swing * 3, -8 * s + 0, 7 * s, 8 * s);
    c.drawImage(heroImgs.leg, -1 - swing * 3, -8 * s + 0, 7 * s, 8 * s);
    /* cape + body */
    c.drawImage(heroImgs.cape, -12 * s * 0.8, -22 * s + 14 * s * 0.6 + bob, 6 * s, 10 * s);
    c.drawImage(heroImgs.body, -6 * s, -22 * s + bob, 12 * s, 14 * s);
    c.restore();
  }

  var view = { w: 0, h: 0, scale: 1, dpr: 1 };
  function resize() {
    var dpr = window.devicePixelRatio || 1;
    view.w = window.innerWidth; view.h = window.innerHeight; view.dpr = dpr;
    mapEl.width = Math.round(view.w * dpr); mapEl.height = Math.round(view.h * dpr);
    view.scale = Math.max(1, Math.min(view.w / (14 * T), view.h / (8 * T)));
  }
  window.addEventListener("resize", resize);
  resize();

  function renderMap() {
    var c = ctx, s = view.scale * view.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = false;
    c.fillStyle = BM.sea; c.fillRect(0, 0, mapEl.width, mapEl.height);
    var vw = view.w / view.scale, vh = view.h / view.scale;
    var camX = hero.x - vw / 2, camY = hero.y - vh / 2 - 10;
    camX = (COLS * T <= vw) ? (COLS * T - vw) / 2 : Math.max(0, Math.min(COLS * T - vw, camX));
    camY = (ROWS * T <= vh) ? (ROWS * T - vh) / 2 : Math.max(0, Math.min(ROWS * T - vh, camY));
    camX = Math.round(camX); camY = Math.round(camY);
    c.setTransform(s, 0, 0, s, 0, 0);
    var x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(COLS - 1, Math.floor((camX + vw) / T));
    var y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(ROWS - 1, Math.floor((camY + vh) / T));
    var x, y;
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) drawTile(x, y, x * T - camX, y * T - camY);
    /* draw things in order of depth so the hero walks behind trees and castles */
    var items = [];
    CASTLES.forEach(function (cs, i) { if (cs.map !== curMap) return; items.push({ y: cs.ty * T + T, f: function () { drawCastle(i, camX, camY); } }); });
    ents.forEach(function (e) { items.push({ y: e.ty * T + T, f: function () { drawEnt(e, camX, camY); } }); });
    PORTALS.forEach(function (p) { if (p.map === curMap) items.push({ y: p.ty * T, f: function () { drawPortal(p, camX, camY); } }); });
    items.push({ y: hero.y, f: function () { drawHero(camX, camY); } });
    items.sort(function (a, b) { return a.y - b.y; });
    items.forEach(function (it) { it.f(); });
    /* tree canopies in front of the hero */
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
      if (tiles[y][x] === TREE && (y + 1) * T > hero.y - 4 && y * T < hero.y + 4 && Math.abs(x * T + 16 - hero.x) < 22) drawTile(x, y, x * T - camX, y * T - camY);
    }
    if (isDark()) { c.fillStyle = "rgba(6,10,40,.5)"; c.fillRect(0, 0, vw, vh); }
    if (nearE && !ui) {
      var ex = nearE.tx * T + 16 - camX, ey = nearE.ty * T - camY - 6, lb = nearE.chest ? "E: Open" : "E: Talk";
      c.font = "8px 'Press Start 2P', monospace"; c.textAlign = "center";
      c.fillStyle = "#1b2a3a"; c.fillText(lb, ex + 1, ey + 1); c.fillStyle = "#fff"; c.fillText(lb, ex, ey);
    }
    /* progress text */
    var inMap = CASTLES.filter(function (cs) { return cs.map === curMap; });
    var n = inMap.filter(function (cs) { return cleared[CASTLES.indexOf(cs)]; }).length;
    c.font = "9px 'Press Start 2P', monospace"; c.textAlign = "center";
    var msg = cleared[FINAL] ? "You are the Champion of Calculus!" : BM.name + ": castles " + n + " / " + inMap.length;
    c.fillStyle = "#1b2a3a"; c.fillText(msg, vw / 2 + 1, vh - 24 + 1);
    c.fillStyle = cleared[FINAL] ? "#ffd84a" : "#fff"; c.fillText(msg, vw / 2, vh - 24);
    /* corner map */
    if (showMini && mini) {
      c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      var ms = view.w < 700 ? 2 : 3, mw = COLS * ms, mh = ROWS * ms, mx = view.w - mw - 12, my = view.w < 700 ? 98 : 62;
      c.fillStyle = "rgba(0,0,0,.65)"; c.fillRect(mx - 4, my - 4, mw + 8, mh + 8);
      c.imageSmoothingEnabled = false; c.drawImage(mini, mx, my, mw, mh);
      CASTLES.forEach(function (cs, i) { if (cs.map !== curMap) return; c.fillStyle = "#000"; c.fillRect(mx + cs.tx * ms - 3, my + (cs.ty - 2) * ms - 3, 7, 7); c.fillStyle = cleared[i] ? "#3aa845" : "#ff4a4a"; c.fillRect(mx + cs.tx * ms - 2, my + (cs.ty - 2) * ms - 2, 5, 5); });
      PORTALS.forEach(function (p) { if (p.map !== curMap) return; c.fillStyle = "#b88cff"; c.fillRect(mx + p.tx * ms - 1, my + p.ty * ms - 1, 5, 5); });
      ents.forEach(function (e) { if (e.chest) return; var mk = questMark(e); if (mk && mk.col !== "#9aa7b8") { c.fillStyle = mk.col; c.fillRect(mx + e.tx * ms - 1, my + e.ty * ms - 1, 4, 4); } });
      if (Math.floor(time * 3) % 2) { c.fillStyle = "#fff"; c.fillRect(mx + hero.x / T * ms - 2, my + hero.y / T * ms - 3, 5, 5); }
      c.fillStyle = "#fff"; c.font = "7px 'Press Start 2P', monospace"; c.textAlign = "right"; c.fillText("M: hide map", mx + mw, my + mh + 14);
    }
  }

  function updateMap(dt) {
    if (ui || warp) { hero.moving = false; return; }
    nearE = findNear();
    var mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    hero.moving = !!(mx || my);
    if (hero.moving) {
      var len = Math.sqrt(mx * mx + my * my), sp = 130 * (1 + 0.06 * lv("spd")) * dt;
      if (mx) hero.dir = mx;
      var nx = hero.x + (mx / len) * sp, ny = hero.y + (my / len) * sp;
      if (!blocked(nx, hero.y)) hero.x = nx;
      if (!blocked(hero.x, ny)) hero.y = ny;
      hero.walk += dt;
      stepT -= dt;
      if (stepT <= 0) { sfx("step"); stepT = 0.28; }
      var dk = doorAt[Math.floor(hero.x / T) + "," + Math.floor((hero.y - 4) / T)];
      if (dk !== undefined) enterCastle(dk);
      PORTALS.forEach(function (p) {
        if (p.map === curMap && !warp && Math.hypot(hero.x - (p.tx * T + 16), hero.y - 8 - (p.ty * T + 32)) < 26) usePortal(p);
      });
    } else { stepT = 0; }
  }
  function blocked(x, y) {
    var hw = 7, hh = 6;
    return solidTile(Math.floor((x - hw) / T), Math.floor((y - hh) / T)) || solidTile(Math.floor((x + hw) / T), Math.floor((y - hh) / T)) ||
      solidTile(Math.floor((x - hw) / T), Math.floor(y / T)) || solidTile(Math.floor((x + hw) / T), Math.floor(y / T));
  }

  /* ============================================================
     CASTLE FIGHT
     ============================================================ */
  /* ============================================================
     COINS, NPCS, CHESTS, SHOP, PORTALS
     ============================================================ */
  var coinEl = document.createElement("div"); coinEl.className = "coins";
  hpEl.parentNode.insertBefore(coinEl, infoEl);
  var bossEl = document.createElement("div"); bossEl.id = "bossbar";
  bossEl.innerHTML = "<b>LORD INFINITY</b><i><u></u></i>";
  var talkEl = document.createElement("div"); talkEl.id = "talk";
  var shopEl = document.createElement("div"); shopEl.id = "shop";
  document.body.appendChild(bossEl); document.body.appendChild(talkEl); document.body.appendChild(shopEl);
  document.querySelector(".pad .grp").insertAdjacentHTML("beforeend", '<button class="btn mapOnly" data-act="act">Act</button>');
  function coinHud() { coinEl.innerHTML = '<span class="coin"></span> ' + SV.coins; }
  function addCoins(n, noq) {
    SV.coins += n; save(); coinHud();
    if (!noq) questEvent("coins", n);
    coinEl.classList.remove("pop"); void coinEl.offsetWidth; coinEl.classList.add("pop");
    sfx("coin");
  }
  coinHud();

  /* ============================================================
     QUESTS
     ============================================================ */
  var Q = [], QB = {};
  function addQ(id, giver, t, d, type, a, n, rw, pre, o, f, up) {
    var q = { id: id, giver: giver, t: t, d: d, type: type, a: a, n: n, rw: rw, pre: pre, o: o, f: f, up: up };
    Q.push(q); QB[id] = q;
  }
  /* Greenlands */
  addQ("hello", "n0_1", "Say Hello", "Talk to Blacksmith Gauss.", "talk", "n0_0", 1, 15, null,
    ["Welcome, traveler! I am Villager Euler.", "Go and say hello to the blacksmith. He has a gold coin above his head."], ["Gauss already likes you! Here is a little thank-you."]);
  addQ("zombies", "n0_1", "Zombie Trouble", "Defeat 10 zombies in any castle.", "kill", 0, 10, 30, "hello",
    ["Zombies keep sneaking into the castles.", "Walk through a castle door and defeat 10 of them for me."], ["Ten zombies fewer! The village sleeps better tonight."]);
  addQ("tour", "n0_1", "Grand Tour", "Walk into the purple portal of the Ember Peaks.", "biome", 4, 1, 250, "zombies",
    ["You look strong now. Here is a big dream: see the Ember Peaks, past the swamp.", "Clear every castle, pass four portals, and walk into the lava lands."], ["You went all the way to the fire lands? Incredible! Take this."]);
  addQ("gear", "n0_0", "Better Gear", "Buy 2 upgrades in any shop.", "upgrade", 0, 2, 25, null,
    ["A hero needs good gear. Spend some coins in my shop.", "Buy any 2 upgrades, then come back."], ["Nice kit! You are twice as dangerous now."]);
  addQ("treasure", "n0_2", "Treasure Hunter", "Open 3 chests.", "chest", 0, 3, 35, null,
    ["Ah, a young adventurer! Numbers are treasures, but so is gold.", "Find and open 3 chests around the map."], ["A fine haul! Calculus rewards the curious."]);
  addQ("c0", "n0_2", "Limits of Fear", "Clear the Castle of Limits.", "clear", 0, 1, 50, "treasure",
    ["Every journey starts with a limit. The Castle of Limits is just south-west of here.", "Clear it, and the zombies will learn to approach carefully."], ["As x approaches the door, the zombies approach zero. Well done!"]);
  addQ("c1", "n0_2", "Slope Seeker", "Clear the Castle of Slopes.", "clear", 1, 1, 60, "c0",
    ["Next, find the Castle of Slopes up north. Follow the road from the crossroads.", "It will test how fast you can change direction."], ["The slope of your skill is steep. Good work!"]);
  addQ("c2", "n0_2", "Area Under the Zombies", "Clear the Castle of Integrals.", "clear", 2, 1, 90, "c1",
    ["The Castle of Integrals is the toughest of the three. Many waves, many zombies.", "Gather every wave and sum them up. Clear it, and the portal east will open."], ["The integral is complete! The portal to the Frozen Tundra is yours.", "Bonus: a free pistol upgrade."], "gd");
  /* Frozen Tundra */
  addQ("forge", "n1_0", "Cold Steel", "Earn 150 coins.", "coins", 0, 150, 60, null,
    ["Cold steel needs hot coin. Bring me 150 coins worth of zombie loot and I will pay you a bonus."], ["You are rich in the cold! A bonus for your effort."]);
  addQ("ice_kill", "n1_2", "Chilly Zombies", "Defeat 15 zombies.", "kill", 0, 15, 45, null,
    ["These zombies are frozen stiff but they still bite!", "Defeat 15 of them."], ["Whew! Now my toes can relax."]);
  addQ("ice_chest", "n1_2", "Frozen Fortune", "Open 3 chests.", "chest", 0, 3, 50, "ice_kill",
    ["Rumor says the snow hides chests. Open 3 for me and I will pay you."], ["Wonderful! Treasure is warmer than tea."]);
  addQ("c3", "n1_1", "Series of Events", "Clear the Castle of Series.", "clear", 3, 1, 90, null,
    ["Every smooth curve is a sum of tiny pieces, young hero.", "Clear the Castle of Series to the west and prove you can add them up."], ["A convergent victory!"]);
  addQ("c4", "n1_1", "Converge!", "Clear the Castle of Sequences.", "clear", 4, 1, 120, "c3",
    ["The Castle of Sequences lies far to the east, past the bend in the road.", "Clear it and the desert portal will open."], ["It converges! You are free to go on.", "Bonus: a free armor upgrade."], "arm");
  /* Scorched Desert */
  addQ("sandsmith", "n2_0", "Desert Traveler", "Buy 3 upgrades.", "upgrade", 0, 3, 70, null,
    ["The sun is cruel. Buy 3 upgrades and I will give you a bonus."], ["You will survive the sand with that kit!"]);
  addQ("sand_kill", "n2_2", "Sand and Sweat", "Defeat 20 zombies.", "kill", 0, 20, 70, null,
    ["Zombies in the desert are dry and mean.", "Defeat 20 of them."], ["Twenty down. I can finally take a nap."]);
  addQ("sand_coin", "n2_2", "Oasis Gold", "Earn 250 coins.", "coins", 0, 250, 90, "sand_kill",
    ["A mirage of gold? No, real coins! Earn 250 from zombies and chests."], ["A true fortune!"]);
  addQ("c5", "n2_1", "Chain Reaction", "Clear the Castle of Chains.", "clear", 5, 1, 120, null,
    ["The chain rule links everything, as the zombies will learn.", "Clear the Castle of Chains to the north-west."], ["Link by link, you won!"]);
  addQ("c6", "n2_1", "Peak Performance", "Clear the Castle of Optima.", "clear", 6, 1, 150, "c5",
    ["Where is the maximum? In the Castle of Optima, at the end of the long road.", "Clear it and the swamp portal will open."], ["Maximum achieved!", "Bonus: free boots."], "spd");
  /* Haunted Swamp */
  addQ("swamp_kill", "n3_1", "Ooze Cleanup", "Defeat 30 zombies.", "kill", 0, 30, 100, null,
    ["Eee hee! The bog zombies ruin my potions.", "Defeat 30 of them."], ["My potions are safe again. Eee hee!"]);
  addQ("c7", "n3_1", "Differential Dilemma", "Clear the Castle of Differentials.", "clear", 7, 1, 150, "swamp_kill",
    ["The Castle of Differentials is near the swamp road. Its zombies change faster than you think.", "Clear it, my dear."], ["How the rate of change has changed! Lovely."]);
  addQ("c8", "n3_1", "Fourier's Fear", "Clear the Castle of Fourier.", "clear", 8, 1, 180, "c7",
    ["The Castle of Fourier is a cursed place. The zombies come in waves, endless waves.", "Clear it and the volcano portal will open."], ["You cut through every wave! The way is open.", "Bonus: a free heart."], "hp");
  addQ("swamp_chest", "n3_2", "Hidden Stash", "Open 4 chests.", "chest", 0, 4, 100, null,
    ["Some chests sink in the mud. Open 4 and bring me a story."], ["A muddy treasure, but still treasure!"]);
  /* Ember Peaks */
  addQ("lava_forge", "n4_0", "Forge of Infinity", "Buy 4 upgrades.", "upgrade", 0, 4, 120, null,
    ["Lord Infinity eats weak heroes. Buy 4 upgrades before you face him."], ["Now that is a hero's loadout."]);
  addQ("lava_kill", "n4_2", "Ashes to Ashes", "Defeat 40 zombies.", "kill", 0, 40, 150, null,
    ["The ash never stops falling and neither do the zombies.", "Defeat 40 of them."], ["Ashes to ashes, zombies to dust."]);
  addQ("boss", "n4_1", "Face Infinity", "Defeat Lord Infinity in the Castle of Infinity.", "clear", 9, 1, 500, null,
    ["Some infinities are bigger than others. Lord Infinity is the biggest.", "Clear the great castle and defeat him."], ["You did it. You are the Champion of Calculus!"]);

  var trackEl = document.createElement("div"); trackEl.className = "qtrack";
  coinEl.parentNode.insertBefore(trackEl, infoEl);
  var qlogEl = document.createElement("div"); qlogEl.id = "qlog";
  document.body.appendChild(qlogEl);
  document.querySelector(".actions").insertAdjacentHTML("afterbegin", '<button class="btn mapOnly" id="qbtn">Quests</button>');

  function qAvail(q) { return !SV.q[q.id] && (!q.pre || (SV.q[q.pre] && SV.q[q.pre].s === 3)); }
  function rewardText(q) { return q.rw + " coins" + (q.up ? " + free upgrade" : ""); }
  function questHud() {
    var rd = [], ac = [], out = "";
    Q.forEach(function (q) { var st = SV.q[q.id]; if (!st) return; if (st.s === 2) rd.push(q); else if (st.s === 1) ac.push(q); });
    rd.slice(0, 1).forEach(function (q) { out += '<span class="rdy">? ' + q.t + '</span>'; });
    ac.slice(0, 2).forEach(function (q) { out += '<span>&#9656; ' + q.t + ' ' + SV.q[q.id].n + '/' + q.n + '</span>'; });
    trackEl.innerHTML = out;
  }
  function questEvent(type, arg) {
    var changed = false;
    Q.forEach(function (q) {
      var st = SV.q[q.id];
      if (!st || st.s !== 1 || q.type !== type) return;
      if (type === "kill" || type === "chest" || type === "upgrade") st.n++;
      else if (type === "coins") st.n += arg;
      else if (arg === q.a) st.n = q.n;
      else return;
      changed = true;
      if (st.n >= q.n) { st.n = q.n; st.s = 2; banner("Quest complete: " + q.t); sfx("chest"); }
    });
    if (changed) { save(); questHud(); if (ui === "quests") renderQuests(); }
  }
  function acceptQuest(q) {
    var st = SV.q[q.id] = { s: 1, n: 0 };
    banner("New quest: " + q.t); sfx("click");
    if ((q.type === "clear" && cleared[q.a]) || (q.type === "biome" && curMap === q.a)) { st.s = 2; st.n = q.n; banner("Quest complete: " + q.t); sfx("chest"); }
    save(); questHud();
  }
  function claimQuest(q) {
    SV.q[q.id].s = 3;
    addCoins(q.rw, true);
    if (q.up) { SV.up[q.up] = Math.min(5, lv(q.up) + 1); applyStats(); }
    banner("Quest done! +" + q.rw + " coins" + (q.up ? " & upgrade" : ""));
    save(); questHud();
  }
  function questFor(n) {
    var list = (n.q || []).map(function (id) { return QB[id]; }), i, st;
    for (i = 0; i < list.length; i++) { st = SV.q[list[i].id]; if (st && st.s === 2) return { q: list[i], mode: "done" }; }
    for (i = 0; i < list.length; i++) if (qAvail(list[i])) return { q: list[i], mode: "offer" };
    for (i = 0; i < list.length; i++) { st = SV.q[list[i].id]; if (st && st.s === 1) return { q: list[i], mode: "hint" }; }
    return null;
  }
  function questMark(e) {
    var qc = e.q && e.q.length ? questFor(e) : null;
    if (!qc) return null;
    if (qc.mode === "offer") return { ch: "!", col: "#ffd84a" };
    if (qc.mode === "done") return { ch: "?", col: "#8cff9a" };
    return { ch: "?", col: "#9aa7b8" };
  }
  function renderQuests() {
    var rd = [], ac = [], dn = 0;
    Q.forEach(function (q) { var st = SV.q[q.id]; if (!st) return; if (st.s === 2) rd.push(q); else if (st.s === 1) ac.push(q); else dn++; });
    function row(q) {
      var st = SV.q[q.id], pct = Math.round(st.n / q.n * 100), g = NPCN[q.giver];
      return '<div class="qrow' + (st.s === 2 ? ' rdy' : '') + '"><b>' + q.t + '</b><small>' + q.d + '</small><span class="qbar"><u style="width:' + pct + '%"></u></span>' +
        '<small>' + (st.s === 2 ? 'Ready! Turn in to ' : 'Progress ' + st.n + '/' + q.n + ' &middot; from ') + g.name + ' (' + BIOMES[g.map].name + ') &middot; ' + rewardText(q) + '</small></div>';
    }
    var h = '<h3>Quest Log <span class="coin"></span> ' + SV.coins + '</h3>';
    if (rd.length) h += '<h4>Ready to turn in</h4>' + rd.map(row).join("");
    if (ac.length) h += '<h4>Active</h4>' + ac.map(row).join("");
    if (!rd.length && !ac.length) h += '<p class="qnone">No active quests. Look for villagers with a gold ! above their head.</p>';
    h += '<p class="qnone">Completed: ' + dn + ' / ' + Q.length + '</p><button class="btn" id="qx">Close (Q)</button>';
    qlogEl.innerHTML = h;
  }
  function openQuests() { if (ui || mode !== "map" || warp) return; ui = "quests"; keys.left = keys.right = keys.up = keys.down = false; renderQuests(); qlogEl.classList.add("show"); sfx("click"); }
  function closeQuests() { ui = null; qlogEl.classList.remove("show"); }
  qlogEl.addEventListener("click", function (ev) { var b = ev.target.closest ? ev.target.closest("button") : null; if (b && b.id === "qx") closeQuests(); });
  $("qbtn").addEventListener("click", function () { if (ui === "quests") closeQuests(); else openQuests(); });
  questHud();

  var UPG = [
    { k: "hp",  n: "Max Heart",    d: "+20 max health",      base: 30 },
    { k: "arm", n: "Armor",        d: "-8% damage taken",    base: 40 },
    { k: "spd", n: "Boots",        d: "+8% move speed",      base: 30 },
    { k: "sw",  n: "Sword",        d: "+1 damage, more reach", base: 50 },
    { k: "gd",  n: "Pistol Power", d: "+1 bullet damage",    base: 60 },
    { k: "mag", n: "Magazine",     d: "+4 bullets per clip", base: 40 },
    { k: "rel", n: "Quick Reload", d: "-15% reload time",    base: 35 }
  ];
  function applyStats() { P.max = maxhp(); P.mag = magSize(); P.hp = P.max; P.ammo = P.mag; drawHealth(); }
  function renderShop() {
    var h = '<h3>Upgrade Shop <span class="coin"></span> ' + SV.coins + '</h3>';
    UPG.forEach(function (u) {
      var l = lv(u.k), maxed = l >= 5, cost = u.base * (l + 1), pips = "";
      for (var i = 0; i < 5; i++) pips += '<i' + (i < l ? ' class="on"' : '') + '></i>';
      h += '<div class="row"><div><b>' + u.n + '</b><small>' + u.d + '</small><span class="pips">' + pips + '</span></div>' +
        '<button class="btn" data-up="' + u.k + '"' + (maxed || SV.coins < cost ? ' disabled' : '') + '>' + (maxed ? 'MAX' : cost + ' coins') + '</button></div>';
    });
    shopEl.innerHTML = h + '<button class="btn" id="shopx">Close (Esc)</button>';
  }
  function openShop() { ui = "shop"; renderShop(); shopEl.classList.add("show"); }
  function closeShop() { ui = null; shopEl.classList.remove("show"); }
  shopEl.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("button") : null;
    if (!b || b.disabled) return;
    if (b.id === "shopx") { closeShop(); return; }
    var k = b.getAttribute("data-up"), u = UPG.filter(function (x) { return x.k === k; })[0];
    if (!u) return;
    var l = lv(k), cost = u.base * (l + 1);
    if (l >= 5 || SV.coins < cost) return;
    SV.coins -= cost; SV.up[k] = l + 1; save(); coinHud(); applyStats(); sfx("buy"); renderShop(); questEvent("upgrade");
  });

  function findNear() {
    var best = null, bd = 52;
    ents.forEach(function (e) {
      if (e.chest && SV.chests[e.id]) return;
      var d = Math.hypot(hero.x - (e.tx * T + 16), hero.y - 8 - (e.ty * T + 22));
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }
  function showTalk() {
    var last = talk.i >= talk.lines.length - 1;
    talkEl.innerHTML = "<b>" + talk.e.name + "</b><p>" + talk.lines[talk.i] + "</p><i>" +
      (last ? (talk.qc && talk.qc.mode === "offer" ? "E: accept quest" : talk.qc && talk.qc.mode === "done" ? "E: claim reward" : talk.e.shop ? "E: open shop" : "E: close") : "E: next") + "</i>";
    talkEl.classList.add("show");
  }
  function interact() {
    if (mode !== "map" || !started || warp) return;
    if (ui === "talk") {
      talk.i++;
      if (talk.i >= talk.lines.length) {
        talkEl.classList.remove("show"); ui = null;
        var e = talk.e;
        var tq = talk.qc;
        if (e.gift && !SV.talked[e.id]) { SV.talked[e.id] = 1; addCoins(e.gift, true); banner("+" + e.gift + " coins!"); }
        if (tq && tq.mode === "offer") acceptQuest(tq.q); else if (tq && tq.mode === "done") claimQuest(tq.q);
        if (e.shop) openShop();
      } else showTalk();
      return;
    }
    if (ui) return;
    var n = findNear();
    if (!n) return;
    keys.left = keys.right = keys.up = keys.down = false;
    if (n.chest) {
      SV.chests[n.id] = 1;
      var amt = 15 + hash(n.tx, n.ty) % 26 + 5 * curMap;
      addCoins(amt); sfx("chest"); banner("Chest: +" + amt + " coins!"); questEvent("chest");
      return;
    }
    questEvent("talk", n.id);
    var qc = n.q && n.q.length ? questFor(n) : null, lines;
    if (qc && qc.mode === "offer") lines = qc.q.o.concat(["Quest: " + qc.q.t + ". " + qc.q.d + " Reward: " + rewardText(qc.q) + "."]);
    else if (qc && qc.mode === "done") lines = qc.q.f.concat(["Reward: " + rewardText(qc.q) + "."]);
    else if (qc && qc.mode === "hint") lines = ["Still on \"" + qc.q.t + "\"? " + qc.q.d, "Progress: " + SV.q[qc.q.id].n + " / " + qc.q.n + ". Come back when you are done."];
    else lines = n.lines.slice();
    if (n.gift && !SV.talked[n.id]) lines.push("Here, take " + n.gift + " coins for visiting!");
    ui = "talk"; talk = { e: n, lines: lines, i: 0, qc: qc };
    sfx("click"); showTalk();
  }

  function drawEnt(e, camX, camY) {
    var c = ctx, px = e.tx * T - camX, py = e.ty * T - camY;
    c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(px + 5, py + 26, 22, 5);
    if (e.chest) {
      var op = !!SV.chests[e.id];
      c.fillStyle = "#6b4425"; c.fillRect(px + 5, py + 14, 22, 13);
      c.fillStyle = "#8a5a33"; c.fillRect(px + 6, py + 15, 20, 11);
      if (op) { c.fillStyle = "#ffd84a"; c.fillRect(px + 8, py + 14, 16, 3); c.fillStyle = "#a87445"; c.fillRect(px + 5, py + 4, 22, 6); }
      else { c.fillStyle = "#a87445"; c.fillRect(px + 5, py + 9, 22, 7); c.fillStyle = "#ffd84a"; c.fillRect(px + 14, py + 9, 4, 18); c.fillStyle = "#c9a227"; c.fillRect(px + 14, py + 16, 4, 4); }
    } else {
      var bob = Math.round(Math.sin(time * 2 + e.tx));
      c.fillStyle = "#2e3560"; c.fillRect(px + 11, py + 22, 4, 8); c.fillRect(px + 17, py + 22, 4, 8);
      c.fillStyle = e.col; c.fillRect(px + 9, py + 12 + bob, 14, 11);
      c.fillStyle = "#f2c9a0"; c.fillRect(px + 10, py + 3 + bob, 12, 10);
      c.fillStyle = e.hair; c.fillRect(px + 10, py + 2 + bob, 12, 4);
      c.fillStyle = "#1a1426"; c.fillRect(px + 13, py + 8 + bob, 2, 2); c.fillRect(px + 18, py + 8 + bob, 2, 2);
      if (e.shop) { c.fillStyle = "#ffd84a"; c.fillRect(px + 13, py - 6 + bob, 6, 6); }
      var mk = questMark(e);
      if (mk) {
        var my2 = py - 14 - (e.shop ? 8 : 0) + Math.round(Math.sin(time * 4) * 2);
        c.font = "12px 'Press Start 2P', monospace"; c.textAlign = "center";
        c.fillStyle = "#1b2a3a"; c.fillText(mk.ch, px + 17, my2 + 1); c.fillStyle = mk.col; c.fillText(mk.ch, px + 16, my2);
      }
    }
  }
  function drawPortal(p, camX, camY) {
    var c = ctx, px = p.tx * T - camX, py = p.ty * T - camY, w = Math.sin(time * 4) * 2;
    c.fillStyle = "#4a1fa8"; c.fillRect(px + 2 - w, py - 10, 28 + w * 2, 74);
    c.fillStyle = "#b88cff"; c.fillRect(px + 8, py - 4, 16, 62);
    c.fillStyle = "#fff"; c.fillRect(px + 14 + Math.sin(time * 5) * 4, py + ((time * 40) % 50), 4, 6);
    c.font = "8px 'Press Start 2P', monospace"; c.textAlign = "center";
    c.fillStyle = "#1b2a3a"; c.fillText(p.label, px + 17, py - 16); c.fillStyle = "#ffd84a"; c.fillText(p.label, px + 16, py - 17);
  }
  function usePortal(p) {
    if (p.need && !p.need.every(function (i) { return cleared[i]; })) { banner("Clear all " + p.need.length + " castles here first!"); hero.x += p.push; return; }
    warp = true; sfx("door");
    fadeTo(function () {
      curMap = p.to; buildMap(p.to);
      hero.x = p.sx * T + 16; hero.y = p.sy * T + 28; hero.dir = 1;
      keys.left = keys.right = keys.up = keys.down = false;
      warp = false; banner(BM.name);
      questEvent("biome", p.to);
    });
  }

  var player = document.createElement("div");
  player.id = "player";
  player.innerHTML =
    '<div class="sprite">' +
      '<div class="leg b">' + pix(LEG, PAL, 4) + '</div>' +
      '<div class="leg f">' + pix(LEG, PAL, 4) + '</div>' +
      '<div class="torso">' +
        '<div class="cape">' + pix(CAPE, PAL, 4) + '</div>' +
        '<div class="upper">' + pix(BODY, PAL, 4) + '</div>' +
        '<div class="arm">' + pix(ARM, PAL, 4) +
          '<div class="sword">' + pix(SWORD, PAL, 4) + '</div>' +
          '<div class="pistol">' + pix(PISTOL, PAL, 4) + '<span class="muzzle"></span></div>' +
        '</div>' +
        '<div class="swoosh"></div>' +
      '</div>' +
    '</div>';
  world.appendChild(player);

  function resetPlayer() {
    P.x = 80; P.y = 0; P.vy = 0; P.dir = 1; P.max = maxhp(); P.mag = magSize(); P.hp = P.max; P.inv = 0; P.atk = 0;
    P.ammo = P.mag; P.reload = 0; P.aimT = 0; P.flashT = 0; P.shotCd = 0;
    player.classList.remove("hurt", "swing", "walk", "air", "aim", "shoot");
    drawHealth();
  }
  function clearFoes() {
    zombies.forEach(function (z) { z.el.remove(); });
    bullets.forEach(function (b) { b.el.remove(); });
    zombies = []; bullets = [];
    bossEl.classList.remove("show");
  }

  function fadeTo(fn) {
    fadeEl.classList.add("on");
    setTimeout(function () { fn(); fadeEl.classList.remove("on"); }, 380);
  }

  function enterCastle(idx) {
    if (mode !== "map" || C) return;
    C = { idx: idx, pending: true };
    keys.left = keys.right = keys.up = keys.down = false;
    sfx("door");
    fadeTo(function () { startCastle(idx); });
  }
  function startCastle(idx) {
    var cfg = CASTLES[idx];
    mode = "castle";
    document.body.classList.remove("on-map"); document.body.classList.add("in-castle"); THEMES.forEach(function (th) { document.body.classList.toggle(th, cfg.theme === th); });
    clearFoes(); over = false; overEl.classList.remove("show");
    resetPlayer();
    C = { idx: idx, cfg: cfg, wave: 0, queue: 0, spawnT: 0, state: "intro", timer: 2.2 };
    banner(cfg.name);
    if (window.Music) Music.play("terraria-theme.mp3", 0.45);
    updateInfo();
  }
  function leaveCastle() {
    fadeTo(function () {
      var cfg = CASTLES[C.idx];
      mode = "map";
      document.body.classList.remove("in-castle"); THEMES.forEach(function (th) { document.body.classList.remove(th); }); document.body.classList.add("on-map");
      hero.x = cfg.tx * T + 16; hero.y = (cfg.ty + 1) * T + 26; hero.dir = 1;
      clearFoes(); over = false; overEl.classList.remove("show");
      P.max = maxhp(); P.mag = magSize(); P.hp = P.max; drawHealth();
      C = null;
      if (window.Music) Music.play("overworld-day.mp3", 0.45);
      if (cleared[FINAL]) banner("Champion of Calculus!");
    });
  }

  function updateInfo() {
    if (!C || !C.cfg) { infoEl.textContent = ""; return; }
    var left = zombies.length + C.queue;
    var ammo = P.reload > 0 ? "RELOADING" : P.ammo + "/" + P.mag;
    infoEl.innerHTML = "WAVE <em>" + Math.max(1, C.wave) + "/" + C.cfg.waves.length + "</em>  ZOMBIES <em>" + left + "</em>\nAMMO <em>" + ammo + "</em>";
  }

  /* ---------- actions ---------- */
  var SWING_TIME = 0.34;
  function attack() {
    if (mode !== "castle" || over || P.atk > 0) return;
    P.atk = SWING_TIME; P.aimT = 0;
    sfx("slash");
    player.classList.remove("swing", "aim");
    void player.offsetWidth;
    player.classList.add("swing");
    zombies.forEach(function (z) { z.hit = false; });
  }
  function jump() {
    if (mode === "castle" && !over && P.y === 0) { P.vy = 560; sfx("jump"); }
  }
  function reload() {
    if (mode !== "castle" || over || P.reload > 0 || P.ammo === P.mag) return;
    P.reload = 1.1 * (1 - 0.15 * lv("rel")); sfx("reload"); updateInfo();
  }
  function shoot() {
    if (mode !== "castle" || over || P.shotCd > 0 || P.reload > 0 || P.atk > 0) return;
    if (P.ammo <= 0) { sfx("empty"); reload(); return; }
    P.ammo--; P.shotCd = 0.22; P.aimT = 0.45; P.flashT = 0.07;
    sfx("shoot");
    player.classList.add("aim", "shoot");
    var el = document.createElement("div");
    el.className = "bullet";
    world.appendChild(el);
    bullets.push({ el: el, x: P.x + 24 + P.dir * 38, h: P.y + 46, dir: P.dir });
    if (P.ammo === 0) reload();
    updateInfo();
  }

  function hurtPlayer(fromX, dmg) {
    if (over || P.inv > 0) return;
    P.hp = Math.max(0, P.hp - Math.round((dmg || 12) * (1 - 0.08 * lv("arm"))));
    sfx("hurt");
    P.inv = 0.8;
    P.x += (P.x + 24 < fromX ? -1 : 1) * 36;
    P.vy = 240;
    player.classList.add("hurt");
    hpEl.classList.remove("shake"); void hpEl.offsetWidth; hpEl.classList.add("shake");
    drawHealth();
    if (P.hp <= 0) {
      over = true;
      overEl.classList.add("show");
      setTimeout(function () { sfx("gameover"); }, 350);
    }
  }

  /* ---------- zombies ---------- */
  function spawnZombie(boss) {
    var el = document.createElement("div");
    el.className = "zombie" + (C.cfg.theme ? " t-" + C.cfg.theme : "") + (boss ? " boss" : "");
    el.innerHTML = '<div class="zb"></div>';
    el.firstChild.style.animationDelay = (-Math.random() * 0.8) + "s";
    world.appendChild(el);
    if (Math.random() < 0.35) sfx("groan");
    var fromLeft = Math.random() < 0.5, sp = C.cfg.speed;
    zombies.push({
      el: el, x: fromLeft ? -70 : window.innerWidth + 10, hp: boss ? (C.cfg.bossHp || 40) : C.cfg.hp, mhp: boss ? (C.cfg.bossHp || 40) : C.cfg.hp, boss: !!boss, sc: boss ? 2.2 : 1, cd: 3, lunge: 0, kb: 0, hit: false, dir: 1,
      speed: boss ? 58 : sp[0] + Math.random() * (sp[1] - sp[0]), ph: Math.random() * 6, dead: false
    });
  }
  function killZombie(z) {
    z.dead = true;
    addCoins(z.boss ? 120 : 1 + Math.floor(Math.random() * 2) + Math.floor(C.cfg.tier / 2));
    questEvent("kill");
    sfx("zdie");
    z.el.classList.remove("near", "lunge"); z.el.classList.add("dying");
    setTimeout(function () { z.el.remove(); }, 700);
  }
  function hitZombie(z, dmg, kb) {
    z.hp -= dmg; z.kb = kb / (z.sc * z.sc); z.hit = true;
    sfx("zhit");
    z.el.classList.add("flash");
    setTimeout(function () { z.el.classList.remove("flash"); }, 90);
    if (z.hp <= 0) killZombie(z);
  }

  function updateWaves(dt) {
    var cfg = C.cfg;
    if (C.state === "intro") {
      C.timer -= dt;
      if (C.timer <= 0) nextWave();
    } else if (C.state === "fight") {
      C.spawnT -= dt;
      if (C.queue > 0 && C.spawnT <= 0 && zombies.length < 10) {
        spawnZombie(); C.queue--; C.spawnT = 0.45 + Math.random() * 0.6; updateInfo();
      }
      if (C.queue === 0 && zombies.length === 0) {
        if (C.wave >= cfg.waves.length && cfg.boss && !C.bossOn) {
          C.bossOn = true; spawnZombie(true); banner("BOSS: Lord Infinity!"); sfx("wave"); updateInfo(); return;
        }
        if (C.wave >= cfg.waves.length) {
          C.state = "done"; C.timer = 3.2;
          cleared[C.idx] = true; saveCleared(); addCoins(40 + 20 * C.idx); questEvent("clear", C.idx);
          banner(cfg.boss ? "Boss defeated! Champion!" : "Castle cleared!"); sfx("cleared");
        } else {
          C.state = "between"; C.timer = 2.6;
          P.hp = Math.min(P.max, P.hp + 25); P.ammo = P.mag; P.reload = 0; drawHealth();
          banner("Wave cleared!");
        }
        updateInfo();
      }
    } else if (C.state === "between") {
      C.timer -= dt;
      if (C.timer <= 0) nextWave();
    } else if (C.state === "done") {
      C.timer -= dt;
      if (C.timer <= 0 && !C.leaving) { C.leaving = true; leaveCastle(); }
    }
  }
  function nextWave() {
    C.wave++; C.queue = C.cfg.waves[C.wave - 1]; C.spawnT = 0.2; C.state = "fight";
    banner("Wave " + C.wave); sfx("wave"); updateInfo();
  }

  function updateCastle(dt) {
    if (!over) {
      var move = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (move) { P.dir = move; P.x += move * 240 * (1 + 0.08 * lv("spd")) * dt; }
      P.x = Math.max(0, Math.min(window.innerWidth - 48, P.x));

      if (P.y > 0 || P.vy > 0) {
        P.vy -= 1500 * dt;
        P.y += P.vy * dt;
        if (P.y <= 0) { P.y = 0; P.vy = 0; sfx("land"); }
      }
      P.atk = Math.max(0, P.atk - dt);
      P.inv = Math.max(0, P.inv - dt);
      P.shotCd = Math.max(0, P.shotCd - dt);
      P.aimT = Math.max(0, P.aimT - dt);
      P.flashT = Math.max(0, P.flashT - dt);
      if (P.reload > 0) { P.reload -= dt; if (P.reload <= 0) { P.reload = 0; P.ammo = P.mag; updateInfo(); } }
      if (P.inv === 0) player.classList.remove("hurt");
      if (P.atk === 0) player.classList.remove("swing");
      if (P.aimT === 0) player.classList.remove("aim");
      if (P.flashT === 0) player.classList.remove("shoot");
      player.classList.toggle("walk", move !== 0 && P.y === 0);
      player.classList.toggle("air", P.y > 0);
      if (move !== 0 && P.y === 0) { stepT -= dt; if (stepT <= 0) { sfx("step"); stepT = 0.28; } } else { stepT = 0; }

      updateWaves(dt);

      /* bullets */
      bullets.forEach(function (b) {
        b.x += b.dir * 760 * dt;
        if (b.x < -20 || b.x > window.innerWidth + 20) { b.dead = true; return; }
        for (var i = 0; i < zombies.length; i++) {
          var z = zombies[i];
          if (z.dead) continue;
          if (Math.abs(b.x - (z.x + 26)) < 24 * z.sc && b.h < 78 * z.sc) {
            hitZombie(z, 1 + lv("gd"), b.dir * 140); b.dead = true; break;
          }
        }
      });
      bullets = bullets.filter(function (b) { if (b.dead) b.el.remove(); return !b.dead; });

      /* zombies */
      var elapsed = SWING_TIME - P.atk;
      zombies.forEach(function (z) {
        if (z.dead) return;
        var zc = z.x + 26, pc = P.x + 24;
        z.dir = pc > zc ? 1 : -1;
        var lurch = 1 + 0.3 * Math.sin(time * 4 + z.ph);
        z.x += z.dir * z.speed * lurch * dt + z.kb * dt;
        if (z.boss) {
          z.cd -= dt;
          if (z.cd < 0) { z.cd = 3.5; z.lunge = 0.7; if (C.queue < 4) C.queue += 3; sfx("groan"); }
          if (z.lunge > 0) { z.lunge -= dt; z.x += z.dir * 260 * dt; }
        }
        z.kb -= z.kb * 6 * dt;
        z.el.classList.toggle("lunge", z.lunge > 0);
        z.el.classList.toggle("near", z.lunge <= 0 && Math.abs(zc - pc) < 70 * z.sc);
        if (Math.abs(zc - pc) < 30 * z.sc && P.y < 40) hurtPlayer(zc, z.boss ? 30 : 12 + 3 * C.cfg.tier);
        if (P.atk > 0 && elapsed > 0.07 && elapsed < 0.26 && !z.hit && P.y < 56) {
          var front = (zc - pc) * P.dir;
          if (front > -10 && front < 120 + 8 * lv("sw")) hitZombie(z, 2 + lv("sw"), P.dir * 420);
        }
      });
      zombies = zombies.filter(function (z) { return !z.dead; });
      var bz = zombies.filter(function (z) { return z.boss; })[0];
      bossEl.classList.toggle("show", !!bz);
      if (bz) bossEl.getElementsByTagName("u")[0].style.width = Math.max(0, bz.hp / bz.mhp * 100) + "%";
    }
    player.style.transform = "translate3d(" + P.x + "px," + (-P.y) + "px,0) scaleX(" + P.dir + ")";
    zombies.forEach(function (z) { z.el.style.transform = "translate3d(" + z.x + "px,0,0) scale(" + (z.dir * z.sc) + "," + z.sc + ")"; });
    bullets.forEach(function (b) { b.el.style.transform = "translate3d(" + b.x + "px,0,0)"; b.el.style.bottom = "calc(100vh - var(--surface) + " + b.h + "px)"; });
  }

  /* ============================================================
     MAIN LOOP
     ============================================================ */
  var last = performance.now(), infoT = 0;
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; time += dt;
    if (started) {
      if (mode === "map") updateMap(dt);
      else if (C && C.cfg) { updateCastle(dt); infoT -= dt; if (infoT <= 0) { updateInfo(); infoT = 0.25; } }
    }
    if (mode === "map") renderMap();
    requestAnimationFrame(loop);
  }

  /* ============================================================
     CONTROLS
     ============================================================ */
  var keymap = {
    ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right",
    ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down"
  };
  window.addEventListener("keydown", function (e) {
    if (!started) return;
    if (e.key === "e" || e.key === "E" || (ui === "talk" && (e.key === "Enter" || e.key === " "))) { e.preventDefault(); if (ui !== "shop") interact(); return; }
    if (e.key === "Escape" && ui === "shop") { closeShop(); return; }
    if (e.key === "Escape" && ui === "quests") { closeQuests(); return; }
    if ((e.key === "q" || e.key === "Q") && mode === "map") { e.preventDefault(); if (ui === "quests") closeQuests(); else if (!ui) openQuests(); return; }
    if ((e.key === "m" || e.key === "M") && mode === "map") { showMini = !showMini; return; }
    if (ui) return;
    var k = keymap[e.key];
    if (k) {
      keys[k] = true; e.preventDefault();
      if (k === "up") jump();
    } else if (e.key === " ") { jump(); e.preventDefault(); }
    else if (e.key === "j" || e.key === "J" || e.key === "x" || e.key === "X") attack();
    else if (e.key === "k" || e.key === "K" || e.key === "z" || e.key === "Z") shoot();
    else if (e.key === "r" || e.key === "R") reload();
  });
  window.addEventListener("keyup", function (e) { var k = keymap[e.key]; if (k) keys[k] = false; });
  world.addEventListener("pointerdown", function (e) {
    if (!started || e.target !== world) return;
    P.dir = e.clientX >= P.x + 24 ? 1 : -1;      // click or tap: shoot toward that side
    shoot();
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-act]"), function (b) {
    var act = b.getAttribute("data-act");
    function down(e) {
      e.preventDefault();
      if (!started) return;
      if (act === "left" || act === "right" || act === "up" || act === "down") keys[act] = true;
      if (act === "act") interact(); else if (act === "jump") jump(); else if (act === "attack") attack(); else if (act === "shoot") shoot();
    }
    function up() { if (keys[act] !== undefined) keys[act] = false; }
    b.addEventListener("pointerdown", down);
    b.addEventListener("pointerup", up);
    b.addEventListener("pointerleave", up);
    b.addEventListener("pointercancel", up);
  });

  $("again").addEventListener("click", function () { if (C && C.cfg) { var i = C.idx; fadeTo(function () { startCastle(i); }); } });
  $("leave").addEventListener("click", function () { if (C && C.cfg) leaveCastle(); });

  var soundBtn = $("sound");
  function soundLabel() { soundBtn.textContent = "Sound: " + (SFX.isMuted() ? "Off" : "On"); }
  if (window.SFX) {
    soundLabel();
    soundBtn.addEventListener("click", function () {
      SFX.toggle();
      if (window.Music) Music.setMuted(SFX.isMuted());
      soundLabel();
    });
  } else { soundBtn.hidden = true; }

  /* ============================================================
     LOADING SCREEN
     ============================================================ */
  (function loadingScreen() {
    var tips = [
      "Press R to reload your pistol.",
      "The sword hits hard. The pistol keeps you safe.",
      "Clearing a wave heals you and refills your ammo.",
      "Walk into a castle door to enter.",
      "Press Q to open your quest log.",
      "Villagers with a gold ! have a quest for you.",
      "Press M to hide or show the corner map.",
      "Don’t forget the + C!"
    ];
    var load = $("loading"), fill = $("ldfill"), pct = $("ldpct"), startMsg = $("ldstart");
    $("ldtip").textContent = tips[Math.floor(Math.random() * tips.length)];
    /* loading music: plays at once if the browser allows it, otherwise on the first press or tap */
    if (window.Music) Music.play("terraria-theme.mp3", 0.45);

    var total = 5, doneCount = 0, t0 = performance.now(), ready = false, shown = 0;
    function step() { doneCount++; }
    function warm(url) {
      if (!window.fetch) { step(); return; }
      fetch(url).then(function (r) { return r.arrayBuffer(); }).then(step, step);
    }
    warm("overworld-day.mp3");
    warm("terraria-theme.mp3");
    var zimg = new Image(); zimg.onload = step; zimg.onerror = step; zimg.src = "zombie.png";
    var fontP = (document.fonts && document.fonts.load) ? document.fonts.load("12px 'Press Start 2P'") : Promise.resolve();
    fontP.then(step, step);
    var imgs = [heroImgs.body, heroImgs.leg, heroImgs.cape];
    var left = imgs.length;
    imgs.forEach(function (im) { var f = function () { if (--left === 0) step(); }; if (im.complete) f(); else { im.onload = f; im.onerror = f; } });

    function begin() {
      if (started) return;
      started = true;
      load.classList.add("done");
      setTimeout(function () { load.style.display = "none"; }, 600);
      if (window.Music) Music.play("overworld-day.mp3", 0.45);
      window.removeEventListener("keydown", begin);
      window.removeEventListener("pointerdown", begin);
      if (cleared[FINAL]) banner("Champion of Calculus!");
    }
    function tick(now) {
      var real = doneCount / total, timed = Math.min(1, (now - t0) / 1800);
      if (now - t0 > 9000) real = 1;
      var target = Math.min(real, timed);
      shown += (target - shown) * 0.2;
      if (target - shown < 0.002) shown = target;
      fill.style.width = (shown * 100) + "%";
      pct.textContent = "Loading " + Math.round(shown * 100) + "%";
      if (shown >= 1 && !ready) {
        ready = true;
        pct.textContent = "Ready!";
        startMsg.hidden = false;
        window.addEventListener("keydown", begin);
        window.addEventListener("pointerdown", begin);
      }
      if (!started) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  resetPlayer();
  drawHealth();
  requestAnimationFrame(loop);
})();
