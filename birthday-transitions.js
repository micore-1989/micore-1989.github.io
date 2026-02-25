(function () {
  var trigger = document.querySelector(".footer-surprise-btn[href='surprise-gate.html']");
  if (!trigger) return;

  var running = false;

  trigger.addEventListener("click", function (event) {
    if (running) {
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    running = true;
    playAsciiGateTransition("surprise-gate.html");
  });

  function playAsciiGateTransition(targetHref) {
    var overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;background:#000;pointer-events:none;overflow:hidden;";

    var canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);

    var ctx = canvas.getContext("2d");
    if (!ctx) {
      window.location.href = targetHref;
      return;
    }

    var dpr = 1;
    var width = 0;
    var height = 0;
    var fontSize = 14;
    var cols = 0;
    var drops = [];
    var chars = "01<>[]{}#@%$&;:+=-*\\/|~^abcdefghijklmnopqrstuvwxyzzshsudochmodprintfcatgrep";
    var started = performance.now();
    var last = 0;
    var duration = 1150;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(window.innerWidth));
      height = Math.max(1, Math.floor(window.innerHeight));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      fontSize = width < 700 ? 12 : 14;
      cols = Math.max(10, Math.floor(width / fontSize));
      drops = new Array(cols).fill(0).map(function (_, i) {
        return {
          y: Math.random() * -height,
          speed: 220 + Math.random() * 320,
          phase: Math.random() * Math.PI * 2 + i * 0.2,
          hue: Math.random() < 0.7 ? 122 : 0,
          xJitter: (Math.random() - 0.5) * fontSize * 0.3,
        };
      });
    }

    function randomChar() {
      return chars[(Math.random() * chars.length) | 0];
    }

    function draw(now) {
      if (!last) last = now;
      var dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      var elapsed = now - started;
      var t = Math.min(1, elapsed / duration);

      // Darken to full black while the ASCII rain intensifies.
      ctx.fillStyle = "rgba(0,0,0," + (0.16 + t * 0.26).toFixed(3) + ")";
      ctx.fillRect(0, 0, width, height);

      ctx.font = "700 " + fontSize + "px 'Courier New', monospace";
      ctx.textBaseline = "top";

      for (var i = 0; i < drops.length; i += 1) {
        var d = drops[i];
        d.y += d.speed * dt;
        d.phase += dt * 3.6;
        var x = i * fontSize + d.xJitter + Math.sin(d.phase) * fontSize * 0.18;
        var trailLen = 10 + ((i + (elapsed / 30) | 0) % 7);

        for (var k = 0; k < trailLen; k += 1) {
          var y = d.y - k * fontSize;
          if (y < -fontSize || y > height + fontSize) continue;
          var head = k === 0;
          var alpha = head ? (0.8 + t * 0.18) : (0.05 + (1 - k / trailLen) * (0.22 + t * 0.25));
          var hue = d.hue === 0 ? (Math.sin(d.phase + k) > 0 ? 0 : 8) : (115 + Math.sin(d.phase + k) * 14);
          var sat = d.hue === 0 ? 92 : 90;
          var light = head ? 70 : 46 + (trailLen - k) * 0.7;
          ctx.fillStyle =
            "hsla(" + hue.toFixed(0) + " " + sat + "% " + light.toFixed(0) + "% / " + alpha.toFixed(3) + ")";
          ctx.fillText(randomChar(), x, y);
        }

        if (d.y - trailLen * fontSize > height + 30) {
          d.y = -Math.random() * (height * 0.5 + 120);
          d.speed = 240 + Math.random() * 360;
          d.hue = Math.random() < 0.68 ? 122 : 0;
        }
      }

      // "Consume" effect from top-to-bottom with dense blackout.
      var consumeY = Math.floor(height * t);
      if (consumeY > 0) {
        var grad = ctx.createLinearGradient(0, 0, 0, consumeY + 24);
        grad.addColorStop(0, "rgba(0,0,0,0.92)");
        grad.addColorStop(0.7, "rgba(0,0,0,0.76)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, consumeY + 28);
      }

      if (elapsed >= duration) {
        window.location.href = targetHref;
        return;
      }

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    requestAnimationFrame(draw);
  }
})();
