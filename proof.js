(function () {
  var page = document.getElementById("proof-page");
  var meter = document.getElementById("meter-fill");
  var image = document.getElementById("proof-image");
  if (!page) return;

  var prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Small "camera punch" effect to make the page feel intentionally unserious.
  if (!prefersReducedMotion) {
    var punchTimer = 0;
    function schedulePunch() {
      clearTimeout(punchTimer);
      punchTimer = window.setTimeout(function () {
        page.classList.add("is-punch");
        window.setTimeout(function () {
          page.classList.remove("is-punch");
          schedulePunch();
        }, 180);
      }, 1200 + Math.random() * 2300);
    }
    schedulePunch();
    window.addEventListener(
      "pagehide",
      function () {
        clearTimeout(punchTimer);
      },
      { once: true }
    );
  }

  // Animated "cringe scanner" meter with mild randomness.
  if (meter && !prefersReducedMotion) {
    var raf = 0;
    var start = performance.now();
    function tick(now) {
      var t = (now - start) / 1000;
      var value = 0.38 + Math.abs(Math.sin(t * 1.25)) * 0.35 + Math.sin(t * 3.6) * 0.06;
      var clamped = Math.max(0.12, Math.min(0.96, value));
      meter.style.transform = "scaleX(" + clamped.toFixed(3) + ")";
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    window.addEventListener(
      "pagehide",
      function () {
        cancelAnimationFrame(raf);
      },
      { once: true }
    );
  }

  // Quick fallback styling in case the image is missing or fails to decode.
  if (image) {
    image.addEventListener("error", function () {
      image.alt = "reasons image failed to load";
      image.style.opacity = "0.18";
      page.classList.add("image-missing");
    });
  }
})();
