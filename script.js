const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// -------------------- Scene navigation --------------------
let currentScene = "intro";
const sceneOrder = [
  "intro",
  "sky",
  "fireworks",
  "shooting",
  "constellation",
  "quiet",
  "ending",
];
function updateProgress() {
  $("#progressText").textContent =
    `${String(sceneOrder.indexOf(currentScene) + 1).padStart(2, "0")} / 07`;
}
function showScene(id) {
  if (id === currentScene) return;
  const old = $("#" + currentScene),
    next = $("#" + id);
  if (!next) return;

  // Crossfade: bring the next scene in while the current one is still visible.
  // This avoids the dark blank frame from V13.
  next.classList.add("active", "scene-entering");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      next.classList.remove("scene-entering");
      old.classList.add("scene-exiting");
      setTimeout(() => old.classList.remove("active", "scene-exiting"), 620);
    });
  });

  currentScene = id;
  updateProgress();
  if (id === "constellation") animateConstellation();
  if (id === "shooting") {
    startMeteors();
    for (let i = 0; i < 5; i++) setTimeout(() => spawnMeteor(true), i * 180);
  }
  if (id === "quiet") {
    setTimeout(() => spawnMeteor(true), 900);
    setTimeout(() => spawnMeteor(true), 2400);
  }
  if (id === "fireworks") {
    for (let i = 0; i < 3; i++) setTimeout(() => spawnMeteor(true), i * 260);
    startFireworks();
  }
}
$$(".next").forEach((btn) =>
  btn.addEventListener("click", () => showScene(btn.dataset.next)),
);
$("#againBtn").addEventListener("click", () => {
  resetFireworks();
  resetConstellation();
  showScene("intro");
});
updateProgress();

// -------------------- Living starfield --------------------
const space = $("#space"),
  ctx = space.getContext("2d");
const dust = $("#cosmicDust"),
  dctx = dust.getContext("2d");
let W,
  H,
  DW,
  DH,
  stars = [],
  dustParticles = [];
let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

function resizeSpace() {
  const d = devicePixelRatio || 1;
  W = space.width = innerWidth * d;
  H = space.height = innerHeight * d;
  space.style.width = innerWidth + "px";
  space.style.height = innerHeight + "px";
  DW = dust.width = innerWidth * d;
  DH = dust.height = innerHeight * d;
  dust.style.width = innerWidth + "px";
  dust.style.height = innerHeight + "px";

  const count = Math.min(1450, Math.floor((innerWidth * innerHeight) / 1050));
  stars = Array.from({ length: count }, () => {
    const roll = Math.random();
    const r =
      roll < 0.78
        ? Math.random() * 0.48 + 0.12
        : roll < 0.965
          ? Math.random() * 0.85 + 0.35
          : Math.random() * 1.5 + 0.8;
    const temp = Math.random();
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: r * d,
      a:
        roll < 0.78 ? Math.random() * 0.28 + 0.12 : Math.random() * 0.48 + 0.28,
      tw: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.012 + 0.001,
      depth: Math.random() * 0.95 + 0.05,
      color:
        temp < 0.12
          ? [180, 210, 255]
          : temp < 0.19
            ? [255, 220, 165]
            : [235, 242, 255],
      bright: r > 1.05,
    };
  });
  dustParticles = Array.from(
    { length: Math.min(230, Math.floor(innerWidth / 6)) },
    () => ({
      x: Math.random() * DW,
      y: Math.random() * DH,
      r: Math.random() * 1.25 * d,
      vx: (Math.random() - 0.5) * 0.065 * d,
      vy: (Math.random() - 0.5) * 0.065 * d,
      a: Math.random() * 0.13,
    }),
  );
  $("#starCount").textContent = count.toLocaleString();
}
addEventListener("resize", resizeSpace);
addEventListener("mousemove", (e) => {
  mouse.targetX = e.clientX / innerWidth - 0.5;
  mouse.targetY = e.clientY / innerHeight - 0.5;
});
addEventListener(
  "touchmove",
  (e) => {
    if (e.touches[0]) {
      mouse.targetX = e.touches[0].clientX / innerWidth - 0.5;
      mouse.targetY = e.touches[0].clientY / innerHeight - 0.5;
    }
  },
  { passive: true },
);

