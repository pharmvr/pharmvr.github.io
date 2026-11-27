/**
 * PharmVR 2D — High-Detail SVG Instrument & Glassware Library
 * Replaces primitive canvas shapes with razor-sharp vector illustrations
 * complete with metallic gradients, glass highlights, and graduations.
 */

window.PHARM_SVG = {
    dropper: (liquidColor = '#0ea5e9', filled = true) => `
        <svg viewBox="0 0 80 120" width="64" height="96" style="filter:drop-shadow(0 6px 10px rgba(15,23,42,0.22));">
            <defs>
                <linearGradient id="bulbGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#1e293b"/>
                    <stop offset="40%" stop-color="#475569"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                </linearGradient>
                <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="rgba(224,242,254,0.85)"/>
                    <stop offset="35%" stop-color="rgba(255,255,255,0.95)"/>
                    <stop offset="100%" stop-color="rgba(186,230,253,0.75)"/>
                </linearGradient>
            </defs>
            <!-- Rubber squeeze bulb -->
            <path d="M28 8 C28 2, 52 2, 52 8 L54 34 C54 38, 26 38, 26 34 Z" fill="url(#bulbGrad)"/>
            <rect x="24" y="32" width="32" height="7" rx="3" fill="#334155"/>
            <!-- Glass pipette barrel -->
            <path d="M32 39 L48 39 L45 88 L41.5 112 C41 115, 39 115, 38.5 112 L35 88 Z" fill="url(#glassGrad)" stroke="#64748b" stroke-width="1.5"/>
            ${filled ? `<path d="M35.5 64 L44.5 64 L43.8 88 L41 110 L39 110 L36.2 88 Z" fill="${liquidColor}" opacity="0.82"/>` : ''}
            <!-- Specular glass highlight -->
            <line x1="35" y1="44" x2="37" y2="85" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
        </svg>`,

    torch: () => `
        <svg viewBox="0 0 120 70" width="92" height="54" style="filter:drop-shadow(0 6px 10px rgba(15,23,42,0.25));">
            <defs>
                <linearGradient id="metalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#94a3b8"/>
                    <stop offset="30%" stop-color="#f1f5f9"/>
                    <stop offset="70%" stop-color="#475569"/>
                    <stop offset="100%" stop-color="#1e293b"/>
                </linearGradient>
            </defs>
            <!-- Pocket clip -->
            <path d="M22 20 L65 20 C68 20, 68 25, 65 25 L26 25" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
            <!-- Body -->
            <rect x="12" y="24" width="84" height="22" rx="4" fill="url(#metalGrad)" stroke="#334155" stroke-width="1.2"/>
            <!-- Knurled grip -->
            <rect x="34" y="25" width="32" height="20" fill="rgba(15,23,42,0.18)"/>
            <!-- Bezel & LED Lens -->
            <rect x="94" y="22" width="12" height="26" rx="3" fill="#334155"/>
            <ellipse cx="106" cy="35" rx="4" ry="11" fill="#fef08a" stroke="#eab308" stroke-width="1.5"/>
        </svg>`,

    cotton: () => `
        <svg viewBox="0 0 110 70" width="84" height="54" style="filter:drop-shadow(0 5px 8px rgba(15,23,42,0.18));">
            <line x1="12" y1="54" x2="80" y2="24" stroke="#e2c799" stroke-width="4" stroke-linecap="round"/>
            <g fill="#ffffff" stroke="#cbd5e1" stroke-width="1">
                <circle cx="82" cy="22" r="11"/>
                <circle cx="90" cy="18" r="9"/>
                <circle cx="76" cy="17" r="8"/>
                <circle cx="88" cy="26" r="7"/>
            </g>
            <path d="M88 14 Q98 10 102 15 M92 22 Q103 20 104 25" stroke="#cbd5e1" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        </svg>`,

    caliper: () => `
        <svg viewBox="0 0 120 70" width="94" height="54" style="filter:drop-shadow(0 5px 8px rgba(15,23,42,0.2));">
            <defs>
                <linearGradient id="steelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#f8fafc"/>
                    <stop offset="50%" stop-color="#cbd5e1"/>
                    <stop offset="100%" stop-color="#64748b"/>
                </linearGradient>
            </defs>
            <!-- Fixed Jaw -->
            <path d="M14 14 L22 14 L22 58 L14 48 Z" fill="url(#steelGrad)" stroke="#475569" stroke-width="1.2"/>
            <!-- Main Millimeter Beam -->
            <rect x="14" y="18" width="96" height="12" rx="2" fill="url(#steelGrad)" stroke="#475569" stroke-width="1.2"/>
            <!-- Sliding Vernier Carriage & Jaw -->
            <rect x="44" y="14" width="28" height="20" rx="2" fill="#0d9488" stroke="#0f766e" stroke-width="1.2"/>
            <path d="M44 34 L52 34 L52 58 L44 48 Z" fill="url(#steelGrad)" stroke="#475569" stroke-width="1.2"/>
            <text x="58" y="27" fill="#ffffff" font-size="8" font-weight="bold" font-family="monospace" text-anchor="middle">mm</text>
        </svg>`,

    syringe: (liquidColor = '#0d9488', filled = true) => `
        <svg viewBox="0 0 120 60" width="92" height="46" style="filter:drop-shadow(0 5px 9px rgba(15,23,42,0.22));">
            <!-- Plunger -->
            <rect x="6" y="27" width="28" height="6" fill="#94a3b8"/>
            <rect x="4" y="19" width="5" height="22" rx="2" fill="#475569"/>
            <!-- Barrel -->
            <rect x="28" y="18" width="54" height="24" rx="3" fill="rgba(241,245,249,0.92)" stroke="#64748b" stroke-width="1.5"/>
            ${filled ? `<rect x="34" y="21" width="42" height="18" rx="1" fill="${liquidColor}" opacity="0.82"/>` : ''}
            <!-- Graduations -->
            <g stroke="#334155" stroke-width="1">
                <line x1="38" y1="18" x2="38" y2="25"/>
                <line x1="48" y1="18" x2="48" y2="27"/>
                <line x1="58" y1="18" x2="58" y2="25"/>
                <line x1="68" y1="18" x2="68" y2="27"/>
            </g>
            <!-- Hub & Needle -->
            <rect x="82" y="25" width="9" height="10" rx="1" fill="#0d9488"/>
            <line x1="91" y1="30" x2="116" y2="30" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        </svg>`,

    bottle: (label, sub, color) => `
        <svg viewBox="0 0 64 92" width="52" height="75" style="filter:drop-shadow(0 6px 10px rgba(15,23,42,0.22));">
            <defs>
                <linearGradient id="amber_${label.replace(/[^a-zA-Z0-9]/g,'')}" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#451a03"/>
                    <stop offset="30%" stop-color="#b45309"/>
                    <stop offset="70%" stop-color="#78350f"/>
                    <stop offset="100%" stop-color="#451a03"/>
                </linearGradient>
            </defs>
            <!-- Dropper Cap -->
            <rect x="22" y="2" width="20" height="16" rx="4" fill="#1e293b"/>
            <rect x="20" y="15" width="24" height="6" rx="2" fill="${color}"/>
            <!-- Neck & Shoulders -->
            <path d="M22 21 L42 21 L52 34 L52 84 C52 88, 12 88, 12 84 L12 34 Z" fill="url(#amber_${label.replace(/[^a-zA-Z0-9]/g,'')})" stroke="#451a03" stroke-width="1.2"/>
            <!-- Clinical Label -->
            <rect x="14" y="38" width="36" height="38" rx="3" fill="#ffffff"/>
            <rect x="14" y="38" width="36" height="7" rx="2" fill="${color}"/>
            <text x="32" y="57" fill="#0f172a" font-size="10" font-weight="800" font-family="Inter, sans-serif" text-anchor="middle">${label}</text>
            <text x="32" y="69" fill="#64748b" font-size="7" font-weight="600" font-family="Inter, sans-serif" text-anchor="middle">${sub}</text>
            <!-- Glass Shine -->
            <line x1="17" y1="36" x2="17" y2="80" stroke="rgba(255,255,255,0.35)" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`
};
