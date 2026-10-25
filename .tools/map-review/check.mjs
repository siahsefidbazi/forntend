import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const pages = await (await fetch('http://localhost:9226/json')).json();
const ws = new WebSocket(pages.find(p => p.url === 'about:blank' || p.url.includes('8084')) .webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, {once:true}));
let id = 0;
const pending = new Map();
const exceptions = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
  if (message.id) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task.reject(message.error) : task.resolve(message.result); }
});
const send = (method, params = {}) => new Promise((resolve,reject) => { const key = ++id; pending.set(key,{resolve,reject}); ws.send(JSON.stringify({id:key,method,params})); });
const evaluate = async expression => (await send('Runtime.evaluate',{expression,returnByValue:true})).result.value;
const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:true});
await send('Emulation.setTouchEmulationEnabled',{enabled:true});
await send('Page.navigate',{url:'http://localhost:8084/search?target=origin&mode=map'});
for(let attempt=0;attempt<70;attempt++) {
  if(await evaluate('!!document.querySelector(".leaflet-container .leaflet-tile")')) break;
  await delay(500);
}
for(let attempt=0;attempt<60;attempt++) {
  if(await evaluate('document.querySelectorAll(".leaflet-tile-loaded").length > 3 && !document.body.innerText.includes("در حال پیدا کردن آدرس")')) break;
  await delay(500);
}
await writeFile('C:/hammasir/.tools/map-review/initial.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
const before = await evaluate('document.body.innerText');
assert.equal(await evaluate('document.querySelectorAll(".leaflet-container").length'),1);
assert.ok(before.includes('تأیید مبدأ'));
const coordinates = text => text.match(/\d{2}\.\d{5}\s*,\s*\d{2}\.\d{5}/)?.[0];
const bounds = await evaluate('(()=>{const r=document.querySelector(".leaflet-container").getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()');
const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
for(let i=1;i<=8;i++) await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*10,y:y+i*5}]});
await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
await delay(1800);
const afterDrag = await evaluate('document.body.innerText');
assert.notEqual(coordinates(before),coordinates(afterDrag),'touch drag must move the selected coordinate');
const zoomBefore = await evaluate('document.querySelector(".leaflet-tile").src');
await send('Input.dispatchMouseEvent',{type:'mouseWheel',x,y,deltaX:0,deltaY:-220});
await delay(1300);
const zoomAfter = await evaluate('document.querySelector(".leaflet-tile").src');
assert.notEqual(zoomBefore.split('/').at(-3),zoomAfter.split('/').at(-3),'wheel must change zoom level');
await delay(3000);
await writeFile('C:/hammasir/.tools/map-review/mobile.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
console.log(JSON.stringify({mobileMap:true,before:coordinates(before),afterTouch:coordinates(afterDrag),wheelZoom:true,body:await evaluate('document.body.innerText'),exceptions},null,2));
ws.close();