function drawSpace(t = 0) {
  mouse.x += (mouse.targetX - mouse.x) * 0.035;
  mouse.y += (mouse.targetY - mouse.y) * 0.035;
  ctx.clearRect(0, 0, W, H);

  const band = ctx.createLinearGradient(0, H * 0.9, W * 0.9, H * 0.05);
  band.addColorStop(0, "rgba(83,72,180,0)");
  band.addColorStop(0.38, "rgba(105,100,205,.045)");
  band.addColorStop(0.58, "rgba(155,125,220,.035)");
  band.addColorStop(1, "rgba(60,90,180,0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, W, H);

  for (const s of stars) {
    s.tw += s.speed;
    const d = devicePixelRatio || 1;
    const x = s.x + mouse.x * 55 * s.depth * d;
    const y = s.y + mouse.y * 55 * s.depth * d;
    const tw = s.a * (0.78 + 0.22 * Math.sin(s.tw));
    const [r, g, b] = s.color;

    if (s.bright) {
      ctx.save();
      ctx.globalAlpha = tw * 0.18;
      ctx.shadowBlur = 18 * d;
      ctx.shadowColor = `rgba(${r},${g},${b},.95)`;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(x, y, s.r * 2.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = tw * 0.55;
      ctx.strokeStyle = `rgba(${r},${g},${b},.8)`;
      ctx.lineWidth = 0.45 * d;
      const spike = 4.5 * d;
      ctx.beginPath();
      ctx.moveTo(x - spike, y);
      ctx.lineTo(x + spike, y);
      ctx.moveTo(x, y - spike);
      ctx.lineTo(x, y + spike);
      ctx.stroke();
      ctx.restore();
    }

    ctx.globalAlpha = tw;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.28 * d, s.r), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  dctx.clearRect(0, 0, DW, DH);
  for (const p of dustParticles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = DW;
    if (p.x > DW) p.x = 0;
    if (p.y < 0) p.y = DH;
    if (p.y > DH) p.y = 0;
    dctx.globalAlpha = p.a;
    dctx.fillStyle = "rgba(170,185,255,1)";
    dctx.beginPath();
    dctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    dctx.fill();
  }
  dctx.globalAlpha = 1;
  requestAnimationFrame(drawSpace);
}
resizeSpace();
requestAnimationFrame(drawSpace);

// First star reacts to click.
$("#firstStar").addEventListener("click", () => {
  showToast("The night is awake. ✦");
  $("#firstStar").animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(5)" },
      { transform: "scale(1)" },
    ],
    { duration: 850, easing: "ease-out" },
  );
});

// -------------------- Birthday-cake constellation --------------------
const cakeLines = $$("#constellationLines line");
const cakeStars = $$("#constellationStars .cake-star");
let cakeTimer = null;

function animateConstellation() {
  clearTimeout(cakeTimer);

  // Reset.
  cakeLines.forEach((l) => {
    l.classList.remove("cake-draw");
    l.style.opacity = ".08";
  });
  cakeStars.forEach((s) => s.classList.remove("cake-light", "cake-finale"));
  $("#cakeIntroText").textContent = "Look a little closer…";
  $("#cakeBirthdayText").classList.remove("show");
  $(".cake-next").classList.remove("show");

  // Stars appear one by one, then the constellation lines connect them.
  const order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  order.forEach((idx, i) => {
    setTimeout(
      () => cakeStars[idx]?.classList.add("cake-light"),
      350 + i * 190,
    );
  });

  cakeLines.forEach((line, i) => {
    setTimeout(
      () => {
        line.classList.add("cake-draw");
        line.style.opacity = "1";
      },
      1250 + i * 120,
    );
  });

  cakeTimer = setTimeout(() => {
    $("#cakeIntroText").textContent = "Looks like someone has a birthday.";
    $("#cakeBirthdayText").classList.add("show");

    // Warm glow travels through the cake.
    cakeStars.forEach((s, i) =>
      setTimeout(() => s.classList.add("cake-finale"), i * 75),
    );

    // Shooting stars cross the finished cake.
    setTimeout(() => spawnMeteor(true), 500);
    setTimeout(() => spawnMeteor(true), 1100);

    // Only after the moment has been enjoyed, offer the next step.
    setTimeout(() => $(".cake-next").classList.add("show"), 1700);
  }, 3200);
}
function resetConstellation() {
  clearTimeout(cakeTimer);
  cakeLines.forEach((l) => {
    l.classList.remove("cake-draw");
    l.style.opacity = ".08";
  });
  cakeStars.forEach((s) => s.classList.remove("cake-light", "cake-finale"));
  $("#cakeIntroText").textContent = "Look a little closer…";
  $("#cakeBirthdayText").classList.remove("show");
  $(".cake-next").classList.remove("show");
}

