var V = 'tos-v8';
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
self.addEventListener('push', function(e) {
var data = {};
try { data = e.data ? e.data.json() : {}; } catch (err) {}
var title = data.title || 'TO BE FITNESS';
var body = data.body || '';
var url = data.url || './';
e.waitUntil(
self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
var visibleClient = null;
for (var i = 0; i < list.length; i++) {
if (list[i].visibilityState === 'visible') { visibleClient = list[i]; break; }
}
if (visibleClient) {
visibleClient.postMessage({ type: 'push-toast', title: title, body: body, url: url });
return;
}
return self.registration.showNotification(title, {
body: body,
icon: './icon-192.png',
badge: './icon-192.png',
data: { url: url }
});
})
);
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if ('focus' in c) { c.navigate(url); return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
