(function () {
  const overlay = document.getElementById("birthday-intro");
  const bubble = document.getElementById("intro-bubble");
  const character = document.getElementById("intro-character");
  const handHeart = document.getElementById("intro-hand-heart-wrap");
  const heartBloom = document.getElementById("intro-heart-bloom");
  const skipBtn = document.getElementById("intro-skip-btn");
  const body = document.body;
  const introTarget = body ? body.getAttribute("data-intro-target") : "";

  if (!body) return;

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let finished = false;
  let cleanupTimer = 0;

  function sleep(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function pulseBubble(text, isHappy) {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.toggle("happy", !!isHappy);
    bubble.classList.remove("switching");
    void bubble.offsetWidth;
    bubble.classList.add("show", "switching");
    window.setTimeout(function () {
      bubble.classList.remove("switching");
    }, 240);
  }

  function talkBeat(duration) {
    if (!character) return;
    character.classList.remove("is-speaking");
    void character.offsetWidth;
    character.classList.add("is-speaking");
    window.setTimeout(function () {
      character.classList.remove("is-speaking");
    }, duration || 320);
  }

  function startHandHeart() {
    if (character) character.classList.add("is-hearting");
    if (handHeart) handHeart.classList.add("active");
  }

  function startHeartBloom() {
    if (heartBloom) {
      heartBloom.classList.remove("grow");
      void heartBloom.offsetWidth;
      heartBloom.classList.add("grow");
    }
    if (bubble) {
      bubble.classList.add("happy");
      bubble.classList.add("switching");
      window.setTimeout(function () {
        bubble.classList.remove("switching");
      }, 220);
    }
  }

  function finishIntro() {
    if (finished) return;
    finished = true;

    if (introTarget) {
      if (overlay) overlay.classList.add("is-exiting");
      cleanupTimer = window.setTimeout(function () {
        window.location.replace(introTarget);
      }, 640);
      return;
    }

    body.classList.remove("intro-active");
    body.classList.add("intro-reveal");

    if (overlay) {
      overlay.classList.add("is-exiting");
      cleanupTimer = window.setTimeout(function () {
        overlay.remove();
      }, 700);
    }

    window.dispatchEvent(new Event("birthdayIntroComplete"));

    window.setTimeout(function () {
      body.classList.remove("intro-reveal");
    }, 900);
  }

  async function runIntro() {
    if (!overlay || !bubble || !character || !handHeart || !heartBloom) {
      finishIntro();
      return;
    }

    bubble.classList.add("show");
    pulseBubble("Hi Elli!", false);
    talkBeat(320);

    if (prefersReducedMotion) {
      await sleep(450);
      pulseBubble("I hope you're having a great day", false);
      talkBeat(360);
      await sleep(650);
      pulseBubble("Happy birthday!", true);
      talkBeat(360);
      await sleep(700);
      startHandHeart();
      await sleep(420);
      startHeartBloom();
      await sleep(520);
      finishIntro();
      return;
    }

    await sleep(900);
    pulseBubble("I hope you're having a great day", false);
    talkBeat(420);

    await sleep(1300);
    pulseBubble("Happy birthday!", true);
    talkBeat(420);

    await sleep(1000);
    startHandHeart();

    await sleep(900);
    startHeartBloom();

    await sleep(980);
    finishIntro();
  }

  if (overlay) {
    overlay.addEventListener(
      "click",
      function () {
        finishIntro();
      },
      { once: true }
    );
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      finishIntro();
    });
  }

  window.setTimeout(finishIntro, 15000);
  runIntro().catch(finishIntro);

  window.addEventListener("pagehide", function () {
    if (cleanupTimer) window.clearTimeout(cleanupTimer);
  });
})();
