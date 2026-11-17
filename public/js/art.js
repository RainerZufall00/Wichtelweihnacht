// Handgezeichnete SVG-Kunst für den Humberger Hof 🐄🐕
let uid = 0;
const nid = (p) => `${p}${++uid}`;

const COW_COATS = {
  fleck: { base: '#fbf7ef', spot: '#8a4b2a', ear: '#8a4b2a' }, // Fleckvieh
  schwarz: { base: '#fbf7ef', spot: '#2b2623', ear: '#2b2623' }, // Schwarzbunt
  braun: { base: '#a8714a', spot: '#7a4a2c', ear: '#7a4a2c' }, // Braunvieh
};

/** Kuhkopf mit Hörnern. hat: 'santa' | 'antlers' | 'none' */
export function cow({ coat = 'fleck', hat = 'santa', name = '', blink = true, cls = '' } = {}) {
  const c = COW_COATS[coat] || COW_COATS.fleck;
  const clip = nid('cowclip');
  const hatSvg =
    hat === 'santa'
      ? `<g class="hat" transform="translate(0 8) rotate(-10 100 46)">
          <path d="M66 50 C70 14 112 -2 150 10 C138 20 132 34 134 50 Z" fill="#d42a2a"/>
          <path d="M66 50 C70 14 112 -2 150 10 C130 12 104 22 92 50 Z" fill="#b51d23" opacity=".55"/>
          <rect x="60" y="42" width="80" height="16" rx="8" fill="#fff"/>
          <circle cx="152" cy="11" r="10" fill="#fff"/>
        </g>`
      : '';
  const tuft = hat === 'none' ? `<path d="M88 50 q6 -14 12 -2 q6 -14 12 2" fill="${c.spot}"/>` : '';
  return `<svg class="cow ${cls}" viewBox="0 0 200 215" aria-hidden="true">
    <defs><clipPath id="${clip}"><ellipse cx="100" cy="102" rx="50" ry="58"/></clipPath></defs>
    <!-- Hörner (Demeter: bleiben dran!) -->
    <path d="M70 62 C46 60 32 44 36 18 C44 34 56 44 78 50 Z" fill="#efe0c0"/>
    <path d="M36 18 C35 26 37 30 40 34 L44 28 Z" fill="#6f6250"/>
    <path d="M130 62 C154 60 168 44 164 18 C156 34 144 44 122 50 Z" fill="#efe0c0"/>
    <path d="M164 18 C165 26 163 30 160 34 L156 28 Z" fill="#6f6250"/>
    <!-- Ohren -->
    <g class="ear-l"><ellipse cx="44" cy="86" rx="27" ry="12" transform="rotate(-18 44 86)" fill="${c.ear}"/>
      <ellipse cx="46" cy="87" rx="17" ry="6" transform="rotate(-18 46 87)" fill="#f3a9a2"/></g>
    <g class="ear-r"><ellipse cx="156" cy="86" rx="27" ry="12" transform="rotate(18 156 86)" fill="${c.ear}"/>
      <ellipse cx="154" cy="87" rx="17" ry="6" transform="rotate(18 154 87)" fill="#f3a9a2"/></g>
    <!-- Kopf -->
    <ellipse cx="100" cy="102" rx="50" ry="58" fill="${c.base}"/>
    <g clip-path="url(#${clip})">
      <path d="M44 60 C70 52 86 74 78 96 C72 112 50 112 44 100 Z" fill="${c.spot}"/>
      <path d="M128 50 C140 62 152 66 156 82 C140 86 122 76 120 60 Z" fill="${c.spot}"/>
      <path d="M112 112 C122 106 140 112 150 124 L150 140 C136 136 118 128 112 112 Z" fill="${c.spot}" opacity=".9"/>
    </g>
    ${tuft}
    <!-- Augen -->
    <g class="eyes${blink ? ' blink' : ''}">
      <ellipse cx="80" cy="98" rx="8" ry="9.5" fill="#1d1a18"/>
      <ellipse cx="120" cy="98" rx="8" ry="9.5" fill="#1d1a18"/>
      <circle cx="83" cy="94" r="3" fill="#fff"/><circle cx="123" cy="94" r="3" fill="#fff"/>
    </g>
    <path d="M69 86 l-5 -4 M73 83 l-3 -5 M131 86 l5 -4 M127 83 l3 -5" stroke="#1d1a18" stroke-width="2" stroke-linecap="round"/>
    <!-- Bäckchen -->
    <ellipse cx="66" cy="118" rx="8" ry="5" fill="#f3a9a2" opacity=".6"/>
    <ellipse cx="134" cy="118" rx="8" ry="5" fill="#f3a9a2" opacity=".6"/>
    <!-- Maul -->
    <ellipse cx="100" cy="142" rx="40" ry="25" fill="#f5b5ad"/>
    <ellipse cx="86" cy="140" rx="6" ry="4.5" fill="#c8706f"/>
    <ellipse cx="114" cy="140" rx="6" ry="4.5" fill="#c8706f"/>
    <path d="M90 153 Q100 160 110 153" stroke="#c8706f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${hatSvg}
    <!-- Halsband + Glocke -->
    <path d="M70 160 Q100 172 130 160" stroke="#c0392b" stroke-width="8" fill="none" stroke-linecap="round"/>
    <g class="bell"><path d="M90 168 Q90 186 86 192 L114 192 Q110 186 110 168 Q100 160 90 168 Z" fill="#f2c14e"/>
      <circle cx="100" cy="195" r="4" fill="#c99a2e"/>
      <path d="M93 172 Q95 182 92 188" stroke="#fff3c4" stroke-width="2" fill="none" opacity=".8"/></g>
    ${name ? `<text x="100" y="212" text-anchor="middle" class="art-label">${name}</text>` : ''}
  </svg>`;
}

