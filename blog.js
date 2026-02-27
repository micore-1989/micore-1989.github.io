(function () {
  var PASSWORD = "mishaswebsite";
  var BLOG_KEY = "misha_blog_data_v1";
  var AUTH_KEY = "misha_blog_editor_auth_v1";

  var unlockEditorBtn = document.getElementById("unlock-editor");
  var lockEditorBtn = document.getElementById("lock-editor");
  var passwordForm = document.getElementById("password-form");
  var passwordInput = document.getElementById("edit-password");
  var authMessage = document.getElementById("auth-message");

  var bigUpdatesList = document.getElementById("big-updates-list");
  var entriesList = document.getElementById("entries-list");
  var editorPanel = document.getElementById("editor-panel");

  var bigForm = document.getElementById("big-update-form");
  var bigEditId = document.getElementById("big-edit-id");
  var bigHeadline = document.getElementById("big-headline");
  var bigDetail = document.getElementById("big-detail");
  var bigCancelEdit = document.getElementById("big-cancel-edit");

  var entryForm = document.getElementById("entry-form");
  var entryEditId = document.getElementById("entry-edit-id");
  var entryTitle = document.getElementById("entry-title");
  var entryBody = document.getElementById("entry-body");
  var entrySpotify = document.getElementById("entry-spotify");
  var entryCancelEdit = document.getElementById("entry-cancel-edit");

  if (!bigUpdatesList || !entriesList || !editorPanel) return;

  var state = loadState();
  var isEditor = readAuth();

  function loadState() {
    var fallback = {
      bigUpdates: [
        {
          id: makeId(),
          headline: "Welcome to the update page.",
          detail: "This page is now live. More updates soon.",
          createdAt: new Date().toISOString(),
        },
      ],
      entries: [
        {
          id: makeId(),
          title: "First post",
          body: "This is where I'll post updates for anyone checking in.",
          spotify: "",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    try {
      var raw = window.localStorage.getItem(BLOG_KEY);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return fallback;
      if (!Array.isArray(parsed.bigUpdates) || !Array.isArray(parsed.entries)) return fallback;
      return parsed;
    } catch (e) {
      return fallback;
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(BLOG_KEY, JSON.stringify(state));
    } catch (e) {
      setAuthMessage("Could not save. Local storage is unavailable.", "error");
    }
  }

  function readAuth() {
    try {
      return window.sessionStorage.getItem(AUTH_KEY) === "ok";
    } catch (e) {
      return false;
    }
  }

  function writeAuth(value) {
    try {
      if (value) window.sessionStorage.setItem(AUTH_KEY, "ok");
      else window.sessionStorage.removeItem(AUTH_KEY);
    } catch (e) {
      // Ignore storage failures and keep in-memory auth.
    }
  }

  function setAuthMessage(text, type) {
    if (!authMessage) return;
    authMessage.textContent = text || "";
    authMessage.classList.remove("success");
    if (type === "success") authMessage.classList.add("success");
  }

  function makeId() {
    return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "Unknown date";
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeUrl(url) {
    var value = String(url || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    return "https://" + value;
  }

  function resetBigForm() {
    if (!bigForm) return;
    bigEditId.value = "";
    bigHeadline.value = "";
    bigDetail.value = "";
  }

  function resetEntryForm() {
    if (!entryForm) return;
    entryEditId.value = "";
    entryTitle.value = "";
    entryBody.value = "";
    entrySpotify.value = "";
  }

  function render() {
    renderBigUpdates();
    renderEntries();
    renderEditorState();
  }

  function renderEditorState() {
    if (unlockEditorBtn) unlockEditorBtn.hidden = isEditor;
    if (passwordForm) passwordForm.hidden = isEditor;
    editorPanel.hidden = !isEditor;
  }

  function renderBigUpdates() {
    if (!state.bigUpdates.length) {
      bigUpdatesList.innerHTML =
        '<div class="empty-state">No big updates posted yet.</div>';
      return;
    }

    var html = state.bigUpdates
      .map(function (item) {
        return (
          '<article class="big-update-card" data-id="' +
          item.id +
          '">' +
          "<h3>" +
          escapeHtml(item.headline) +
          "</h3>" +
          '<div class="meta-row">' +
          formatDate(item.createdAt) +
          "</div>" +
          (item.detail
            ? '<p class="big-detail">' + escapeHtml(item.detail) + "</p>"
            : "") +
          (isEditor
            ? '<div class="admin-item-actions">' +
              '<button class="small-btn" data-action="edit-big" data-id="' +
              item.id +
              '">Edit</button>' +
              '<button class="small-btn small-btn-danger" data-action="delete-big" data-id="' +
              item.id +
              '">Delete</button>' +
              "</div>"
            : "") +
          "</article>"
        );
      })
      .join("");

    bigUpdatesList.innerHTML = html;
  }

  function renderEntries() {
    if (!state.entries.length) {
      entriesList.innerHTML =
        '<div class="empty-state">No entries posted yet.</div>';
      return;
    }

    var html = state.entries
      .map(function (item) {
        var spotifyUrl = normalizeUrl(item.spotify);
        var spotifyHtml = spotifyUrl
          ? '<a class="spotify-link" href="' +
            escapeHtml(spotifyUrl) +
            '" target="_blank" rel="noopener noreferrer">Open Spotify Link</a>'
          : "";

        return (
          '<article class="entry-card" data-id="' +
          item.id +
          '">' +
          "<h3>" +
          escapeHtml(item.title) +
          "</h3>" +
          '<div class="meta-row">' +
          formatDate(item.createdAt) +
          "</div>" +
          '<p class="entry-body">' +
          escapeHtml(item.body) +
          "</p>" +
          spotifyHtml +
          (isEditor
            ? '<div class="admin-item-actions">' +
              '<button class="small-btn" data-action="edit-entry" data-id="' +
              item.id +
              '">Edit</button>' +
              '<button class="small-btn small-btn-danger" data-action="delete-entry" data-id="' +
              item.id +
              '">Delete</button>' +
              "</div>"
            : "") +
          "</article>"
        );
      })
      .join("");

    entriesList.innerHTML = html;
  }

  function handleBigListAction(event) {
    var btn = event.target.closest("button[data-action]");
    if (!btn || !isEditor) return;
    var action = btn.getAttribute("data-action");
    var id = btn.getAttribute("data-id");
    var idx = state.bigUpdates.findIndex(function (it) {
      return it.id === id;
    });
    if (idx < 0) return;

    if (action === "delete-big") {
      state.bigUpdates.splice(idx, 1);
      saveState();
      render();
      return;
    }

    if (action === "edit-big") {
      var item = state.bigUpdates[idx];
      bigEditId.value = item.id;
      bigHeadline.value = item.headline || "";
      bigDetail.value = item.detail || "";
      bigHeadline.focus();
    }
  }

  function handleEntriesAction(event) {
    var btn = event.target.closest("button[data-action]");
    if (!btn || !isEditor) return;
    var action = btn.getAttribute("data-action");
    var id = btn.getAttribute("data-id");
    var idx = state.entries.findIndex(function (it) {
      return it.id === id;
    });
    if (idx < 0) return;

    if (action === "delete-entry") {
      state.entries.splice(idx, 1);
      saveState();
      render();
      return;
    }

    if (action === "edit-entry") {
      var item = state.entries[idx];
      entryEditId.value = item.id;
      entryTitle.value = item.title || "";
      entryBody.value = item.body || "";
      entrySpotify.value = item.spotify || "";
      entryTitle.focus();
    }
  }

  if (unlockEditorBtn) {
    unlockEditorBtn.addEventListener("click", function () {
      if (passwordForm) {
        passwordForm.hidden = false;
        passwordInput.focus();
      }
      setAuthMessage("Enter password to enable editing.");
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = (passwordInput.value || "").trim();
      if (value !== PASSWORD) {
        setAuthMessage("Incorrect password.");
        passwordInput.select();
        return;
      }
      isEditor = true;
      writeAuth(true);
      passwordInput.value = "";
      setAuthMessage("Editor unlocked.", "success");
      render();
    });
  }

  if (lockEditorBtn) {
    lockEditorBtn.addEventListener("click", function () {
      isEditor = false;
      writeAuth(false);
      resetBigForm();
      resetEntryForm();
      setAuthMessage("Editor locked.");
      render();
    });
  }

  if (bigCancelEdit) {
    bigCancelEdit.addEventListener("click", resetBigForm);
  }

  if (entryCancelEdit) {
    entryCancelEdit.addEventListener("click", resetEntryForm);
  }

  if (bigForm) {
    bigForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!isEditor) return;

      var headline = (bigHeadline.value || "").trim();
      var detail = (bigDetail.value || "").trim();
      var editId = (bigEditId.value || "").trim();
      if (!headline) return;

      if (editId) {
        var existing = state.bigUpdates.find(function (it) {
          return it.id === editId;
        });
        if (existing) {
          existing.headline = headline;
          existing.detail = detail;
          existing.createdAt = new Date().toISOString();
        }
      } else {
        state.bigUpdates.unshift({
          id: makeId(),
          headline: headline,
          detail: detail,
          createdAt: new Date().toISOString(),
        });
      }

      saveState();
      resetBigForm();
      render();
    });
  }

  if (entryForm) {
    entryForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!isEditor) return;

      var title = (entryTitle.value || "").trim();
      var body = (entryBody.value || "").trim();
      var spotify = (entrySpotify.value || "").trim();
      var editId = (entryEditId.value || "").trim();
      if (!title || !body) return;

      if (editId) {
        var existing = state.entries.find(function (it) {
          return it.id === editId;
        });
        if (existing) {
          existing.title = title;
          existing.body = body;
          existing.spotify = spotify;
          existing.createdAt = new Date().toISOString();
        }
      } else {
        state.entries.unshift({
          id: makeId(),
          title: title,
          body: body,
          spotify: spotify,
          createdAt: new Date().toISOString(),
        });
      }

      saveState();
      resetEntryForm();
      render();
    });
  }

  bigUpdatesList.addEventListener("click", handleBigListAction);
  entriesList.addEventListener("click", handleEntriesAction);

  render();
})();
