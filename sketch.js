// Memory Walk — Kirin (UI fixes + idle mode + ambient glow)

let startYear = 70;
let endYear   = 2025;
let totalKm   = endYear - startYear; // 1955
let progressKm = 0;
let walkers = 10;

const STORAGE_KEY = 'kirin_progress_km_ui_fixes';

// Milestones (same list as before, image optional)
const milestones = [
  { year:71,   label:"Eboracum founded",           icon:"🏛️", caption:"The Romans established the fortress of Eboracum at the confluence of the Ouse and Foss—foundations of today’s York.", image:"" },
  { year:208,  label:"Death of Septimius Severus", icon:"🪦", caption:"Roman emperor Septimius Severus died in York while campaigning in Britain, briefly making the city an imperial power base.", image:"" },
  { year:306,  label:"Constantine proclaimed",     icon:"👑", caption:"In Eboracum, Constantine was hailed emperor by his father’s troops—an event that helped set Rome (and later Europe) on a path toward Christianisation.", image:"" },
  { year:627,  label:"First York Minster",         icon:"⛪", caption:"King Edwin’s baptism led to a first wooden church on this site, beginning 1,300+ years of worship in York.", image:"" },
  { year:866,  label:"Viking Invasion",            icon:"🛶", caption:"The Great Heathen Army captured York and renamed it Jórvík, turning it into a bustling Viking trading hub. ", image:"" },
  { year:1068, label:"York Castle built",          icon:"🏰", caption:"William the Conqueror raised a motte-and-bailey at York—precursor to Clifford’s Tower—to secure Norman control.", image:"" },
  { year:1212, label:"Minster fire",               icon:"🔥", caption:"A medieval blaze damaged parts of the Minster and city, prompting phases of rebuilding in stone.", image:"assets/1212.png" },
  { year:1349, label:"Black Death",                icon:"☠️", caption:"The plague hit York hard, reshaping population, labour and guild life across the city. Learn more:", image:"" },
  { year:1485, label:"Wars of the Roses end",      icon:"🌹", caption:"Bosworth brought Tudor rule; York’s close ties to Richard III ended and civic fortunes shifted under new royal policy.", image:"" },
  { year:1644, label:"Siege of York",              icon:"🛡️", caption:"After the Parliamentarian victory at nearby Marston Moor, York surrendered—turning the tide in the North.", image:"" },
  { year:1839, label:"Railway station opens",      icon:"🚂", caption:"York’s first station opened, propelling the city into the railway age and new industries.", image:"" },
  { year:1932, label:"Chocolate Orange launched",  icon:"🍫", caption:"Terry’s created the Chocolate Orange in York—a local invention that became a national favourite.", image:"" },
  { year:1984, label:"Jorvik Centre opens",        icon:"🛶", caption:"JORVIK brought Coppergate’s archaeology to life and re-imagined museum storytelling.", image:"" },
  { year:2001, label:"Fairtrade City",             icon:"🤝", caption:"York’s fair-trade movement gathered pace; the city would go on to achieve official Fairtrade City status in 2004.", image:"" },
  { year:2025, label:"Challenge complete!",        icon:"🎉", caption:"You made it to the present day—time traveller status unlocked!", image:"" }
];


// Era bands (labels higher up for breathing room)
const eras = [
  { label:"Romans",           icon:"🏛️", from:71,   to:410 },
  { label:"Vikings & Early",  icon:"⚔️", from:627,  to:1068 },
  { label:"Medieval",         icon:"🛡️", from:1212, to:1485 },
  { label:"Early Modern",     icon:"📜", from:1644, to:1839 },
  { label:"Chocolate & Now",  icon:"🍫", from:1932, to:2025 }
];

// layout + controls
let timelineY;
let leftX, rightX;
let sliderEl, decBtn, incBtn, addForm, addInput, resetBtn;

// hover tracking
let hoveredMilestone = null;
let lastAnchorX = null;

