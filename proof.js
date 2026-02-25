(function () {
  var page = document.getElementById("proof-page");
  var meter = document.getElementById("meter-fill");
  var current = document.getElementById("affirmation-current");
  var list = document.getElementById("affirmation-list");
  var listWrap = document.getElementById("affirmation-list-wrap");
  if (!page || !current || !list || !listWrap) return;

  var prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var affirmations = [
    "You are genuinely beautiful, and not in a try-hard way. It just happens.",
    "You have the kind of face people remember after one conversation.",
    "You make a room feel instantly more alive when you walk into it.",
    "You are deeply loved, even by people who pretend to be chill about it.",
    "Your laugh has elite energy and should honestly be protected by law.",
    "You are the definition of pretty and funny at the same time. Dangerous combo.",
    "You have immaculate taste and somehow make it look effortless.",
    "You are the type of person people feel lucky to know.",
    "You make ordinary moments feel like core memories.",
    "You are so easy to adore it almost feels unfair to everyone else.",
    "Your presence is comforting and exciting at the same time. Rare talent.",
    "You are beautiful in the obvious way and in the subtle way too.",
    "You deserve soft mornings, loud laughter, and people who hype you up properly.",
    "You are extremely lovable and honestly this page is just documenting facts.",
    "You glow even when you are doing absolutely nothing special.",
    "You are one of those people that makes life feel better to be in.",
    "You make cute look effortless and iconic look accidental.",
    "You are loved a lot, and yes, this includes aggressively.",
    "You have main-character energy without being annoying about it.",
    "You are the kind of beautiful that also makes people feel calm.",
    "You are magnetic, hilarious, and low-key impossible to forget.",
    "You deserve to feel adored today because you are.",
    "You look like the reason someone writes a playlist.",
    "You are pretty enough to stop a conversation and nice enough to restart it.",
    "You are loved by people who know you and admired by people who don't yet.",
    "You make life more fun just by existing in it.",
    "You are a walking reminder that sweetness and style can coexist.",
    "You are, respectfully, a total catch.",
  ];

  var prefixes = ["FACT", "TRUE", "REAL", "CERT", "INFO", "ALERT", "NOTE", "PSA"];
  var hearts = ["<3", "♡", "♥", "<33"];
  var index = 0;
  var loopTimer = 0;
  var maxVisible = 18;

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setCurrent(text) {
    current.textContent = text;
  }

  function addAffirmationLine(text) {
    var li = document.createElement("li");
    var prefix = prefixes[index % prefixes.length];
    var heart = hearts[index % hearts.length];
    li.innerHTML =
      '<span class="affirmation-prefix">[' +
      prefix +
      ']</span> ' +
      escapeHtml(text) +
      ' <span class="affirmation-heart">' +
      heart +
      "</span>";
    list.appendChild(li);

    while (list.children.length > maxVisible) {
      list.removeChild(list.firstElementChild);
    }

    listWrap.scrollTop = listWrap.scrollHeight;
  }

  function nextAffirmation() {
    var text = affirmations[index % affirmations.length];
    setCurrent(text);
    addAffirmationLine(text);
    index += 1;
  }

  function scheduleNext() {
    if (prefersReducedMotion) return;
    clearTimeout(loopTimer);
    loopTimer = window.setTimeout(function () {
      nextAffirmation();
      scheduleNext();
    }, 950 + Math.random() * 850);
  }

  // Seed the feed so it looks "already running" on load.
  var seedCount = prefersReducedMotion ? 5 : 8;
  for (var i = 0; i < seedCount; i += 1) {
    nextAffirmation();
  }
  if (!prefersReducedMotion) {
    scheduleNext();
  }

  // Small camera punch effect to keep the page goofy.
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
      }, 1500 + Math.random() * 2600);
    }
    schedulePunch();
  }

  // "Love meter" oscillation.
  var raf = 0;
  if (meter && !prefersReducedMotion) {
    var start = performance.now();
    function tick(now) {
      var t = (now - start) / 1000;
      var value = 0.46 + Math.abs(Math.sin(t * 0.95)) * 0.3 + Math.sin(t * 2.8) * 0.08;
      var clamped = Math.max(0.18, Math.min(0.98, value));
      meter.style.transform = "scaleX(" + clamped.toFixed(3) + ")";
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener(
    "pagehide",
    function () {
      clearTimeout(loopTimer);
      if (raf) cancelAnimationFrame(raf);
    },
    { once: true }
  );
})();