const DOGS = {
  emmi: { fur: '#c98a4b', dark: '#8b5527', chest: '#f4dcb8', accessory: 'antlers', tag: 'Emmi' },
  micky: { fur: '#3b3532', dark: '#1f1b19', chest: '#f3efe8', accessory: 'santa', tag: 'Micky' },
};

/** Sitzender Hund. which: 'emmi' | 'micky' */
export function dog(which = 'emmi', { cls = '' } = {}) {
  const d = DOGS[which];
  const acc =
    d.accessory === 'antlers'
      ? `<g class="antlers" stroke="#7a4a2c" stroke-width="5" stroke-linecap="round" fill="none">
          <path d="M58 44 Q50 20 40 8 M50 26 Q38 24 32 16 M46 16 Q50 6 56 2"/>
          <path d="M102 44 Q110 20 120 8 M110 26 Q122 24 128 16 M114 16 Q110 6 104 2"/>
          <path d="M46 52 Q80 26 114 52" stroke="#c0392b" stroke-width="5"/>
        </g>`
      : `<g class="hat" transform="rotate(14 80 40)">
          <path d="M48 48 C54 16 92 4 124 14 C112 22 108 34 112 48 Z" fill="#d42a2a"/>
          <rect x="42" y="40" width="76" height="14" rx="7" fill="#fff"/>
          <circle cx="126" cy="15" r="9" fill="#fff"/>
        </g>`;
  return `<svg class="dog dog-${which} ${cls}" viewBox="0 0 160 205" aria-hidden="true">
    <!-- Schwanz -->
    <path class="tail" d="M118 168 Q150 160 146 128" stroke="${d.fur}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <!-- Körper -->
    <ellipse cx="80" cy="152" rx="44" ry="46" fill="${d.fur}"/>
    <ellipse cx="80" cy="150" rx="24" ry="34" fill="${d.chest}"/>
    <ellipse cx="60" cy="194" rx="15" ry="9" fill="${d.fur}"/>
    <ellipse cx="100" cy="194" rx="15" ry="9" fill="${d.fur}"/>
    <path d="M55 195 v-5 M60 196 v-5 M65 195 v-5 M95 195 v-5 M100 196 v-5 M105 195 v-5" stroke="${d.dark}" stroke-width="1.6" stroke-linecap="round"/>
    <!-- Ohren -->
    <path class="ear-l" d="M48 58 C28 56 20 86 28 108 C36 112 46 98 52 78 Z" fill="${d.dark}"/>
    <path class="ear-r" d="M112 58 C132 56 140 86 132 108 C124 112 114 98 108 78 Z" fill="${d.dark}"/>
    <!-- Kopf -->
    <ellipse cx="80" cy="78" rx="38" ry="36" fill="${d.fur}"/>
    <ellipse cx="80" cy="96" rx="22" ry="16" fill="${d.chest}"/>
    ${which === 'micky' ? `<path d="M80 44 C74 60 74 74 80 84 C86 74 86 60 80 44 Z" fill="${d.chest}"/>` : ''}
    <g class="eyes blink">
      <ellipse cx="65" cy="74" rx="5.5" ry="6.5" fill="#1d1a18"/>
      <ellipse cx="95" cy="74" rx="5.5" ry="6.5" fill="#1d1a18"/>
      <circle cx="67" cy="71.5" r="2" fill="#fff"/><circle cx="97" cy="71.5" r="2" fill="#fff"/>
    </g>
    <ellipse cx="80" cy="88" rx="8" ry="6" fill="#1d1a18"/>
    <ellipse cx="78" cy="86" rx="2.5" ry="1.6" fill="#fff" opacity=".6"/>
    <path d="M80 94 v5 M80 99 Q72 106 66 100 M80 99 Q88 106 94 100" stroke="#1d1a18" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path class="tongue" d="M76 103 Q80 116 84 103 Z" fill="#f07a86"/>
    ${acc}
    <!-- Halsband + Marke -->
    <path d="M50 110 Q80 124 110 110" stroke="#1f6f43" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="80" cy="126" r="9" fill="#f2c14e" stroke="#c99a2e" stroke-width="1.5"/>
    <text x="80" y="146" text-anchor="middle" class="art-label dog-name">${d.tag}</text>
  </svg>`;
}

