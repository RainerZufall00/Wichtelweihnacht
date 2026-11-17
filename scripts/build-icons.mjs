// Erzeugt Icons + Vorschaubild (og.png) aus den SVG-Zeichnungen.
// Nur für Entwicklung nötig:  node scripts/build-icons.mjs   (braucht playwright)
import { writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { cow, farmScene } from '../public/js/art.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = new URL('../public/img/', import.meta.url);

const iconSvg = (maskable) => {
  const s = maskable ? 0.62 : 0.78;
  const size = 512 * s;
  const off = (512 - size) / 2;
  const inner = cow({ coat: 'fleck', hat: 'santa', blink: false }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><radialGradient id="bg" cx=".7" cy=".2" r="1"><stop offset="0" stop-color="#2a3f80"/><stop offset=".5" stop-color="#16285a"/><stop offset="1" stop-color="#0b1630"/></radialGradient></defs>
  ${maskable ? '<rect width="512" height="512" fill="url(#bg)"/>' : '<rect width="512" height="512" rx="112" fill="url(#bg)"/>'}
  <g fill="#fff" opacity=".85"><circle cx="70" cy="90" r="6"/><circle cx="440" cy="70" r="5"/><circle cx="460" cy="300" r="4"/><circle cx="50" cy="330" r="5"/><circle cx="120" cy="460" r="4"/><circle cx="400" cy="450" r="6"/></g>
  <ellipse cx="256" cy="470" rx="${maskable ? 300 : 230}" ry="70" fill="#e7f0fb" opacity="${maskable ? 1 : 0.95}"/>
  <svg x="${off}" y="${off + (maskable ? 14 : 22)}" width="${size}" height="${size * 1.075}" viewBox="0 0 200 215">${inner}</svg>
</svg>`;
};

writeFileSync(new URL('icon.svg', out), iconSvg(false));
writeFileSync(new URL('maskable.svg', out), iconSvg(true));

const font = (f) => readFileSync(new URL(`../public/fonts/${f}`, import.meta.url)).toString('base64');
const browser = await chromium.launch();
const page = await browser.newPage();

async function png(svg, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: new URL(file, out).pathname, omitBackground: true });
}
await png(iconSvg(false), 192, 'icon-192.png');
await png(iconSvg(false), 512, 'icon-512.png');
await png(iconSvg(true), 512, 'maskable-512.png');
await png(iconSvg(true), 180, 'apple-touch-icon.png');

// Vorschaubild für WhatsApp & Co.
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<style>
@font-face{font-family:Xmas;src:url(data:font/woff2;base64,${font('mountains-of-christmas.woff2')})}
@font-face{font-family:Fredoka;src:url(data:font/woff2;base64,${font('fredoka.woff2')});font-weight:300 700}
body{margin:0;width:1200px;height:630px;overflow:hidden;background:radial-gradient(120% 90% at 80% 0%,#2a3f80,#16285a 40%,#0b1630 80%);font-family:Fredoka;position:relative}
.t{position:absolute;left:60px;top:70px;color:#fff;width:560px}
.s{color:#f2c14e;letter-spacing:.3em;text-transform:uppercase;font-weight:600;font-size:26px}
.b{font-family:Xmas;font-size:96px;line-height:.95;text-shadow:0 5px 0 #a51d22,0 12px 30px rgba(0,0,0,.5)}
.b em{font-style:normal;color:#f2c14e}
.p{margin-top:24px;font-size:28px;color:#cfdcff}
.f{position:absolute;right:-20px;bottom:0;width:760px;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 22%)}
.art-label{font-family:Fredoka;font-weight:600;font-size:13px;fill:#fff}
</style>
<div class="t"><div class="s">Die große</div><div class="b">Humberger <em>Wichtel</em>weihnacht</div><div class="p">Dein Los wartet im Stall 🐄🎁</div></div>
<div class="f">${farmScene()}</div>`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: new URL('og.png', out).pathname });
await browser.close();
console.log('Icons erzeugt ✓');
