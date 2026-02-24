(function () {
  const canvas = document.getElementById("ascii-rain");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let dpr = 1;
  let width = 0;
  let height = 0;
  let fontSize = 16;
  let columns = 0;
  let drops = [];
  let lastTs = 0;

  const chars =
    "01<>[]{}()/\\\\|=+-_*#@&%$;:.,~^`VIM:q!ZZ:wqa!printf echo cd ls grep sed awk cat nano rust go js html css";

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(window.innerWidth));
    height = Math.max(1, Math.floor(window.innerHeight));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fontSize = width < 520 ? 12 : width < 900 ? 14 : 16;
    columns = Math.max(12, Math.floor(width / fontSize));
    drops = new Array(columns).fill(0).map(function (_, i) {
      return {
        y: Math.random() * -height,
        speed: (prefersReducedMotion ? 18 : 34) + Math.random() * (prefersReducedMotion ? 18 : 54),
        hue: Math.random() < 0.2 ? 355 : 125,
        drift: (Math.random() - 0.5) * 0.25,
        xOffset: (Math.random() - 0.5) * (fontSize * 0.3),
        phase: Math.random() * Math.PI * 2 + i * 0.13,
      };
    });
  }

  function randomChar() {
    return chars[(Math.random() * chars.length) | 0];
  }

  function draw(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    ctx.fillStyle = "rgba(3, 4, 4, 0.12)";
    ctx.fillRect(0, 0, width, height);

    ctx.font = "700 " + fontSize + "px 'Courier New', monospace";
    ctx.textBaseline = "top";

    for (let i = 0; i < drops.length; i += 1) {
      const drop = drops[i];
      drop.y += drop.speed * dt;
      drop.phase += dt * 2.2;

      const x = i * fontSize + drop.xOffset + Math.sin(drop.phase) * (fontSize * 0.22);
      const y = drop.y;

      const trail = prefersReducedMotion ? 7 : 14;
      for (let t = 0; t < trail; t += 1) {
        const charY = y - t * fontSize;
        if (charY < -fontSize || charY > height + fontSize) continue;

        const intensity = 1 - t / trail;
        const head = t === 0;
        const hue = drop.hue + (head ? 0 : Math.sin(drop.phase + t) * 7);
        const sat = drop.hue > 300 ? 92 : 88;
        const light = head ? 72 : 56 - t * 1.3;
        const alpha = head ? 0.95 : 0.12 + intensity * 0.38;

        ctx.fillStyle = "hsla(" + hue.toFixed(0) + " " + sat + "% " + light + "% / " + alpha + ")";
        ctx.fillText(randomChar(), x, charY);
      }

      if (drop.y - trail * fontSize > height + Math.random() * 140) {
        drop.y = -Math.random() * (height * 0.5 + 100);
        drop.speed = (prefersReducedMotion ? 18 : 34) + Math.random() * (prefersReducedMotion ? 18 : 54);
        drop.hue = Math.random() < 0.22 ? 355 : 126;
        drop.xOffset = (Math.random() - 0.5) * (fontSize * 0.3);
      }
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);

  // Clear once to start from a dark frame.
  ctx.fillStyle = "#030404";
  ctx.fillRect(0, 0, width, height);
  requestAnimationFrame(draw);
})();

