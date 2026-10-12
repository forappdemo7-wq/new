// High-fidelity SVG poster covers matching the reference mockup cards in image.png

export const COVER_1984 = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" fill="#0A0A0C"/>
  <defs>
    <radialGradient id="eyeGlow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#E53935" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#8E0000" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#0A0A0C" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g stroke="#D32F2F" stroke-width="1.5" opacity="0.75">
    ${Array.from({ length: 36 }).map((_, i) => {
      const angle = (i * 10 * Math.PI) / 180;
      const x2 = 200 + 260 * Math.cos(angle);
      const y2 = 260 + 260 * Math.sin(angle);
      return `<line x1="200" y1="260" x2="${x2}" y2="${y2}"/>`;
    }).join('')}
  </g>
  <circle cx="200" cy="260" r="140" fill="url(#eyeGlow)"/>
  <path d="M 90 260 Q 200 160 310 260 Q 200 360 90 260 Z" fill="#0A0A0C" stroke="#FF5252" stroke-width="6"/>
  <circle cx="200" cy="260" r="46" fill="#D32F2F"/>
  <circle cx="200" cy="260" r="22" fill="#000000"/>
  <circle cx="210" cy="250" r="7" fill="#FFFFFF"/>
  <text x="200" y="90" font-family="Georgia, serif" font-size="52" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">1984</text>
  <text x="200" y="520" font-family="'Courier New', monospace" font-size="20" font-weight="700" fill="#FF5252" text-anchor="middle" letter-spacing="6">GEORGE ORWELL</text>
</svg>
`)}`;

export const COVER_GATSBY = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" fill="#0B132B"/>
  <defs>
    <radialGradient id="skyGlow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#1C2541"/>
      <stop offset="100%" stop-color="#0B132B"/>
    </radialGradient>
  </defs>
  <rect width="400" height="600" fill="url(#skyGlow)"/>
  <g stroke="#F5D061" stroke-width="2" fill="none" opacity="0.9">
    <path d="M 100 240 Q 140 200 180 240 Q 140 280 100 240 Z" fill="#1C2541"/>
    <path d="M 220 240 Q 260 200 300 240 Q 260 280 220 240 Z" fill="#1C2541"/>
    <circle cx="140" cy="240" r="14" fill="#6FFFE9"/>
    <circle cx="260" cy="240" r="14" fill="#6FFFE9"/>
    <circle cx="140" cy="240" r="6" fill="#0B132B"/>
    <circle cx="260" cy="240" r="6" fill="#0B132B"/>
    <path d="M 140 260 Q 135 290 140 305 Q 145 290 140 260 Z" fill="#6FFFE9" opacity="0.8"/>
  </g>
  <text x="200" y="80" font-family="'Times New Roman', serif" font-size="22" font-style="italic" fill="#E0A96D" text-anchor="middle" letter-spacing="3">The</text>
  <text x="200" y="125" font-family="Georgia, serif" font-size="36" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="6">GREAT</text>
  <text x="200" y="165" font-family="Georgia, serif" font-size="36" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="6">GATSBY</text>
  <text x="200" y="550" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#E0A96D" text-anchor="middle" letter-spacing="4">F. SCOTT FITZGERALD</text>
</svg>
`)}`;

export const COVER_BATMAN = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" fill="#090A0F"/>
  <g stroke="#334155" stroke-width="1" opacity="0.4">
    ${Array.from({ length: 30 }).map((_, i) => {
      const x = i * 14;
      return `<line x1="${x}" y1="0" x2="${x + 60}" y2="600"/>`;
    }).join('')}
  </g>
  <circle cx="200" cy="220" r="105" fill="#F8FAFC" opacity="0.9"/>
  <g fill="#090A0F">
    <path d="M 160 250 L 175 160 L 190 200 L 210 200 L 225 160 L 240 250 L 280 340 L 120 340 Z"/>
    <path d="M 120 340 Q 60 420 40 480 Q 120 450 160 480 Q 200 440 240 480 Q 280 450 360 480 Q 340 420 280 340 Z"/>
  </g>
  <text x="200" y="80" font-family="'Impact', sans-serif" font-size="40" font-weight="900" fill="#E2E8F0" text-anchor="middle" letter-spacing="4">BATMAN</text>
  <text x="200" y="112" font-family="Georgia, serif" font-size="16" font-style="italic" fill="#94A3B8" text-anchor="middle" letter-spacing="2">The Long Halloween</text>
  <text x="200" y="555" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#64748B" text-anchor="middle" letter-spacing="4">JEPH LOEB &amp; TIM SALE</text>