// -------------------- Living shooting stars --------------------
// Shooting stars are part of the atmosphere, not a single section.
// They continue quietly through every scene so the universe always feels alive.
let meteorTimer = null,
  wishUsed = false;
const globalMeteorLayer = $("#globalMeteors");
function spawnMeteor(force = false) {
  if (!globalMeteorLayer) return;
  // A few extra meteors are allowed in the dedicated shooting-star scene,
  // but the background layer is active everywhere.
  if (!force && currentScene === "fireworks" && Math.random() < 0.2) return;
  const el = document.createElement("div");
  el.className =
    "global-meteor " +
    (Math.random() < 0.16 ? "warm " : "") +
    (Math.random() < 0.28 ? "fast" : "");
  const startX = 10 + Math.random() * 110;
  const startY = 7 + Math.random() * 57;
  const angle = 22 + Math.random() * 18;
  const distance = innerWidth * (0.28 + Math.random() * 0.42);
  const rise = distance * (0.38 + 0.18 * Math.random());
  el.style.left = startX + "vw";
  el.style.top = startY + "vh";
  el.style.transform = `rotate(${angle}deg)`;
  globalMeteorLayer.appendChild(el);
  const duration = force
    ? 850 + Math.random() * 500
    : 1100 + Math.random() * 1300;
  el.animate(
    [
      {
        transform: `rotate(${angle}deg) translate(0,0) scaleX(.55)`,
        opacity: 0,
      },
      {
        transform: `rotate(${angle}deg) translate(-${distance * 0.08}px,${rise * 0.08}px) scaleX(1)`,
        opacity: 0.95,
        offset: 0.16,
      },
      {
        transform: `rotate(${angle}deg) translate(-${distance}px,${rise}px) scaleX(.82)`,
        opacity: 0,
      },
    ],
    { duration, easing: "cubic-bezier(.16,.72,.24,1)" },
  ).onfinish = () => el.remove();
}
function scheduleMeteor() {
  clearTimeout(meteorTimer);
  const base = currentScene === "shooting" ? 650 : 2100;
  const variance = currentScene === "shooting" ? 900 : 3000;
  meteorTimer = setTimeout(
    () => {
      spawnMeteor();
      // Sometimes two arrive close together, like a tiny meteor shower.
      if (Math.random() < 0.22)
        setTimeout(() => spawnMeteor(), 180 + Math.random() * 420);
      scheduleMeteor();
    },
    base + Math.random() * variance,
  );
}
function startMeteors() {
  scheduleMeteor();
  spawnMeteor(true);
}
startMeteors();
$("#wishBtn").addEventListener("click", () => {
  if (wishUsed) return;
  wishUsed = true;
  $("#wishInputWrap").classList.remove("hidden");
  $("#wishMessage").textContent = "The sky is listening. ✦";
  $("#wishInput").focus();
  for (let i = 0; i < 5; i++) setTimeout(() => spawnMeteor(true), i * 180);
});
$("#sendWish").addEventListener("click", sendWish);
$("#wishInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendWish();
});
async function sendWish() {
  const input = $("#wishInput");
  const wish = input.value.trim();
  if (!wish) {
    input.placeholder = "A tiny wish is enough…";
    return;
  }

  const sendButton = $("#sendWish");
  sendButton.disabled = true;
  sendButton.textContent = "Sending…";

  try {
    const response = await fetch("/api/send-wish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wish }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "The wish could not be sent.");
    }

    input.value = "";
    $("#wishInputWrap").classList.add("hidden");
    $("#wishMessage").textContent =
      "Your wish has found its way into the stars. ✦";
    for (let i = 0; i < 9; i++) setTimeout(() => spawnMeteor(true), i * 100);
    showToast("Wish released into the night. ☄︎");
    $(".wish-next").classList.add("show");
  } catch (error) {
    console.error("Wish delivery failed:", error);
    sendButton.disabled = false;
    sendButton.textContent = "Send it to the sky ↑";
    $("#wishMessage").textContent =
      "The stars are a little busy. Please try again. ✦";
    showToast("The wish could not be sent. Try again.");
  }
}

