(function () {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const colors = ["#c9a44a", "#ead7a1", "#ffffff", "#f6d36b", "#d8b458"];
  const pieces = [];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let lastTime = 0;
  let startedAt = performance.now();
  let lastScrollY = window.scrollY;
  let gustX = 0;
  let gustY = 0;

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

  function pieceRadius(p) {
    return Math.max(3, Math.max(p.w, p.h) * 0.5);
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

  function disturbPileFromScroll(scrollDelta) {
    if (!scrollDelta) return;

    const magnitude = clamp(Math.abs(scrollDelta), 1, 140);
    const direction = Math.sign(scrollDelta) || 1;

    gustX += direction * magnitude * 0.85;
    gustY += Math.min(22, magnitude * 0.12);

    const resting = pieces.filter((p) => p.resting);
    if (!resting.length) return;

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

  function animate(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;

    maybeSpawn(now, dt);

    gustX *= Math.pow(config.baseWindDecay, dt * 60);
    gustY *= Math.pow(0.9, dt * 60);

    for (const p of pieces) {
      updatePiece(p, dt);
    }

    ctx.clearRect(0, 0, width, height);
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

  function onScroll() {
    syncCanvasToViewport();
    const next = window.scrollY;
    const delta = next - lastScrollY;
    lastScrollY = next;
    disturbPileFromScroll(delta);
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("scroll", onScroll, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resize);
    window.visualViewport.addEventListener("scroll", syncCanvasToViewport, { passive: true });
  }
  requestAnimationFrame(animate);
})();
