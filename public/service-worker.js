const FILES_TO_CACHE = [
    "./index.html",
    "./css/styles.css",
    "./js/index.js",
    "./js/idb.js",
    "./manifest.json",
    "./icons/icon-72x72.png",
    "./icons/icon-96x96.png",
    "./icons/icon-128x128.png",
    "./icons/icon-144x144.png",
    "./icons/icon-152x152.png",
    "./icons/icon-192x192.png",
    "./icons/icon-384x384.png",
    "./icons/icon-512x512.png"
];

const CACHE_NAME = "pwa-budget-cache-v2";
const DATA_CACHE_NAME = "data-budget-cache-v2";

self.addEventListener('install', function(e){
    e.waitUntil (
        caches.open(CACHE_NAME).then(cache => {
            console.log("Pre-cache successful!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log('Removing old cache data', key);
                        return caches.delete(key);
                    }
                })
            )
        })
    )
    self.clients.claim();
});

self.addEventListener('fetch', function(e){
    console.log("fetching at :" + e.request.url);
    e.respondWith(
        fetch(e.request).catch(function () {
            return caches.match(e.request).then(function (response) {
                if (response) {
                    return response
                } else if (e.request.headers.get("accept").includes("text/html")){
                    return caches.match("/")
                }
            })
        })
    )
})