// -------------------- Fireworks --------------------
const fw = $("#fireworksCanvas"),
  fctx = fw.getContext("2d");
let fwW,
  fwH,
  particles = [],
  rockets = [],
  fwTimer = null,
  fwStarted = false;

function resizeFW() {
  const d = devicePixelRatio || 1;
  fwW = fw.width = innerWidth * d;
  fwH = fw.height = innerHeight * d;
  fw.style.width = innerWidth + "px";
  fw.style.height = innerHeight + "px";
}
addEventListener("resize", resizeFW);
resizeFW();

const fireworkPalettes = [
  ["#fff8e6", "#ffd98a", "#ffb45f"],
  ["#ffffff", "#c9d7ff", "#9bb8ff"],
  ["#fff2fb", "#f2b4df", "#bd8dff"],
  ["#fff6df", "#f4cf8a", "#e9a85c"],
];

function rocket() {
  const d = devicePixelRatio || 1;
  const x = (0.12 + Math.random() * 0.76) * fwW;
  const palette =
    fireworkPalettes[Math.floor(Math.random() * fireworkPalettes.length)];
  rockets.push({
    x,
    y: fwH + 12,
    vx: (Math.random() - 0.5) * 0.8 * d,
    vy: -(7.4 + Math.random() * 2.8) * d,
    target: fwH * (0.16 + Math.random() * 0.34),
    trail: [],
    palette,
  });
}

function burst(
  x,
  y,
  amount = 115,
  palette = fireworkPalettes[
    Math.floor(Math.random() * fireworkPalettes.length)
  ],
  style = "chrysanthemum",
) {
  const d = devicePixelRatio || 1;
  for (let i = 0; i < amount; i++) {
    const a = Math.random() * Math.PI * 2;
    let speed;
    if (style === "willow") speed = 1.2 + Math.random() * 3.2;
    else if (style === "ring") speed = 2.4 + Math.random() * 1.8;
    else speed = 1.5 + Math.random() * 4.8;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * speed * d,
      vy: Math.sin(a) * speed * d,
      life: 1,
      decay: 0.008 + Math.random() * 0.009,
      size: (Math.random() * 1.8 + 0.55) * d,
      color: palette[Math.floor(Math.random() * palette.length)],
      trail: [],
      gravity: style === "willow" ? 0.045 : 0.022,
      style,
    });
  }
  // A few slower gold sparks make the explosion feel layered.
  for (let i = 0; i < Math.floor(amount * 0.16); i++) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * (1 + Math.random() * 1.4) * d,
      vy: Math.sin(a) * (1 + Math.random() * 1.4) * d,
      life: 1,
      decay: 0.006 + Math.random() * 0.004,
      size: 1.5 * d,
      color: "#ffe7ad",
      trail: [],
      gravity: 0.035,
      style: "glow",
    });
  }
}

