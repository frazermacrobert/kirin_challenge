// Memory Walk — Kirin (screenshot-style neon build)

let startYear = 70;           // keep 1955 total
let endYear   = 2025;
let totalKm   = endYear - startYear; // 1955
let progressKm = 0;
let walkers = 10;

const STORAGE_KEY = 'kirin_progress_km_v3';
let simTimer = null;

// Milestones (with optional image + caption)
const milestones = [
  { year:71,   label:"Eboracum founded",           icon:"🏛️", caption:"York begins.",                                 image:"" },
  { year:208,  label:"Death of Septimius Severus", icon:"🪦", caption:"Power shifts in the North.",                     image:"" },
  { year:306,  label:"Constantine proclaimed",     icon:"👑", caption:"A turning point for empire and faith.",         image:"" },
  { year:627,  label:"First York Minster",         icon:"⛪", caption:"Foundations of worship and wonder.",             image:"" },
  { year:866,  label:"Viking Invasion",            icon:"🛶", caption:"Granddad’s dock stories.",                       image:"https://images.unsplash.com/photo-1526404803658-54a7f9b2b9b6?auto=format&fit=crop&w=800&q=60" },
  { year:1068, label:"York Castle built",          icon:"🏰", caption:"Stone, strategy, and a new order.",              image:"" },
  { year:1212, label:"Minster fire",               icon:"🔥", caption:"Rebuilding resilience.",                        image:"" },
  { year:1349, label:"Black Death",                icon:"☠️", caption:"Empty streets and echoes.",                     image:"" },
  { year:1485, label:"Wars of the Roses end",      icon:"🌹", caption:"The city’s fortunes change again.",             image:"" },
  { year:1644, label:"Siege of York",              icon:"🛡️", caption:"Holding the line in civil war.",                image:"" },
  { year:1839, label:"Railway station opens",      icon:"🚂", caption:"York accelerates.",                             image:"" },
  { year:1932, label:"Chocolate Orange launched",  icon:"🍫", caption:"A sweet spot in history.",                      image:"" },
  { year:1984, label:"Jorvik Centre opens",        icon:"🛶", caption:"Dig, discover, delight.",                       image:"" },
  { year:2001, label:"Fairtrade City",             icon:"🤝", caption:"Doing business better.",                         image:"" },
  { year:2025, label:"Challenge complete!",        icon:"🎉", caption:"You made it to the present day!",               image:"" }
];

// Era bands (labels only)
const eras = [
  { label:"Romans",           icon:"🏛️", from:71,   to:410 },
  { label:"Vikings & Early",  icon:"⚔️", from:627,  to:1068 },
  { label:"Medieval",         icon:"🛡️", from:1212, to:1485 },
  { label:"Early Modern",     icon:"📜", from:1644, to:1839 },
  { label:"Chocolate & Now",  icon:"🍫", from:1932, to:2025 }
];

// layout
let timelineY;
let leftX, rightX;

let sliderEl, decBtn, incBtn, addForm, addInput, resetBtn, simBtn;

function setup(){
  const holder = document.getElementById('canvas-holder');
  const w = max(820, windowWidth - 28);
  const h = 360;
  const cnv = createCanvas(w, h);
  cnv.parent(holder);

  timelineY = h/2;
  leftX  = 60;
  rightX = width - 60;

  // controls
  sliderEl = document.getElementById('kmSlider');
  decBtn   = document.getElementById('decBtn');
  incBtn   = document.getElementById('incBtn');
  simBtn   = document.getElementById('simBtn');
  addForm  = document.getElementById('toolbar');
  addInput = document.getElementById('addInput');
  resetBtn = document.getElementById('resetBtn');

  // restore
  const saved = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  progressKm = constrain(isNaN(saved)?0:saved, 0, totalKm);

  // slider
  sliderEl.max = totalKm;
  sliderEl.value = progressKm;
  ['input','change'].forEach(evt => {
    sliderEl.addEventListener(evt, e => {
      const v = parseInt(e.target.value,10);
      progressKm = Number.isNaN(v) ? 0 : constrain(v, 0, totalKm);
      updateUI();
    });
  });

  decBtn.addEventListener('click', () => adjustProgress(-1));
  incBtn.addEventListener('click', () => adjustProgress(+1));

  // Add km (form submit; supports negatives)
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = parseInt(addInput.value, 10);
    if (!Number.isNaN(n) && Number.isFinite(n)) {
      adjustProgress(n);
      addInput.value = "";
    }
  });

  resetBtn.addEventListener('click', () => { progressKm = 0; syncControls(); updateUI(); });

  // Sim slider toggle
  simBtn.addEventListener('click', () => {
    if (simTimer){ clearInterval(simTimer); simTimer = null; simBtn.classList.remove('active'); return; }
    simBtn.classList.add('active');
    simTimer = setInterval(() => {
      if (progressKm >= totalKm){ clearInterval(simTimer); simTimer = null; simBtn.classList.remove('active'); return; }
      adjustProgress(+1);
    }, 55);
  });

  updateUI();
}

