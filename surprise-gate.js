(function () {
  const form = document.getElementById("gate-form");
  const input = document.getElementById("gate-password");
  const message = document.getElementById("gate-message");
  const fireCanvas = document.getElementById("gate-fire-transition");

  if (!form || !input || !message) return;

  const PASSWORD = "ipromiseiamelli";
  const AUTH_KEY = "elli_surprise_auth";
  const AUTH_VALUE = "ok";

  try {
    if (window.sessionStorage.getItem(AUTH_KEY) === AUTH_VALUE) {
      window.location.replace("surprise.html");
      return;
    }
  } catch (e) {
    // Ignore storage failures and continue with normal gate flow.
  }

  function setMessage(text, type) {
    message.textContent = text;
    message.classList.remove("error", "success");
    if (type) message.classList.add(type);
  }

  let transitionRunning = false;

  function runFireTransitionAndRedirect() {
    if (transitionRunning) return;
    transitionRunning = true;

    if (!fireCanvas) {
      window.location.href = "surprise.html";
      return;
    }

    const ctx = fireCanvas.getContext("2d");
    if (!ctx) {
      window.location.href = "surprise.html";
      return;
    }

    document.body.classList.add("fire-transitioning");

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;

    let dpr = 1;
    let width = 0;
    let height = 0;
    let start = 0;
    let last = 0;
    let rafId = 0;
    let disposed = false;
    let frameSkip = 0;
    const flames = [];
    const embers = [];
    const smokePuffs = [];
    const turbulenceSeeds = Array.from({ length: 7 }, () => ({
      amp: 18 + Math.random() * 34,
      freq: 0.45 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.35 + Math.random() * 0.9,
    }));
    const duration = 5000;
    const maxFlames = coarsePointer ? 54 : 96;
    const maxEmbers = coarsePointer ? 48 : 96;
    const maxSmoke = coarsePointer ? 28 : 46;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.1 : 1.45);
      width = Math.max(1, Math.floor(window.innerWidth));
      height = Math.max(1, Math.floor(window.innerHeight));
      fireCanvas.width = Math.floor(width * dpr);
      fireCanvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function spawnFlame(levelY) {
      if (flames.length >= maxFlames) return;
      flames.push({
        x: rand(-40, width + 40),
        y: levelY + rand(-14, 22),
        vx: rand(-10, 10),
        vy: -rand(16, 70),
        r: rand(16, 32),
        life: 0,
        maxLife: rand(0.65, 1.55),
        hue: rand(12, 30),
        alpha: rand(0.12, 0.28),
        flicker: rand(0, Math.PI * 2),
      });
    }

    function spawnEmber(levelY) {
      if (embers.length >= maxEmbers) return;
      embers.push({
        x: rand(0, width),
        y: levelY + rand(-10, 10),
        vx: rand(-18, 18),
        vy: -rand(35, 110),
        r: rand(1.1, 3.2),
        life: 0,
        maxLife: rand(0.45, 1.2),
        alpha: rand(0.28, 0.72),
      });
    }

    function spawnSmoke(levelY) {
      if (smokePuffs.length >= maxSmoke) return;
      smokePuffs.push({
        x: rand(-60, width + 60),
        y: levelY + rand(-30, 20),
        vx: rand(-8, 8),
        vy: -rand(5, 19),
        r: rand(24, 72),
        life: 0,
        maxLife: rand(1.7, 3.8),
        alpha: rand(0.05, 0.16),
        drift: rand(0, Math.PI * 2),
      });
    }

    function flameSurfaceY(x, baseY, progress, seconds) {
      let offset = 0;
      for (let i = 0; i < turbulenceSeeds.length; i += 1) {
        const s = turbulenceSeeds[i];
        offset +=
          Math.sin(seconds * s.speed + x * (0.0025 + s.freq * 0.0019) + s.phase) *
          s.amp *
          (0.25 + progress * 0.75);
      }
      const edgeNoise = Math.sin(x * 0.019 + seconds * 2.1) * 9 + Math.sin(x * 0.041 - seconds * 1.4) * 6;
      return baseY - offset - edgeNoise;
    }

    function cleanup() {
      if (disposed) return;
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", resize);
      }
    }

    function draw(now) {
      if (disposed) return;
      if (!start) start = now;
      if (!last) last = now;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;

      if (coarsePointer && !prefersReducedMotion) {
        frameSkip = (frameSkip + 1) % 2;
        if (frameSkip === 1) {
          rafId = requestAnimationFrame(draw);
          return;
        }
      }

      const elapsed = now - start;
      const t = clamp(elapsed / duration, 0, 1);
      const riseT = clamp((elapsed - duration * 0.08) / (duration * 0.9), 0, 1);
      const eased = clamp(Math.pow(riseT, 1.35) * (2.15 - riseT), 0, 1);
      const levelY = height - eased * (height + 110);
      const seconds = elapsed / 1000;

      ctx.clearRect(0, 0, width, height);

      const spawnCount = coarsePointer ? Math.floor(2 + eased * 5) : Math.floor(3 + eased * 7);
      for (let i = 0; i < spawnCount; i += 1) {
        if (Math.random() < 0.72) spawnFlame(levelY);
      }
      for (let i = 0; i < (coarsePointer ? 4 : 6); i += 1) {
        if (Math.random() < 0.12 + eased * 0.18) spawnEmber(levelY + 10);
      }
      for (let i = 0; i < (coarsePointer ? 2 : 3); i += 1) {
        if (Math.random() < 0.18 + eased * 0.18) spawnSmoke(levelY + 26);
      }

      // Smoke/soot veil that intensifies as the fire rises.
      const smokeTop = Math.max(0, levelY - 180);
      const smokeGrad = ctx.createLinearGradient(0, smokeTop, 0, height);
      smokeGrad.addColorStop(0, "rgba(0,0,0,0)");
      smokeGrad.addColorStop(0.22, "rgba(8,8,8,0.12)");
      smokeGrad.addColorStop(0.55, "rgba(18,14,12,0.28)");
      smokeGrad.addColorStop(1, "rgba(0,0,0,0.84)");
      ctx.fillStyle = smokeGrad;
      ctx.fillRect(0, smokeTop, width, height - smokeTop);

      // Continuous flame front (less game-y than particle-only fire).
      const pathTop = Math.max(0, levelY - 90);
      const baseGlow = ctx.createLinearGradient(0, pathTop, 0, height);
      baseGlow.addColorStop(0, "rgba(255,240,190,0)");
      baseGlow.addColorStop(0.18, "rgba(255,202,98,0.16)");
      baseGlow.addColorStop(0.45, "rgba(255,130,40,0.34)");
      baseGlow.addColorStop(0.78, "rgba(185,44,10,0.55)");
      baseGlow.addColorStop(1, "rgba(25,4,2,0.95)");
      ctx.fillStyle = baseGlow;
      ctx.fillRect(0, pathTop, width, height - pathTop);

      const step = coarsePointer ? 28 : 20;
      ctx.beginPath();
      ctx.moveTo(0, height + 10);
      ctx.lineTo(0, flameSurfaceY(0, levelY, eased, seconds));
      for (let x = step; x <= width + step; x += step) {
        ctx.lineTo(x, flameSurfaceY(x, levelY, eased, seconds));
      }
      ctx.lineTo(width, height + 10);
      ctx.closePath();

      const flameFill = ctx.createLinearGradient(0, Math.max(0, levelY - 100), 0, height);
      flameFill.addColorStop(0, "rgba(255,200,92,0.24)");
      flameFill.addColorStop(0.2, "rgba(255,145,54,0.3)");
      flameFill.addColorStop(0.55, "rgba(236,83,24,0.42)");
      flameFill.addColorStop(1, "rgba(72,10,2,0.88)");
      ctx.fillStyle = flameFill;
      ctx.fill();

      // Core white-hot glow close to the front edge.
      const edgeY = Math.max(0, levelY - 42);
      const coreGrad = ctx.createLinearGradient(0, edgeY - 20, 0, edgeY + 70);
      coreGrad.addColorStop(0, "rgba(255,255,255,0)");
      coreGrad.addColorStop(0.24, "rgba(255,235,170,0.13)");
      coreGrad.addColorStop(0.55, "rgba(255,176,82,0.17)");
      coreGrad.addColorStop(1, "rgba(255,95,32,0)");
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, edgeY - 20, width, 100);

      // Smoke puffs
      for (let i = smokePuffs.length - 1; i >= 0; i -= 1) {
        const s = smokePuffs[i];
        s.life += dt;
        s.drift += dt * 1.4;
        s.x += s.vx * dt + Math.sin(s.drift) * 2.8 * dt;
        s.y += s.vy * dt;
        const st = s.life / s.maxLife;
        if (st >= 1) {
          smokePuffs.splice(i, 1);
          continue;
        }
        const alpha = s.alpha * (1 - st);
        const radius = s.r * (0.8 + st * 0.9);
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, radius);
        g.addColorStop(0, "rgba(42,42,42," + (alpha * 0.48).toFixed(3) + ")");
        g.addColorStop(0.55, "rgba(18,18,18," + (alpha * 0.34).toFixed(3) + ")");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flame tongues / licks
      for (let i = flames.length - 1; i >= 0; i -= 1) {
        const f = flames[i];
        f.life += dt;
        f.flicker += dt * (4.8 + (i % 5));
        f.x += f.vx * dt + Math.sin(f.flicker) * 6 * dt;
        f.y += f.vy * dt;
        f.vy -= 7 * dt;

        const lifeT = f.life / f.maxLife;
        if (lifeT >= 1) {
          flames.splice(i, 1);
          continue;
        }

        const alpha = f.alpha * (1 - lifeT);
        const radius = f.r * (1 - lifeT * 0.45);
        const gx = f.x;
        const gy = f.y;
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
        grad.addColorStop(0, "rgba(255,244,212," + (alpha * 0.42).toFixed(3) + ")");
        grad.addColorStop(0.22, "hsla(" + f.hue.toFixed(0) + " 94% 56% / " + (alpha * 0.38).toFixed(3) + ")");
        grad.addColorStop(0.62, "hsla(" + (f.hue + 8).toFixed(0) + " 88% 40% / " + (alpha * 0.22).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(gx, gy, radius * 0.58, radius * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Embers
      for (let i = embers.length - 1; i >= 0; i -= 1) {
        const e = embers[i];
        e.life += dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.vx *= Math.pow(0.995, dt * 60);
        e.vy *= Math.pow(0.99, dt * 60);
        const lifeT = e.life / e.maxLife;
        if (lifeT >= 1) {
          embers.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = e.alpha * (1 - lifeT);
        ctx.fillStyle = lifeT < 0.35 ? "#ffe3a0" : lifeT < 0.7 ? "#ff9b36" : "#ff5f24";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * (1 - lifeT * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Dark top-down smoke curtain to help the screen feel consumed.
      const curtainY = Math.max(0, levelY - 120);
      const curtain = ctx.createLinearGradient(0, 0, 0, height);
      curtain.addColorStop(0, "rgba(0,0,0," + (0.06 + eased * 0.18).toFixed(3) + ")");
      curtain.addColorStop(Math.min(0.8, (curtainY + 50) / Math.max(1, height)), "rgba(0,0,0," + (0.12 + eased * 0.22).toFixed(3) + ")");
      curtain.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = curtain;
      ctx.fillRect(0, 0, width, height);

      // Final blackout to make sure the page is fully consumed before redirect.
      if (t > 0.82) {
        const fade = Math.pow((t - 0.82) / 0.18, 1.2);
        ctx.fillStyle = "rgba(0,0,0," + fade.toFixed(3) + ")";
        ctx.fillRect(0, 0, width, height);
      }

      if (elapsed >= duration) {
        cleanup();
        window.location.href = "surprise.html";
        return;
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", resize, { passive: true });
    }
    window.addEventListener("pagehide", cleanup, { once: true });
    rafId = requestAnimationFrame(draw);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = input.value.trim();

    if (value === PASSWORD) {
      try {
        window.sessionStorage.setItem(AUTH_KEY, AUTH_VALUE);
      } catch (e) {
        // Continue even if storage fails; direct redirect still works for this navigation.
      }
      setMessage("Access granted. Opening surprise...", "success");
      input.disabled = true;
      runFireTransitionAndRedirect();
      return;
    }

    setMessage("Incorrect password.", "error");
    input.select();
  });

  window.addEventListener("pageshow", function () {
    input.focus();
  });
})();
