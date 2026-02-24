(function () {
  const output = document.getElementById("terminal-output");
  const form = document.getElementById("terminal-form");
  const input = document.getElementById("terminal-answer");
  const bodyEl = document.getElementById("terminal-body");
  const matrixCanvas = document.getElementById("matrix-bg");
  const scanOverlay = document.getElementById("scan-overlay");

  if (!output || !form || !input || !bodyEl) return;

  const TARGET = "birthday.html";
  const DENIED = "denied.html";
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let gateResolved = false;
  let typingBusy = false;
  let matrixStarted = false;
  let matrixStop = null;

  function sleep(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function scrollOutputToBottom() {
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function appendLine(className) {
    const line = document.createElement("p");
    line.className = "term-line" + (className ? " " + className : "");
    output.appendChild(line);
    scrollOutputToBottom();
    return line;
  }

  async function typeIntoElement(el, text, opts) {
    const options = opts || {};
    const speed = options.speed || (prefersReducedMotion ? 0 : 16);
    const caret = document.createElement("span");
    caret.className = "typing-caret";
    caret.textContent = "_";
    el.textContent = "";
    el.appendChild(caret);

    if (prefersReducedMotion || speed <= 0) {
      el.textContent = text;
      return;
    }

    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      caret.before(ch);
      scrollOutputToBottom();
      await sleep(speed + (Math.random() * (options.jitter || 10) | 0));
    }
    caret.remove();
  }

  async function typeLine(text, className, opts) {
    const line = appendLine(className);
    await typeIntoElement(line, text, opts);
    return line;
  }

  async function typePromptLine(prompt, command, className, opts) {
    const line = appendLine(className || "prompted");
    const promptText = document.createTextNode(prompt + " ");
    line.appendChild(promptText);
    const cmdSpan = document.createElement("span");
    cmdSpan.className = "command-text";
    line.appendChild(cmdSpan);
    await typeIntoElement(cmdSpan, command, opts || { speed: 12 });
    return line;
  }

  function randChoice(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function randomHex(len) {
    let s = "";
    const chars = "0123456789abcdef";
    for (let i = 0; i < len; i += 1) s += chars[(Math.random() * chars.length) | 0];
    return s;
  }

  function fakeCodeLine() {
    const ops = ["mov", "jmp", "xor", "call", "push", "lea", "cmp", "and", "or", "shr"];
    const regs = ["rax", "rbx", "rcx", "rdx", "r8", "r9", "r10", "r11"];
    const lhs = randChoice(regs);
    const rhs = Math.random() < 0.55 ? randChoice(regs) : "0x" + randomHex(4);
    const prefix = "0x" + randomHex(8);
    return prefix + "  " + randChoice(ops) + " " + lhs + ", " + rhs;
  }

  function randomAsciiLine() {
    const chars = "01<>[]{}()/\\|=+-_*#@&%$;:.,~^";
    let out = "";
    const len = 44 + ((Math.random() * 26) | 0);
    for (let i = 0; i < len; i += 1) {
      out += chars[(Math.random() * chars.length) | 0];
    }
    return out;
  }

  function initMatrixRain() {
    if (!matrixCanvas) return function () {};
    const ctx = matrixCanvas.getContext("2d");
    if (!ctx) return function () {};

    let dpr = 1;
    let width = 0;
    let height = 0;
    let fontSize = 14;
    let columns = 0;
    let drops = [];
    let rafId = 0;
    let lastTs = 0;
    const chars = "01[]{}()<>/=+-*#%$@;:.,_~^ABCDEFabcdef";

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(window.innerWidth));
      height = Math.max(1, Math.floor(window.innerHeight));
      matrixCanvas.width = Math.floor(width * dpr);
      matrixCanvas.height = Math.floor(height * dpr);
      matrixCanvas.style.width = width + "px";
      matrixCanvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fontSize = width < 620 ? 12 : 14;
      columns = Math.max(12, Math.floor(width / fontSize));
      drops = new Array(columns).fill(0).map(function (_, i) {
        return {
          y: -Math.random() * height,
          speed: (prefersReducedMotion ? 18 : 42) + Math.random() * (prefersReducedMotion ? 10 : 34),
          phase: Math.random() * Math.PI * 2 + i * 0.11,
          hue: 124 + Math.random() * 8,
        };
      });
    }

    function draw(ts) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      ctx.fillStyle = "rgba(2, 5, 3, 0.18)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = "500 " + fontSize + "px Menlo, Monaco, monospace";
      ctx.textBaseline = "top";

      for (let i = 0; i < drops.length; i += 1) {
        const d = drops[i];
        d.y += d.speed * dt;
        d.phase += dt * 1.9;
        const x = i * fontSize + Math.sin(d.phase) * 1.8;
        const trail = prefersReducedMotion ? 5 : 11;

        for (let t = 0; t < trail; t += 1) {
          const y = d.y - t * fontSize;
          if (y < -fontSize || y > height + fontSize) continue;
          const alpha = t === 0 ? 0.92 : 0.1 + (1 - t / trail) * 0.34;
          const light = t === 0 ? 72 : 54 - t * 1.6;
          const ch = chars[(Math.random() * chars.length) | 0];
          ctx.fillStyle = "hsla(" + d.hue.toFixed(0) + " 85% " + light.toFixed(0) + "% / " + alpha.toFixed(2) + ")";
          ctx.fillText(ch, x, y);
        }

        if (d.y - trail * fontSize > height + Math.random() * 120) {
          d.y = -Math.random() * (height * 0.4 + 80);
          d.speed = (prefersReducedMotion ? 18 : 42) + Math.random() * (prefersReducedMotion ? 10 : 34);
        }
      }

      rafId = window.requestAnimationFrame(draw);
    }

    function start() {
      resize();
      matrixCanvas.classList.add("active");
      window.addEventListener("resize", resize);
      ctx.fillStyle = "#020503";
      ctx.fillRect(0, 0, width, height);
      rafId = window.requestAnimationFrame(draw);
    }

    function stop() {
      matrixCanvas.classList.remove("active");
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    }

    start();
    return stop;
  }

  function ensureMatrix() {
    if (matrixStarted) return;
    matrixStarted = true;
    matrixStop = initMatrixRain();
  }

  function humanTyperSpeed(kind) {
    if (prefersReducedMotion) return { speed: 0, jitter: 0 };
    if (kind === "slow") return { speed: 20, jitter: 18 };
    if (kind === "fast") return { speed: 8, jitter: 8 };
    return { speed: 13, jitter: 12 };
  }

  async function bootstrapTerminal() {
    typingBusy = true;

    await typeLine("Last login: Tue Feb 24 20:06:13 on console", "meta", humanTyperSpeed("fast"));
    await typePromptLine("elli-iphone:~ mobile$", "whoami", "prompted", humanTyperSpeed("fast"));
    await typeLine("mobile", "dim", humanTyperSpeed("fast"));

    await typePromptLine("elli-iphone:~ mobile$", "uname -a", "prompted", humanTyperSpeed("fast"));
    await typeLine("Darwin iPhone 23.6.0 Darwin Kernel Version 23.6.0 arm64", "dim", humanTyperSpeed("fast"));

    await typePromptLine("elli-iphone:~ mobile$", "ssh birthday@mainframe.local", "prompted", humanTyperSpeed());
    await typeLine("Warning: Permanently added 'mainframe.local' (ED25519) to the list of known hosts.", "meta", humanTyperSpeed("fast"));
    await typeLine("birthday@mainframe.local's password: ********", "dim", humanTyperSpeed("fast"));
    await typeLine("login successful :: session attached", "success", humanTyperSpeed("fast"));

    await typePromptLine("mainframe:~ birthday$", "./run_birthday_payload --stealth", "prompted", humanTyperSpeed());
    await typeLine("[task] hacking into the mainframe", "warning", humanTyperSpeed());
    await typeLine("[task] aquiring admin priveledges", "warning", humanTyperSpeed());
    await typeLine("[task] taking over user device", "warning", humanTyperSpeed());
    await typeLine("[task] deleting sys32.exe", "danger", humanTyperSpeed());
    await typeLine("[note] sys32.exe not found on this platform (good)", "meta", humanTyperSpeed("fast"));
    await typeLine("[inject] terminal payload written to display buffer", "success", humanTyperSpeed("fast"));
    await sleep(prefersReducedMotion ? 40 : 160);

    ensureMatrix();

    await typePromptLine("mainframe:~ birthday$", "cat /tmp/payload.log | tail -n 7", "prompted", humanTyperSpeed("fast"));
    for (let i = 0; i < 7; i += 1) {
      await typeLine(fakeCodeLine(), "dim", { speed: prefersReducedMotion ? 0 : 4, jitter: 4 });
    }

    await typePromptLine("mainframe:~ birthday$", "ascii_stream --mode=cinematic --target=display", "prompted", humanTyperSpeed("fast"));
    for (let i = 0; i < 3; i += 1) {
      await typeLine(randomAsciiLine(), "dim", { speed: prefersReducedMotion ? 0 : 3, jitter: 2 });
    }

    await typePromptLine("mainframe:~ birthday$", "prompt_user --question", "prompted", humanTyperSpeed("fast"));
    await typeLine("Are you ready for the best birthday present ever?", "prompted", humanTyperSpeed("slow"));

    typingBusy = false;
    form.classList.remove("hidden");
    input.focus();
    scrollOutputToBottom();
  }

  async function approvedSequence() {
    typingBusy = true;
    form.classList.add("hidden");

    await typeLine("> Yes", "prompted", humanTyperSpeed("fast"));
    await sleep(prefersReducedMotion ? 40 : 220);
    await typeLine("Access Granted", "big", humanTyperSpeed());
    await typePromptLine("mainframe:~ birthday$", "scan_target --label \"Birthday Girl\" --deep", "prompted", humanTyperSpeed("fast"));
    await typeLine("Scanning for Birthday Girl", "prompted", humanTyperSpeed("fast"));

    scanOverlay.classList.remove("hidden");
    await sleep(prefersReducedMotion ? 120 : 5000);
    scanOverlay.classList.add("hidden");

    await typeLine("match found :: elli.steinbach", "success", humanTyperSpeed("fast"));
    await typePromptLine("mainframe:~ birthday$", "echo Approved", "prompted", humanTyperSpeed("fast"));
    await typeLine("Approved", "prompted", { speed: prefersReducedMotion ? 0 : 18, jitter: 9 });
    await sleep(prefersReducedMotion ? 120 : 650);

    if (typeof matrixStop === "function") matrixStop();
    window.location.replace(TARGET);
  }

  function denyAndRedirect() {
    gateResolved = true;
    form.classList.add("hidden");
    output.appendChild(Object.assign(document.createElement("p"), {
      className: "term-line danger",
      textContent: "> " + (input.value || "")
    }));
    scrollOutputToBottom();
    if (typeof matrixStop === "function") matrixStop();
    window.setTimeout(function () {
      window.location.replace(DENIED);
    }, prefersReducedMotion ? 30 : 260);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (typingBusy || gateResolved) return;

    const value = (input.value || "").trim();
    if (value === "Yes") {
      gateResolved = true;
      approvedSequence().catch(function () {
        window.location.replace(TARGET);
      });
      return;
    }

    denyAndRedirect();
  });

  input.addEventListener("keydown", function (event) {
    if (typingBusy && event.key !== "Tab") {
      event.preventDefault();
    }
  });

  bootstrapTerminal().catch(function () {
    window.location.replace(TARGET);
  });
})();
