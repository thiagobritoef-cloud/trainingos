var V = 'tos-v6';
self.addEventListener('install', function(e) {
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        if (k !== V) return caches.delete(k);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  if (url.indexOf('supabase') >= 0 || url.indexOf('cdn.jsdelivr') >= 0) return;
  e.respondWith(
    fetch(e.request).then(function(res) {
      return caches.open(V).then(function(c) {
        c.put(e.request, res.clone());
        return res;
      });
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