function ringBurst(x, y) {
  const d = devicePixelRatio || 1;
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    const speed = 3.5 * d;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 1,
      decay: 0.012,
      size: 1.1 * d,
      color: i % 2 ? "#f6d58f" : "#d9d4ff",
      trail: [],
      gravity: 0.008,
      style: "ring",
    });
  }
}

function textTargets(text, y = 0.43) {
  const c = document.createElement("canvas"),
    cc = c.getContext("2d"),
    d = devicePixelRatio || 1;
  c.width = fwW;
  c.height = fwH;
  const size = Math.min(fwW / (text.length * 0.62), 118 * d);
  cc.font = `600 ${size}px Inter`;
  cc.textAlign = "center";
  cc.textBaseline = "middle";
  cc.fillStyle = "#fff";
  cc.fillText(text, fwW / 2, fwH * y);
  const data = cc.getImageData(0, 0, c.width, c.height).data,
    targets = [];
  const step = Math.max(4, Math.floor(5 * d));
  for (let yy = 0; yy < c.height; yy += step)
    for (let xx = 0; xx < c.width; xx += step) {
      if (data[(yy * c.width + xx) * 4 + 3] > 150)
        targets.push({ x: xx, y: yy });
    }
  return targets;
}
function formText(text, y, delay = 0) {
  setTimeout(() => {
    const targets = textTargets(text, y),
      d = devicePixelRatio || 1;
    for (const t of targets) {
      const startX = fwW / 2 + (Math.random() - 0.5) * fwW * 0.8;
      const startY = fwH * (0.2 + 0.48 * Math.random());
      particles.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 1.8 * d,
        vy: (Math.random() - 0.5) * 1.8 * d,
        life: 1,
        decay: 0.0014 + Math.random() * 0.0011,
        size: (Math.random() * 1.7 + 0.5) * d,
        color:
          Math.random() < 0.55
            ? "#fff3d1"
            : Math.random() < 0.5
              ? "#ffffff"
              : "#d8d4ff",
        targetX: t.x,
        targetY: t.y,
        forming: true,
        trail: [],
      });
    }
  }, delay);
}

function fwLoop() {
  fctx.fillStyle = "rgba(2,1,9,.115)";
  fctx.fillRect(0, 0, fwW, fwH);
  const d = devicePixelRatio || 1;

  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.trail.push({ x: r.x, y: r.y });
    if (r.trail.length > 13) r.trail.shift();
    r.x += r.vx;
    r.y += r.vy;
    r.vy += 0.055 * d;
    for (let k = 1; k < r.trail.length; k++) {
      const a = k / r.trail.length;
      fctx.globalAlpha = a * 0.35;
      fctx.strokeStyle = r.palette[1];
      fctx.lineWidth = (k / 5) * d;
      fctx.beginPath();
      fctx.moveTo(r.trail[k - 1].x, r.trail[k - 1].y);
      fctx.lineTo(r.trail[k].x, r.trail[k].y);
      fctx.stroke();
    }
    fctx.globalAlpha = 1;
    fctx.fillStyle = "#fff";
    fctx.shadowBlur = 10 * d;
    fctx.shadowColor = r.palette[0];
    fctx.beginPath();
    fctx.arc(r.x, r.y, 1.7 * d, 0, Math.PI * 2);
    fctx.fill();
    fctx.shadowBlur = 0;
    if (r.y <= r.target) {
      const style =
        Math.random() < 0.18
          ? "willow"
          : Math.random() < 0.2
            ? "ring"
            : "chrysanthemum";
      burst(r.x, r.y, 110, r.palette, style);
      if (style === "ring") ringBurst(r.x, r.y);
      rockets.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.forming) {
      const dx = p.targetX - p.x,
        dy = p.targetY - p.y;
      p.x += dx * 0.035;
      p.y += dy * 0.035;
      p.vx *= 0.98;
      p.vy *= 0.98;
    } else {
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 5) p.trail.shift();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.994;
      p.vy *= 0.994;
    }
    p.life -= p.decay;
    fctx.globalAlpha = Math.max(0, p.life);
    if (!p.forming && p.trail.length > 1) {
      fctx.strokeStyle = p.color;
      fctx.lineWidth = Math.max(0.45, p.size * 0.7);
      fctx.beginPath();
      fctx.moveTo(p.trail[0].x, p.trail[0].y);
      fctx.lineTo(p.x, p.y);
      fctx.stroke();
    }
    fctx.fillStyle = p.color;
    fctx.beginPath();
    fctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    fctx.fill();
    if (p.life <= 0) particles.splice(i, 1);
  }
  fctx.globalAlpha = 1;
  requestAnimationFrame(fwLoop);
}
fwLoop();

