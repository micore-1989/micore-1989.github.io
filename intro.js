(function () {
  const body = document.body;
  const overlay = document.getElementById("birthday-intro");
  const heart = document.getElementById("intro-heart-bloom");
  const target = body ? body.getAttribute("data-intro-target") : "birthday.html";

  if (!body || !overlay || !heart) {
    window.location.replace(target || "birthday.html");
    return;
  }

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    overlay.classList.add("is-exiting");
    window.setTimeout(function () {
      window.location.replace(target || "birthday.html");
    }, prefersReducedMotion ? 180 : 360);
  }

  function start() {
    if (prefersReducedMotion) {
      heart.classList.add("grow");
      window.setTimeout(finish, 280);
      return;
    }

    window.setTimeout(function () {
      heart.classList.add("grow");
    }, 220);

    window.setTimeout(finish, 1700);
  }

  overlay.addEventListener(
    "click",
    function () {
      finish();
    },
    { once: true }
  );

  window.setTimeout(finish, 6000);
  start();
})();