// ---- Idle mode -------------------------------------------------------------
let idleTimer;
function goIdleSoon(){
  document.body.classList.remove('is-idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(()=> document.body.classList.add('is-idle'), 15000); // 15s idle
}
// treat these as “activity”
['pointermove','keydown','click','touchstart','wheel'].forEach(ev=>{
  window.addEventListener(ev, goIdleSoon, {passive:true});
});

// ---- Ambient overlay sizing (pulses in idle) -------------------------------
function updateAmbientBar(){
  const bar = document.getElementById('ambientBar');
  if (!bar) return;

  const x = map(progressYear(), startYear, endYear, leftX, rightX);
  const widthPx = Math.max(0, x - leftX);

  bar.style.left = `${leftX}px`;
  bar.style.top  = `${timelineY - 6}px`;  // center a 12px-high overlay
  bar.style.width = `${widthPx}px`;
}

// ---- Follow-glow (moves the bg highlight under the knob) -------------------
function updateFollowGlow(){
  const holder = document.getElementById('canvas-holder');
  if (!holder) return;
  const rect = holder.getBoundingClientRect();
  const knobX = map(progressYear(), startYear, endYear, leftX, rightX);
  const pageX = (rect.left + knobX) / window.innerWidth * 100;
  const pageY = (rect.top + timelineY) / window.innerHeight * 100;
  document.documentElement.style.setProperty('--knobx', `${pageX}%`);
  document.documentElement.style.setProperty('--knoby', `${pageY}%`);
}

function setup(){
  const holder = document.getElementById('canvas-holder');
  const w = max(820, windowWidth - 28);
  const h = 360;
  const cnv = createCanvas(w, h);
  cnv.parent(holder);

  timelineY = h/2;
  leftX  = 60;
  rightX = width - 60;

  // restore
  const saved = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  progressKm = constrain(isNaN(saved)?0:saved, 0, totalKm);

  // controls
  sliderEl = document.getElementById('kmSlider');
  decBtn   = document.getElementById('decBtn');
  incBtn   = document.getElementById('incBtn');
  addForm  = document.getElementById('toolbar');
  addInput = document.getElementById('addInput');
  resetBtn = document.getElementById('resetBtn');

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

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = parseInt(addInput.value, 10);
    if (!Number.isNaN(n) && Number.isFinite(n)) {
      adjustProgress(n);
      addInput.value = "";
    }
  });

  resetBtn.addEventListener('click', () => { progressKm = 0; syncControls(); updateUI(); });

  // Start idle detector and initial glow
  goIdleSoon();
  updateUI();           // writes stats + localStorage + glow + ambient bar
  updateAmbientBar();   // ensure ambient overlay positioned right away
}

function windowResized(){
  const w = max(820, windowWidth - 28);
  resizeCanvas(w, height);
  leftX  = 60;
  rightX = width - 60;
  updateAmbientBar();
  updateFollowGlow();
}

function draw(){
  clear();
  drawEraBands();
  drawTimelineNeon();
  drawMilestones();
  drawProgressKnob();

  // show/hide focus card based on hover
  if (hoveredMilestone){
    showFocusCard(hoveredMilestone);
  } else {
    hideFocusCard();
  }
}

// Parallax hotspot for the big gradient
document.addEventListener('pointermove', (e)=>{
  const x = (e.clientX / innerWidth) * 100;
  const y = (e.clientY / innerHeight) * 100;
  document.documentElement.style.setProperty('--gx', `${x}%`);
  document.documentElement.style.setProperty('--gy', `${y}%`);
}, {passive:true});

/* ---------- Drawing ---------- */

// Give more headroom between era labels and icons
const ERA_LABEL_Y_OFFSET = 70;     // higher = further above the line
const MILESTONE_ICON_OFFSET = 26;  // higher = closer to the line