export function barn() {
  const lights = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    const x = 8 + t * 144;
    const y = t < 0.5 ? 58 - t * 2 * 44 : 14 + (t - 0.5) * 2 * 44;
    const colors = ['#ff5a5a', '#ffd34d', '#5ad1ff', '#7dff8a'];
    return `<circle class="light" style="animation-delay:${(i % 4) * 0.35}s" cx="${x}" cy="${y + 6}" r="3.4" fill="${colors[i % 4]}"/>`;
  }).join('');
  return `<svg class="barn" viewBox="0 0 160 150" aria-hidden="true">
    <rect x="16" y="56" width="128" height="92" fill="#b3282d"/>
    <rect x="16" y="56" width="128" height="92" fill="url(#none)" stroke="#8e1f23" stroke-width="2"/>
    <path d="M4 62 L80 8 L156 62 Z" fill="#7b1c20"/>
    <path d="M4 62 L80 8 L156 62 L148 64 L80 18 L12 64 Z" fill="#fff"/>
    <path d="M30 40 Q80 -4 130 40 L132 46 Q80 6 28 46 Z" fill="#eef4ff" opacity=".9"/>
    ${lights}
    <rect x="58" y="88" width="44" height="60" fill="#f5e9d6"/>
    <rect x="62" y="92" width="36" height="56" fill="#8e1f23"/>
    <path d="M62 92 L98 148 M98 92 L62 148" stroke="#f5e9d6" stroke-width="4"/>
    <rect x="70" y="62" width="20" height="18" rx="2" fill="#ffd77a" class="window"/>
    <path d="M80 62 v18 M70 71 h20" stroke="#8e1f23" stroke-width="2"/>
    <rect x="26" y="96" width="20" height="18" rx="2" fill="#ffd77a" class="window"/>
    <rect x="114" y="96" width="20" height="18" rx="2" fill="#ffd77a" class="window"/>
    <path d="M36 96 v18 M26 105 h20 M124 96 v18 M114 105 h20" stroke="#8e1f23" stroke-width="2"/>
    <rect x="8" y="144" width="144" height="6" rx="3" fill="#fff"/>
  </svg>`;
}

