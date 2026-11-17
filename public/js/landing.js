import { $, startSnow, wireTaps, soundToggle, setupPwa, store } from './common.js';
import { farmScene } from './art.js';

const mine = store.get('myLink');
setupPwa(mine && /^\/w\/[A-Za-z0-9_-]+$/.test(mine) ? mine : '');
startSnow($('#snow'));
wireTaps();
soundToggle($('#soundBtn'));
$('#hero').innerHTML = farmScene();
if (mine && /^\/w\/[A-Za-z0-9_-]+$/.test(mine)) {
  $('#mine').hidden = false;
  $('#mineLink').href = mine;
  // Als App gestartet? Direkt zum eigenen Los.
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) location.replace(mine);
}
