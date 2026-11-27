/**
 * PharmVR 2D — Procedural animated rodents
 *  LAB.Rodent    : side-view albino mouse / rat with walking gait, breathing, sniffing,
 *                  ataxia, sedation, Straub tail, tonic extension, clonic jerks, paw licking.
 *  LAB.RodentTop : top-down mouse for arenas & mazes with steering + gait.
 * Units: local px at scale 1 ≈ a 95 px long mouse. Ground contact at y = 0.
 */
(function () {
    const { M, G } = LAB;

    const FUR_TOP = '#ffffff', FUR_MID = '#eef2f6', FUR_LOW = '#c9d2dc';
    const SKIN = '#f6b7c3', SKIN_DK = '#e48ea0';

    class Rodent {
        constructor(o = {}) {
            this.x = o.x || 0; this.y = o.y || 0;
            this.scale = o.scale || 1;
            this.kind = o.kind || 'mouse';
            this.facing = o.facing || 1;
            this.rot = 0;                 // whole-body rotation (rad)
            this.t = Math.random() * 10;
            this.phase = 0;               // gait phase 0..1
            this.gaitSpeed = 0;           // cycles / s
            this.stride = o.kind === 'rat' ? 16 : 14;
            // pose blend targets (0..1) — set these; they are smoothed internally
            this.pose = { walk: 0, sedation: 0, ataxia: 0, tonic: 0, clonic: 0, lick: 0, straub: 0, crouch: 0, sniff: 1, hunch: 0, rear: 0 };
            this.p = Object.assign({}, this.pose);
            this.headAngle = 0;
            this.blink = 0; this._nextBlink = 2 + Math.random() * 3;
            this.breathRate = o.breathRate || 2.6;
            this.eyeOpen = 1;
            this.jitter = { h: 0, b: 0, legs: [0, 0, 0, 0] };
            this.tailSeed = Math.random() * 6;
            this.alpha = 1;
            this.shadow = true;
            this.groundY = null;          // if set, shadow is drawn at this world y
        }

        set(pose) { Object.assign(this.pose, pose); return this; }

        update(dt) {
            this.t += dt;
            for (const k in this.pose) this.p[k] = M.approach(this.p[k], this.pose[k], k === 'clonic' ? 14 : 4, dt);
            this.phase = (this.phase + this.gaitSpeed * dt) % 1;
            // blinking
            this._nextBlink -= dt;
            if (this._nextBlink < 0) { this.blink = 1; this._nextBlink = 2 + Math.random() * 4; }
            this.blink = Math.max(0, this.blink - dt * 7);
            // clonic jerks: rapid random impulses
            const c = this.p.clonic;
            if (c > 0.02) {
                if (Math.random() < dt * 18) {
                    this.jitter.h = (Math.random() - 0.5) * 0.7 * c;
                    this.jitter.b = (Math.random() - 0.5) * 6 * c;
                    this.jitter.legs = this.jitter.legs.map(() => (Math.random() - 0.5) * 16 * c);
                }
            }
            this.jitter.h *= Math.exp(-dt * 10);
            this.jitter.b *= Math.exp(-dt * 10);
            this.jitter.legs = this.jitter.legs.map(v => v * Math.exp(-dt * 8));
            // head motion: sniffing + ataxic sway
            const sniff = Math.sin(this.t * 9) * 0.04 * this.p.sniff * (1 - this.p.sedation);
            const look = M.noise1(this.t * 0.6 + this.tailSeed) * 0.18 * (1 - this.p.tonic) * (1 - this.p.sedation * 0.7);
            this.headAngle = sniff + look + this.p.sedation * 0.32 + this.p.lick * 0.55 - this.p.tonic * 0.25 + this.jitter.h + this.p.rear * -0.2;
            this.eyeOpen = Math.min(1 - this.blink, 1 - this.p.sedation * 0.65);
        }

        /** world-space position of the mouth (for licking effects etc.) */
        get rumpX() { return this.x - 44 * this.scale * this.facing; }

        draw(ctx) {
            const s = this.scale, p = this.p;
            ctx.save();
            ctx.globalAlpha = this.alpha;
            if (this.shadow) {
                const gy = this.groundY !== null ? this.groundY : this.y;
                const lift = Math.max(0, gy - this.y);
                G.shadow(ctx, this.x, gy + 1, 50 * s * (1 + p.tonic * 0.2), 7 * s, 0.32 * Math.max(0.2, 1 - lift / 120));
            }
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.scale(this.facing * s, s);

            const isRat = this.kind === 'rat';
            const L = isRat ? 1.12 : 1;
            const breath = 1 + Math.sin(this.t * this.breathRate * Math.PI * 2) * 0.025;
            const lower = p.sedation * 5 + p.crouch * 6 - p.tonic * 1;
            const bob = (p.walk > 0.1 ? Math.abs(Math.sin(this.phase * Math.PI * 2)) * 1.5 * p.walk : 0) + this.jitter.b;
            const roll = Math.sin(this.t * 3.1) * 0.1 * p.ataxia;

            ctx.save();
            ctx.translate(0, lower + bob * 0.5);
            ctx.rotate(roll - p.rear * 0.9);

            // ---- far-side legs (behind body)
            this._legs(ctx, true, L);
            // ---- tail
            this._tail(ctx, L);
            // ---- body
            ctx.save();
            ctx.translate(0, -22);
            ctx.scale(L * (1 + p.tonic * 0.18), breath * (1 - p.sedation * 0.12 + p.hunch * 0.12));
            ctx.translate(0, 22);
            this._body(ctx);
            ctx.restore();
            // ---- near legs
            this._legs(ctx, false, L);
            // ---- head
            ctx.save();
            ctx.translate(22 * L * (1 + p.tonic * 0.15), -27 + p.sedation * 3);
            ctx.rotate(this.headAngle);
            this._head(ctx);
            ctx.restore();
            ctx.restore();
            ctx.restore();
        }

        _body(ctx) {
            const g = ctx.createLinearGradient(0, -48, 0, -6);
            g.addColorStop(0, FUR_TOP); g.addColorStop(0.55, FUR_MID); g.addColorStop(1, FUR_LOW);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(24, -36);
            ctx.bezierCurveTo(10, -47, -24, -48, -40, -35);
            ctx.bezierCurveTo(-49, -27, -49, -12, -37, -8);
            ctx.bezierCurveTo(-20, -4, 6, -5, 21, -9);
            ctx.bezierCurveTo(30, -12, 32, -28, 24, -36);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(100,116,139,0.35)'; ctx.lineWidth = 0.9; ctx.stroke();
            // rim light + fur strokes
            ctx.save(); ctx.clip();
            const hl = ctx.createRadialGradient(-6, -44, 2, -6, -40, 30);
            hl.addColorStop(0, 'rgba(255,255,255,0.9)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = hl; ctx.fillRect(-50, -50, 90, 30);
            ctx.strokeStyle = 'rgba(148,163,184,0.28)'; ctx.lineWidth = 0.7;
            for (let i = 0; i < 16; i++) {
                const fx = -38 + i * 4, fy = -12 - (i % 3) * 3;
                ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx - 2, fy + 3, fx - 4, fy + 5); ctx.stroke();
            }
            // haunch contour
            ctx.strokeStyle = 'rgba(148,163,184,0.35)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(-28, -20, 12, -2.3, -0.3); ctx.stroke();
            ctx.restore();
        }

        _head(ctx) {
            const p = this.p;
            // far ear
            this._ear(ctx, 6, -13, -0.15, 0.8);
            const g = ctx.createLinearGradient(0, -16, 0, 10);
            g.addColorStop(0, FUR_TOP); g.addColorStop(1, FUR_LOW);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(-9, -11);
            ctx.bezierCurveTo(2, -17, 18, -12, 27, 1);
            ctx.bezierCurveTo(30, 5, 29, 8, 25, 8.5);
            ctx.bezierCurveTo(16, 10, 4, 11, -6, 8);
            ctx.bezierCurveTo(-13, 4, -13, -6, -9, -11);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(100,116,139,0.35)'; ctx.lineWidth = 0.9; ctx.stroke();
            // nose
            ctx.fillStyle = SKIN_DK; ctx.beginPath(); ctx.arc(27.5, 4, 2.2, 0, Math.PI * 2); ctx.fill();
            // mouth
            ctx.strokeStyle = 'rgba(190,110,130,0.8)'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(25, 8); ctx.quadraticCurveTo(22, 9.5, 19, 8.5); ctx.stroke();
            // eye (albino red)
            const eo = Math.max(0.08, this.eyeOpen);
            ctx.save(); ctx.translate(13, -3); ctx.scale(1, eo);
            const eg = ctx.createRadialGradient(-0.6, -0.8, 0.2, 0, 0, 3);
            eg.addColorStop(0, '#ff6b81'); eg.addColorStop(0.5, '#c0122f'); eg.addColorStop(1, '#5c0614');
            ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(-0.9, -1, 0.9, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            if (eo < 0.6) { ctx.strokeStyle = 'rgba(148,163,184,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(9.5, -3 - 3 * eo); ctx.quadraticCurveTo(13, -4 - 3 * eo, 16.5, -3 - 3 * eo); ctx.stroke(); }
            // whiskers
            const tw = Math.sin(this.t * 14) * 1.2 * p.sniff * (1 - p.sedation);
            ctx.strokeStyle = 'rgba(100,116,139,0.55)'; ctx.lineWidth = 0.45;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath(); ctx.moveTo(23, 4);
                ctx.quadraticCurveTo(32, 2 + i * 2 + tw, 42, i * 4.5 + tw * 1.5);
                ctx.stroke();
            }
            // near ear
            this._ear(ctx, 1, -12, -0.35, 1);
        }

        _ear(ctx, x, y, rot, k) {
            ctx.save(); ctx.translate(x, y); ctx.rotate(rot - this.p.sedation * 0.3);
            const eg = ctx.createRadialGradient(0, -2, 1, 0, -2, 9 * k);
            eg.addColorStop(0, '#f9c4cf'); eg.addColorStop(0.7, '#f3a8b8'); eg.addColorStop(1, '#e88aa0');
            ctx.fillStyle = eg;
            ctx.beginPath(); ctx.ellipse(0, -3, 7 * k, 9 * k, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(200,110,130,0.55)'; ctx.lineWidth = 0.8; ctx.stroke();
            ctx.fillStyle = 'rgba(214,110,135,0.35)';
            ctx.beginPath(); ctx.ellipse(0.8, -2, 4 * k, 6 * k, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        _tail(ctx, L) {
            const p = this.p;
            const n = this.kind === 'rat' ? 20 : 17, seg = this.kind === 'rat' ? 5 : 4.6;
            let x = -45 * L, y = -18;
            let a = Math.PI + 0.55;                   // start: back & down
            const straub = Math.max(p.straub, p.tonic * 0.6);
            ctx.lineCap = 'round';
            const pts = [[x, y]];
            for (let i = 0; i < n; i++) {
                const k = i / n;
                const sway = Math.sin(this.t * 2.2 + this.tailSeed - i * 0.35) * 0.09 * (1 - p.sedation * 0.7) * (1 - straub);
                let curl = -0.11 + 0.02 * Math.sin(this.t * 0.7);           // gentle upward curve
                curl = M.lerp(curl, 0.16 * (k < 0.35 ? 1 : -0.4), straub);  // S-shaped erect (Straub) tail
                if (p.tonic > 0.3) curl = M.lerp(curl, 0, p.tonic);
                a += curl + sway + this.jitter.legs[0] * 0.004;
                if (i === 0) a = M.lerp(Math.PI + 0.55, Math.PI - 1.2, straub) + (p.tonic > 0.3 ? -0.5 * p.tonic : 0);
                x += Math.cos(a) * seg; y += Math.sin(a) * seg;
                // keep tail above ground
                if (y > 0) y = 0;
                pts.push([x, y]);
            }
            for (let i = 0; i < pts.length - 1; i++) {
                const w = M.lerp(4.4, 1.0, i / pts.length);
                ctx.strokeStyle = i % 2 ? SKIN : '#f0a9b7';
                ctx.lineWidth = w;
                ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.8;
            ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1] - 1) : ctx.moveTo(q[0], q[1] - 1)); ctx.stroke();
        }

        _legs(ctx, far, L) {
            const p = this.p;
            const legs = far
                ? [{ hip: [-23 * L, -15], hind: true, off: 0.5, j: 2 }, { hip: [19 * L, -13], hind: false, off: 0.0, j: 3 }]
                : [{ hip: [-29 * L, -15], hind: true, off: 0.0, j: 0 }, { hip: [14 * L, -12], hind: false, off: 0.5, j: 1 }];
            for (const lg of legs) {
                const [hx, hy] = lg.hip;
                // gait foot target
                const ph = (this.phase + lg.off) % 1;
                let fx, fy;
                const st = this.stride * p.walk;
                if (ph < 0.62) { fx = hx + st / 2 - (ph / 0.62) * st; fy = 0; }
                else { const q = (ph - 0.62) / 0.38; fx = hx - st / 2 + q * st; fy = -Math.sin(q * Math.PI) * 6 * p.walk; }
                fx += lg.hind ? -2 : 3;
                // ataxic splay & slip
                fx += Math.sin(this.t * 4 + lg.off * 7) * 5 * p.ataxia;
                fy -= p.lower || 0;
                // tonic extension: hind legs straight back, forelimbs forward
                if (p.tonic > 0.01) {
                    const tx = lg.hind ? hx - 34 : hx + 26, ty = lg.hind ? -6 : -4;
                    fx = M.lerp(fx, tx, p.tonic); fy = M.lerp(fy, ty, p.tonic);
                }
                // paw licking: near fore paw raised to mouth
                if (!lg.hind && !far && p.lick > 0.01) {
                    fx = M.lerp(fx, hx + 16, p.lick); fy = M.lerp(fy, -26, p.lick);
                }
                if (p.rear > 0.01 && !lg.hind) { fx = M.lerp(fx, hx + 10, p.rear); fy = M.lerp(fy, -10, p.rear); }
                fx += this.jitter.legs[lg.j] * (lg.hind ? 1 : 0.7);
                fy += Math.abs(this.jitter.legs[lg.j]) * -0.4;
                // compensate body lowering so feet stay on ground
                fy -= p.sedation * 5 + p.crouch * 6;

                const col = far ? '#cfd7e0' : '#f4f6f9';
                const dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy) || 1;
                const bend = (lg.hind ? 1 : -1) * Math.max(0, 22 - d) * 0.55;
                const kx = hx + dx / 2 + (-dy / d) * bend * (lg.hind ? -1 : 1);
                const ky = hy + dy / 2 + (dx / d) * bend * (lg.hind ? -1 : 1);
                ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.strokeStyle = col; ctx.lineWidth = lg.hind ? 8 : 6;
                ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.stroke();
                ctx.strokeStyle = far ? '#d9a1ad' : '#f2b4c1'; ctx.lineWidth = lg.hind ? 3.2 : 2.6;
                ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
                // paw
                ctx.fillStyle = far ? '#dc9fae' : SKIN;
                ctx.beginPath();
                if (lg.hind) ctx.ellipse(fx + (p.tonic > 0.5 ? -4 : 3), fy - 1, 6, 2, p.tonic > 0.5 ? 0.2 : 0, 0, Math.PI * 2);
                else ctx.ellipse(fx + 2, fy - 1, 3.6, 1.8, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    LAB.Rodent = Rodent;

    /* ============================================================ */
    class RodentTop {
        constructor(o = {}) {
            this.x = o.x || 0; this.y = o.y || 0;
            this.heading = o.heading || 0;
            this.scale = o.scale || 1;
            this.speed = 0;              // px / s
            this.maxSpeed = o.maxSpeed || 90;
            this.turnRate = o.turnRate || 5;
            this.target = null;
            this.t = Math.random() * 10;
            this.phase = 0;
            this.tailSeed = Math.random() * 6;
            this.distance = 0;
            this.rearing = 0;            // 0..1 (body shortens)
            this.groom = 0;
            this.freeze = 0;
            this.color = o.color || '#f8fafc';
        }
        goTo(x, y, speed) { this.target = { x, y }; if (speed !== undefined) this.maxSpeed = speed; }
        get atTarget() { return !this.target || Math.hypot(this.target.x - this.x, this.target.y - this.y) < 6; }
        update(dt) {
            this.t += dt;
            let want = 0;
            if (this.target && !this.atTarget && this.freeze < 0.5) {
                const da = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                let diff = da - this.heading;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.heading += M.clamp(diff, -this.turnRate * dt, this.turnRate * dt);
                want = this.maxSpeed * Math.max(0.2, Math.cos(diff));
                const dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
                want = Math.min(want, dist * 3 + 10);
            }
            this.speed = M.approach(this.speed, want, 6, dt);
            const dx = Math.cos(this.heading) * this.speed * dt, dy = Math.sin(this.heading) * this.speed * dt;
            this.x += dx; this.y += dy;
            this.distance += Math.hypot(dx, dy);
            this.phase = (this.phase + this.speed * dt / 22) % 1;
        }
        draw(ctx) {
            const s = this.scale;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.heading);
            ctx.scale(s, s);
            G.shadow(ctx, 2, 3, 30, 15, 0.28);
            const moving = Math.min(1, this.speed / 30);
            const wig = Math.sin(this.phase * Math.PI * 2);
            // tail
            ctx.lineCap = 'round';
            let tx = -24, ty = 0, ta = Math.PI;
            for (let i = 0; i < 16; i++) {
                ta += Math.sin(this.t * 3 + this.tailSeed - i * 0.45) * (0.06 + 0.05 * moving) + wig * 0.02;
                const nx = tx + Math.cos(ta) * 3.6, ny = ty + Math.sin(ta) * 3.6;
                ctx.strokeStyle = SKIN; ctx.lineWidth = M.lerp(3.6, 0.9, i / 16);
                ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(nx, ny); ctx.stroke();
                tx = nx; ty = ny;
            }
            // paws
            ctx.fillStyle = SKIN;
            [[12, 1], [12, -1], [-12, 1], [-12, -1]].forEach(([px, side], i) => {
                const off = (i === 0 || i === 3 ? 1 : -1) * wig * 4 * moving;
                ctx.beginPath(); ctx.ellipse(px + off, side * 11, 3.2, 2, 0, 0, Math.PI * 2); ctx.fill();
            });
            // body
            const len = 1 - this.rearing * 0.25;
            const bg = ctx.createRadialGradient(-2, -3, 2, 0, 0, 26);
            bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.7, this.color); bg.addColorStop(1, '#cbd5e1');
            ctx.fillStyle = bg;
            ctx.beginPath(); ctx.ellipse(-3, 0, 24 * len, 12.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(100,116,139,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
            // head
            const hy = this.groom > 0.3 ? Math.sin(this.t * 12) * 2 : Math.sin(this.t * 7) * 0.8;
            ctx.save(); ctx.translate(17 * len, hy);
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.moveTo(-6, -8.5); ctx.quadraticCurveTo(8, -7.5, 16, 0); ctx.quadraticCurveTo(8, 7.5, -6, 8.5); ctx.closePath(); ctx.fill();
            ctx.stroke();
            // ears
            [-1, 1].forEach(sd => {
                ctx.fillStyle = '#f5b3c1';
                ctx.beginPath(); ctx.ellipse(-2, sd * 9, 4.5, 3.4, sd * 0.4, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(200,110,130,0.5)'; ctx.lineWidth = 0.6; ctx.stroke();
            });
            // eyes
            ctx.fillStyle = '#b3122c';
            ctx.beginPath(); ctx.arc(6, -4.2, 1.5, 0, Math.PI * 2); ctx.arc(6, 4.2, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = SKIN_DK; ctx.beginPath(); ctx.arc(16, 0, 1.6, 0, Math.PI * 2); ctx.fill();
            // whiskers
            ctx.strokeStyle = 'rgba(100,116,139,0.45)'; ctx.lineWidth = 0.4;
            [-1, 1].forEach(sd => { for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(13, sd * 2); ctx.lineTo(22 + i * 2, sd * (6 + i * 3)); ctx.stroke(); } });
            ctx.restore();
            ctx.restore();
        }
    }
    LAB.RodentTop = RodentTop;
})();