(function () {
  const canvas = document.getElementById("balloon-layer");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const balloons = [];
  const colors = [
    { fill: "rgba(255, 75, 87, 0.82)", stroke: "rgba(255, 75, 87, 0.95)" },
    { fill: "rgba(99, 255, 123, 0.78)", stroke: "rgba(99, 255, 123, 0.96)" },
    { fill: "rgba(255, 222, 89, 0.78)", stroke: "rgba(255, 222, 89, 0.95)" },
    { fill: "rgba(112, 206, 255, 0.78)", stroke: "rgba(112, 206, 255, 0.95)" },
    { fill: "rgba(255, 153, 223, 0.8)", stroke: "rgba(255, 153, 223, 0.95)" },
  ];

  let dpr = 1;
  let width = 0;
  let height = 0;
  let lastTs = 0;
  let gustX = 0;
  let touchY = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function balloonCount() {
    if (prefersReducedMotion) return 6;
    if (width < 520) return 8;
    if (width < 900) return 11;
    return 14;
  }

  function makeBalloon(fromBottom) {
    const radius = width < 520 ? random(16, 26) : random(18, 34);
    const palette = colors[(Math.random() * colors.length) | 0];
    const startY = fromBottom
      ? height + random(radius * 1.5, height * 0.55 + radius * 5)
      : random(radius + 12, height - radius - 12);

    return {
      x: random(radius + 8, Math.max(radius + 9, width - radius - 8)),
      y: startY,
      r: radius,
      vx: random(-20, 20),
      vy: -random(25, 90),
      drift: random(-18, 18),
      phase: random(0, Math.PI * 2),
      phaseSpeed: random(0.5, 1.4),
      buoyancy: prefersReducedMotion ? random(20, 38) : random(32, 58),
      damping: prefersReducedMotion ? 0.988 : 0.992,
      bounce: random(0.55, 0.74),
      stringLen: radius * random(1.4, 2.1),
      fill: palette.fill,
      stroke: palette.stroke,
      shineShift: random(-0.2, 0.2),
    };
  }

  function seedBalloons() {
    balloons.length = 0;
    const count = balloonCount();
    for (let i = 0; i < count; i += 1) {
      balloons.push(makeBalloon(false));
      balloons[i].y = height + random(10, height * 0.6);
      balloons[i].x = clamp((width / count) * (i + 0.5) + random(-28, 28), balloons[i].r + 6, width - balloons[i].r - 6);
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(window.innerWidth));
    height = Math.max(1, Math.floor(window.innerHeight));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!balloons.length) {
      seedBalloons();
      return;
    }

    const target = balloonCount();
    while (balloons.length < target) balloons.push(makeBalloon(true));
    while (balloons.length > target) balloons.pop();

    for (const b of balloons) {
      b.x = clamp(b.x, b.r + 6, width - b.r - 6);
      b.y = clamp(b.y, -b.r * 2, height + b.r * 3);
    }
  }

  function disturbFromScroll(delta) {
    if (!delta) return;
    const mag = clamp(Math.abs(delta), 1, 160);
    const dir = Math.sign(delta) || 1;
    gustX += dir * mag * 0.45;

    for (let i = 0; i < balloons.length; i += 1) {
      const b = balloons[i];
      // Nudge balloons upward so they tap the top boundary and visibly bounce.
      b.vy -= mag * random(0.12, 0.24);
      b.vx += dir * random(-12, 12);
      if (b.y - b.r < 24) {
        b.vy = Math.abs(b.vy) * 0.7 + random(10, 24);
      }
    }
  }

  function onWheel(event) {
    disturbFromScroll(event.deltaY || 0);
  }

  let lastScrollY = window.scrollY;
  function onScroll() {
    const next = window.scrollY;
    const delta = next - lastScrollY;
    lastScrollY = next;
    disturbFromScroll(delta);
  }

  function onTouchStart(event) {
    touchY = event.touches && event.touches[0] ? event.touches[0].clientY : null;
  }

  function onTouchMove(event) {
    if (!event.touches || !event.touches[0]) return;
    const y = event.touches[0].clientY;
    if (touchY == null) {
      touchY = y;
      return;
    }
    disturbFromScroll(touchY - y);
    touchY = y;
  }

  function drawBalloon(b) {
    const topPad = 8;
    const anchorY = Math.min(height - 6, b.y + b.stringLen);
    const sway = Math.sin(b.phase) * Math.max(2, b.r * 0.18);

    ctx.save();

    // String
    ctx.strokeStyle = "rgba(210, 255, 220, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + b.r * 0.6);
    ctx.quadraticCurveTo(
      b.x + sway * 1.4,
      b.y + b.stringLen * 0.55,
      b.x + sway,
      anchorY
    );
    ctx.stroke();

    // Balloon body
    ctx.fillStyle = b.fill;
    ctx.strokeStyle = b.stroke;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, b.r * 0.92, b.r * 1.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Knot
    ctx.beginPath();
    ctx.moveTo(b.x - 3, b.y + b.r * 0.98);
    ctx.lineTo(b.x + 3, b.y + b.r * 0.98);
    ctx.lineTo(b.x, b.y + b.r * 1.18);
    ctx.closePath();
    ctx.fillStyle = b.stroke;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.ellipse(
      b.x - b.r * (0.28 + b.shineShift),
      Math.max(topPad + 4, b.y - b.r * 0.3),
      b.r * 0.18,
      b.r * 0.28,
      -0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  function updateBalloon(b, dt) {
    b.phase += b.phaseSpeed * dt;

    const swayAccel = Math.sin(b.phase * 1.1) * 10 + b.drift + gustX * 0.06;
    b.vx += swayAccel * dt;
    b.vx *= Math.pow(0.985, dt * 60);

    // Buoyant upward acceleration (negative y).
    b.vy -= b.buoyancy * dt;
    b.vy *= Math.pow(b.damping, dt * 60);

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    const topBound = b.r + 10;
    const leftBound = b.r + 6;
    const rightBound = width - b.r - 6;
    const bottomBound = height - b.r - 8;

    if (b.x < leftBound) {
      b.x = leftBound;
      b.vx = Math.abs(b.vx) * 0.72;
    } else if (b.x > rightBound) {
      b.x = rightBound;
      b.vx = -Math.abs(b.vx) * 0.72;
    }

    // Ceiling collision: balloons bounce off the visible top instead of leaving screen.
    if (b.y < topBound) {
      b.y = topBound;
      b.vy = Math.abs(b.vy) * b.bounce + random(6, 16);
      b.vx += random(-10, 10);
    } else if (b.y > bottomBound) {
      b.y = bottomBound;
      b.vy = -Math.abs(b.vy) * 0.55;
      b.vx += random(-8, 8);
    }
  }

  function draw(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.04, (ts - lastTs) / 1000);
    lastTs = ts;

    gustX *= Math.pow(0.92, dt * 60);

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < balloons.length; i += 1) {
      updateBalloon(balloons[i], dt);
    }

    // Back-to-front draw for a little depth.
    balloons.sort(function (a, b) {
      return a.r - b.r || a.y - b.y;
    });

    for (let i = 0; i < balloons.length; i += 1) {
      drawBalloon(balloons[i]);
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  requestAnimationFrame(draw);
})();