function drawEraBands(){
  noStroke();
  textAlign(CENTER, BOTTOM);
  textSize(18);
  for(const e of eras){
    const x1 = map(e.from, startYear, endYear, leftX, rightX);
    const x2 = map(e.to,   startYear, endYear, leftX, rightX);
    fill(255,255,255,12);
    rect(x1, timelineY-40, x2-x1, 80, 12);
    // label sits higher up now for breathing room
    fill(255,255,255,160);
    text(`${e.icon} ${e.label}`, (x1+x2)/2, timelineY - ERA_LABEL_Y_OFFSET);
  }
}

function drawTimelineNeon(){
  stroke(255,255,255,42); strokeWeight(8);
  line(leftX, timelineY, rightX, timelineY);

  const x = map(progressYear(), startYear, endYear, leftX, rightX);

  drawingContext.save();
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(255,45,154,.95)';
  stroke(255,45,154); strokeWeight(12);
  line(leftX, timelineY, x, timelineY);
  drawingContext.restore();

  stroke(255,45,154,120); strokeWeight(18);
  line(leftX, timelineY, x, timelineY);

  noStroke(); fill(255,255,255,190); textAlign(LEFT, TOP);
  text(`${startYear} AD — York`, leftX, timelineY+18);
  textAlign(RIGHT, TOP);
  text(`Present Day`, rightX, timelineY+18);
}

function drawMilestones(){
  hoveredMilestone = null; // will be set if we detect hover
  textAlign(CENTER, BOTTOM); textSize(16);

  for(const m of milestones){
    const x = map(m.year, startYear, endYear, leftX, rightX);

    // stem + dot
    stroke(255,255,255,60); strokeWeight(1);
    line(x, timelineY-28, x, timelineY+28);
    noStroke(); fill(255); circle(x, timelineY, 7);

    // icon (closer to the line so it doesn't clash with era labels)
    noStroke(); fill(255);
    text(m.icon || "•", x, timelineY - MILESTONE_ICON_OFFSET);

    // hover test (small hit box around icon/line)
    if (abs(mouseX - x) < 14 && abs(mouseY - timelineY) < 24) {
      hoveredMilestone = m;
      lastAnchorX = x;
    }
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
  localStorage.setItem(STORAGE_KEY, String(progressKm));

  // keep the background glow and ambient overlay in sync
  updateFollowGlow();
  updateAmbientBar();
}

/* ---------- Focus card (hover only) ---------- */
function showFocusCard(m){
  const card   = document.getElementById('focusCard');
  const header = document.querySelector('.topbar');
  const holder = document.getElementById('canvas-holder');

  // populate
  document.getElementById('focusYear').textContent   = m.year;
  document.getElementById('focusTitle').textContent  = `— ${m.label}`;
  document.getElementById('focusCaption').textContent= m.caption || '';
  const media = document.getElementById('focusMedia');
  media.style.backgroundImage = m.image ? `url('${m.image}')` : 'none';

  // show to measure
  card.classList.remove('hidden');
  card.style.display = 'block';

  // anchor to hovered milestone
  const headerBottom = header ? header.getBoundingClientRect().bottom + window.scrollY : 0;
  const holderRect   = holder.getBoundingClientRect();
  const cardW = card.offsetWidth;
  const cardH = card.offsetHeight;

  // anchor X is lastAnchorX (canvas space) -> convert to page X
  const anchorPageX = holderRect.left + window.scrollX + lastAnchorX;
  const desiredLeft = anchorPageX - cardW/2;
  const clampedLeft = Math.min(Math.max(12, desiredLeft), window.innerWidth - cardW - 12);

  // sit above the line with headroom from header
  const linePageY   = holderRect.top + window.scrollY + timelineY;
  const desiredTop  = linePageY - cardH - 18;
  const clampedTop  = Math.max(headerBottom + 12, desiredTop);

  card.style.left = `${clampedLeft}px`;
  card.style.top  = `${clampedTop}px`;
}

function hideFocusCard(){
  const card = document.getElementById('focusCard');
  if (!card.classList.contains('hidden')) {
    card.classList.add('hidden');
    card.style.display = 'none';
  }
}
