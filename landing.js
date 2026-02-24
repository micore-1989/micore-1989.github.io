(function () {
  const hotspots = Array.from(document.querySelectorAll('.hotspot'));
  const statusLine = document.getElementById('status-line');
  const successFlash = document.getElementById('success-flash');

  if (!hotspots.length || !statusLine || !successFlash) return;

  const TARGET = 'birthday.html';
  let current = 0;
  let locked = false;
  let clearErrorTimer = 0;

  const steps = [
    'Step 1 of 2: click the left golf club head',
    'Step 2 of 2: now click the right golf club head',
    'Correct. Opening the birthday website...'
  ];

  function setStatus(text, type) {
    statusLine.textContent = text;
    statusLine.classList.remove('error', 'success');
    if (type) statusLine.classList.add(type);
  }

  function resetChallenge(message) {
    current = 0;
    hotspots.forEach(function (btn) {
      btn.classList.remove('correct');
      btn.disabled = false;
    });
    setStatus(message || steps[0], message ? 'error' : '');

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
    setStatus(steps[2], 'success');
    successFlash.classList.add('show');
    window.setTimeout(function () {
      window.location.replace(TARGET);
    }, 850);
  }

  hotspots.forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      if (locked) return;

      const order = Number(btn.dataset.order);
      if (order !== current) {
        resetChallenge('WRONG ORDER. left to right means LEFT to RIGHT.');
        return;
      }

      btn.classList.add('correct');
      btn.disabled = true;
      current += 1;

      if (current >= hotspots.length) {
        winChallenge();
        return;
      }

      setStatus(steps[current]);
    });
  });

  setStatus(steps[0]);
})();
