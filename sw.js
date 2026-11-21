var CACHE_NAME = "wkugg-portal-v1";
var APP_SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e) {
  var req = e.request;
  var url = req.url || "";

  // የApps Script API እና POST ጥያቄዎችን ቀጥታ ወደ ኢንተርኔት ልቀቅ
  if (req.method !== "GET" || url.indexOf("script.google.com") >= 0) return;

  // ገጹ ሲከፈት፦ ኢንተርኔት ካለ አዲሱን አምጣ፤ ዳታ ከሌለ ከOffline Cache ክፈት
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function(res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put("./index.html", copy); });
        return res;
      }).catch(function() {
        return caches.match("./index.html");
      })
    );
    return;
  }

  // QR Code እና ሎጎን ለOffline አስቀምጥ
  if (url.indexOf("quickchart.io") >= 0 || url.indexOf(self.location.origin) === 0) {
    e.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(res) {
          if (res && (res.ok || res.type === "opaque")) {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function(c) { c.put(req, copy); });
          }
          return res;
        });
      })
    );
  }
});