function windowResized(){
  const w = max(820, windowWidth - 28);
  resizeCanvas(w, height);
  leftX  = 60;
  rightX = width - 60;
  positionFocusCard(); // keep card aligned on resize
}

function draw(){
  clear();
  drawEraBands();
  drawTimelineNeon();
  drawMilestones();
  drawProgressKnob();
  positionFocusCard(); // keep HTML card anchored to the timeline
}

/* ---------- Drawing ---------- */
function drawEraBands(){
  noStroke();
  textAlign(CENTER, BOTTOM);
  textSize(18);
  for(const e of eras){
    const x1 = map(e.from, startYear, endYear, leftX, rightX);
    const x2 = map(e.to,   startYear, endYear, leftX, rightX);
    fill(255,255,255,12);
    rect(x1, timelineY-40, x2-x1, 80, 12);
    fill(255,255,255,160);
    text(`${e.icon} ${e.label}`, (x1+x2)/2, timelineY-46);
  }
}

function drawTimelineNeon(){
  // base
  stroke(255,255,255,42); strokeWeight(8);
  line(leftX, timelineY, rightX, timelineY);

  // neon segment (progress)
  const x = map(progressYear(), startYear, endYear, leftX, rightX);
  drawingContext.save();
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(255,45,154,.95)';
  stroke(255,45,154); strokeWeight(12);
  line(leftX, timelineY, x, timelineY);
  drawingContext.restore();

  // soft overglow
  stroke(255,45,154,120); strokeWeight(18);
  line(leftX, timelineY, x, timelineY);

  // end labels (left/right)
  noStroke(); fill(255,255,255,190); textAlign(LEFT, TOP);
  text(`${startYear} AD — York`, leftX, timelineY+18);
  textAlign(RIGHT, TOP);
  text(`Present Day`, rightX, timelineY+18);
}

function drawMilestones(){
  textAlign(CENTER, BOTTOM); textSize(16);
  for(const m of milestones){
    const x = map(m.year, startYear, endYear, leftX, rightX);

    // stem + dot
    stroke(255,255,255,60); strokeWeight(1);
    line(x, timelineY-28, x, timelineY+28);
    noStroke(); fill(255); circle(x, timelineY, 7);

    // icon above stem
    fill(255);
    text(m.icon || "•", x, timelineY-34);
  }
}

function drawProgressKnob(){
  const x = map(progressYear(), startYear, endYear, leftX, rightX);
  drawingContext.save();
  drawingContext.shadowBlur = 18;
  drawingContext.shadowColor = 'rgba(255,45,154,0.9)';
  noStroke(); fill(255,45,154);
  circle(x, timelineY, 15);
  drawingContext.restore();

  // triangle pointer
  fill(255,255,255,190);
  triangle(x, timelineY+15, x-6, timelineY+28, x+6, timelineY+28);
}

/* ---------- Behavior + UI ---------- */
function progressYear(){ return startYear + progressKm; }

function adjustProgress(delta){
  progressKm = constrain(progressKm + delta, 0, totalKm);
  syncControls();
  updateUI();
}

function keyPressed(){
  if (keyCode === LEFT_ARROW)  adjustProgress(-1);
  if (keyCode === RIGHT_ARROW) adjustProgress(+1);
}

function syncControls(){ document.getElementById('kmSlider').value = progressKm; }

function updateUI(){
  const year = Math.round(progressYear());
  document.getElementById('kmStat').textContent = `${progressKm} / ${totalKm} km`;
  document.getElementById('yearStat').textContent = `${year} CE`;
  document.getElementById('walkersStat').textContent = walkers;

  // debug block
  document.getElementById('dbgKm').textContent = progressKm;
  document.getElementById('dbgYear').textContent = year;
  const px = Math.round(map(year, startYear, endYear, leftX, rightX));
  document.getElementById('dbgPx').textContent = px;

  localStorage.setItem(STORAGE_KEY, String(progressKm));
  updateFocusCard();
}

function nearestMilestone(y){
  let best = null, bestDist = 1e9;
  for (const m of milestones){
    const d = Math.abs(m.year - y);
    if (d < bestDist){ best = m; bestDist = d; }
  }
  return best;
}

function updateFocusCard(){
  const y = Math.round(progressYear());
  const m = nearestMilestone(y);
  const card = document.getElementById('focusCard');
  document.getElementById('focusYear').textContent = m.year;
  document.getElementById('focusTitle').textContent = `— ${m.label}`;
  document.getElementById('focusCaption').textContent = m.caption || '';
  const media = document.getElementById('focusMedia');
  media.style.backgroundImage = m.image ? `url('${m.image}')` : 'none';
  card.classList.remove('hidden');
}

function positionFocusCard(){
  const holder = document.getElementById('canvas-holder');
  const rect = holder.getBoundingClientRect();
  const card  = document.getElementById('focusCard');
  const top = rect.top + window.scrollY + timelineY - 190; // sit above the bar
  card.style.top = `${top}px`;
}
