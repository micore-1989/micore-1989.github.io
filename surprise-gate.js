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

    let dpr = 1;
    let width = 0;
    let height = 0;
    let start = 0;
    let last = 0;
    const flames = [];
    const embers = [];
    const duration = 1550;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      flames.push({
        x: rand(-40, width + 40),
        y: levelY + rand(-14, 22),
        vx: rand(-12, 12),
        vy: -rand(40, 130),
        r: rand(18, 46),
        life: 0,
        maxLife: rand(0.35, 0.95),
        hue: rand(10, 42),
        alpha: rand(0.45, 0.9),
        flicker: rand(0, Math.PI * 2),
      });
    }

    function spawnEmber(levelY) {
      embers.push({
        x: rand(0, width),
        y: levelY + rand(-10, 10),
        vx: rand(-18, 18),
        vy: -rand(45, 140),
        r: rand(1.3, 3.8),
        life: 0,
        maxLife: rand(0.35, 0.85),
        alpha: rand(0.4, 0.9),
      });
    }

    function draw(now) {
      if (!start) start = now;
      if (!last) last = now;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;

      const elapsed = now - start;
      const t = clamp(elapsed / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 2.2);
      const levelY = height - eased * (height + 80);

      ctx.clearRect(0, 0, width, height);

      const spawnCount = Math.floor(10 + eased * 20);
      for (let i = 0; i < spawnCount; i += 1) {
        if (Math.random() < 0.7) spawnFlame(levelY);
      }
      for (let i = 0; i < 14; i += 1) {
        if (Math.random() < 0.4 + eased * 0.45) spawnEmber(levelY + 10);
      }

      // Dark smoke/heat layer behind flames
      const smokeTop = Math.max(0, levelY - 120);
      const smokeGrad = ctx.createLinearGradient(0, smokeTop, 0, height);
      smokeGrad.addColorStop(0, "rgba(0,0,0,0)");
      smokeGrad.addColorStop(0.35, "rgba(20,8,4,0.25)");
      smokeGrad.addColorStop(1, "rgba(0,0,0,0.92)");
      ctx.fillStyle = smokeGrad;
      ctx.fillRect(0, smokeTop, width, height - smokeTop);

      // Core fire body rising from bottom.
      const fireGrad = ctx.createLinearGradient(0, Math.max(0, levelY - 20), 0, height);
      fireGrad.addColorStop(0, "rgba(255,255,255,0.0)");
      fireGrad.addColorStop(0.18, "rgba(255,225,130,0.45)");
      fireGrad.addColorStop(0.42, "rgba(255,155,40,0.7)");
      fireGrad.addColorStop(0.75, "rgba(255,68,18,0.88)");
      fireGrad.addColorStop(1, "rgba(80,8,0,1)");
      ctx.fillStyle = fireGrad;
      ctx.fillRect(0, Math.max(0, levelY - 8), width, height - Math.max(0, levelY - 8));

      // Flame tongues
      for (let i = flames.length - 1; i >= 0; i -= 1) {
        const f = flames[i];
        f.life += dt;
        f.flicker += dt * rand(4, 8);
        f.x += f.vx * dt + Math.sin(f.flicker) * 8 * dt;
        f.y += f.vy * dt;
        f.vy -= 18 * dt;

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
        grad.addColorStop(0, "rgba(255,255,220," + (alpha * 0.9).toFixed(3) + ")");
        grad.addColorStop(0.28, "hsla(" + f.hue.toFixed(0) + " 98% 62% / " + (alpha * 0.95).toFixed(3) + ")");
        grad.addColorStop(0.7, "hsla(" + (f.hue + 10).toFixed(0) + " 95% 44% / " + (alpha * 0.58).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(gx, gy, radius * 0.72, radius * 1.18, 0, 0, Math.PI * 2);
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
        ctx.fillStyle = lifeT < 0.35 ? "#fff3b0" : lifeT < 0.7 ? "#ff9d2a" : "#ff4a1a";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * (1 - lifeT * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Bright flame edge band near current top of fire.
      const edgeY = Math.max(0, levelY - 26);
      const edgeGrad = ctx.createLinearGradient(0, edgeY, 0, edgeY + 58);
      edgeGrad.addColorStop(0, "rgba(255,255,255,0)");
      edgeGrad.addColorStop(0.25, "rgba(255,222,120,0.35)");
      edgeGrad.addColorStop(1, "rgba(255,80,18,0)");
      ctx.fillStyle = edgeGrad;
      ctx.fillRect(0, edgeY, width, 58);

      // Final blackout to make sure the page is fully consumed before redirect.
      if (t > 0.82) {
        ctx.fillStyle = "rgba(0,0,0," + ((t - 0.82) / 0.18).toFixed(3) + ")";
        ctx.fillRect(0, 0, width, height);
      }

      if (elapsed >= duration) {
        window.location.href = "surprise.html";
        return;
      }

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    requestAnimationFrame(draw);
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
