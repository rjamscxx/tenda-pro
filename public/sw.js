const CACHE = 'tenda-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  // Only intercept navigation requests to provide offline fallback
  if (event.request.mode !== 'navigate') return

  event.respondWith(
    fetch(event.request).catch(() =>
      new Response(
        `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — Tenda Pro</title>
        <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#0E1714;color:#ECE6D5;display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:1.5rem}
        .wrap{text-align:center;max-width:320px}.icon{width:52px;height:52px;border-radius:14px;background:#18231F;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem}
        h1{font-size:1.25rem;font-weight:600;margin-bottom:.5rem}p{font-size:.875rem;color:#929B93;line-height:1.6}
        .btn{display:inline-block;margin-top:1.5rem;padding:.6rem 1.25rem;background:#58C098;color:#0E1714;border-radius:.625rem;font-size:.875rem;font-weight:600;cursor:pointer;border:none}
        </style></head><body><div class="wrap">
        <div class="icon"><svg width="26" height="26" viewBox="0 0 14 14" fill="none"><path d="M3 11C3 8 5 6 7 6C9 6 11 8 11 11" stroke="#58C098" stroke-width="1.7" stroke-linecap="round"/><path d="M7 6V2M5 4l2-2 2 2" stroke="#58C098" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <h1>You're offline</h1><p>Check your connection and try again.</p>
        <button class="btn" onclick="location.reload()">Retry</button>
        </div></body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    )
  )
})
