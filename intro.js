(function () {
  const overlay = document.getElementById("birthday-intro");
  const bubble = document.getElementById("intro-bubble");
  const character = document.getElementById("intro-character");
  const burst = document.getElementById("intro-sneeze-burst");
  const body = document.body;

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
    // Restart the pulse animation when text changes.
    void bubble.offsetWidth;
    bubble.classList.add("show", "switching");
    window.setTimeout(function () {
      bubble.classList.remove("switching");
    }, 240);
  }

  function playSneeze() {
    if (character) {
      character.classList.remove("is-sneezing");
      void character.offsetWidth;
      character.classList.add("is-sneezing");
      window.setTimeout(function () {
        character.classList.remove("is-sneezing");
      }, 380);
    }

    if (burst) {
      burst.classList.remove("active");
      void burst.offsetWidth;
      burst.classList.add("active");
      window.setTimeout(function () {
        burst.classList.remove("active");
      }, 320);
    }
  }

  function finishIntro() {
    if (finished) return;
    finished = true;

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
    if (!overlay || !bubble || !character || !burst) {
      finishIntro();
      return;
    }

    bubble.classList.add("show");
    pulseBubble("sneeze", false);

    if (prefersReducedMotion) {
      await sleep(380);
      pulseBubble("Happy Birthday Elli!", true);
      await sleep(700);
      pulseBubble("sneeze", false);
      await sleep(260);
      playSneeze();
      await sleep(260);
      finishIntro();
      return;
    }

    await sleep(540);
    playSneeze();

    await sleep(760);
    pulseBubble("sneeze", false);

    await sleep(520);
    playSneeze();

    await sleep(860);
    pulseBubble("Happy Birthday Elli!", true);

    await sleep(1200);
    pulseBubble("sneeze", false);

    await sleep(430);
    playSneeze();

    await sleep(340);
    finishIntro();
  }

  // Allow emergency skip if the user clicks/taps the intro.
  if (overlay) {
    overlay.addEventListener(
      "click",
      function () {
        finishIntro();
      },
      { once: true }
    );
  }

  // Safety fallback so the page can't get stuck behind the overlay.
  window.setTimeout(finishIntro, 12000);

  runIntro().catch(finishIntro);

  window.addEventListener("pagehide", function () {
    if (cleanupTimer) window.clearTimeout(cleanupTimer);
  });
})();
