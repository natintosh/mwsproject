var cacheName = 'cc-v1';
var currenciesUrl = 'https://free.currencyconverterapi.com/api/v5/currencies'

var cacheFiles = [
    './',
    './index.html',
    './js/app.js',
    './js/bootstrap.js',
    './js/bootstrap.js.map',
    './js/jquery.js',
    './js/index.js',
    './css/bootstrap.css',
    './css/bootstrap.css.map',
    './css/index.css',
    currenciesUrl
]

self.addEventListener('install', function (e) { 
    console.log('ServiceWorker, installed');
    e.waitUntil(
        caches.open(cacheName).then(function (cache) { 
            console.log('ServiceWorker, caching cachefiles')
            return cache.addAll(cacheFiles);
         })
    );
 });

 self.addEventListener('activate', function (e) {
    console.log('ServiceWorker, activated');

    e.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(cacheNames.map((name) => {
                if (name !== cacheName) {
                    console.log('ServiceWorker, Removing Cached Files from Cache - ', name)
                    return caches.delete(name);
                }
            }))
        })
    )
 })


self.addEventListener('fetch', function(e) {
    console.log('ServiceWorker, Fetch', e.request.url);
    var requestUrl = new URL(e.request.url);
    if (requestUrl.origin === location.origin) {
        e.respondWith(
            caches.match(e.request).then(function(response) {
                if ( response ) {
                    console.log("ServiceWorker, Found in Cache", e.request.url, response);
                    return response;
                }
                
                var requestClone = e.request.clone();
                
                return fetch(requestClone).then(function(response) {
                    if ( !response ) {
                        console.log("ServiceWorker, No response from fetch ")
                        return response;
                    }
                    
                    var responseClone = response.clone();
                    caches.open(cacheName).then(function(cache) {
                        cache.put(e.request, responseClone);
                        console.log('ServiceWorker, New Data Cached', e.request.url);
                        return response;
                    });
                }).catch(function(err) {
                    console.log('ServiceWorker, Error Fetching & Caching New Data', err);
                });
            })
        )
    }
});
