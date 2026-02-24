(function () {
  const form = document.getElementById("gate-form");
  const input = document.getElementById("gate-password");
  const message = document.getElementById("gate-message");

  if (!form || !input || !message) return;

  const PASSWORD = "ipromiseiamelli";
  const AUTH_KEY = "elli_surprise_auth";
  const AUTH_VALUE = "ok";

  try {
    if (window.sessionStorage.getItem(AUTH_KEY) === AUTH_VALUE) {
      window.location.replace("surprise.html");
      return;
    }
  } catch (e) {
    // Ignore storage failures and continue with normal gate flow.
  }

  function setMessage(text, type) {
    message.textContent = text;
    message.classList.remove("error", "success");
    if (type) message.classList.add(type);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = input.value.trim();

    if (value === PASSWORD) {
      try {
        window.sessionStorage.setItem(AUTH_KEY, AUTH_VALUE);
      } catch (e) {
        // Continue even if storage fails; direct redirect still works for this navigation.
      }
      setMessage("Access granted. Opening surprise...", "success");
      input.disabled = true;
      setTimeout(function () {
        window.location.href = "surprise.html";
      }, 350);
      return;
    }

    setMessage("Incorrect password.", "error");
    input.select();
  });

  window.addEventListener("pageshow", function () {
    input.focus();
  });
})();
