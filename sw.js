var V = 'tos-v12';
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
  var req = e.request;
  var url = req.url;
  if (req.method !== 'GET' || url.indexOf('supabase.co') >= 0 || url.indexOf('stripe.com') >= 0) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(function(res) {
      if (res && (res.ok || res.type === 'opaque')) {
        var cp = res.clone();
        caches.open(V).then(function(c) { c.put(req, cp); });
      }
      return res;
    }).catch(function() {
      return caches.match(req).then(function(m) {
        if (m) return m;
        return caches.match(req, { ignoreSearch: true }).then(function(m2) {
          if (m2) return m2;
          if (req.mode === 'navigate') return caches.match('/index.html').then(function(m3) { return m3 || caches.match('/'); });
          return Response.error();
        });
      });
    })
  );
});
self.addEventListener('push', function(e) {
var data = {};
try { data = e.data ? e.data.json() : {}; } catch (err) {}
var title = data.title || 'TO BE FITNESS';
var body = data.body || '';
var url = data.url || './';
if (url.charAt(0) === '/' && url.charAt(1) !== '/') url = './';
e.waitUntil(
Promise.all([
self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
list.forEach(function(c) {
c.postMessage({ type: 'push-toast', title: title, body: body, url: url });
});
}),
self.registration.showNotification(title, {
body: body,
icon: './icon-192.png',
badge: './icon-192.png',
data: { url: url }
})
])
);
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  if (url.charAt(0) === '/' && url.charAt(1) !== '/') url = './';
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