</svg>
`)}`;

export const COVER_ATOMIC_HABITS = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" fill="#FFFBEB"/>
  <rect x="20" y="20" width="360" height="560" fill="#FEF3C7" rx="8"/>
  <g fill="#D97706" opacity="0.4">
    ${Array.from({ length: 80 }).map((_, i) => {
      const cx = 50 + (i % 10) * 40;
      const cy = 200 + Math.floor(i / 10) * 30;
      return `<circle cx="${cx}" cy="${cy}" r="2"/>`;
    }).join('')}
  </g>
  <text x="200" y="140" font-family="'Courier New', monospace" font-size="18" font-weight="700" fill="#B45309" text-anchor="middle" letter-spacing="4">JAMES CLEAR</text>
  <text x="200" y="240" font-family="Georgia, serif" font-size="42" font-weight="900" fill="#78350F" text-anchor="middle" letter-spacing="2">Atomic</text>
  <text x="200" y="300" font-family="Georgia, serif" font-size="42" font-weight="900" fill="#78350F" text-anchor="middle" letter-spacing="2">Habits</text>
  <text x="200" y="380" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#92400E" text-anchor="middle">Tiny Changes, Remarkable Results</text>
</svg>
`)}`;

export const COVER_MARTIAN = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" fill="#9A3412"/>
  <circle cx="200" cy="240" r="120" fill="#EA580C"/>
  <text x="200" y="240" font-family="'Impact', sans-serif" font-size="32" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="6">THE MARTIAN</text>
  <text x="200" y="540" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#FFEDD5" text-anchor="middle" letter-spacing="4">ANDY WEIR</text>
</svg>
`)}`;

export const COVER_WATCHMEN = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" fill="#FACC15"/>
  <circle cx="200" cy="270" r="110" fill="#EAB308" stroke="#000000" stroke-width="12"/>
  <circle cx="160" cy="230" r="12" fill="#000000"/>
  <circle cx="240" cy="230" r="12" fill="#000000"/>
  <path d="M 140 300 Q 200 360 260 300" fill="none" stroke="#000000" stroke-width="14" stroke-linecap="round"/>
  <path d="M 160 210 Q 180 250 170 290 Q 165 310 160 320" fill="none" stroke="#DC2626" stroke-width="10" stroke-linecap="round"/>
  <text x="200" y="80" font-family="'Impact', sans-serif" font-size="44" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="6">WATCHMEN</text>
  <text x="200" y="550" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#000000" text-anchor="middle" letter-spacing="4">ALAN MOORE · DAVE GIBBONS</text>
</svg>
`)}`;

export const COVER_FOURTH_WING = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" fill="#0F172A"/>
  <circle cx="200" cy="270" r="110" fill="none" stroke="#F59E0B" stroke-width="4"/>
  <path d="M 100 270 Q 200 180 300 270 Q 200 360 100 270 Z" fill="#F59E0B" opacity="0.8"/>
  <text x="200" y="110" font-family="Georgia, serif" font-size="34" font-weight="900" fill="#F59E0B" text-anchor="middle" letter-spacing="4">FOURTH WING</text>
  <text x="200" y="540" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#FDE68A" text-anchor="middle" letter-spacing="3">REBECCA YARROS</text>
</svg>
`)}`;

export const COVER_PRIDE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" fill="#2E4034"/>
  <rect x="25" y="25" width="350" height="550" fill="none" stroke="#D4AF37" stroke-width="2" rx="4"/>
  <rect x="35" y="35" width="330" height="530" fill="none" stroke="#D4AF37" stroke-width="1" stroke-dasharray="4,4"/>
  <g stroke="#D4AF37" fill="none" stroke-width="2" opacity="0.85">
    <circle cx="200" cy="270" r="110"/>
    <path d="M 140 270 Q 200 210 260 270 Q 200 330 140 270 Z"/>
    <circle cx="200" cy="270" r="40"/>
  </g>
  <text x="200" y="125" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#D4AF37" text-anchor="middle" letter-spacing="3">PRIDE</text>
  <text x="200" y="160" font-family="'Times New Roman', serif" font-size="20" font-style="italic" fill="#FFFFFF" text-anchor="middle">&amp;</text>
  <text x="200" y="200" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#D4AF37" text-anchor="middle" letter-spacing="3">PREJUDICE</text>
  <text x="200" y="470" font-family="Georgia, serif" font-size="16" font-style="italic" fill="#E8ECD7" text-anchor="middle" letter-spacing="3">Jane Austen</text>
