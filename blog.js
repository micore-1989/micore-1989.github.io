(function () {
  var PASSWORD = "mishaswebsite";
  var AUTH_KEY = "misha_blog_editor_auth_v1";
  var DATA_PATH = "blog-data.json";
  var REPO_OWNER = "micore-1989";
  var REPO_NAME = "micore-1989.github.io";
  var REPO_BRANCH = "main";

  var lockEditorBtn = document.getElementById("lock-editor");
  var passwordForm = document.getElementById("password-form");
  var passwordInput = document.getElementById("edit-password");
  var authMessage = document.getElementById("auth-message");
  var tokenInput = document.getElementById("github-token");

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
  var entryMedia = document.getElementById("entry-media");
  var entryCancelEdit = document.getElementById("entry-cancel-edit");

  if (!bigUpdatesList || !entriesList || !editorPanel) return;

  var state = defaultState();
  var isEditor = readAuth();

  init();

  async function init() {
    state = await loadState();
    render();

    if (isEditor) {
      setAuthMessage(
        "Editor unlocked. Enter a GitHub token to publish changes for all visitors."
      );
    }
  }

  function defaultState() {
    return {
      bigUpdates: [
        {
          id: "welcome-update",
          headline: "Welcome to the update page.",
          detail: "This page is now live. More updates soon.",
          createdAt: "2026-02-28T00:00:00.000Z",
        },
      ],
      entries: [
        {
          id: "first-post",
          title: "First post",
          body: "This is where I'll post updates for anyone checking in.",
          spotify: "",
          media: "",
          createdAt: "2026-02-28T00:00:00.000Z",
        },
      ],
    };
  }

  async function loadState() {
    var fallback = defaultState();

    if (!window.fetch) return fallback;

    try {
      var response = await window.fetch(DATA_PATH + "?v=" + Date.now(), {
        cache: "no-store",
      });

      if (!response.ok) return fallback;

      var parsed = await response.json();
      return sanitizeState(parsed, fallback);
    } catch (error) {
      return fallback;
    }
  }

  function sanitizeState(parsed, fallback) {
    if (!parsed || typeof parsed !== "object") return fallback;
    if (!Array.isArray(parsed.bigUpdates) || !Array.isArray(parsed.entries)) {
      return fallback;
    }

    return {
      bigUpdates: parsed.bigUpdates.map(function (item) {
        return {
          id: String(item.id || makeId()),
          headline: String(item.headline || ""),
          detail: String(item.detail || ""),
          createdAt: String(item.createdAt || new Date().toISOString()),
        };
      }),
      entries: parsed.entries.map(function (item) {
        return {
          id: String(item.id || makeId()),
          title: String(item.title || ""),
          body: String(item.body || ""),
          spotify: String(item.spotify || ""),
          media: String(item.media || ""),
          createdAt: String(item.createdAt || new Date().toISOString()),
        };
      }),
    };
  }

  function readAuth() {
    try {
      return window.sessionStorage.getItem(AUTH_KEY) === "ok";
    } catch (error) {
      return false;
    }
  }

  function writeAuth(value) {
    try {
      if (value) {
        window.sessionStorage.setItem(AUTH_KEY, "ok");
      } else {
        window.sessionStorage.removeItem(AUTH_KEY);
      }
    } catch (error) {
      // Ignore storage failure.
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

  function encodeBase64Utf8(value) {
    return window.btoa(unescape(encodeURIComponent(value)));
  }

  function cloneState(value) {
    return JSON.parse(JSON.stringify(value));
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
    if (entryMedia) entryMedia.value = "";
  }

  function getMediaType(url) {
    var value = String(url || "").trim().toLowerCase();
    if (!value) return "";
    if (/\.(jpg|jpeg|png|gif|webp|avif)(\?|#|$)/.test(value)) return "image";
    if (/\.(mp4|webm|ogg|mov)(\?|#|$)/.test(value)) return "video";
    return "link";
  }

  function renderMedia(url) {
    var mediaUrl = normalizeUrl(url);
    if (!mediaUrl) return "";

    var safeUrl = escapeHtml(mediaUrl);
    var type = getMediaType(mediaUrl);

    if (type === "image") {
      return (
        '<img class="entry-media" src="' +
        safeUrl +
        '" alt="Blog entry image" loading="lazy" />'
      );
    }

    if (type === "video") {
      return (
        '<video class="entry-media" controls preload="metadata">' +
        '<source src="' +
        safeUrl +
        '" />' +
        "Your browser does not support the video tag." +
        "</video>"
      );
    }

    return (
      '<a class="entry-media-link" href="' +
      safeUrl +
      '" target="_blank" rel="noopener noreferrer">Open media</a>'
    );
  }

  function render() {
    renderBigUpdates();
    renderEntries();
    renderEditorState();
  }

  function renderEditorState() {
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

        var mediaHtml = renderMedia(item.media);

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
          mediaHtml +
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

  function getApiUrl() {
    return (
      "https://api.github.com/repos/" +
      REPO_OWNER +
      "/" +
      REPO_NAME +
      "/contents/" +
      DATA_PATH
    );
  }

  function getHeaders(token) {
    return {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    };
  }

  async function getCurrentRemoteSha(token) {
    var response = await window.fetch(getApiUrl() + "?ref=" + REPO_BRANCH, {
      method: "GET",
      headers: getHeaders(token),
    });

    if (response.status === 404) return "";

    if (!response.ok) {
      throw new Error("Could not read the current published blog data.");
    }

    var payload = await response.json();
    return payload && payload.sha ? payload.sha : "";
  }

  async function publishState(nextState, message) {
    if (!isEditor) {
      setAuthMessage("Enter the editor password first.");
      return false;
    }

    if (!window.fetch) {
      setAuthMessage("This browser does not support publishing.");
      return false;
    }

    var token = tokenInput ? String(tokenInput.value || "").trim() : "";

    if (!token) {
      setAuthMessage("Enter a GitHub token to save changes for all visitors.");
      return false;
    }

    setAuthMessage("Publishing changes...");

    try {
      var sha = await getCurrentRemoteSha(token);
      var content = JSON.stringify(nextState, null, 2) + "\n";
      var body = {
        message: message,
        content: encodeBase64Utf8(content),
        branch: REPO_BRANCH,
      };

      if (sha) body.sha = sha;

      var response = await window.fetch(getApiUrl(), {
        method: "PUT",
        headers: getHeaders(token),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("GitHub rejected the publish request.");
      }

      state = cloneState(nextState);
      render();
      setAuthMessage(
        "Published successfully. GitHub Pages may take about a minute to update.",
        "success"
      );
      return true;
    } catch (error) {
      setAuthMessage(error.message || "Publishing failed.");
      return false;
    }
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
      var nextState = cloneState(state);
      nextState.bigUpdates.splice(idx, 1);
      publishState(nextState, "Delete big update");
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
      var nextState = cloneState(state);
      nextState.entries.splice(idx, 1);
      publishState(nextState, "Delete blog entry");
      return;
    }

    if (action === "edit-entry") {
      var item = state.entries[idx];
      entryEditId.value = item.id;
      entryTitle.value = item.title || "";
      entryBody.value = item.body || "";
      entrySpotify.value = item.spotify || "";
      if (entryMedia) entryMedia.value = item.media || "";
      entryTitle.focus();
    }
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
      render();
      setAuthMessage(
        "Editor unlocked. Enter a GitHub token to publish changes for all visitors.",
        "success"
      );
    });
  }

  if (lockEditorBtn) {
    lockEditorBtn.addEventListener("click", function () {
      isEditor = false;
      writeAuth(false);
      resetBigForm();
      resetEntryForm();
      if (tokenInput) tokenInput.value = "";
      render();
      setAuthMessage("Editor locked.");
    });
  }

  if (bigCancelEdit) {
    bigCancelEdit.addEventListener("click", resetBigForm);
  }

  if (entryCancelEdit) {
    entryCancelEdit.addEventListener("click", resetEntryForm);
  }

  if (bigForm) {
    bigForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!isEditor) return;

      var headline = (bigHeadline.value || "").trim();
      var detail = (bigDetail.value || "").trim();
      var editId = (bigEditId.value || "").trim();

      if (!headline) return;

      var nextState = cloneState(state);

      if (editId) {
        var existing = nextState.bigUpdates.find(function (it) {
          return it.id === editId;
        });

        if (existing) {
          existing.headline = headline;
          existing.detail = detail;
          existing.createdAt = new Date().toISOString();
        }
      } else {
        nextState.bigUpdates.unshift({
          id: makeId(),
          headline: headline,
          detail: detail,
          createdAt: new Date().toISOString(),
        });
      }

      if (await publishState(nextState, "Update blog big updates")) {
        resetBigForm();
      }
    });
  }

  if (entryForm) {
    entryForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!isEditor) return;

      var title = (entryTitle.value || "").trim();
      var body = (entryBody.value || "").trim();
      var spotify = (entrySpotify.value || "").trim();
      var media = (entryMedia && entryMedia.value ? entryMedia.value : "").trim();
      var editId = (entryEditId.value || "").trim();

      if (!title || !body) return;

      var nextState = cloneState(state);

      if (editId) {
        var existing = nextState.entries.find(function (it) {
          return it.id === editId;
        });

        if (existing) {
          existing.title = title;
          existing.body = body;
          existing.spotify = spotify;
          existing.media = media;
          existing.createdAt = new Date().toISOString();
        }
      } else {
        nextState.entries.unshift({
          id: makeId(),
          title: title,
          body: body,
          spotify: spotify,
          media: media,
          createdAt: new Date().toISOString(),
        });
      }

      if (await publishState(nextState, "Update blog entries")) {
        resetEntryForm();
      }
    });
  }

  bigUpdatesList.addEventListener("click", handleBigListAction);
  entriesList.addEventListener("click", handleEntriesAction);
})();
