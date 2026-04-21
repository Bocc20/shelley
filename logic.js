/* ─── BURGER MENU ────────────────────────────────────── */
const burgerBtn = document.getElementById('burgerBtn');
const drawer    = document.getElementById('drawer');

burgerBtn.addEventListener('click', () => {
  burgerBtn.classList.toggle('open');
  drawer.classList.toggle('open');
});

document.querySelectorAll('.drawer-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + target).classList.add('active');
    document.querySelectorAll('.drawer-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    burgerBtn.classList.remove('open');
    drawer.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

/* ─── GALLERY: upload images ─────────────────────────── */
document.querySelectorAll('.upload-label input[type="file"]').forEach(input => {
  input.addEventListener('change', e => {
    const slot = input.dataset.slot;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const inner = document.getElementById('inner-' + slot);
      inner.querySelectorAll('.ph-icon, .ph-text').forEach(el => el.remove());
      let img = inner.querySelector('img');
      if (!img) { img = document.createElement('img'); inner.prepend(img); }
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
});

/* ─── GALLERY: live caption sync ────────────────────── */
document.querySelectorAll('.caption-input').forEach(inp => {
  inp.addEventListener('input', () => {
    const slot = inp.dataset.cap;
    document.getElementById('capdisplay-' + slot).textContent = inp.value;
  });
});

/* ─── CONFETTI LOGIC ─────────────────────────────────── */
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let animId;

const COLORS = ['#e8637a','#f4b8c4','#d4a853','#c4435e','#fff0f3','#f9c6d0','#ffd580'];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function Particle() {
  this.reset(true);
}
Particle.prototype.reset = function (init = false) {
  this.x = Math.random() * canvas.width;
  this.y = init ? Math.random() * canvas.height - canvas.height : -12;
  this.w = Math.random() * 10 + 5;
  this.h = Math.random() * 6 + 3;
  this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  this.vx = (Math.random() - 0.5) * 2;
  this.vy = Math.random() * 3 + 1.5;
  this.angle = Math.random() * Math.PI * 2;
  this.spin = (Math.random() - 0.5) * 0.15;
  this.alpha = Math.random() * 0.5 + 0.5;
  this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
};
Particle.prototype.update = function () {
  this.x += this.vx;
  this.y += this.vy;
  this.angle += this.spin;
  if (this.y > canvas.height + 20) this.reset();
};
Particle.prototype.draw = function () {
  ctx.save();
  ctx.globalAlpha = this.alpha;
  ctx.translate(this.x, this.y);
  ctx.rotate(this.angle);
  ctx.fillStyle = this.color;
  if (this.shape === 'rect') {
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, this.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

function spawnBurst(n = 120) {
  for (let i = 0; i < n; i++) {
    const p = new Particle();
    p.y = canvas.height * (Math.random() * 0.5);
    p.vy = Math.random() * 4 + 2;
    particles.push(p);
  }
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  if (particles.length > 400) particles.splice(0, particles.length - 400);
  animId = requestAnimationFrame(loop);
}

document.getElementById('celebrateBtn').addEventListener('click', () => {
  spawnBurst(160);
  if (!animId) loop();
});

setTimeout(() => {
  spawnBurst(60);
  loop();
}, 800);
