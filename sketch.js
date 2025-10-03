/*
  Memory Walk — Kirin prototype (p5.js)
  - Timeline visual: 70 AD -> 2025 (1km = 1 year)
  - progressKm controls via range input and arrow keys
  - Pixelation effect applied to timeline segments left of the current orb
  - Simple milestone popover + Restore action (removes pixelation for that band)
*/

let startYear = 70;
let endYear = 2025;
let totalKm = endYear - startYear; // 1955
let progressKm = 438; // default
let canvasMargin = 90;
let timelineY;
let timelineH = 110;
let leftX, rightX;
let milestones = [
  { year: 70, label: "York Founded", icon: "🏛" },
  { year: 866, label: "Viking Invasion", icon: "⛵" },
  { year: 1066, label: "Norman Conquest", icon: "👑" },
  { year: 1914, label: "WWI", icon: "🌺" },
  { year: 2025, label: "Present Day", icon: "🏙" }
];

let sliderEl, minusBtn, plusBtn, popoverEl, popTitleEl, popBodyEl, restoreBtn, debugEl;
let restoredYear = null; // highest year restored via Restore action

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-container');
  // transparent canvas to allow background gradient through
  clear();

  timelineY = height * 0.52;
  leftX = canvasMargin;
  rightX = width - canvasMargin;

  // DOM elements
  sliderEl = document.getElementById('progressRange');
  minusBtn = document.getElementById('minus');
  plusBtn = document.getElementById('plus');
  popoverEl = document.getElementById('popover');
  popTitleEl = document.getElementById('popTitle');
  popBodyEl = document.getElementById('popBody');
  restoreBtn = document.getElementById('restoreBtn');
  debugEl = document.getElementById('debug');

  sliderEl.addEventListener('input', (e)=> {
    progressKm = parseInt(e.target.value);
  });
  minusBtn.addEventListener('click', ()=> {
    progressKm = max(0, progressKm - 1);
    sliderEl.value = progressKm;
  });
  plusBtn.addEventListener('click', ()=> {
    progressKm = min(totalKm, progressKm + 1);
    sliderEl.value = progressKm;
  });

  restoreBtn.addEventListener('click', ()=> {
    // restore the currently hovered/selected event if any
    if (hoveredEvent) {
      restoredYear = hoveredEvent.year;
      // small flourish: reduce pixelation instantly for band
      pulseRestore = 18; // frames of special bloom effect
    }
  });

  // keyboard
  window.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowRight') {
      progressKm = min(totalKm, progressKm + 1);
      sliderEl.value = progressKm;
    } else if (e.key === 'ArrowLeft') {
      progressKm = max(0, progressKm - 1);
      sliderEl.value = progressKm;
    }
  });

  // ensure initial UI text
  updateStats();
}

let hoveredEvent = null;
let pulseRestore = 0;

