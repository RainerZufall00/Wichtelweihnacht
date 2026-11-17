// Handgezeichnete SVG-Kunst für den Jakobshof 🐄🐕
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

const TONGUE = '<path class="tongue" d="M75 102 Q80 118 85 102 Z" fill="#f07a86"/><path d="M80 104 v8" stroke="#d65a68" stroke-width="1.2"/>';

function dogEyes(y, lx, rx) {
  // Braune Iris, damit die Augen auf schwarzem Fell sichtbar sind
  return `<g class="eyes blink">
      <circle cx="${lx}" cy="${y}" r="7" fill="#6b4126"/><circle cx="${rx}" cy="${y}" r="7" fill="#6b4126"/>
      <circle cx="${lx}" cy="${y}" r="4.6" fill="#0e0c0b"/><circle cx="${rx}" cy="${y}" r="4.6" fill="#0e0c0b"/>
      <circle cx="${lx + 2}" cy="${y - 2.5}" r="2" fill="#fff"/><circle cx="${rx + 2}" cy="${y - 2.5}" r="2" fill="#fff"/>
    </g>`;
}

const ANTLERS = `<g class="antlers" stroke="#7a4a2c" stroke-width="5" stroke-linecap="round" fill="none">
    <path d="M58 44 Q50 20 40 8 M50 26 Q38 24 32 16 M46 16 Q50 6 56 2"/>
    <path d="M102 44 Q110 20 120 8 M110 26 Q122 24 128 16 M114 16 Q110 6 104 2"/>
    <path d="M46 52 Q80 26 114 52" stroke="#c0392b" stroke-width="5"/>
  </g>`;
const BANDANA = `<g class="bandana">
    <path d="M52 100 Q80 114 108 100 L104 110 Q92 122 80 142 Q68 122 56 110 Z" fill="#d42a2a"/>
    <path d="M52 100 Q80 114 108 100 L106 106 Q80 120 54 106 Z" fill="#a51d22"/>
    <g fill="#fff" opacity=".9"><circle cx="70" cy="116" r="2"/><circle cx="90" cy="116" r="2"/><circle cx="80" cy="124" r="2"/><circle cx="74" cy="131" r="1.6"/><circle cx="86" cy="131" r="1.6"/><circle cx="80" cy="113" r="1.6"/></g>
    <path d="M104 104 l10 -4 -2 8 Z" fill="#d42a2a"/>
  </g>`;
const COLLAR = (y) => `<path d="M52 ${y} Q80 ${y + 14} 108 ${y}" stroke="#1f6f43" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="80" cy="${y + 14}" r="8.5" fill="#f2c14e" stroke="#c99a2e" stroke-width="1.5"/>`;

/** Emmi – Berner Sennenhund: groß, dreifarbig (schwarz, weiß, rostbraun) */
function emmi() {
  const B = '#1d1a19', W = '#fbf7f0', R = '#b8622b';
  return `
    <path class="tail" d="M114 172 C148 170 160 142 150 114 C146 132 134 150 112 156 Z" fill="${B}"/>
    <path d="M150 114 C155 122 155 132 152 140 C147 133 146 122 150 114 Z" fill="${W}"/>
    <ellipse cx="80" cy="150" rx="48" ry="49" fill="${B}"/>
    <path d="M38 132 l-6 6 6 2 M122 132 l6 6 -6 2" stroke="${B}" stroke-width="5" stroke-linecap="round"/>
    <rect x="51" y="156" width="21" height="40" rx="10" fill="${R}"/>
    <rect x="88" y="156" width="21" height="40" rx="10" fill="${R}"/>
    <path d="M80 104 C62 108 58 130 64 148 C68 160 75 170 80 180 C85 170 92 160 96 148 C102 130 98 108 80 104 Z" fill="${W}"/>
    <path d="M70 122 l-4 6 6 0 M90 122 l4 6 -6 0 M74 140 l-3 5 5 0 M86 140 l3 5 -5 0" stroke="#e7ddcf" stroke-width="2" fill="none"/>
    <ellipse cx="61" cy="196" rx="15" ry="8.5" fill="${W}"/>
    <ellipse cx="99" cy="196" rx="15" ry="8.5" fill="${W}"/>
    <path d="M56 197 v-5 M61 198 v-5 M66 197 v-5 M94 197 v-5 M99 198 v-5 M104 197 v-5" stroke="#b9ada0" stroke-width="1.6" stroke-linecap="round"/>
    <path class="ear-l" d="M48 50 C34 54 24 78 31 98 C40 101 51 86 57 64 Z" fill="#131110"/>
    <path class="ear-r" d="M112 50 C126 54 136 78 129 98 C120 101 109 86 103 64 Z" fill="#131110"/>
    <path d="M80 36 C106 36 122 54 122 77 C122 100 104 113 80 113 C56 113 38 100 38 77 C38 54 54 36 80 36 Z" fill="${B}"/>
    <ellipse cx="58" cy="95" rx="13" ry="10" fill="${R}"/>
    <ellipse cx="102" cy="95" rx="13" ry="10" fill="${R}"/>
    <path d="M80 42 C75 54 72 68 70 84 L90 84 C88 68 85 54 80 42 Z" fill="${W}"/>
    <ellipse cx="80" cy="97" rx="19" ry="15" fill="${W}"/>
    <ellipse cx="63" cy="60" rx="5.5" ry="4" fill="${R}"/>
    <ellipse cx="97" cy="60" rx="5.5" ry="4" fill="${R}"/>
    ${dogEyes(72, 63, 97)}
    <ellipse cx="80" cy="88" rx="8.5" ry="6" fill="#0e0c0b"/>
    <ellipse cx="78" cy="86" rx="2.6" ry="1.6" fill="#fff" opacity=".6"/>
    <path d="M80 94 v5 M80 99 Q72 106 65 100 M80 99 Q88 106 95 100" stroke="#0e0c0b" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${TONGUE}
    ${ANTLERS}
    ${COLLAR(110)}`;
}

