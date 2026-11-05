// Service worker Dompetku — naikkan VERSION setiap kali index.html diperbarui
const VERSION='v1';
const CACHE='dompetku-'+VERSION;
const CORE=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png','./icons/favicon-32.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dompetku-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  // Halaman: coba jaringan dulu (dapat versi terbaru), jatuh ke cache saat offline
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return res})
      .catch(()=>caches.match('./index.html')));
    return;
  }
  // Aset sendiri & Google Fonts: cache dulu, perbarui di latar belakang
  const okHost=url.origin===location.origin||url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com';
  if(!okHost)return;
  e.respondWith(caches.match(req).then(hit=>{
    const net=fetch(req).then(res=>{
      if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp))}
      return res;
    }).catch(()=>hit);
    return hit||net;
  }));
});
