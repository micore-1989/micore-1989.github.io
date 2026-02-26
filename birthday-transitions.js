(function () {
  var surpriseTrigger = document.querySelector(".footer-surprise-btn[href='surprise-gate.html']");
  if (!surpriseTrigger) return;

  var running = false;

  bindTransition(surpriseTrigger, function () {
    playAsciiGateTransition("surprise-gate.html");
  });

  function bindTransition(trigger, runner) {
    if (!trigger) return;
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
      runner(event, trigger);
    });
  }

  function playAsciiGateTransition(targetHref) {
    var prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var coarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;

    var overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;background:transparent;pointer-events:none;overflow:hidden;";

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
    var duration = 5000;
    var rafId = 0;
    var removed = false;
    var redirecting = false;
    var frameGate = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.25 : 1.75);
      width = Math.max(1, Math.floor(window.innerWidth));
      height = Math.max(1, Math.floor(window.innerHeight));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      fontSize = width < 520 ? 11 : width < 900 ? 12 : 14;
      var colDivisor = coarsePointer ? 1.25 : 1;
      cols = Math.max(10, Math.floor(width / (fontSize * colDivisor)));
      drops = new Array(cols).fill(0).map(function (_, i) {
        return {
          y: Math.random() * -height,
          speed: (coarsePointer ? 120 : 150) + Math.random() * (coarsePointer ? 150 : 220),
          phase: Math.random() * Math.PI * 2 + i * 0.2,
          hue: Math.random() < 0.5 ? 122 : 0,
          xJitter: (Math.random() - 0.5) * fontSize * 0.3,
        };
      });
    }

    function randomChar() {
      return chars[(Math.random() * chars.length) | 0];
    }

    function draw(now) {
      if (removed) return;
      if (!last) last = now;
      var dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      var elapsed = now - started;
      var t = Math.min(1, elapsed / duration);
      var consumeT = Math.min(1, Math.max(0, (elapsed - duration * 0.05) / (duration * 0.95)));

      // Frame throttling on mobile/coarse pointers to reduce heat and lag.
      if (coarsePointer) {
        frameGate = (frameGate + 1) % 2;
        if (frameGate === 1) {
          rafId = requestAnimationFrame(draw);
          return;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Subtle dark veil so the current page remains visible until consumed.
      ctx.fillStyle = "rgba(0,0,0," + (0.03 + t * 0.06).toFixed(3) + ")";
      ctx.fillRect(0, 0, width, height);

      ctx.font = "700 " + fontSize + "px 'Courier New', monospace";
      ctx.textBaseline = "top";

      for (var i = 0; i < drops.length; i += 1) {
        var d = drops[i];
        d.y += d.speed * dt;
        d.phase += dt * 3.6;
        var x = i * fontSize + d.xJitter + Math.sin(d.phase) * fontSize * 0.18;
        var trailLen = coarsePointer ? 8 + ((i + ((elapsed / 50) | 0)) % 4) : 10 + (((i + (elapsed / 30)) | 0) % 7);

        for (var k = 0; k < trailLen; k += 1) {
          var y = d.y - k * fontSize;
          if (y < -fontSize || y > height + fontSize) continue;
          var head = k === 0;
          var alpha = head ? (0.62 + t * 0.16) : (0.04 + (1 - k / trailLen) * (0.16 + t * 0.18));
          var hue = d.hue === 0 ? (Math.sin(d.phase + k) > 0 ? 0 : 8) : (115 + Math.sin(d.phase + k) * 14);
          var sat = d.hue === 0 ? 92 : 90;
          var light = head ? 68 : 42 + (trailLen - k) * 0.8;
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

      // "Consume" effect from top-to-bottom with a soft black gradient edge.
      var consumeY = Math.floor(height * consumeT);
      if (consumeY > 0) {
        ctx.fillStyle = "rgba(0,0,0," + (0.55 + consumeT * 0.4).toFixed(3) + ")";
        ctx.fillRect(0, 0, width, Math.max(0, consumeY - 42));

        var grad = ctx.createLinearGradient(0, Math.max(0, consumeY - 56), 0, consumeY + 36);
        grad.addColorStop(0, "rgba(0,0,0,0.96)");
        grad.addColorStop(0.35, "rgba(0,0,0,0.78)");
        grad.addColorStop(0.75, "rgba(0,0,0,0.28)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, Math.max(0, consumeY - 56), width, 92);
      }

      // Redraw a brighter neon layer on top of the consume veil so the "hacker" rain
      // remains visible while the black gradient is taking over the page.
      for (var j = 0; j < drops.length; j += (coarsePointer ? 3 : 2)) {
        var f = drops[j];
        var fx = j * fontSize + f.xJitter + Math.sin(f.phase * 1.05) * fontSize * 0.14;
        var fTrail = coarsePointer ? 5 : 7;
        for (var n = 0; n < fTrail; n += 1) {
          var fy = f.y - n * fontSize;
          if (fy < -fontSize || fy > height + fontSize) continue;
          var fHue = j % 2 === 0 ? (112 + Math.sin(f.phase + n * 0.8) * 14) : (n === 0 ? 0 : 8);
          var fAlpha = n === 0 ? 0.92 : 0.12 + (1 - n / fTrail) * 0.28;
          ctx.fillStyle =
            "hsla(" +
            fHue.toFixed(0) +
            " 95% " +
            (n === 0 ? 72 : 56).toFixed(0) +
            "% / " +
            fAlpha.toFixed(3) +
            ")";
          ctx.fillText(randomChar(), fx, fy);
        }
      }

      if (elapsed >= duration) {
        redirectToGate();
        return;
      }

      rafId = requestAnimationFrame(draw);
    }

    function cleanup() {
      if (removed) return;
      removed = true;
      window.removeEventListener("resize", resize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", resize);
      }
      if (rafId) cancelAnimationFrame(rafId);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    function redirectToGate() {
      if (redirecting) return;
      redirecting = true;

      // Freeze the final state as fully covered so there is no flash of the source page
      // while navigation is beginning.
      try {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
      } catch (e) {
        // Ignore canvas failures and continue to navigate.
      }
      overlay.style.background = "#000";

      // Leave the overlay attached until pagehide so there is no brief visual gap.
      window.location.replace(targetHref);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", resize, { passive: true });
    }
    window.addEventListener("pagehide", cleanup, { once: true });
    rafId = requestAnimationFrame(draw);
  }

})();
