// ...existing code...
//學習5程式碼所在
// 定義五種粉紅色的十六進位顏色代碼
const COLORS = [
  '#ffe5ec', // 淺粉紅
  '#ffc2d1', // 柔和粉紅
  '#ffb3c6', // 中粉紅
  '#ff8fab', // 較深粉紅
  '#fb6f92'  // 艷粉紅
];

// 背景顏色
const BACKGROUND_COLOR = '#fff0f3';

// 儲存所有圓形物件的陣列
let circles = [];
// 圓形的總數量
const NUM_CIRCLES = 30;

// 粒子系統（爆破）
let particles = [];
const PARTICLES_PER_EXPLOSION = 18;
const PARTICLE_DRAG = 0.98;

// 音效（外部或合成 fallback）
let explosionSound;

// 提示文字與分數
let showPrompt = true;
let promptText = "點擊開啟聲音並點擊圓形產生爆破";
let promptAlpha = 255;
let promptFading = false;

let score = 0; // 分數

function preload() {
  // 嘗試載入外部音效（可放 assets/explosion.mp3）
  soundFormats('mp3', 'wav');
  explosionSound = loadSound('assets/explosion.mp3', () => {
    // 成功載入
  }, (err) => {
    console.warn('explosion sound load failed:', err);
    explosionSound = null;
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  for (let i = 0; i < NUM_CIRCLES; i++) {
    circles.push(new Bubble());
  }

  background(BACKGROUND_COLOR);

  // 如果瀏覽器需要，嘗試預先建立 audio context（避免只有點擊後才能建立）
  try {
    if (getAudioContext && getAudioContext().state === 'suspended') {
      // 不主動 resume，等使用者互動（click）再 resume
    }
  } catch (e) {}
}

function draw() {
  background(BACKGROUND_COLOR);

  // 繪製左上角識別文字
  push();
  textSize(32);
  fill('#402E2A');
  noStroke();
  textAlign(LEFT, TOP);
  text('412730243 林子綺', 12, 12);
  pop();

  // 繪製右上角分數
  push();
  textSize(32);
  fill('#402E2A');
  noStroke();
  textAlign(RIGHT, TOP);
  text('分數: ' + score, width - 12, 12);
  pop();

  // 更新並繪製圓形
  for (let i = 0; i < circles.length; i++) {
    circles[i].move();
    circles[i].display();
  }

  // 移除已爆破的圓並補上新圓（保持總數）
  for (let i = circles.length - 1; i >= 0; i--) {
    if (circles[i].dead) {
      circles.splice(i, 1);
    }
  }
  while (circles.length < NUM_CIRCLES) {
    circles.push(new Bubble());
  }

  // 更新並繪製粒子（爆破碎片）
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  // 繪製提示文字（畫面中央）
  if (showPrompt) {
    textAlign(CENTER, CENTER);
    textSize(28);
    noStroke();
    if (promptFading) {
      promptAlpha = max(0, promptAlpha - 8);
      if (promptAlpha <= 0) showPrompt = false;
    }
    fill(0, 0, 0, promptAlpha);
    text(promptText, width / 2, height / 2);
  }
}

/**
 * 繪製五角星的通用函式
 */
function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// 定義一個 Bubble (氣泡/圓形) 類別
class Bubble {
  constructor() {
    this.x = random(width);
    this.y = random(height, height + 200);
    this.d = random(50, 200);
    this.r = this.d / 2;

    // 保留原始 hex 顏色以便比對
    this.hex = random(COLORS);
    this.c = color(this.hex);

    this.alpha = random(50, 200);
    this.speed = random(-0.5, -3);
    this.starD = this.d / 5;
    this.starC = color(255);

    this.dead = false;
  }

  move() {
    if (this.dead) return;

    this.y += this.speed;
    this.x += random(-0.5, 0.5);

    // 往上超出畫面則重置至底部（不自動爆破）
    if (this.y < -this.r) {
      this.y = height + this.r;
      this.x = random(width);
    }
  }

  display() {
    if (this.dead) return;

    noStroke();
    this.c.setAlpha(this.alpha);
    fill(this.c);
    circle(this.x, this.y, this.d);

    // 五角星
    this.starC.setAlpha(this.alpha);
    fill(this.starC);
    const starR2 = this.starD / 2;
    const offset = this.r - starR2 - 5;
    const angleA = radians(45);
    const starX = this.x + cos(angleA) * offset;
    const starY = this.y - sin(angleA) * offset;
    star(starX, starY, starR2 * 0.4, starR2, 5);
  }
}

// 粒子類別（爆破碎片）
class Particle {
  constructor(x, y, baseColor, big = false) {
    this.pos = createVector(x, y);
    const angle = random(TWO_PI);
    const speed = random(big ? 1.5 : 0.6, big ? 6 : 3.5);
    this.vel = createVector(cos(angle) * speed, sin(angle) * speed);
    this.life = int(random(40, 90)) * (big ? 1.4 : 1);
    this.maxLife = this.life;
    this.size = random(3, 10) * (big ? 1.4 : 1);
    this.r = constrain(red(baseColor) + random(-10, 30), 0, 255);
    this.g = constrain(green(baseColor) + random(-10, 30), 0, 255);
    this.b = constrain(blue(baseColor) + random(-10, 30), 0, 255);
    this.alpha = random(180, 255);
    this.drag = PARTICLE_DRAG;
  }

  update() {
    this.pos.add(this.vel);
    this.vel.mult(this.drag);
    this.vel.y += 0.02;
    this.life--;
  }

  display() {
    noStroke();
    const a = map(this.life, 0, this.maxLife, 0, this.alpha);
    fill(this.r, this.g, this.b, a);
    circle(this.pos.x, this.pos.y, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}

// 建立爆破效果（並播放音效）
function createExplosion(x, y, baseColor, big = false) {
  const count = big ? PARTICLES_PER_EXPLOSION * 2 : PARTICLES_PER_EXPLOSION;
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x + random(-6, 6), y + random(-6, 6), baseColor, big));
  }

  // 播放外部音效或合成音效 fallback
  if (explosionSound && explosionSound.isLoaded && explosionSound.isLoaded()) {
    try {
      explosionSound.rate(random(0.9, 1.2));
      explosionSound.setVolume(random(0.35, 0.9));
      explosionSound.play();
    } catch (e) {
      playSynthExplosion();
    }
  } else {
    playSynthExplosion();
  }
}

// 合成簡單 pop 音效作為 fallback
function playSynthExplosion() {
  try {
    const osc = new p5.Oscillator('triangle');
    const env = new p5.Envelope();
    env.setADSR(0.001, 0.08, 0.2, 0.06);
    env.setRange(0.8, 0);
    osc.amp(0);
    osc.freq(random(300, 900));
    osc.start();
    env.play(osc);
    setTimeout(() => {
      try { osc.stop(); } catch (e) {}
    }, 250);
  } catch (e) {
    // 若 p5.sound 未載入則無音
  }
}

// 偵測滑鼠按下：若按到圓形則爆破該圓並更新分數；若畫面提示存在則隱藏提示與 resume audio
function mousePressed() {
  // 隱藏提示並嘗試 resume audio
  if (showPrompt) {
    promptFading = true;
    try {
      if (getAudioContext && getAudioContext().state !== 'running') {
        getAudioContext().resume();
      }
    } catch (e) {}
  }

  // 檢查是否點到圓形（從最上層開始）
  for (let i = circles.length - 1; i >= 0; i--) {
    const b = circles[i];
    if (b.dead) continue;
    const d = dist(mouseX, mouseY, b.x, b.y);
    if (d <= b.r) {
      // 點到圓形，產生爆破，標記為死，更新分數
      createExplosion(b.x, b.y, b.c);
      b.dead = true;

      // 若按到淺粉紅 '#ffe5ec' 加一分，其他顏色扣一分
      if (b.hex && b.hex.toLowerCase() === '#ffe5ec') {
        score += 1;
      } else {
        score -= 1;
      }
      break; // 一次只處理一個圓
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(BACKGROUND_COLOR);
}
// ...existing code...