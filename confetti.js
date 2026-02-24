(function () {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const colors = ["#c9a44a", "#ead7a1", "#ffffff", "#f6d36b", "#d8b458"];
  const pieces = [];
  const cursorDrops = [];
  const rainbowTrailColors = [
    "#ff4b57",
    "#ff9b45",
    "#ffe25c",
    "#63ff7b",
    "#53cfff",
    "#a97bff",
  ];
  const cursorSprite = {
    img: null,
    ready: false,
    w: 40,
    h: 44,
  };

  let width = 0;
  let height = 0;
  let dpr = 1;
  let lastTime = 0;
  let startedAt = 0;
  let lastScrollY = window.scrollY;
  let gustX = 0;
  let gustY = 0;
  let animationStarted = false;

  const config = {
    spawnDurationMs: 3000,
    maxPieces: 260,
    spawnPerSecond: 85,
    gravity: 900,
    airDrag: 0.0015,
    bounce: 0.18,
    floorPadding: 4,
    binSize: 8,
    baseWindDecay: 0.94,
    maxDisturbPerScroll: 24,
    ribbonStartDelayMs: 380,
    ribbonDurationMs: 5000,
    ribbonMax: 44,
    ribbonSpawnPerSecond: 12,
    ribbonGravity: 240,
    ribbonAirDrag: 0.0012,
  };

  let pileBins = [];

  function getViewportMetrics() {
    const vv = window.visualViewport;
    return {
      width: Math.max(1, Math.floor(vv ? vv.width : window.innerWidth)),
      height: Math.max(1, Math.floor(vv ? vv.height : window.innerHeight)),
      top: Math.round(window.scrollY + (vv ? vv.offsetTop : 0)),
      left: Math.round(window.scrollX + (vv ? vv.offsetLeft : 0)),
    };
  }

  function syncCanvasToViewport() {
    const metrics = getViewportMetrics();
    canvas.style.top = metrics.top + "px";
    canvas.style.left = metrics.left + "px";
    canvas.style.width = metrics.width + "px";
    canvas.style.height = metrics.height + "px";
  }

  function resize() {
    const metrics = getViewportMetrics();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = metrics.width;
    height = metrics.height;
    syncCanvasToViewport();
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const nextBins = new Array(Math.ceil(width / config.binSize) + 2).fill(0);
    if (pileBins.length) {
      for (let i = 0; i < Math.min(nextBins.length, pileBins.length); i += 1) {
        nextBins[i] = pileBins[i];
      }
    }
    pileBins = nextBins;

    for (const p of pieces) {
      p.x = Math.min(width - 4, Math.max(4, p.x));
      p.y = Math.min(height + 200, p.y);
      if (p.resting) {
        p.resting = false;
        clearDeposit(p);
      }
    }
    for (const d of cursorDrops) {
      d.x = Math.min(width - 4, Math.max(4, d.x));
      d.y = Math.min(height + 200, d.y);
      if (d.resting) {
        d.resting = false;
        clearCursorDeposit(d);
      }
    }
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function spawnPiece() {
    if (pieces.length >= config.maxPieces) return;

    const size = random(4, 10);
    const aspect = random(0.55, 1.8);
    const x = random(width * 0.08, width * 0.92);
    const y = random(-80, -10);
    const vx = random(-80, 80) + gustX * 0.15;
    const vy = random(60, 180);
    const wobble = random(1.8, 5.5);
    const shape = Math.random() < 0.82 ? "rect" : "circle";

    pieces.push({
      x,
      y,
      vx,
      vy,
      w: size * aspect,
      h: size,
      r: random(0, Math.PI * 2),
      vr: random(-3, 3),
      wobble,
      wobblePhase: random(0, Math.PI * 2),
      color: colors[(Math.random() * colors.length) | 0],
      shape,
      resting: false,
      asleepFrames: 0,
      depositStart: -1,
      depositEnd: -1,
      depositAmount: 0,
      layer: Math.random(),
    });
  }

  function spawnRibbon() {
    if (cursorDrops.length >= config.ribbonMax) return;

    cursorDrops.push({
      x: random(width * 0.04, width * 0.96),
      y: random(-160, -20),
      vx: random(-28, 28),
      vy: random(25, 95),
      amp: random(10, 26),
      freq: random(1.4, 2.8),
      phase: random(0, Math.PI * 2),
      phaseSpeed: random(1.4, 3.2),
      alpha: random(0.78, 0.95),
      life: 0,
      maxLife: random(5.8, 8.5),
      layer: Math.random(),
      w: cursorSprite.w,
      h: cursorSprite.h,
      r: random(0, Math.PI * 2),
      vr: random(-0.9, 0.9),
      hue: random(0, 360),
      hueSpeed: random(40, 86),
      resting: false,
      asleepFrames: 0,
      depositStart: -1,
      depositEnd: -1,
      depositAmount: 0,
      trail: [],
    });
  }

  function pieceRadius(p) {
    return Math.max(3, Math.max(p.w, p.h) * 0.5);
  }

  function cursorDropRadius(d) {
    return Math.max(8, Math.max(d.w, d.h) * 0.38);
  }

  function terrainYAt(x) {
    const bin = x / config.binSize;
    const i0 = clamp(Math.floor(bin), 0, pileBins.length - 1);
    const i1 = clamp(i0 + 1, 0, pileBins.length - 1);
    const t = bin - i0;
    const pileHeight = pileBins[i0] * (1 - t) + pileBins[i1] * t;
    return height - config.floorPadding - pileHeight;
  }

  function clearDeposit(p) {
    if (p.depositStart < 0 || p.depositEnd < p.depositStart || p.depositAmount <= 0) {
      p.depositStart = -1;
      p.depositEnd = -1;
      p.depositAmount = 0;
      return;
    }

    const count = p.depositEnd - p.depositStart + 1;
    const perBin = p.depositAmount / count;
    for (let i = p.depositStart; i <= p.depositEnd; i += 1) {
      pileBins[i] = Math.max(0, pileBins[i] - perBin);
    }

    p.depositStart = -1;
    p.depositEnd = -1;
    p.depositAmount = 0;
  }

  function smoothLocalPile(start, end) {
    const left = clamp(start - 1, 0, pileBins.length - 1);
    const right = clamp(end + 1, 0, pileBins.length - 1);
    for (let i = left; i <= right; i += 1) {
      const prev = pileBins[Math.max(0, i - 1)];
      const curr = pileBins[i];
      const next = pileBins[Math.min(pileBins.length - 1, i + 1)];
      pileBins[i] = curr * 0.5 + prev * 0.25 + next * 0.25;
    }
  }

  function settlePiece(p) {
    if (p.resting) return;

    const radius = pieceRadius(p);
    const start = clamp(Math.floor((p.x - radius) / config.binSize), 0, pileBins.length - 1);
    const end = clamp(Math.floor((p.x + radius) / config.binSize), 0, pileBins.length - 1);
    let maxPile = 0;
    for (let i = start; i <= end; i += 1) {
      if (pileBins[i] > maxPile) maxPile = pileBins[i];
    }

    p.x = clamp(p.x, radius, width - radius);
    p.y = height - config.floorPadding - maxPile - radius;
    p.vx = 0;
    p.vy = 0;
    p.vr *= 0.25;
    p.resting = true;
    p.asleepFrames = 0;

    const deposit = Math.max(1.2, radius * 0.65);
    const count = end - start + 1;
    const perBin = deposit / count;
    for (let i = start; i <= end; i += 1) {
      pileBins[i] += perBin;
    }
    smoothLocalPile(start, end);

    p.depositStart = start;
    p.depositEnd = end;
    p.depositAmount = deposit;
  }

  function wakePiece(p, impulseX, impulseY) {
    if (!p.resting) return;
    clearDeposit(p);
    p.resting = false;
    p.vx = random(-14, 14) + impulseX;
    p.vy = -Math.abs(impulseY) - random(20, 90);
    p.vr = random(-2.2, 2.2);
    p.y -= random(1, 4);
    p.asleepFrames = 0;
  }

  function clearCursorDeposit(d) {
    if (d.depositStart < 0 || d.depositEnd < d.depositStart || d.depositAmount <= 0) {
      d.depositStart = -1;
      d.depositEnd = -1;
      d.depositAmount = 0;
      return;
    }

    const count = d.depositEnd - d.depositStart + 1;
    const perBin = d.depositAmount / count;
    for (let i = d.depositStart; i <= d.depositEnd; i += 1) {
      pileBins[i] = Math.max(0, pileBins[i] - perBin);
    }

    d.depositStart = -1;
    d.depositEnd = -1;
    d.depositAmount = 0;
  }

  function settleCursorDrop(d) {
    if (d.resting) return;

    const radius = cursorDropRadius(d);
    const start = clamp(Math.floor((d.x - radius) / config.binSize), 0, pileBins.length - 1);
    const end = clamp(Math.floor((d.x + radius) / config.binSize), 0, pileBins.length - 1);
    let maxPile = 0;
    for (let i = start; i <= end; i += 1) {
      if (pileBins[i] > maxPile) maxPile = pileBins[i];
    }

    d.x = clamp(d.x, radius, width - radius);
    d.y = height - config.floorPadding - maxPile - radius;
    d.vx = 0;
    d.vy = 0;
    d.vr *= 0.25;
    d.resting = true;
    d.asleepFrames = 0;
    d.trail.length = 0;

    const deposit = Math.max(1.6, radius * 0.58);
    const count = end - start + 1;
    const perBin = deposit / count;
    for (let i = start; i <= end; i += 1) {
      pileBins[i] += perBin;
    }
    smoothLocalPile(start, end);

    d.depositStart = start;
    d.depositEnd = end;
    d.depositAmount = deposit;
  }

  function wakeCursorDrop(d, impulseX, impulseY) {
    if (!d.resting) return;
    clearCursorDeposit(d);
    d.resting = false;
    d.vx = random(-10, 10) + impulseX;
    d.vy = -Math.abs(impulseY) - random(18, 70);
    d.vr = random(-1.4, 1.4);
    d.y -= random(1, 3);
    d.asleepFrames = 0;
  }

  function disturbRibbonsFromScroll(scrollDelta) {
    if (!scrollDelta || !cursorDrops.length) return;
    const magnitude = clamp(Math.abs(scrollDelta), 1, 140);
    const direction = Math.sign(scrollDelta) || 1;
    const count = Math.min(cursorDrops.length, Math.max(4, Math.round(magnitude * 0.08)));

    for (let i = 0; i < count; i += 1) {
      const d = cursorDrops[(Math.random() * cursorDrops.length) | 0];
      if (!d) continue;
      if (d.resting) {
        wakeCursorDrop(d, direction * random(12, 40), random(10, 45));
        continue;
      }
      d.vx += direction * random(10, 46);
      d.vy -= random(4, 22);
      d.phaseSpeed += random(-0.12, 0.12);
    }
  }

  function disturbPileFromScroll(scrollDelta) {
    if (!scrollDelta) return;

    const magnitude = clamp(Math.abs(scrollDelta), 1, 140);
    const direction = Math.sign(scrollDelta) || 1;

    gustX += direction * magnitude * 0.85;
    gustY += Math.min(22, magnitude * 0.12);

    const resting = pieces.filter((p) => p.resting);
    const restingCursorDrops = cursorDrops.filter((d) => d.resting);

    const toWake = Math.min(
      resting.length,
      config.maxDisturbPerScroll,
      Math.max(4, Math.round(magnitude * 0.22))
    );

    for (let i = 0; i < toWake; i += 1) {
      const p = resting[(Math.random() * resting.length) | 0];
      if (!p || !p.resting) continue;
      wakePiece(p, direction * random(18, 85), random(25, 120));
    }

    const toWakeCursorDrops = Math.min(
      restingCursorDrops.length,
      Math.max(2, Math.round(magnitude * 0.1))
    );
    for (let i = 0; i < toWakeCursorDrops; i += 1) {
      const d = restingCursorDrops[(Math.random() * restingCursorDrops.length) | 0];
      if (!d || !d.resting) continue;
      wakeCursorDrop(d, direction * random(8, 42), random(16, 64));
    }

    disturbRibbonsFromScroll(scrollDelta);
  }

  function updatePiece(p, dt) {
    if (p.resting) {
      p.asleepFrames += 1;
      p.r += p.vr * dt;
      p.vr *= 0.97;
      return;
    }

    const drag = Math.pow(1 - config.airDrag, dt * 60);
    p.wobblePhase += p.wobble * dt;
    p.vx += gustX * 0.02 * dt;
    p.vy += config.gravity * dt;
    p.vx *= drag;
    p.vy *= drag;
    p.vr *= 0.998;

    p.x += p.vx * dt + Math.sin(p.wobblePhase) * 8 * dt;
    p.y += p.vy * dt;
    p.r += p.vr * dt;

    const radius = pieceRadius(p);
    if (p.x < radius) {
      p.x = radius;
      p.vx *= -0.35;
    } else if (p.x > width - radius) {
      p.x = width - radius;
      p.vx *= -0.35;
    }

    const groundY = terrainYAt(p.x) - radius;
    if (p.y >= groundY) {
      p.y = groundY;

      const impact = Math.abs(p.vy);
      if (impact > 160 && Math.random() < 0.55) {
        p.vy = -impact * config.bounce;
        p.vx *= 0.65;
        if (Math.abs(p.vy) < 45 && Math.abs(p.vx) < 18) {
          settlePiece(p);
        }
      } else if (Math.abs(p.vx) < 24 || impact < 120) {
        settlePiece(p);
      } else {
        p.vy = -impact * 0.08;
        p.vx *= 0.55;
      }
    }

    if (p.y > height + 240) {
      p.y = -40;
      p.x = random(0, width);
      p.vy = random(60, 140);
    }
  }

  function updateRibbon(r, dt) {
    if (r.resting) {
      r.asleepFrames += 1;
      r.hue = (r.hue + r.hueSpeed * dt * 0.7) % 360;
      r.r += r.vr * dt;
      r.vr *= 0.97;
      return;
    }

    const drag = Math.pow(1 - config.ribbonAirDrag, dt * 60);
    r.life += dt;
    r.phase += r.phaseSpeed * dt;
    r.hue = (r.hue + r.hueSpeed * dt) % 360;
    r.vx += gustX * 0.012 * dt;
    r.vy += (config.ribbonGravity + gustY * 5) * dt;
    r.vx *= drag;
    r.vy *= Math.pow(0.995, dt * 60);
    r.vr *= 0.998;

    r.x += r.vx * dt + Math.sin(r.phase * 1.2) * 10 * dt;
    r.y += r.vy * dt;
    r.r += r.vr * dt;

    r.trail.push({ x: r.x, y: r.y });
    if (r.trail.length > 10) r.trail.shift();

    const lateralPad = Math.max(8, Math.max(r.w, r.h) * 0.4);
    if (r.x < lateralPad) {
      r.x = lateralPad;
      r.vx = Math.abs(r.vx) * 0.72;
    } else if (r.x > width - lateralPad) {
      r.x = width - lateralPad;
      r.vx = -Math.abs(r.vx) * 0.72;
    }

    const radius = cursorDropRadius(r);
    const groundY = terrainYAt(r.x) - radius;
    if (r.y >= groundY) {
      r.y = groundY;
      const impact = Math.abs(r.vy);
      if (impact > 90 && Math.random() < 0.5) {
        r.vy = -impact * 0.18;
        r.vx *= 0.78;
        r.vr *= 0.9;
        if (Math.abs(r.vy) < 28 && Math.abs(r.vx) < 16) {
          settleCursorDrop(r);
        }
      } else {
        settleCursorDrop(r);
      }
    }
  }

  function drawPiece(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);

    const alpha = p.resting ? 0.95 : 0.88;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = "rgba(15,15,16,0.15)";
    ctx.lineWidth = 0.6;

    if (p.shape === "circle") {
      const radius = Math.max(2, p.h * 0.55);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.fill();
    }

    if (!p.resting) {
      ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  function drawRibbon(r) {
    ctx.save();
    ctx.globalAlpha = r.alpha;

    if (!r.resting && r.trail && r.trail.length > 1) {
      const stripeGap = 2.3;
      const baseWidth = 2.8;
      for (let c = 0; c < rainbowTrailColors.length; c += 1) {
        const offset = (c - (rainbowTrailColors.length - 1) / 2) * stripeGap;
        ctx.strokeStyle = rainbowTrailColors[c];
        ctx.lineWidth = baseWidth;
        ctx.lineCap = "round";
        ctx.globalAlpha = r.alpha * 0.22;
        ctx.beginPath();
        for (let i = 0; i < r.trail.length; i += 1) {
          const t = i / Math.max(1, r.trail.length - 1);
          const point = r.trail[i];
          const px = point.x + Math.sin(r.phase + t * 2.4) * Math.max(2, r.amp * 0.22);
          const py = point.y + offset;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = r.alpha;
    }

    if (cursorSprite.ready && cursorSprite.img) {
      ctx.translate(r.x, r.y);
      ctx.rotate(r.r);
      ctx.filter = "hue-rotate(" + r.hue.toFixed(1) + "deg) saturate(1.28)";
      ctx.drawImage(cursorSprite.img, -r.w / 2, -r.h / 2, r.w, r.h);
      ctx.filter = "none";
    } else {
      ctx.translate(r.x, r.y);
      ctx.rotate(r.r);
      ctx.fillStyle = "hsla(" + r.hue.toFixed(0) + " 85% 62% / " + r.alpha + ")";
      ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
    }

    ctx.restore();
  }

  function drawPileShadow() {
    // Soft base shadow for the accumulated pile.
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i < pileBins.length; i += 1) {
      const x = i * config.binSize;
      const y = height - config.floorPadding - pileBins[i];
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function maybeSpawn(now, dt) {
    if (now - startedAt > config.spawnDurationMs) return;
    const rate = config.spawnPerSecond * dt;
    const count = Math.floor(rate);
    const extra = Math.random() < rate - count ? 1 : 0;
    for (let i = 0; i < count + extra; i += 1) {
      spawnPiece();
    }
  }

  function maybeSpawnRibbons(now, dt) {
    const elapsed = now - startedAt;
    const ribbonStart = config.spawnDurationMs + config.ribbonStartDelayMs;
    const ribbonEnd = ribbonStart + config.ribbonDurationMs;
    if (elapsed < ribbonStart || elapsed > ribbonEnd) return;

    const rate = config.ribbonSpawnPerSecond * dt;
    const count = Math.floor(rate);
    const extra = Math.random() < rate - count ? 1 : 0;
    for (let i = 0; i < count + extra; i += 1) {
      spawnRibbon();
    }
  }

  function animate(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;

    maybeSpawn(now, dt);
    maybeSpawnRibbons(now, dt);

    gustX *= Math.pow(config.baseWindDecay, dt * 60);
    gustY *= Math.pow(0.9, dt * 60);

    for (const p of pieces) {
      updatePiece(p, dt);
    }
    for (let i = cursorDrops.length - 1; i >= 0; i -= 1) {
      const r = cursorDrops[i];
      updateRibbon(r, dt);
      if ((!r.resting && r.life > r.maxLife) || (!r.resting && r.y > height + Math.max(r.h, r.w) + 60)) {
        if (r.resting) clearCursorDeposit(r);
        cursorDrops.splice(i, 1);
      }
    }

    ctx.clearRect(0, 0, width, height);
    cursorDrops.sort((a, b) => {
      if (a.resting !== b.resting) return a.resting ? -1 : 1;
      return a.y - b.y || a.layer - b.layer;
    });
    for (const r of cursorDrops) {
      drawRibbon(r);
    }
    drawPileShadow();

    pieces.sort((a, b) => {
      if (a.resting !== b.resting) return a.resting ? -1 : 1;
      return a.y - b.y || a.layer - b.layer;
    });

    for (const p of pieces) {
      drawPiece(p);
    }

    requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (animationStarted) return;
    animationStarted = true;
    startedAt = performance.now();
    lastTime = 0;
    requestAnimationFrame(animate);
  }

  function onScroll() {
    syncCanvasToViewport();
    const next = window.scrollY;
    const delta = next - lastScrollY;
    lastScrollY = next;
    disturbPileFromScroll(delta);
  }

  resize();
  (function loadCursorSprite() {
    const img = new Image();
    img.decoding = "async";
    img.onload = function () {
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      const targetHeight = 44;
      const ratio = targetHeight / h;
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      if (w > 64) {
        const shrink = 64 / w;
        w = 64;
        h = Math.max(1, Math.round(h * shrink));
      }
      cursorSprite.img = img;
      cursorSprite.w = w;
      cursorSprite.h = h;
      for (const d of cursorDrops) {
        d.w = cursorSprite.w;
        d.h = cursorSprite.h;
      }
      cursorSprite.ready = true;
    };
    img.src = "cursor.png";
  })();
  window.addEventListener("resize", resize);
  window.addEventListener("scroll", onScroll, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resize);
    window.visualViewport.addEventListener("scroll", syncCanvasToViewport, { passive: true });
  }

  if (document.body && document.body.classList.contains("intro-active")) {
    window.addEventListener("birthdayIntroComplete", startAnimation, { once: true });
    // Fallback in case the intro script fails.
    window.setTimeout(startAnimation, 13000);
  } else {
    startAnimation();
  }
})();