/** Micky – Mini Australian Shepherd: klein, schwarz-weiß, Klappohren, Halskrause */
function micky() {
  const B = '#1b1919', W = '#fbf8f3', C = '#b8743a';
  return `
    <path class="tail" d="M112 176 C140 176 150 156 144 136 C138 150 128 160 110 162 Z" fill="${B}"/>
    <path d="M144 136 l5 6 -6 1 4 6 -6 0" fill="${B}"/>
    <ellipse cx="80" cy="154" rx="40" ry="45" fill="${B}"/>
    <rect x="56" y="160" width="17" height="36" rx="8" fill="${W}"/>
    <rect x="87" y="160" width="17" height="36" rx="8" fill="${W}"/>
    <path d="M56 104 L62 116 L53 122 L62 130 L56 138 L67 144 L64 154 L75 160 L80 174 L85 160 L96 154 L93 144 L104 138 L98 130 L107 122 L98 116 L104 104 Q80 96 56 104 Z" fill="${W}"/>
    <ellipse cx="64" cy="196" rx="12.5" ry="7.5" fill="${W}"/>
    <ellipse cx="96" cy="196" rx="12.5" ry="7.5" fill="${W}"/>
    <path d="M60 197 v-4 M64 198 v-4 M68 197 v-4 M92 197 v-4 M96 198 v-4 M100 197 v-4" stroke="#b9ada0" stroke-width="1.5" stroke-linecap="round"/>
    <g class="ear-l"><path d="M52 62 C44 46 42 34 47 22 C56 30 64 40 68 50 Z" fill="${B}"/>
      <path d="M47 22 C41 28 39 36 41 44 C45 39 48 33 50 27 Z" fill="#4d4645"/></g>
    <g class="ear-r"><path d="M108 62 C116 46 118 34 113 22 C104 30 96 40 92 50 Z" fill="${B}"/>
      <path d="M113 22 C119 28 121 36 119 44 C115 39 112 33 110 27 Z" fill="#4d4645"/></g>
    <path d="M47 66 l-6 4 6 3 M113 66 l6 4 -6 3" stroke="${B}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="80" cy="76" rx="33" ry="32" fill="${B}"/>
    <path d="M80 44 C77 56 75 68 73 84 L87 84 C85 68 83 56 80 44 Z" fill="${W}"/>
    <ellipse cx="80" cy="95" rx="16" ry="12.5" fill="${W}"/>
    <ellipse cx="65" cy="63" rx="3.6" ry="2.6" fill="${C}"/>
    <ellipse cx="95" cy="63" rx="3.6" ry="2.6" fill="${C}"/>
    ${dogEyes(72, 65, 95)}
    <ellipse cx="80" cy="88" rx="7" ry="5.2" fill="#0e0c0b"/>
    <ellipse cx="78" cy="86.5" rx="2.2" ry="1.4" fill="#fff" opacity=".6"/>
    <path d="M80 93 v4 M80 97 Q73 103 67 98 M80 97 Q87 103 93 98" stroke="#0e0c0b" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${BANDANA}`;
}

/** Sitzender Hund. which: 'emmi' | 'micky' */
export function dog(which = 'emmi', { cls = '' } = {}) {
  const label = which === 'emmi' ? 'Emmi' : 'Micky';
  const tagY = which === 'emmi' ? 150 : 154;
  return `<svg class="dog dog-${which} ${cls}" viewBox="0 0 160 205" aria-hidden="true">
    ${which === 'emmi' ? emmi() : micky()}
    <text x="80" y="${tagY}" text-anchor="middle" class="art-label dog-name"${which === 'micky' ? ' style="font-size:11px"' : ''}>${label}</text>
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
    <rect x="46" y="44" width="68" height="14" rx="3" fill="#f5e9d6" stroke="#5b3a24" stroke-width="1.5"/>
    <text x="80" y="54.5" text-anchor="middle" class="barn-sign">JAKOBSHOF</text>
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
  return `<svg class="farm" viewBox="0 0 420 270" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Verschneiter Jakobshof mit Stall, Kühen und den Hunden Emmi und Micky">
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
    ${dogs ? `<g class="tap" data-sound="bark" data-say="Wuff … ich steh gleich auf. Gleich.|Ich hab schon mehr Weihnachten erlebt als ihr alle zusammen.|Langsam, Kinder. Ich bin nicht mehr die Jüngste.|Früher gab's unterm Baum noch richtige Knochen.|Weckt mich, wenn es Leberwurst gibt.|Graue Schnauze, großes Herz. Frohe Weihnachten!"><svg x="14" y="154" width="94" height="120">${dog('emmi')}</svg></g>
    <g class="tap" data-sound="bark" data-say="Wuff! Micky, klein aber oho 🐑"><svg x="100" y="200" width="58" height="74">${dog('micky')}</svg></g>` : ''}
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
