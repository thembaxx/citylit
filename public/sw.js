/* Public field-guide text and explicitly requested photos only; no third-party maps. */
const CACHE = 'citylit-field-guide-v3';
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/offline.html','/data/places.json','/data/cities.json','/app-icon.svg'])));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('citylit-field-guide-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||event.request.method!=='GET')return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));return;}
 if(url.pathname==='/offline.html'||url.pathname.startsWith('/data/')||url.pathname.startsWith('/images/'))event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
self.addEventListener('message',event=>{
 if(event.data?.type!=='SAVE_GUIDE')return;
 event.waitUntil((async()=>{let ok=true;const cache=await caches.open(CACHE);try{
 await cache.addAll(['/offline.html','/data/places.json','/data/cities.json']);
 const places=await (await cache.match('/data/places.json')).json();const ids=Array.isArray(event.data.ids)?event.data.ids.filter(id=>typeof id==='string').slice(0,30):[];
 const photos=[...new Set(places.filter(p=>ids.includes(p.id)).flatMap(p=>p.images.slice(0,1).map(i=>i.src)))];
 for(const photo of photos){if(!photo.startsWith('/images/'))continue;try{await cache.add(photo);}catch{ok=false;}}
 }catch{ok=false;}const textSaved = !!(await cache.match("/data/places.json"));event.ports[0]?.postMessage({ok,textSaved});})());
});
