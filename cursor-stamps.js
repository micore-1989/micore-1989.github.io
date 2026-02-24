(function () {
  var SOURCE_IMAGE = "poop.png";
  var MAX_STAMPS_PER_PAGE = 180;
  var STORAGE_KEY = "poop_stamps::" + window.location.pathname;
  var cursorDataUrl = "";
  var stampDataUrl = "";
  var cutoutReady = false;
  var pendingStampQueue = [];
  var stampRecords = loadStampRecords();

  injectStyles();
  initClickStamping();
  prepareCutout();

  function injectStyles() {
    if (document.getElementById("poop-cursor-styles")) return;

    var style = document.createElement("style");
    style.id = "poop-cursor-styles";
    style.textContent =
      "html.poop-cursor-ready, html.poop-cursor-ready * { cursor: var(--poop-cursor) !important; }" +
      ".poop-stamp { position: absolute; pointer-events: none; z-index: 44; opacity: 0.22; " +
      "transform: translate(-50%, -50%); user-select: none; -webkit-user-drag: none; " +
      "filter: drop-shadow(0 1px 2px rgba(0,0,0,0.08)); }";
    document.head.appendChild(style);
  }

  function initClickStamping() {
    document.addEventListener(
      "click",
      function (event) {
        if (!event.isTrusted) return;
        if (typeof event.button === "number" && event.button !== 0) return;

        var x = Math.round(event.pageX || event.clientX + window.scrollX);
        var y = Math.round(event.pageY || event.clientY + window.scrollY);
        var record = {
          x: x,
          y: y,
          s: round2(0.88 + Math.random() * 0.34),
          r: Math.round(-12 + Math.random() * 24)
        };

        stampRecords.push(record);
        if (stampRecords.length > MAX_STAMPS_PER_PAGE) {
          stampRecords = stampRecords.slice(stampRecords.length - MAX_STAMPS_PER_PAGE);
        }
        saveStampRecords(stampRecords);

        if (cutoutReady) {
          renderStamp(record);
        } else {
          pendingStampQueue.push(record);
        }
      },
      true
    );
  }

  function prepareCutout() {
    var img = new Image();
    img.decoding = "async";
    img.onload = function () {
      try {
        cursorDataUrl = buildRawCursorAsset(img).toDataURL("image/png");
        applyCursor();
      } catch (err) {
        console.error("poop cursor image prep failed:", err);
      }

      try {
        var result = buildCutoutAssets(img);
        stampDataUrl = result.stampUrl;
        cutoutReady = true;
        restoreStamps();
        flushPendingStamps();
      } catch (err) {
        console.error("poop stamp cutout failed, using full image fallback:", err);
        try {
          stampDataUrl = buildRawStampAsset(img).toDataURL("image/png");
          cutoutReady = true;
          restoreStamps();
          flushPendingStamps();
        } catch (fallbackErr) {
          console.error("poop stamp fallback failed:", fallbackErr);
        }
      }
    };
    img.onerror = function () {
      console.error("poop cursor image failed to load");
    };
    img.src = SOURCE_IMAGE;
  }

  function applyCursor() {
    if (!cursorDataUrl) return;
    var root = document.documentElement;
    root.style.setProperty("--poop-cursor", "url(\"" + cursorDataUrl + "\") 8 8, auto");
    root.classList.add("poop-cursor-ready");
  }

  function restoreStamps() {
    if (!stampDataUrl || !stampRecords.length) return;
    for (var i = 0; i < stampRecords.length; i += 1) {
      renderStamp(stampRecords[i]);
    }
  }

  function flushPendingStamps() {
    if (!pendingStampQueue.length || !cutoutReady) return;
    for (var i = 0; i < pendingStampQueue.length; i += 1) {
      renderStamp(pendingStampQueue[i]);
    }
    pendingStampQueue = [];
  }

  function renderStamp(record) {
    if (!stampDataUrl || !record) return;
    var stamp = new Image();
    stamp.className = "poop-stamp";
    stamp.src = stampDataUrl;
    stamp.alt = "";
    stamp.loading = "eager";
    stamp.decoding = "async";
    stamp.setAttribute("aria-hidden", "true");

    var base = getBaseStampSize();
    stamp.style.left = Math.round(record.x) + "px";
    stamp.style.top = Math.round(record.y) + "px";
    stamp.style.width = Math.round(base * (record.s || 1)) + "px";
    stamp.style.transform =
      "translate(-50%, -50%) rotate(" + Math.round(record.r || 0) + "deg)";

    document.body.appendChild(stamp);
  }

  function getBaseStampSize() {
    var vw = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
    if (vw <= 420) return 52;
    if (vw <= 768) return 62;
    return 78;
  }

  function buildCutoutAssets(img) {
    var sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = img.naturalWidth || img.width;
    sourceCanvas.height = img.naturalHeight || img.height;
    var ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);

    var imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    removeEdgeConnectedBackground(imageData);
    ctx.putImageData(imageData, 0, 0);

    var crop = cropToOpaque(sourceCanvas, 8);
    var stampCanvas = scaleToWidth(crop, 120);
    var cursorCanvas = scaleToHeight(crop, 48);

    return {
      stampUrl: stampCanvas.toDataURL("image/png"),
      cursorUrl: cursorCanvas.toDataURL("image/png")
    };
  }

  function buildRawCursorAsset(img) {
    var targetHeight = 44;
    var ratio = targetHeight / (img.naturalHeight || img.height);
    var out = document.createElement("canvas");
    out.height = Math.max(1, Math.round(targetHeight));
    out.width = Math.max(1, Math.round((img.naturalWidth || img.width) * ratio));

    // Browser cursor support is limited for large images.
    if (out.width > 64) {
      var shrink = 64 / out.width;
      out.width = 64;
      out.height = Math.max(1, Math.round(out.height * shrink));
    }

    out.getContext("2d").drawImage(img, 0, 0, out.width, out.height);
    return out;
  }

  function buildRawStampAsset(img) {
    var targetWidth = 120;
    var ratio = targetWidth / (img.naturalWidth || img.width);
    var out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(targetWidth));
    out.height = Math.max(1, Math.round((img.naturalHeight || img.height) * ratio));
    out.getContext("2d").drawImage(img, 0, 0, out.width, out.height);
    return out;
  }

  function removeEdgeConnectedBackground(imageData) {
    var w = imageData.width;
    var h = imageData.height;
    var data = imageData.data;
    var total = w * h;
    var visited = new Uint8Array(total);
    var queue = new Int32Array(total);
    var head = 0;
    var tail = 0;
    var palette = buildBackgroundPalette(data, w, h);

    function lum(r, g, b) {
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function sat(r, g, b) {
      var max = Math.max(r, g, b);
      var min = Math.min(r, g, b);
      return max - min;
    }

    function minPaletteDist(r, g, b) {
      var min = Infinity;
      for (var i = 0; i < palette.length; i += 1) {
        var p = palette[i];
        var dr = r - p[0];
        var dg = g - p[1];
        var db = b - p[2];
        var d = Math.sqrt(dr * dr + dg * dg + db * db);
        if (d < min) min = d;
      }
      return min;
    }

    function isBackgroundIndex(idx, seedMode) {
      var di = idx * 4;
      var a = data[di + 3];
      if (a < 12) return true;
      var r = data[di];
      var g = data[di + 1];
      var b = data[di + 2];
      var d = minPaletteDist(r, g, b);
      var l = lum(r, g, b);
      var s = sat(r, g, b);

      if (seedMode) {
        return d < 72 || (d < 92 && l > 118 && s < 72);
      }

      return d < 52 || (d < 86 && l > 130 && s < 60);
    }

    function seed(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      var idx = y * w + x;
      if (visited[idx]) return;
      visited[idx] = 1;
      if (!isBackgroundIndex(idx, true)) return;
      queue[tail++] = idx;
    }

    for (var x = 0; x < w; x += 1) {
      seed(x, 0);
      seed(x, h - 1);
    }
    for (var y = 0; y < h; y += 1) {
      seed(0, y);
      seed(w - 1, y);
    }

    while (head < tail) {
      var idx = queue[head++];
      if (!isBackgroundIndex(idx, false)) continue;

      var di = idx * 4;
      data[di + 3] = 0;

      var px = idx % w;
      var py = (idx - px) / w;

      enqueue(px - 1, py);
      enqueue(px + 1, py);
      enqueue(px, py - 1);
      enqueue(px, py + 1);
    }

    function enqueue(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      var idx = y * w + x;
      if (visited[idx]) return;
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  }

  function buildBackgroundPalette(data, w, h) {
    var points = [];
    var x;
    var y;

    function push(xPos, yPos) {
      points.push([clampInt(xPos, 0, w - 1), clampInt(yPos, 0, h - 1)]);
    }

    push(0, 0);
    push(w - 1, 0);
    push(0, h - 1);
    push(w - 1, h - 1);
    push(Math.floor(w * 0.5), 0);
    push(Math.floor(w * 0.25), 0);
    push(Math.floor(w * 0.75), 0);

    for (x = 0; x < w; x += Math.max(16, Math.floor(w / 12))) {
      push(x, Math.floor(h * 0.05));
      push(x, Math.floor(h * 0.14));
    }
    for (y = 0; y < Math.floor(h * 0.55); y += Math.max(18, Math.floor(h / 20))) {
      push(0, y);
      push(w - 1, y);
      push(Math.floor(w * 0.03), y);
      push(Math.floor(w * 0.97), y);
    }

    var palette = [];
    for (var i = 0; i < points.length; i += 1) {
      var p = sampleAverage(data, w, h, points[i][0], points[i][1], 2);
      if (p[3] < 10) continue;
      palette.push([p[0], p[1], p[2]]);
    }

    if (!palette.length) palette.push([240, 240, 240]);
    return palette;
  }

  function sampleAverage(data, w, h, cx, cy, radius) {
    var r = 0;
    var g = 0;
    var b = 0;
    var a = 0;
    var count = 0;

    for (var dy = -radius; dy <= radius; dy += 1) {
      for (var dx = -radius; dx <= radius; dx += 1) {
        var x = clampInt(cx + dx, 0, w - 1);
        var y = clampInt(cy + dy, 0, h - 1);
        var di = (y * w + x) * 4;
        r += data[di];
        g += data[di + 1];
        b += data[di + 2];
        a += data[di + 3];
        count += 1;
      }
    }

    return [
      Math.round(r / count),
      Math.round(g / count),
      Math.round(b / count),
      Math.round(a / count)
    ];
  }

  function cropToOpaque(canvas, pad) {
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    var w = canvas.width;
    var h = canvas.height;
    var data = ctx.getImageData(0, 0, w, h).data;
    var minX = w;
    var minY = h;
    var maxX = -1;
    var maxY = -1;

    for (var y = 0; y < h; y += 1) {
      for (var x = 0; x < w; x += 1) {
        var a = data[(y * w + x) * 4 + 3];
        if (a < 18) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < 0 || maxY < 0) {
      return canvas;
    }

    minX = clampInt(minX - pad, 0, w - 1);
    minY = clampInt(minY - pad, 0, h - 1);
    maxX = clampInt(maxX + pad, 0, w - 1);
    maxY = clampInt(maxY + pad, 0, h - 1);

    var cropW = Math.max(1, maxX - minX + 1);
    var cropH = Math.max(1, maxY - minY + 1);
    var out = document.createElement("canvas");
    out.width = cropW;
    out.height = cropH;
    out.getContext("2d").drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
    return out;
  }

  function scaleToWidth(canvas, targetWidth) {
    var ratio = targetWidth / canvas.width;
    var out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(targetWidth));
    out.height = Math.max(1, Math.round(canvas.height * ratio));
    out.getContext("2d").drawImage(canvas, 0, 0, out.width, out.height);
    return out;
  }

  function scaleToHeight(canvas, targetHeight) {
    var ratio = targetHeight / canvas.height;
    var out = document.createElement("canvas");
    out.height = Math.max(1, Math.round(targetHeight));
    out.width = Math.max(1, Math.round(canvas.width * ratio));

    if (out.width > 64) {
      var shrink = 64 / out.width;
      out.width = 64;
      out.height = Math.max(1, Math.round(out.height * shrink));
    }

    out.getContext("2d").drawImage(canvas, 0, 0, out.width, out.height);
    return out;
  }

  function loadStampRecords() {
    try {
      var raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (r) {
        return r && isFinite(r.x) && isFinite(r.y);
      });
    } catch (err) {
      return [];
    }
  }

  function saveStampRecords(records) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
      // Ignore quota/storage failures.
    }
  }

  function clampInt(value, min, max) {
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }
})();