function tree(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-4" y="40" width="8" height="12" fill="#5b3a24"/>
    <path d="M0 -6 L24 24 L12 24 L30 44 L-30 44 L-12 24 L-24 24 Z" fill="#1f6f43"/>
    <path d="M0 -6 L24 24 L12 24 L18 30 L-8 22 Z" fill="#fff" opacity=".85"/>
    <path d="M-30 44 L30 44 L26 40 L-26 40 Z" fill="#fff" opacity=".9"/>
    <circle class="light" cx="-10" cy="32" r="2.6" fill="#ffd34d"/>
    <circle class="light" style="animation-delay:.5s" cx="10" cy="20" r="2.6" fill="#ff5a5a"/>
    <circle class="light" style="animation-delay:1s" cx="14" cy="36" r="2.6" fill="#5ad1ff"/>
    <path d="M0 -14 l3 7 7 0 -6 4 3 7 -7 -4 -7 4 3 -7 -6 -4 7 0 Z" fill="#f2c14e" class="star"/>
  </g>`;
}

/** Hof-Szene: Stall, Kühe am Zaun, Emmi & Micky. */
export function farmScene({ cows = true, dogs = true } = {}) {
  const fence = Array.from({ length: 14 }, (_, i) => `<rect x="${i * 30 + 4}" y="188" width="8" height="40" rx="3" fill="#8a5a36"/>`).join('');
  return `<svg class="farm" viewBox="0 0 420 270" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Verschneiter Humberger Hof mit Stall, Kühen und den Hunden Emmi und Micky">
    <circle cx="350" cy="44" r="22" fill="#fff6d8" class="moon"/>
    <circle cx="358" cy="38" r="20" fill="#0f1d3d" opacity=".0"/>
    <path d="M0 170 Q90 120 200 150 T420 140 V270 H0 Z" fill="#c9dbf3"/>
    <path d="M0 200 Q120 160 260 190 T420 180 V270 H0 Z" fill="#e7f0fb"/>
    ${tree(368, 118, 1.1)}${tree(330, 138, 0.75)}
    <svg x="12" y="70" width="150" height="140">${barn()}</svg>
    <rect x="0" y="196" width="420" height="7" rx="3" fill="#a06a42"/>
    <rect x="0" y="212" width="420" height="7" rx="3" fill="#a06a42"/>
    ${fence}
    ${cows ? `<g class="tap" data-sound="moo" data-say="Muuuh! 🎄"><svg x="160" y="112" width="96" height="104">${cow({ coat: 'fleck', hat: 'santa' })}</svg></g>
    <g class="tap" data-sound="moo" data-say="Muh-ry Christmas!"><svg x="236" y="128" width="84" height="90">${cow({ coat: 'schwarz', hat: 'none' })}</svg></g>` : ''}
    <path d="M0 238 Q210 222 420 238 V270 H0 Z" fill="#fff"/>
    ${dogs ? `<g class="tap" data-sound="bark" data-say="Wuff! Ich bin Emmi 🦌"><svg x="40" y="190" width="62" height="80">${dog('emmi')}</svg></g>
    <g class="tap" data-sound="bark" data-say="Wuff wuff! Micky hier 🎅"><svg x="100" y="196" width="58" height="74">${dog('micky')}</svg></g>` : ''}
  </svg>`;
}

/** Milchkanne als Lostrommel */
export function milkChurn() {
  return `<svg class="churn" viewBox="0 0 160 220" aria-hidden="true">
    <defs><linearGradient id="metal" x1="0" x2="1">
      <stop offset="0" stop-color="#8c97a6"/><stop offset=".35" stop-color="#e8eef5"/><stop offset=".6" stop-color="#b9c3cf"/><stop offset="1" stop-color="#7d8896"/>
    </linearGradient></defs>
    <rect x="58" y="10" width="44" height="14" rx="6" fill="url(#metal)"/>
    <path d="M52 24 H108 L112 50 H48 Z" fill="url(#metal)"/>
    <path d="M48 50 Q20 62 22 96 V196 Q22 210 36 210 H124 Q138 210 138 196 V96 Q140 62 112 50 Z" fill="url(#metal)"/>
    <path d="M22 108 Q6 108 8 128" stroke="#7d8896" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M138 108 Q154 108 152 128" stroke="#7d8896" stroke-width="7" fill="none" stroke-linecap="round"/>
    <rect x="22" y="100" width="116" height="6" fill="#7d8896" opacity=".5"/>
    <rect x="22" y="186" width="116" height="6" fill="#7d8896" opacity=".5"/>
    <rect x="38" y="120" width="84" height="50" rx="10" fill="#fffaf0" stroke="#1f6f43" stroke-width="3"/>
    <text x="80" y="143" text-anchor="middle" class="churn-text">BIO-LOSE</text>
    <text x="80" y="161" text-anchor="middle" class="churn-sub">frisch vom Hof</text>
  </svg>`;
}

export function giftIcon() {
  return `<svg viewBox="0 0 64 64" class="gift" aria-hidden="true">
    <rect x="8" y="26" width="48" height="32" rx="4" fill="#d42a2a"/>
    <rect x="4" y="18" width="56" height="12" rx="4" fill="#e84a4a"/>
    <rect x="28" y="18" width="8" height="40" fill="#f2c14e"/>
    <path d="M32 18 C20 4 8 12 18 18 Z M32 18 C44 4 56 12 46 18 Z" fill="#f2c14e"/>
  </svg>`;
}
