// Giúp ứng dụng mở được khi không có mạng: lưu sẵn phần chính, tranh nào đã mở thì lưu lại để lần sau dùng offline.
const CORE = 'to-mau-core-v2', ART = 'to-mau-tranh-v1';
const FILES = ['./', 'index.html', 'chu-de.js', 'ten-tranh.js', 'con-vat.js', 'nhac.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CORE && k !== ART).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Tranh và ảnh nhỏ: lấy từ bộ nhớ trước, chưa có thì tải rồi lưu lại.
  if (/\/(tranh|anh-nho)\//.test(url.pathname)) {
    e.respondWith(caches.open(ART).then(async c => (await c.match(req)) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
    return;
  }
  // Phần chính: ưu tiên bản mới trên mạng, mất mạng thì dùng bản đã lưu.
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { if (r.ok) caches.open(CORE).then(c => c.put(req, r.clone())); return r; }).catch(() => caches.match(req)));
  }
});
