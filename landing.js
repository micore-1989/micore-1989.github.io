(function () {
  var grid = document.getElementById("captcha-grid");
  var status = document.getElementById("captcha-status");
  if (!grid || !status) return;

  var tiles = Array.prototype.slice.call(grid.querySelectorAll(".captcha-tile"));
  if (!tiles.length) return;

  var TARGET = "birthday.html";
  var FAIL_TARGET = "wrong.html";
  var locked = false;

  function setStatus(text, type) {
    status.textContent = text;
    status.classList.remove("success", "error");
    if (type) status.classList.add(type);
  }

  function chooseTile(button) {
    if (!button || locked) return;
    locked = true;
    grid.classList.add("locked");

    var isCorrect = button.dataset.correct === "true";
    button.classList.add(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      setStatus("Correct. Verifying selection...", "success");
      window.setTimeout(function () {
        window.location.replace(TARGET);
      }, 700);
      return;
    }

    setStatus("Wrong selection. Initiating consequences...", "error");
    window.setTimeout(function () {
      window.location.replace(FAIL_TARGET);
    }, 550);
  }

  tiles.forEach(function (tile) {
    tile.addEventListener("click", function (event) {
      event.preventDefault();
      chooseTile(tile);
    });
  });

  setStatus("Select exactly one image.");
})();
