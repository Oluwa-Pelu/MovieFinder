self.addEventListener("install", (event) => {
  console.log("📦 Service Worker installing...");
  event.waitUntil(
    caches.open("movie-app-cache").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/src/main.jsx",
        "/src/App.jsx",
        "/src/index.css",
        "/hero.png",
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