function startFireworks() {
  if (fwStarted) return;
  fwStarted = true;
  particles = [];
  rockets = [];
  $("#fireworkIntro").style.opacity = "1";
  $("#birthdayReveal").classList.remove("show");
  $("#replayFireworks").classList.remove("show");
  $(".final-next").classList.remove("show");
  $("#fireworkCaption").textContent = "wait for it…";
  fctx.clearRect(0, 0, fwW, fwH);
  setTimeout(() => ($("#fireworkIntro").style.opacity = "0"), 1500);

  // A deliberate build-up: one distant firework, then a richer sky.
  let n = 0;
  fwTimer = setInterval(() => {
    rocket();
    n++;
    if (n >= 7) {
      clearInterval(fwTimer);
      setTimeout(
        () => burst(fwW * 0.24, fwH * 0.29, 125, fireworkPalettes[1]),
        500,
      );
      setTimeout(
        () => burst(fwW * 0.76, fwH * 0.34, 125, fireworkPalettes[2]),
        850,
      );
      setTimeout(() => formText("MAMTA", 0.42, 0), 1300);
      setTimeout(() => {
        $("#fireworkCaption").textContent = "look closely…";
        formText("HAPPY BIRTHDAY", 0.59, 0);
        setTimeout(() => {
          burst(fwW * 0.5, fwH * 0.24, 180, fireworkPalettes[0]);
          burst(fwW * 0.16, fwH * 0.47, 90, fireworkPalettes[2]);
          burst(fwW * 0.84, fwH * 0.46, 90, fireworkPalettes[1]);
          $("#birthdayReveal").classList.add("show");
          $("#replayFireworks").classList.add("show");
          $(".final-next").classList.add("show");
          $("#fireworkCaption").textContent = "✦ the sky has something to say";
        }, 2300);
      }, 1700);
    }
  }, 560);
}

function resetFireworks() {
  fwStarted = false;
  clearInterval(fwTimer);
  particles = [];
  rockets = [];
  $("#birthdayReveal").classList.remove("show");
  $("#replayFireworks").classList.remove("show");
  $(".final-next").classList.remove("show");
  $("#fireworkCaption").textContent = "wait for it…";
  fctx.clearRect(0, 0, fwW, fwH);
}
$("#replayFireworks").onclick = () => {
  resetFireworks();
  setTimeout(startFireworks, 100);
};

// -------------------- Ambient cosmic tone --------------------
let audioCtx = null,
  master = null,
  oscillators = [],
  soundOn = false;
function makeAmbient() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  master = audioCtx.createGain();
  master.gain.value = 0;
  master.connect(audioCtx.destination);
  [174, 261.63, 392].forEach((freq, i) => {
    const o = audioCtx.createOscillator(),
      g = audioCtx.createGain();
    o.type = i === 1 ? "triangle" : "sine";
    o.frequency.value = freq;
    g.gain.value = i === 0 ? 0.5 : 0.18;
    o.connect(g).connect(master);
    o.start();
    oscillators.push(o);
  });
}
$("#soundBtn").addEventListener("click", () => {
  if (!audioCtx) makeAmbient();
  soundOn = !soundOn;
  master.gain.setTargetAtTime(soundOn ? 0.012 : 0, audioCtx.currentTime, 0.8);
  $("#soundBtn").textContent = soundOn ? "♫" : "♪";
});

// -------------------- Tiny utilities --------------------
let toastTimer = null;
function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}
