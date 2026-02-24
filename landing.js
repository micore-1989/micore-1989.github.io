(function () {
  const hotspots = Array.from(document.querySelectorAll(".hotspot"));
  const statusLine = document.getElementById("status-line");
  const successFlash = document.getElementById("success-flash");
  const challengeWrap = document.getElementById("challenge-wrap");

  if (!hotspots.length || !statusLine || !successFlash || !challengeWrap) return;

  const TARGET = "birthday.html";
  let current = 0;
  let locked = false;
  let clearErrorTimer = 0;
  const targetRegions = [
    // "left nipple" target (right-side person in the photo)
    { x: 56.0, y: 48.2, w: 19.5, h: 12.5 },
    // right golf club head
    { x: 87.0, y: 51.3, w: 17.0, h: 11.5 },
  ];

  const steps = [
    "Step 1 of 2: click on my left nipple",
    "Step 2 of 2: now click the right golf club head",
    "Correct. Opening the birthday website...",
  ];

  function setStatus(text, type) {
    statusLine.textContent = text;
    statusLine.classList.remove("error", "success");
    if (type) statusLine.classList.add(type);
  }

  function resetChallenge(message) {
    current = 0;
    hotspots.forEach(function (btn) {
      btn.classList.remove("correct");
      btn.disabled = false;
    });
    setStatus(message || steps[0], message ? "error" : "");

    if (clearErrorTimer) window.clearTimeout(clearErrorTimer);
    if (message) {
      clearErrorTimer = window.setTimeout(function () {
        if (locked) return;
        setStatus(steps[0]);
      }, 1100);
    }
  }

  function winChallenge() {
    locked = true;
    setStatus(steps[2], "success");
    successFlash.classList.add("show");
    window.setTimeout(function () {
      window.location.replace(TARGET);
    }, 850);
  }

  function handleSelection(order, sourceBtn) {
    if (locked) return;

    if (order !== current) {
      resetChallenge("WRONG ORDER. left to right means LEFT to RIGHT.");
      return;
    }

    if (sourceBtn) {
      sourceBtn.classList.add("correct");
      sourceBtn.disabled = true;
    } else if (hotspots[order]) {
      // Coordinate fallback click on the image should still show progress.
      hotspots[order].classList.add("correct");
      hotspots[order].disabled = true;
    }

    current += 1;

    if (current >= hotspots.length) {
      winChallenge();
      return;
    }

    setStatus(steps[current]);
  }

  function percentFromClick(event) {
    const rect = challengeWrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  }

  function regionHit(point, region) {
    const dx = Math.abs(point.x - region.x);
    const dy = Math.abs(point.y - region.y);
    return dx <= region.w / 2 && dy <= region.h / 2;
  }

  hotspots.forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      const order = Number(btn.dataset.order);
      handleSelection(order, btn);
    });
  });

  challengeWrap.addEventListener("click", function (event) {
    if (locked) return;
    if (event.target && event.target.closest && event.target.closest(".hotspot")) return;

    const point = percentFromClick(event);
    if (!point) return;

    for (let i = 0; i < targetRegions.length; i += 1) {
      if (regionHit(point, targetRegions[i])) {
        handleSelection(i, null);
        return;
      }
    }
  });

  setStatus(steps[0]);
})();
