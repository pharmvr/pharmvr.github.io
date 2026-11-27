/**
 * PharmVR 2D — LAB core toolkit
 * Math/easing helpers, procedural graphics primitives (lab room, metal, glass,
 * LCDs, reagent vials, syringe), particle system and a light-weight chart.
 * Every experiment scene is drawn procedurally on a 960×540 logical canvas.
 */
(function () {
    const LAB = window.LAB = window.LAB || {};
    LAB.W = 960;
    LAB.H = 540;
    LAB.registry = {};
    LAB.register = (nums, Cls) => [].concat(nums).forEach(n => { LAB.registry[n] = Cls; });

    /* ---------------- math ---------------- */
    const M = LAB.M = {
        clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
        lerp: (a, b, t) => a + (b - a) * t,
        inv: (a, b, v) => (v - a) / (b - a),
        rand: (a = 0, b = 1) => a + Math.random() * (b - a),
        randn() { // standard normal
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        },
        gauss: (mean, sd) => mean + M.randn() * sd,
        // frame-rate independent exponential approach
        approach: (cur, target, rate, dt) => target + (cur - target) * Math.exp(-rate * dt),
        smooth: t => t * t * (3 - 2 * t),
        noise1(x) { // cheap smooth value noise
            const i = Math.floor(x), f = x - i;
            const h = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
            return M.lerp(h(i), h(i + 1), f * f * (3 - 2 * f)) * 2 - 1;
        },
        mean: a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0,
        sem(a) {
            if (a.length < 2) return 0;
            const m = M.mean(a);
            return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)) / Math.sqrt(a.length);
        },
        linreg(xs, ys) {
            const n = xs.length, mx = M.mean(xs), my = M.mean(ys);
            let sxy = 0, sxx = 0, syy = 0;
            for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
            const slope = sxx ? sxy / sxx : 0;
            return { slope, intercept: my - slope * mx, r2: sxx && syy ? (sxy * sxy) / (sxx * syy) : 0 };
        }
    };

    LAB.ease = {
        linear: t => t,
        in: t => t * t,
        out: t => 1 - (1 - t) * (1 - t),
        inOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
        outBack: t => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
        outBounce(t) {
            const n = 7.5625, d = 2.75;
            if (t < 1 / d) return n * t * t;
            if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
            if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
            return n * (t -= 2.625 / d) * t + 0.984375;
        }
    };

    /* ---------------- tweens / timeline ---------------- */
    class Tweens {
        constructor() { this.list = []; }
        add(dur, onUpdate, { ease = LAB.ease.inOut, delay = 0, onDone } = {}) {
            const tw = { t: -delay, dur, onUpdate, ease, onDone };
            this.list.push(tw);
            return tw;
        }
        wait(sec, fn) { return this.add(sec, () => {}, { onDone: fn, ease: LAB.ease.linear }); }
        update(dt) {
            for (const tw of this.list.slice()) {
                tw.t += dt;
                if (tw.t < 0) continue;
                const p = Math.min(1, tw.t / tw.dur);
                tw.onUpdate(tw.ease(p), p);
                if (p >= 1) {
                    this.list.splice(this.list.indexOf(tw), 1);
                    if (tw.onDone) tw.onDone();
                }
            }
        }
        clear() { this.list = []; }
        get active() { return this.list.length > 0; }
    }
    LAB.Tweens = Tweens;

    /* ---------------- particles ---------------- */
    class Particles {
        constructor() { this.p = []; }
        emit(o) {
            this.p.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, life: 1, age: 0, r: 2, color: '#fff', drag: 0, shape: 'circle', alpha: 1, grow: 0 }, o));
        }
        update(dt) {
            for (let i = this.p.length - 1; i >= 0; i--) {
                const q = this.p[i];
                q.age += dt;
                if (q.age >= q.life) { this.p.splice(i, 1); continue; }
                q.vx += q.ax * dt; q.vy += q.ay * dt;
                if (q.drag) { q.vx *= Math.exp(-q.drag * dt); q.vy *= Math.exp(-q.drag * dt); }
                q.x += q.vx * dt; q.y += q.vy * dt;
                q.r += q.grow * dt;
                if (q.update) q.update(q, dt);
            }
        }
        draw(ctx) {
            for (const q of this.p) {
                const k = 1 - q.age / q.life;
                const a = q.alpha * (q.fade === false ? 1 : Math.min(1, k * 1.6));
                if (a <= 0) continue;
                ctx.globalAlpha = a;
                if (q.shape === 'bubble') {
                    ctx.strokeStyle = q.color; ctx.lineWidth = 0.8;
                    ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(0.3, q.r), 0, Math.PI * 2); ctx.stroke();
                    ctx.fillStyle = 'rgba(255,255,255,0.55)';
                    ctx.beginPath(); ctx.arc(q.x - q.r * 0.35, q.y - q.r * 0.35, Math.max(0.3, q.r * 0.3), 0, Math.PI * 2); ctx.fill();
                } else if (q.shape === 'soft') {
                    const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, Math.max(0.5, q.r));
                    g.addColorStop(0, q.color); g.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(0.5, q.r), 0, Math.PI * 2); ctx.fill();
                } else if (q.shape === 'spark') {
                    ctx.strokeStyle = q.color; ctx.lineWidth = q.r;
                    ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03); ctx.stroke();
                } else if (q.shape === 'drop') {
                    ctx.fillStyle = q.color;
                    ctx.beginPath();
                    ctx.moveTo(q.x, q.y - q.r * 1.8);
                    ctx.bezierCurveTo(q.x + q.r, q.y - q.r * 0.4, q.x + q.r, q.y + q.r, q.x, q.y + q.r);
                    ctx.bezierCurveTo(q.x - q.r, q.y + q.r, q.x - q.r, q.y - q.r * 0.4, q.x, q.y - q.r * 1.8);
                    ctx.fill();
                } else {
                    ctx.fillStyle = q.color;
                    ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(0.3, q.r), 0, Math.PI * 2); ctx.fill();
                }
            }
            ctx.globalAlpha = 1;
        }
        clear() { this.p = []; }
    }
    LAB.Particles = Particles;

    /* ---------------- graphics primitives ---------------- */
    const G = LAB.G = {};

    G.rr = (ctx, x, y, w, h, r = 6) => {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    };

    G.hexA = (hex, a) => {
        const h = hex.replace('#', '');
        const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        const n = parseInt(f, 16);
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    };
    G.mix = (hexA, hexB, t) => {
        const p = h => { const f = h.replace('#', ''); const n = parseInt(f.length === 3 ? f.split('').map(c => c + c).join('') : f, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
        const a = p(hexA), b = p(hexB);
        const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
        return `rgb(${c[0]},${c[1]},${c[2]})`;
    };

    /** soft elliptical contact shadow */
    G.shadow = (ctx, x, y, rx, ry, a = 0.35) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, ry / rx);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        g.addColorStop(0, `rgba(0,0,0,${a})`);
        g.addColorStop(0.6, `rgba(0,0,0,${a * 0.45})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    };

    /** brushed-steel rectangle; vertical=true shades left→right */
    G.metal = (ctx, x, y, w, h, { r = 3, vertical = false, tone = 'steel', stroke = true } = {}) => {
        const tones = {
            steel: ['#5b6673', '#cfd6de', '#f4f7fa', '#a3adb8', '#6b7683'],
            dark: ['#1b2027', '#3b434d', '#59626d', '#30363f', '#15191e'],
            brass: ['#6b4f12', '#c9a227', '#f6e39a', '#b58b1c', '#5e430c'],
            chrome: ['#3d4651', '#e9eef3', '#ffffff', '#8c97a3', '#2c333b'],
            black: ['#08090b', '#22262c', '#33383f', '#1a1d22', '#060708']
        }[tone] || tone;
        const g = vertical ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, tones[0]); g.addColorStop(0.18, tones[1]); g.addColorStop(0.42, tones[2]);
        g.addColorStop(0.75, tones[3]); g.addColorStop(1, tones[4]);
        ctx.fillStyle = g;
        G.rr(ctx, x, y, w, h, r); ctx.fill();
        if (stroke) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke(); }
    };

    /** shaded cylinder seen from the side (axis vertical) */
    G.cylinder = (ctx, x, y, w, h, base = '#8a96a3', { r = 2, alpha = 1 } = {}) => {
        ctx.save(); ctx.globalAlpha = alpha;
        const g = ctx.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, G.mix(base.startsWith('#') ? base : '#8a96a3', '#000000', 0.45));
        g.addColorStop(0.3, G.mix(base, '#ffffff', 0.45));
        g.addColorStop(0.5, G.mix(base, '#ffffff', 0.15));
        g.addColorStop(1, G.mix(base, '#000000', 0.55));
        ctx.fillStyle = g;
        G.rr(ctx, x, y, w, h, r); ctx.fill();
        ctx.restore();
    };

    /** transparent glass panel/tube with reflections */
    G.glass = (ctx, x, y, w, h, { r = 6, tint = 'rgba(200,225,240,0.10)', edge = 'rgba(220,240,255,0.65)', lw = 1.5 } = {}) => {
        ctx.save();
        ctx.fillStyle = tint;
        G.rr(ctx, x, y, w, h, r); ctx.fill();
        const g = ctx.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, 'rgba(255,255,255,0.20)');
        g.addColorStop(0.08, 'rgba(255,255,255,0.04)');
        g.addColorStop(0.85, 'rgba(255,255,255,0.0)');
        g.addColorStop(1, 'rgba(255,255,255,0.16)');
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = edge; ctx.lineWidth = lw; ctx.stroke();
        // specular streaks
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x + Math.min(8, w * 0.12), y + h * 0.08); ctx.lineTo(x + Math.min(8, w * 0.12), y + h * 0.55); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(x + w * 0.82, y + h * 0.12); ctx.lineTo(x + w * 0.82, y + h * 0.3); ctx.stroke();
        ctx.restore();
    };

    /** recessed LCD / LED readout with glowing text */
    G.lcd = (ctx, x, y, w, h, text, { color = '#34f5c5', label = '', size = 0, align = 'center', bg = '#04110d' } = {}) => {
        ctx.save();
        G.rr(ctx, x - 2, y - 2, w + 4, h + 4, 5);
        ctx.fillStyle = '#20252c'; ctx.fill();
        G.rr(ctx, x, y, w, h, 3);
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, bg); g.addColorStop(1, G.mix(bg, '#000000', 0.4));
        ctx.fillStyle = g; ctx.fill();
        const fs = size || Math.round(h * (label ? 0.48 : 0.62));
        ctx.font = `700 ${fs}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.textAlign = align; ctx.textBaseline = 'middle';
        ctx.shadowColor = color; ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        const tx = align === 'center' ? x + w / 2 : (align === 'right' ? x + w - 6 : x + 6);
        ctx.fillText(text, tx, y + h / 2 + (label ? h * 0.14 : 1));
        ctx.shadowBlur = 0;
        if (label) {
            ctx.font = `600 ${Math.max(7, Math.round(h * 0.2))}px Inter, sans-serif`;
            ctx.fillStyle = G.hexA(color.startsWith('#') ? color : '#34f5c5', 0.65);
            ctx.fillText(label, tx, y + h * 0.2);
        }
        // glass glare
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y, w, h * 0.42);
        ctx.restore();
    };

    G.led = (ctx, x, y, r, color, on = true) => {
        ctx.save();
        if (on) {
            const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
            g.addColorStop(0, G.hexA(color, 0.55)); g.addColorStop(1, G.hexA(color, 0));
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, Math.PI * 2); ctx.fill();
        }
        const g2 = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        g2.addColorStop(0, on ? '#ffffff' : '#9aa3ad');
        g2.addColorStop(0.35, on ? color : G.mix(color, '#222222', 0.7));
        g2.addColorStop(1, G.mix(color, '#000000', on ? 0.4 : 0.8));
        ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    };

    G.knob = (ctx, x, y, r, angle = 0) => {
        ctx.save();
        G.shadow(ctx, x + 1, y + 3, r * 1.1, r * 0.6, 0.3);
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r);
        g.addColorStop(0, '#f8fafc'); g.addColorStop(0.5, '#9aa4af'); g.addColorStop(1, '#3a424c');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1f252c'; ctx.lineWidth = 1; ctx.stroke();
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle) * r * 0.75, y + Math.sin(angle) * r * 0.75); ctx.stroke();
        ctx.restore();
    };

    G.screw = (ctx, x, y, r = 3) => {
        const g = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, r);
        g.addColorStop(0, '#f1f5f9'); g.addColorStop(1, '#4b5563');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(x - r * 0.6, y); ctx.lineTo(x + r * 0.6, y); ctx.stroke();
    };

    /** text label with leader line, like a textbook figure callout */
    G.callout = (ctx, text, ax, ay, lx, ly, { color = '#e2e8f0', bg = 'rgba(15,23,42,0.78)', size = 11 } = {}) => {
        ctx.save();
        ctx.strokeStyle = 'rgba(226,232,240,0.7)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lx, ly); ctx.stroke();
        ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(ax, ay, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.font = `600 ${size}px Inter, sans-serif`;
        const tw = ctx.measureText(text).width;
        const bx = lx < ax ? lx - tw - 12 : lx, by = ly - size * 0.9;
        G.rr(ctx, bx, by, tw + 12, size * 1.8, 4); ctx.fillStyle = bg; ctx.fill();
        ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.fillText(text, bx + 6, ly);
        ctx.restore();
    };

    /** small text helper */
    G.text = (ctx, s, x, y, { size = 12, weight = 600, color = '#e2e8f0', align = 'left', base = 'alphabetic', font = 'Inter, sans-serif', shadow = false } = {}) => {
        ctx.save();
        ctx.font = `${weight} ${size}px ${font}`;
        ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
        if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4; }
        ctx.fillText(s, x, y);
        ctx.restore();
    };

    /** reagent vial / ampoule (bottom-centre anchor) */
    G.vial = (ctx, x, y, { color = '#0d9488', label = '', h = 54, w = 26, fill = 0.7, cap = '#1e293b' } = {}) => {
        ctx.save();
        G.shadow(ctx, x, y, w * 0.75, 4, 0.35);
        const left = x - w / 2, top = y - h;
        // liquid
        const lh = (h - 16) * fill;
        ctx.fillStyle = G.hexA(color, 0.75);
        G.rr(ctx, left + 2, y - lh - 2, w - 4, lh, 3); ctx.fill();
        // glass body
        G.glass(ctx, left, top + 12, w, h - 12, { r: 4, tint: 'rgba(220,235,245,0.12)' });
        // cap
        G.metal(ctx, left + 3, top, w - 6, 13, { r: 2, tone: 'dark' });
        ctx.fillStyle = color; ctx.fillRect(left + 3, top + 10, w - 6, 3);
        // label
        if (label) {
            ctx.fillStyle = '#f8fafc';
            G.rr(ctx, left + 2, top + 22, w - 4, 18, 2); ctx.fill();
            ctx.fillStyle = color; ctx.fillRect(left + 2, top + 22, w - 4, 3);
            ctx.fillStyle = '#0f172a'; ctx.font = '700 7.5px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(label.slice(0, 8), x, top + 32.5);
        }
        ctx.restore();
    };

    /**
     * Hypodermic syringe. (x,y) = needle tip, angle = direction the needle points.
     * fill 0..1 = liquid in barrel; plunger 0..1 (1 = pulled back fully).
     */
    G.syringe = (ctx, x, y, angle, { fill = 0.8, plunger = null, color = '#0ea5e9', scale = 1, needle = 34 } = {}) => {
        const pl = plunger === null ? fill : plunger;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);
        // local: needle tip at (0,0), barrel extends to -x
        const nL = needle, hubL = 10, barL = 78, barH = 16;
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-nL, 0); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(-2, -0.4); ctx.lineTo(-nL, -0.4); ctx.stroke();
        // hub
        ctx.fillStyle = G.hexA(color, 0.9);
        G.rr(ctx, -nL - hubL, -4, hubL, 8, 2); ctx.fill();
        // barrel
        const bx = -nL - hubL - barL;
        const liqL = barL * 0.92 * M.clamp(fill, 0, 1);
        ctx.fillStyle = G.hexA(color, 0.72);
        ctx.fillRect(-nL - hubL - liqL, -barH / 2 + 2, liqL, barH - 4);
        G.glass(ctx, bx, -barH / 2, barL, barH, { r: 3, tint: 'rgba(235,245,250,0.25)', edge: 'rgba(190,205,220,0.95)', lw: 1.2 });
        // graduations
        ctx.strokeStyle = 'rgba(30,41,59,0.75)'; ctx.lineWidth = 0.8;
        for (let i = 1; i < 10; i++) {
            const gx = -nL - hubL - i * (barL / 10);
            ctx.beginPath(); ctx.moveTo(gx, -barH / 2); ctx.lineTo(gx, -barH / 2 + (i % 5 === 0 ? 7 : 4)); ctx.stroke();
        }
        // plunger rubber + rod
        const rubberX = -nL - hubL - barL * 0.92 * M.clamp(pl, 0, 1) - 5;
        ctx.fillStyle = '#111827'; ctx.fillRect(rubberX, -barH / 2 + 1.5, 5, barH - 3);
        const rodEnd = rubberX - barL * 0.9;
        G.metal(ctx, rodEnd, -3, rubberX - rodEnd, 6, { r: 1, tone: 'chrome', stroke: false });
        // thumb press + finger flange
        G.metal(ctx, rodEnd - 5, -11, 5, 22, { r: 2, tone: 'dark', stroke: false });
        G.metal(ctx, bx - 4, -barH / 2 - 7, 4, barH + 14, { r: 1.5, tone: 'dark', stroke: false });
        ctx.restore();
    };

    /** procedural lab room — cached per canvas size/options */
    const roomCache = {};
    G.labRoom = (ctx, W, H, opts = {}) => {
        const o = Object.assign({ benchY: 410, wall: '#d7e0e8', bench: 'dark', cabinets: true, window: true, shelf: true, seed: 1 }, opts);
        const key = JSON.stringify([W, H, o]);
        let c = roomCache[key];
        if (!c) {
            c = document.createElement('canvas');
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            c.width = W * dpr; c.height = H * dpr;
            const x = c.getContext('2d');
            x.scale(dpr, dpr);
            paintRoom(x, W, H, o);
            roomCache[key] = c;
        }
        ctx.drawImage(c, 0, 0, W, H);
    };

    function paintRoom(ctx, W, H, o) {
        const by = o.benchY;
        // wall
        const wg = ctx.createLinearGradient(0, 0, 0, by);
        wg.addColorStop(0, G.mix(o.wall, '#ffffff', 0.25));
        wg.addColorStop(1, G.mix(o.wall, '#5b6b7a', 0.25));
        ctx.fillStyle = wg; ctx.fillRect(0, 0, W, by);
        // subtle tiles
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
        for (let ty = 150; ty < by; ty += 34) { ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke(); }
        for (let tx = 0; tx < W; tx += 46) { for (let ty = 150; ty < by; ty += 34) { const off = (Math.floor(ty / 34) % 2) * 23; ctx.beginPath(); ctx.moveTo(tx + off, ty); ctx.lineTo(tx + off, ty + 34); ctx.stroke(); } }
        // window light
        if (o.window) {
            ctx.save();
            const wx = W * 0.07, wy = 40, ww = W * 0.2, wh = 170;
            const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
            sky.addColorStop(0, '#eaf4ff'); sky.addColorStop(1, '#c4d9ec');
            ctx.fillStyle = '#9aa8b5'; G.rr(ctx, wx - 6, wy - 6, ww + 12, wh + 12, 4); ctx.fill();
            ctx.fillStyle = sky; ctx.fillRect(wx, wy, ww, wh);
            ctx.fillStyle = 'rgba(160,190,210,0.5)';
            ctx.fillRect(wx, wy + wh * 0.62, ww, wh * 0.38);
            ctx.fillStyle = '#9aa8b5'; ctx.fillRect(wx + ww / 2 - 3, wy, 6, wh); ctx.fillRect(wx, wy + wh / 2 - 3, ww, 6);
            // light beam
            const lg = ctx.createLinearGradient(wx, wy, wx + ww * 2.4, by);
            lg.addColorStop(0, 'rgba(255,255,240,0.22)'); lg.addColorStop(1, 'rgba(255,255,240,0)');
            ctx.fillStyle = lg;
            ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + ww, wy); ctx.lineTo(wx + ww * 3, by); ctx.lineTo(wx + ww * 0.6, by); ctx.closePath(); ctx.fill();
            ctx.restore();
        }
        // upper cabinets
        if (o.cabinets) {
            const cx0 = o.window ? W * 0.32 : 0;
            for (let x = cx0; x < W; x += 130) {
                const cg = ctx.createLinearGradient(0, 0, 0, 92);
                cg.addColorStop(0, '#e9eef2'); cg.addColorStop(1, '#c5ced7');
                ctx.fillStyle = cg; ctx.fillRect(x + 2, 0, 126, 92);
                ctx.strokeStyle = 'rgba(80,95,110,0.35)'; ctx.strokeRect(x + 2.5, 0.5, 125, 91);
                ctx.fillStyle = '#8b96a1'; G.rr(ctx, x + 112, 60, 5, 22, 2); ctx.fill();
            }
            const sh = ctx.createLinearGradient(0, 92, 0, 120);
            sh.addColorStop(0, 'rgba(30,40,50,0.28)'); sh.addColorStop(1, 'rgba(30,40,50,0)');
            ctx.fillStyle = sh; ctx.fillRect(o.window ? W * 0.32 : 0, 92, W, 28);
        }
        // back shelf with out-of-focus reagent bottles
        if (o.shelf) {
            const sy = by - 120;
            const off = document.createElement('canvas');
            off.width = W; off.height = by;
            const s = off.getContext('2d');
            const colors = ['#8b5a2b', '#3b82f6', '#e2e8f0', '#16a34a', '#a16207', '#94a3b8', '#7c3aed', '#ef4444'];
            let rng = o.seed * 9301;
            const r = () => { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; };
            for (let x = W * 0.36; x < W - 20; x += 22 + r() * 26) {
                const h = 26 + r() * 34, w = 14 + r() * 12, col = colors[Math.floor(r() * colors.length)];
                s.globalAlpha = 0.55;
                s.fillStyle = G.mix(col, o.wall, 0.45);
                G.rr(s, x, sy - h, w, h, 3); s.fill();
                s.fillStyle = '#334155'; s.fillRect(x + w * 0.25, sy - h - 7, w * 0.5, 8);
                s.fillStyle = 'rgba(255,255,255,0.7)'; s.fillRect(x + 2, sy - h * 0.7, w - 4, h * 0.3);
                s.globalAlpha = 1;
            }
            ctx.save();
            try { ctx.filter = 'blur(2.2px)'; } catch (e) { /* unsupported */ }
            ctx.drawImage(off, 0, 0);
            ctx.restore();
            ctx.fillStyle = '#aab5bf'; ctx.fillRect(W * 0.34, sy, W * 0.66, 6);
            ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(W * 0.34, sy + 6, W * 0.66, 8);
        }
        // bench
        const dark = o.bench === 'dark';
        const bg = ctx.createLinearGradient(0, by, 0, H);
        bg.addColorStop(0, dark ? '#2c343e' : '#d5dce3');
        bg.addColorStop(0.75, dark ? '#1a2028' : '#b9c2cb');
        bg.addColorStop(1, dark ? '#12161c' : '#a7b1bb');
        ctx.fillStyle = bg; ctx.fillRect(0, by, W, H - by);
        // back edge / splash line
        ctx.fillStyle = dark ? '#3c4652' : '#eef2f5'; ctx.fillRect(0, by - 3, W, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, by + 1, W, 3);
        // reflection sheen
        const rg = ctx.createLinearGradient(0, by, W, H);
        rg.addColorStop(0, 'rgba(255,255,255,0.0)');
        rg.addColorStop(0.45, dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.25)');
        rg.addColorStop(0.6, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = rg; ctx.fillRect(0, by, W, H - by);
        // vignette
        const vg = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.5, W * 0.75);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.32)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }

    /* ---------------- chart ---------------- */
    class Chart {
        constructor(canvas, { w = 300, h = 200 } = {}) {
            this.canvas = canvas;
            this.w = w; this.h = h;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = w * dpr; canvas.height = h * dpr;
            canvas.style.width = '100%'; canvas.style.aspectRatio = `${w} / ${h}`;
            this.ctx = canvas.getContext('2d');
            this.ctx.scale(dpr, dpr);
            this.opts = null;
        }
        /**
         * opts: { xMin,xMax,yMin,yMax, xLabel,yLabel, logX, logY(base10 axis), xTicks:[], yTicks:[], xFmt, yFmt,
         *         series:[{name,color,points:[[x,y,err?]],type:'line'|'scatter'|'bar'|'step', dashed, width}], annotations:[{x?,y?,text,color}] }
         */
        draw(opts) {
            this.opts = opts;
            const c = this.ctx, w = this.w, h = this.h;
            const pad = { l: 42, r: 10, t: 12, b: 32 };
            c.clearRect(0, 0, w, h);
            c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
            const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
            const lx = v => opts.logX ? Math.log10(Math.max(1e-12, v)) : v;
            const ly = v => opts.logY ? Math.log10(Math.max(1e-12, v)) : v;
            const x0 = lx(opts.xMin), x1 = lx(opts.xMax), y0 = ly(opts.yMin), y1 = ly(opts.yMax);
            const X = v => pad.l + (lx(v) - x0) / (x1 - x0) * pw;
            const Y = v => pad.t + ph - (ly(v) - y0) / (y1 - y0) * ph;
            this.X = X; this.Y = Y;
            // grid + ticks
            const xt = opts.xTicks || niceTicks(opts.xMin, opts.xMax, 5);
            const yt = opts.yTicks || (opts.logY ? logTicks(opts.yMin, opts.yMax) : niceTicks(opts.yMin, opts.yMax, 5));
            c.font = '500 9.5px Inter, sans-serif'; c.fillStyle = '#64748b';
            c.strokeStyle = '#eef2f6'; c.lineWidth = 1;
            yt.forEach(v => {
                const yy = Math.round(Y(v)) + 0.5;
                c.beginPath(); c.moveTo(pad.l, yy); c.lineTo(pad.l + pw, yy); c.stroke();
                c.textAlign = 'right'; c.textBaseline = 'middle';
                c.fillText(opts.yFmt ? opts.yFmt(v) : fmt(v), pad.l - 5, yy);
            });
            xt.forEach(v => {
                const xx = Math.round(X(v)) + 0.5;
                c.beginPath(); c.moveTo(xx, pad.t); c.lineTo(xx, pad.t + ph); c.stroke();
                c.textAlign = 'center'; c.textBaseline = 'top';
                c.fillText(opts.xFmt ? opts.xFmt(v) : fmt(v), xx, pad.t + ph + 4);
            });
            c.strokeStyle = '#94a3b8';
            c.beginPath(); c.moveTo(pad.l, pad.t); c.lineTo(pad.l, pad.t + ph); c.lineTo(pad.l + pw, pad.t + ph); c.stroke();
            c.fillStyle = '#334155'; c.font = '600 10px Inter, sans-serif';
            c.textAlign = 'center'; c.textBaseline = 'bottom';
            c.fillText(opts.xLabel || '', pad.l + pw / 2, h - 1);
            c.save(); c.translate(10, pad.t + ph / 2); c.rotate(-Math.PI / 2);
            c.textBaseline = 'top'; c.fillText(opts.yLabel || '', 0, -6); c.restore();
            // clip plot
            c.save(); c.beginPath(); c.rect(pad.l, pad.t - 4, pw + 4, ph + 8); c.clip();
            (opts.series || []).forEach((s, si) => {
                const pts = s.points || [];
                c.strokeStyle = s.color; c.fillStyle = s.color; c.lineWidth = s.width || 2;
                c.setLineDash(s.dashed ? [5, 4] : []);
                if (s.type === 'bar') {
                    const n = opts.barCount || pts.length;
                    const bw = (s.barWidth || 0.6) * pw / Math.max(1, n);
                    pts.forEach(p => {
                        const bx = X(p[0]) - bw / 2 + (s.offset || 0) * bw;
                        const top = Y(p[1]), base = Y(Math.max(opts.yMin, 0));
                        const g = c.createLinearGradient(0, top, 0, base);
                        g.addColorStop(0, s.color); g.addColorStop(1, G.hexA(s.color.startsWith('#') ? s.color : '#0d9488', 0.55));
                        c.fillStyle = g; G.rr(c, bx, Math.min(top, base), bw, Math.abs(base - top), 3); c.fill();
                        if (p[2]) { // SEM whisker
                            c.strokeStyle = '#334155'; c.lineWidth = 1.2;
                            c.beginPath(); c.moveTo(bx + bw / 2, Y(p[1] - p[2])); c.lineTo(bx + bw / 2, Y(p[1] + p[2]));
                            c.moveTo(bx + bw / 2 - 4, Y(p[1] + p[2])); c.lineTo(bx + bw / 2 + 4, Y(p[1] + p[2])); c.stroke();
                        }
                        if (s.labels) { c.fillStyle = '#334155'; c.font = '600 9px Inter'; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText(fmt(p[1]), bx + bw / 2, top - 2); }
                    });
                } else if (s.type === 'scatter') {
                    pts.forEach(p => {
                        c.beginPath(); c.arc(X(p[0]), Y(p[1]), s.r || 4, 0, Math.PI * 2);
                        c.fillStyle = s.color; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.2; c.stroke();
                    });
                } else {
                    c.beginPath();
                    pts.forEach((p, i) => {
                        if (s.type === 'step' && i > 0) c.lineTo(X(p[0]), Y(pts[i - 1][1]));
                        i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1]));
                    });
                    c.stroke();
                    if (s.markers) pts.forEach(p => { c.beginPath(); c.arc(X(p[0]), Y(p[1]), 3.2, 0, Math.PI * 2); c.fillStyle = s.color; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke(); });
                }
                c.setLineDash([]);
            });
            (opts.annotations || []).forEach(a => {
                c.strokeStyle = a.color || '#94a3b8'; c.setLineDash([3, 3]); c.lineWidth = 1;
                if (a.x !== undefined) { c.beginPath(); c.moveTo(X(a.x), pad.t); c.lineTo(X(a.x), pad.t + ph); c.stroke(); }
                if (a.y !== undefined) { c.beginPath(); c.moveTo(pad.l, Y(a.y)); c.lineTo(pad.l + pw, Y(a.y)); c.stroke(); }
                c.setLineDash([]);
                if (a.text) {
                    c.fillStyle = a.color || '#475569'; c.font = '600 9px Inter'; c.textAlign = 'left'; c.textBaseline = 'bottom';
                    c.fillText(a.text, (a.x !== undefined ? X(a.x) : pad.l) + 3, (a.y !== undefined ? Y(a.y) : pad.t + 10) - 2);
                }
            });
            c.restore();
            // legend
            const named = (opts.series || []).filter(s => s.name);
            if (named.length) {
                c.font = '600 9px Inter, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left';
                let lxp = pad.l + 6, lyp = pad.t + 6;
                named.forEach(s => {
                    const tw = c.measureText(s.name).width;
                    if (lxp + tw + 20 > w - 4) { lxp = pad.l + 6; lyp += 12; }
                    c.fillStyle = s.color; c.fillRect(lxp, lyp - 3, 9, 6);
                    c.fillStyle = '#334155'; c.fillText(s.name, lxp + 12, lyp);
                    lxp += tw + 22;
                });
            }
        }
    }
    function niceTicks(a, b, n) {
        const span = b - a; if (span <= 0) return [a];
        const step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)));
        const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0) || mag * 10;
        const out = [];
        for (let v = Math.ceil(a / step) * step; v <= b + step * 1e-6; v += step) out.push(+v.toFixed(10));
        return out;
    }
    function logTicks(a, b) {
        const out = [];
        for (let e = Math.floor(Math.log10(a)); e <= Math.ceil(Math.log10(b)); e++) {
            [1, 2, 5].forEach(m => { const v = m * Math.pow(10, e); if (v >= a * 0.999 && v <= b * 1.001) out.push(v); });
        }
        return out;
    }
    function fmt(v) {
        if (Math.abs(v) >= 1000) return (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k';
        if (Math.abs(v) < 0.01 && v !== 0) return v.toExponential(0);
        return String(+v.toFixed(2));
    }
    LAB.Chart = Chart;
    LAB.fmt = fmt;
})();
