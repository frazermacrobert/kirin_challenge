// Memory Walk — Kirin (clean build)
let startYear = 70;   // keep 1955 km total as per original display
let endYear   = 2025;
let totalKm   = endYear - startYear; // 1955
let progressKm = 0;

let milestones = [
  // Romans
  { year: 71,  label: "Eboracum founded",           icon: "🏛️" },
  { year: 208, label: "Death of Septimius Severus", icon: "🪦" },
  { year: 306, label: "Constantine proclaimed",     icon: "👑" },

  // Vikings & Early Medieval
  { year: 627, label: "First York Minster",         icon: "⛪" },
  { year: 866, label: "Vikings capture York",       icon: "⚔️" },
  { year: 1068,label: "York Castle built",          icon: "🏰" },

  // Medieval Growth
  { year: 1212,label: "Minster fire",               icon: "🔥" },
  { year: 1349,label: "Black Death in York",        icon: "☠️" },
  { year: 1485,label: "End of Wars of the Roses",   icon: "🌹" },

  // Early Modern & Civil War
  { year: 1644,label: "Siege of York",              icon: "🛡️" },
  { year: 1839,label: "Railway station opens",      icon: "🚂" },

  // Chocolate & Modern York
  { year: 1932,label: "Chocolate Orange launched",  icon: "🍫" },
  { year: 1984,label: "Jorvik Centre opens",        icon: "🛶" },
  { year: 2001,label: "Fairtrade City",             icon: "🤝" },
  { year: 2025,label: "Challenge complete!",        icon: "🎉" }
];

// layout
let timelineY;
let leftX, rightX;
let sliderEl, decBtn, incBtn;

function setup(){
  const holder = document.getElementById('canvas-holder');
  const w = max(680, windowWidth - 24);
  const h = 280;
  const cnv = createCanvas(w, h);
  cnv.parent(holder);

  timelineY = h/2;
  leftX  = 40;
  rightX = width - 40;

  sliderEl = document.getElementById('kmSlider');
  decBtn = document.getElementById('decBtn');
  incBtn = document.getElementById('incBtn');

  // keep UI in sync with computed total
  sliderEl.max = totalKm;
  sliderEl.value = progressKm;

  ['input','change'].forEach(evt => {
    sliderEl.addEventListener(evt, e => {
      const v = parseInt(e.target.value,10);
      progressKm = Number.isNaN(v) ? 0 : constrain(v, 0, totalKm);
      updateStats();
    });
  });

  decBtn.addEventListener('click', () => { adjustProgress(-1); });
  incBtn.addEventListener('click', () => { adjustProgress( 1); });

  updateStats();
}

function windowResized(){
  // resize canvas responsively
  const holder = document.getElementById('canvas-holder');
  const w = max(680, windowWidth - 24);
  resizeCanvas(w, height);
  leftX  = 40;
  rightX = width - 40;
}

function draw(){
  clear();
  drawTimeline();
  drawMilestones();
  drawProgress();
}

function drawTimeline(){
  stroke(30,30,30,60);
  strokeWeight(4);
  line(leftX, timelineY, rightX, timelineY);

  // ticks every ~100 years
  const span = endYear - startYear;
  const step = 100;
  textAlign(CENTER, TOP);
  noStroke();
  fill(0,0,0,130);
  for(let y = Math.ceil(startYear/step)*step; y <= endYear; y+= step){
    const x = map(y, startYear, endYear, leftX, rightX);
    stroke(30,30,30,60); strokeWeight(1);
    line(x, timelineY-8, x, timelineY+8);
    noStroke(); fill(0,0,0,120);
    text(y, x, timelineY+12);
  }
}

function drawMilestones(){
  textAlign(CENTER, BOTTOM);
  for(const m of milestones){
    const x = map(m.year, startYear, endYear, leftX, rightX);

    // stem + dot
    stroke(0,0,0,80); strokeWeight(1);
    line(x, timelineY-26, x, timelineY+26);
    noStroke();
    fill(0); circle(x, timelineY, 6);

    // icon
    textSize(18); noStroke(); fill(0);
    text(m.icon || "•", x, timelineY-32);

    // reveal label on hover
    if (abs(mouseX - x) < 14 && abs(mouseY - timelineY) < 22) {
      showPopoverForEvent(m);
    }
  }
  // hide popover if not over anything
  if (!overAnyMilestone()) hidePopover();
}

function overAnyMilestone(){
  for(const m of milestones){
    const x = map(m.year, startYear, endYear, leftX, rightX);
    if (abs(mouseX - x) < 14 && abs(mouseY - timelineY) < 22) return true;
  }
  return false;
}

function drawProgress(){
  const x = map(progressKmToYear(progressKm), startYear, endYear, leftX, rightX);
  stroke(178,31,45,255); strokeWeight(6);
  line(leftX, timelineY, x, timelineY);
  noStroke(); fill(178,31,45);
  circle(x, timelineY, 10);
}

function progressKmToYear(km){
  // 1 km == 1 year
  return startYear + km;
}

function adjustProgress(delta){
  progressKm = constrain(progressKm + delta, 0, totalKm);
  document.getElementById('kmSlider').value = progressKm;
  updateStats();
}

function keyPressed(){
  if (keyCode === LEFT_ARROW)  adjustProgress(-1);
  if (keyCode === RIGHT_ARROW) adjustProgress( 1);
}

function updateStats(){
  const year = Math.round(progressKmToYear(progressKm));
  const km = `${progressKm} / ${totalKm} km`;
  document.getElementById('kmStat').textContent = km;
  document.getElementById('yearStat').textContent = `Current year ${year} CE`;
}

// --- Popover management with header-aware clamping ---
function showPopoverForEvent(m){
  const header = document.querySelector('.site-header');
  const headerBottom = header ? header.getBoundingClientRect().bottom : 0;

  const pop = document.getElementById('popover');
  pop.classList.remove('hidden');
  pop.style.display = 'block';

  const x = map(m.year, startYear, endYear, leftX, rightX);
  const popWidth = 260;
  const left = Math.min(Math.max(x - popWidth/2, 12), window.innerWidth - popWidth - 12);

  const desiredTop = (document.getElementById('canvas-holder').getBoundingClientRect().top) + timelineY - 140;
  const top = Math.max(headerBottom + 12, desiredTop);

  pop.style.left = `${left}px`;
  pop.style.top  = `${top}px`;

  document.getElementById('popTitle').innerText = `${m.year} — ${m.label}`;
  document.getElementById('popBody').innerText  = "Reflect on this moment in York's story.";
}

function hidePopover(){
  const pop = document.getElementById('popover');
  if (!pop.classList.contains('hidden')) {
    pop.classList.add('hidden');
    pop.style.display = 'none';
  }
}
