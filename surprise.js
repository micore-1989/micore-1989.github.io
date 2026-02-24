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