function draw() {
  clear(); // keep CSS gradient visible
  timelineY = height * 0.52;
  leftX = canvasMargin;
  rightX = width - canvasMargin;

  let currentYear = startYear + progressKm;
  currentYear = constrain(currentYear, startYear, endYear);

  // draw timeline ribbon
  push();
  drawingContext.shadowBlur = 36;
  drawingContext.shadowColor = '#ff1493';
  strokeWeight(14);
  stroke(255, 255, 255, 40);
  noFill();
  line(leftX, timelineY, rightX, timelineY);
  pop();

  // draw subtle shimmer line on top (neon)
  push();
  strokeWeight(4);
  drawingContext.shadowBlur = 18;
  drawingContext.shadowColor = '#ff1493';
  stroke(255,20,147,140);
  line(leftX, timelineY-4, rightX, timelineY-4);
  pop();

  // markers
  textAlign(CENTER, CENTER);
  textSize(14);
  for (let m of milestones) {
    let x = map(m.year, startYear, endYear, leftX, rightX);
    // vertical pin
    noStroke();
    fill(30, 30, 40, 160);
    ellipse(x, timelineY, 10, 10);
    // icon above
    textSize(18);
    if (startYear + progressKm >= m.year) {
      // unlocked
      push();
      drawingContext.shadowBlur = 18;
      drawingContext.shadowColor = '#ff1493';
      fill(255);
      text(m.icon, x, timelineY - 30);
      pop();
    } else {
      fill(230,230,230,100);
      text(m.icon, x, timelineY - 30);
    }
    // small label when passed
    textSize(12);
    if (startYear + progressKm >= m.year) {
      fill(255);
      text(m.label, x, timelineY - 56);
    }
  }

  // trail behind orb
  let orbYear = startYear + progressKm;
  let orbX = map(orbYear, startYear, endYear, leftX, rightX);
  strokeWeight(8);
  stroke(255,255,255,60);
  line(leftX, timelineY, orbX, timelineY);

  // pixelation region: everything left of orbX that is not restored
  let pixelLeft = leftX;
  let pixelRight = orbX;
  if (restoredYear) {
    // compute restored boundary x
    let restoredX = map(restoredYear, startYear, endYear, leftX, rightX);
    pixelLeft = restoredX; // do not pixelate right of restoredX
  }

  if (pixelRight - pixelLeft > 12) {
    // capture the region
    let bandY = timelineY - timelineH/2;
    let bandH = timelineH;
    // safety clamp
    let px = floor(pixelLeft);
    let py = floor(bandY);
    let pw = floor(max(1, pixelRight - pixelLeft));
    let ph = floor(max(2, bandH));
    // get the pixels as an image
    let img = get(px, py, pw, ph);
    // determine block size based on progress (older = larger blocks)
    let decayFactor = constrain((1 - (progressKm / totalKm)) * 0.35, 0, 1);
    let maxBlock = 24;
    let minBlock = 1;
    let blockSize = max(minBlock, floor(lerp(minBlock, maxBlock, decayFactor)));
    // allow temporary smaller blocks during pulse restore
    if (pulseRestore > 0) {
      blockSize = max(minBlock, floor(blockSize * 0.35));
      pulseRestore--;
    }
    // avoid zero or too-large resize
    let tinyW = max(1, floor(img.width / blockSize));
    let tinyH = max(1, floor(img.height / blockSize));
    img.resize(tinyW, tinyH);
    // draw the pixelated image scaled back up
    image(img, px, py, pw, ph);
    // tint with magenta to reinforce brand
    noStroke();
    fill(255, 20, 147, 24);
    rect(px, py, pw, ph);
    // update debug
    document.getElementById('debug').innerText = `progressKm: ${progressKm} | mappedYear: ${Math.round(orbYear)} | pixelBlockSize: ${blockSize}px`;
  } else {
    document.getElementById('debug').innerText = `progressKm: ${progressKm} | mappedYear: ${Math.round(orbYear)} | pixelBlockSize: 1px`;
  }

  // draw orb (glass orb with neon halo)
  push();
  drawingContext.shadowBlur = 40;
  drawingContext.shadowColor = '#ff1493';
  noStroke();
  fill(255, 16);
  ellipse(orbX, timelineY, 48, 48);
  // inner badge
  fill(255);
  textSize(14);
  textAlign(CENTER, CENTER);
  text(Math.round(orbYear), orbX, timelineY);
  pop();

  // detect hover over milestones
  hoveredEvent = null;
  for (let m of milestones) {
    let x = map(m.year, startYear, endYear, leftX, rightX);
    if (dist(mouseX, mouseY, x, timelineY - 30) < 20) {
      hoveredEvent = m;
    }
  }

  // show popover if hovering a milestone or if a milestone was recently passed
  if (hoveredEvent) {
    showPopoverForEvent(hoveredEvent);
  } else {
    hidePopover();
  }

  updateStats();
}

function showPopoverForEvent(m) {
  let x = map(m.year, startYear, endYear, leftX, rightX);
  let pop = document.getElementById('popover');
  pop.style.display = 'block';
  pop.classList.remove('hidden');
  // position the popover slightly above the marker
  let rect = document.body.getBoundingClientRect();
  let left = constrain(x - 120, 10, windowWidth() - 240);
  let top = max(36, timelineY - 140);
  pop.style.left = left + 'px';
  pop.style.top = (top) + 'px';
  document.getElementById('popTitle').innerText = `${m.year} — ${m.label}`;
  // example memory caption
  document.getElementById('popBody').innerText = "Granddad’s dock stories";
}

function hidePopover() {
  let pop = document.getElementById('popover');
  pop.style.display = 'none';
  pop.classList.add('hidden');
}

function updateStats(){
  let orbYear = Math.round(startYear + progressKm);
  document.getElementById('stat-progress').innerText = `${progressKm} / ${totalKm} km`;
  document.getElementById('stat-year').innerText = `Current year ${orbYear} CE`;
}

// helpers
function windowWidth(){ return window.innerWidth; }
function windowHeight(){ return window.innerHeight; }

function windowResized(){
  resizeCanvas(windowWidth(), windowHeight());
}

