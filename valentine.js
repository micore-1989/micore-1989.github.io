(function () {
  function initValentinePage() {
    const stage = document.getElementById("choice-stage");
    const noBtn = document.getElementById("no-btn");
    const yesBtn = document.getElementById("yes-btn");
    const message = document.getElementById("response-message");
    const yesDestination = "date-invite.html";

    if (!stage || !noBtn || !yesBtn || !message) return;

    document.documentElement.classList.add("js-ready");

    const supportsMatchMedia = typeof window.matchMedia === "function";
    const finePointer = supportsMatchMedia && window.matchMedia("(pointer: fine)").matches;

    let rafMoveQueued = false;
    let pendingPointerEvent = null;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function stageMetrics() {
      const stageRect = stage.getBoundingClientRect();
      const btnRect = noBtn.getBoundingClientRect();
      const padding = 10;
      const maxX = Math.max(padding, stageRect.width - btnRect.width - padding);
      const maxY = Math.max(padding, stageRect.height - btnRect.height - padding);
      return { stageRect, btnRect, padding, maxX, maxY };
    }

    function placeNoButton(x, y) {
      const m = stageMetrics();
      const left = clamp(x, m.padding, m.maxX);
      const top = clamp(y, m.padding, m.maxY);
      noBtn.style.left = left + "px";
      noBtn.style.top = top + "px";
      noBtn.style.transform = "none";
    }

    function randomizeNoButton() {
      const m = stageMetrics();
      const left = m.padding + Math.random() * Math.max(1, m.maxX - m.padding);
      const top = m.padding + Math.random() * Math.max(1, m.maxY - m.padding);
      placeNoButton(left, top);
    }

    function setInitialNoButtonPosition() {
      const m = stageMetrics();
      const left = m.stageRect.width * 0.65 - m.btnRect.width / 2;
      const top = m.stageRect.height * 0.5 - m.btnRect.height / 2;
      placeNoButton(left, top);
    }

    function dodgeFromPointer(event) {
      if (!finePointer) return;

      pendingPointerEvent = event;
      if (rafMoveQueued) return;

      rafMoveQueued = true;
      requestAnimationFrame(function () {
        rafMoveQueued = false;
        if (!pendingPointerEvent) return;

        const e = pendingPointerEvent;
        pendingPointerEvent = null;

        const rect = noBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const distance = Math.hypot(dx, dy);

        if (distance < 125) {
          randomizeNoButton();
          message.textContent = "Interesting choice. Please try again.";
        }
      });
    }

    yesBtn.addEventListener("click", function () {
      message.textContent = "Excellent answer. Very elegant choice.";
      yesBtn.disabled = true;
      noBtn.disabled = true;
      setTimeout(function () {
        window.location.href = yesDestination;
      }, 450);
    });

    noBtn.addEventListener("mouseenter", function () {
      if (!finePointer) return;
      randomizeNoButton();
      message.textContent = "No is currently unavailable.";
    });

    noBtn.addEventListener("pointerdown", function (event) {
      // Keep it playful on touch devices too.
      if (finePointer) return;
      event.preventDefault();
      randomizeNoButton();
      message.textContent = "Nice try. The button moved.";
    });

    noBtn.addEventListener("click", function (event) {
      if (finePointer) {
        event.preventDefault();
        randomizeNoButton();
      }
    });

    stage.addEventListener("mousemove", dodgeFromPointer);
    stage.addEventListener("pointermove", dodgeFromPointer);
    stage.addEventListener("mouseleave", function () {
      pendingPointerEvent = null;
    });

    window.addEventListener("resize", setInitialNoButtonPosition);

    requestAnimationFrame(function () {
      requestAnimationFrame(setInitialNoButtonPosition);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initValentinePage, { once: true });
  } else {
    initValentinePage();
  }
})();
