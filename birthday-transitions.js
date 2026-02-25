(function () {
  var surpriseTrigger = document.querySelector(".footer-surprise-btn[href='surprise-gate.html']");
  var proofTrigger = document.querySelector("#reason-2 .reason-btn[href='proof.html']");
  if (!surpriseTrigger && !proofTrigger) return;

  var running = false;

  bindTransition(surpriseTrigger, function () {
    playAsciiGateTransition("surprise-gate.html");
  });

  bindTransition(proofTrigger, function (event, el) {
    playProofTransition("proof.html", el || event.currentTarget);
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

  function playProofTransition(targetHref, sourceEl) {
    var prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var coarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;

    var overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;pointer-events:none;overflow:hidden;" +
      "background:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(10,10,10,0) 100%);";

    var canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    overlay.appendChild(canvas);

    var title = document.createElement("div");
    title.textContent = "WHY I WOULD BE A BAD BOYFRIEND (RECEIPTS)";
    title.style.cssText =
      "position:absolute;left:50%;top:10px;transform:translateX(-50%);" +
      "padding:8px 14px;border:2px solid rgba(255,255,255,0.55);" +
      "background:rgba(0,0,0,0.72);color:#fff;font:700 12px/1.1 'Courier New',monospace;" +
      "letter-spacing:1px;text-align:center;text-shadow:0 0 8px rgba(255,0,0,0.6);";
    overlay.appendChild(title);

    var stickerTexts = [
      "POV: evidence drop",
      "bro is cooked",
      "L + ratio + receipts",
      "this is so unserious",
      "subway surfers footage missing",
      "chat, look at this",
      "sending to the groupchat",
    ];
    var stickers = [];
    for (var s = 0; s < (coarsePointer ? 5 : 8); s += 1) {
      var sticker = document.createElement("div");
      sticker.textContent = stickerTexts[s % stickerTexts.length];
      sticker.style.cssText =
        "position:absolute;padding:4px 8px;background:rgba(255,255,255,0.92);" +
        "color:#111;border:2px solid #111;border-radius:999px;" +
        "font:700 11px/1 'Courier New',monospace;white-space:nowrap;" +
        "box-shadow:0 6px 18px rgba(0,0,0,0.28);";
      overlay.appendChild(sticker);
      stickers.push({
        el: sticker,
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.08,
        rot: (Math.random() - 0.5) * 18,
        vr: (Math.random() - 0.5) * 14,
      });
    }

    document.body.appendChild(overlay);

    var ctx = canvas.getContext("2d");
    if (!ctx) {
      window.location.href = targetHref;
      return;
    }

    var dpr = 1;
    var width = 0;
    var height = 0;
    var rafId = 0;
    var removed = false;
    var redirecting = false;
    var start = performance.now();
    var last = 0;
    var frameGate = 0;
    var duration = prefersReducedMotion ? 1200 : 2400;
    var burstX = 0.5;
    var burstY = 0.5;
    var cols = [];
    var phrases = [
      "POV",
      "L+RATIO",
      "BAD BF",
      "RECEIPTS",
      "AURA -100",
      "CHAT???",
      "ITS OVER",
      "CLIP IT",
      "COOKED",
      "UNSERIOUS",
    ];

    if (sourceEl && sourceEl.getBoundingClientRect) {
      var rect = sourceEl.getBoundingClientRect();
      burstX = rect.left + rect.width / 2;
      burstY = rect.top + rect.height / 2;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.2 : 1.6);
      width = Math.max(1, Math.floor(window.innerWidth));
      height = Math.max(1, Math.floor(window.innerHeight));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var colWidth = width < 520 ? 54 : 72;
      var count = Math.max(6, Math.floor(width / colWidth));
      cols = new Array(count).fill(0).map(function (_, i) {
        return {
          x: (i + 0.5) * (width / count),
          y: -Math.random() * height,
          speed: (coarsePointer ? 120 : 160) + Math.random() * 140,
          hue: i % 2 === 0 ? 125 : 4,
          phrase: phrases[(Math.random() * phrases.length) | 0],
          phase: Math.random() * Math.PI * 2,
        };
      });
    }

    function cleanup() {
      if (removed) return;
      removed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", resize);
      }
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    function redirect() {
      if (redirecting) return;
      redirecting = true;
      try {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
      } catch (e) {}
      overlay.style.background = "#000";
      window.location.replace(targetHref);
    }

    function draw(now) {
      if (removed) return;
      if (!last) last = now;
      var dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      var elapsed = now - start;
      var t = Math.min(1, elapsed / duration);

      if (coarsePointer) {
        frameGate = (frameGate + 1) % 2;
        if (frameGate === 1) {
          rafId = requestAnimationFrame(draw);
          return;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Darkening background to transition out of the elegant page into chaos.
      var bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "rgba(0,0,0," + (0.08 + t * 0.55).toFixed(3) + ")");
      bgGrad.addColorStop(0.65, "rgba(12,12,12," + (0.12 + t * 0.65).toFixed(3) + ")");
      bgGrad.addColorStop(1, "rgba(0,0,0," + (0.22 + t * 0.72).toFixed(3) + ")");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Button-origin "dramatic" burst.
      var burstRadius = (80 + Math.pow(t, 0.9) * Math.max(width, height) * 1.1);
      var burst = ctx.createRadialGradient(burstX, burstY, 0, burstX, burstY, burstRadius);
      burst.addColorStop(0, "rgba(255,255,255," + (0.22 * (1 - t)).toFixed(3) + ")");
      burst.addColorStop(0.22, "rgba(255,220,150," + (0.12 * (1 - t * 0.7)).toFixed(3) + ")");
      burst.addColorStop(0.55, "rgba(255,0,70," + (0.14 * (1 - t * 0.45)).toFixed(3) + ")");
      burst.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = burst;
      ctx.fillRect(0, 0, width, height);

      ctx.font = (width < 640 ? 12 : 14) + "px 'Courier New', monospace";
      ctx.textBaseline = "top";

      for (var i = 0; i < cols.length; i += 1) {
        var c = cols[i];
        c.y += c.speed * dt;
        c.phase += dt * 3.2;
        var y = c.y;
        for (var k = 0; k < 6; k += 1) {
          var py = y - k * 22;
          if (py < -24 || py > height + 24) continue;
          var head = k === 0;
          var hue = c.hue === 125 ? 120 + Math.sin(c.phase + k) * 14 : 2 + Math.sin(c.phase + k) * 6;
          var alpha = head ? (0.82 - t * 0.15) : (0.11 + (1 - k / 6) * 0.18);
          ctx.fillStyle = "hsla(" + hue.toFixed(0) + " 95% " + (head ? 65 : 54) + "% / " + alpha.toFixed(3) + ")";
          ctx.fillText(k % 2 === 0 ? c.phrase : "..." + c.phrase.toLowerCase(), c.x - 34, py);
        }
        if (c.y > height + 120) {
          c.y = -40 - Math.random() * (height * 0.35);
          c.speed = (coarsePointer ? 120 : 160) + Math.random() * 140;
          c.phrase = phrases[(Math.random() * phrases.length) | 0];
          c.hue = Math.random() < 0.5 ? 125 : 4;
        }
      }

      // Fake vertical-video caption bars.
      var frameW = Math.min(width * (coarsePointer ? 0.88 : 0.58), 560);
      var frameH = Math.min(height * 0.62, width * 0.9);
      var frameX = (width - frameW) / 2;
      var frameY = (height - frameH) / 2;
      ctx.strokeStyle = "rgba(255,255,255," + (0.18 + t * 0.2).toFixed(3) + ")";
      ctx.lineWidth = 2;
      ctx.strokeRect(frameX, frameY, frameW, frameH);

      ctx.fillStyle = "rgba(0,0,0,0.58)";
      ctx.fillRect(frameX + 10, frameY + 10, frameW - 20, 34);
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.font = "700 " + (width < 560 ? 12 : 13) + "px 'Courier New', monospace";
      ctx.fillText("why i would be a bad boyfriend (funny edition)", frameX + 18, frameY + 20);

      ctx.fillStyle = "rgba(0,0,0,0.64)";
      ctx.fillRect(frameX + 10, frameY + frameH - 52, frameW - 20, 38);
      ctx.fillStyle = "rgba(255,255,255,0.98)";
      ctx.fillText("scrolling to evidence... do not panic", frameX + 18, frameY + frameH - 40);

      // Floating stickers
      for (var z = 0; z < stickers.length; z += 1) {
        var st = stickers[z];
        st.x += st.vx * dt;
        st.y += st.vy * dt;
        st.rot += st.vr * dt;
        if (st.x < 0.02 || st.x > 0.98) st.vx *= -1;
        if (st.y < 0.06 || st.y > 0.94) st.vy *= -1;
        var px = st.x * width;
        var py2 = st.y * height;
        st.el.style.transform =
          "translate(" +
          (px - st.el.offsetWidth / 2).toFixed(1) +
          "px," +
          (py2 - st.el.offsetHeight / 2).toFixed(1) +
          "px) rotate(" +
          st.rot.toFixed(1) +
          "deg) scale(" +
          (1 + Math.sin(elapsed / 180 + z) * 0.03).toFixed(3) +
          ")";
        st.el.style.opacity = (0.74 + Math.sin(elapsed / 220 + z) * 0.18).toFixed(3);
      }

      if (t > 0.62) {
        ctx.fillStyle = "rgba(0,0,0," + ((t - 0.62) / 0.38).toFixed(3) + ")";
        ctx.fillRect(0, 0, width, height);
      }

      if (elapsed >= duration) {
        redirect();
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
})();