</svg>
`)}`;

export const COVER_HOBBIT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" fill="#132A13"/>
  <path d="M 0 350 L 120 180 L 220 280 L 320 160 L 400 280 L 400 600 L 0 600 Z" fill="#31572C"/>
  <path d="M 0 420 L 160 280 L 260 380 L 360 260 L 400 320 L 400 600 L 0 600 Z" fill="#4F772D"/>
  <path d="M 180 110 Q 200 90 220 110 Q 240 100 250 115 Q 230 120 220 115 Q 200 130 180 110 Z" fill="#D4AF37"/>
  <rect x="20" y="20" width="360" height="560" fill="none" stroke="#D4AF37" stroke-width="2"/>
  <text x="200" y="80" font-family="Georgia, serif" font-size="20" font-style="italic" fill="#ECF39E" text-anchor="middle">The</text>
  <text x="200" y="130" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#D4AF37" text-anchor="middle" letter-spacing="6">HOBBIT</text>
  <text x="200" y="550" font-family="Georgia, serif" font-size="15" font-weight="600" fill="#ECF39E" text-anchor="middle" letter-spacing="4">J.R.R. TOLKIEN</text>
</svg>
`)}`;

export const COVER_SANDMAN = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" fill="#030712"/>
  <g opacity="0.6">
    <ellipse cx="200" cy="280" rx="140" ry="180" fill="#1E1B4B"/>
    <ellipse cx="200" cy="300" rx="100" ry="130" fill="#312E81"/>
    <ellipse cx="200" cy="320" rx="60" ry="80" fill="#4338CA"/>
  </g>
  <circle cx="170" cy="240" r="5" fill="#FFFFFF"/>
  <circle cx="230" cy="240" r="5" fill="#FFFFFF"/>
  <path d="M 170 230 L 170 250 M 160 240 L 180 240" stroke="#FFFFFF" stroke-width="1.5"/>
  <path d="M 230 230 L 230 250 M 220 240 L 240 240" stroke="#FFFFFF" stroke-width="1.5"/>
  <text x="200" y="90" font-family="Georgia, serif" font-size="16" font-style="italic" fill="#818CF8" text-anchor="middle" letter-spacing="4">THE</text>
  <text x="200" y="135" font-family="'Cinzel', Georgia, serif" font-size="34" font-weight="bold" fill="#F8FAFC" text-anchor="middle" letter-spacing="8">SANDMAN</text>
  <text x="200" y="540" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#818CF8" text-anchor="middle" letter-spacing="4">NEIL GAIMAN</text>
</svg>
`)}`;

export const COVER_MOBY_DICK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <rect width="400" height="600" fill="#0C4A6E"/>
  <path d="M 0 320 C 100 300 200 360 400 320 L 400 600 L 0 600 Z" fill="#075985"/>
  <path d="M 0 380 C 140 400 260 350 400 390 L 400 600 L 0 600 Z" fill="#0369A1"/>
  <g fill="#F8FAFC" stroke="#E2E8F0" stroke-width="3">
    <path d="M 90 290 C 160 210 280 230 330 310 C 260 280 180 320 90 290 Z"/>
    <path d="M 80 295 L 30 240 Q 60 285 80 300 Q 60 315 30 360 Z"/>
  </g>
  <text x="200" y="90" font-family="Georgia, serif" font-size="36" font-weight="900" fill="#F8FAFC" text-anchor="middle" letter-spacing="4">MOBY-DICK</text>
  <text x="200" y="125" font-family="Georgia, serif" font-size="16" font-style="italic" fill="#7DD3FC" text-anchor="middle">or, The Whale</text>
  <text x="200" y="555" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#BAE6FD" text-anchor="middle" letter-spacing="4">HERMAN MELVILLE</text>
</svg>
`)}`;
