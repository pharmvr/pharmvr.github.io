/**
 * PharmVR 2D — procedural guinea pig (side view)
 *
 * Stockier than LAB.Rodent's mouse/rat, with short legs, rounded rump and no
 * tail. Poses are blended the same way: set them and they are smoothed.
 *
 *   dyspnoea 0..1  laboured breathing — deeper, faster excursions, head extended
 *   ataxia   0..1  swaying, unsteady stance
 *   crouch   0..1  hunched, pressed to the floor
 *   collapse 0..1  lying on the side (the end point of the aerosol test)
 *
 * Units: at scale 1 the animal is about 150 px long, ground contact at y = 0.
 */
(function () {
    const { M, G } = LAB;

    const FUR_TOP = '#c8a882', FUR_MID = '#a98862', FUR_LOW = '#7d6244';
    const FUR_WHITE = '#f2e8dc', SKIN = '#e8b4ae';

    class GuineaPig {
        constructor(o = {}) {
            this.x = o.x || 0; this.y = o.y || 0;
            this.scale = o.scale || 1;
            this.facing = o.facing || 1;
            this.rot = 0;
            this.t = Math.random() * 10;
            this.breathRate = o.breathRate || 2.4;
            this.pose = { dyspnoea: 0, ataxia: 0, crouch: 0, collapse: 0, sniff: 1, walk: 0 };
            this.p = Object.assign({}, this.pose);
            this.phase = 0;
            this.gaitSpeed = 0;
            this.blink = 0; this._nextBlink = 2 + Math.random() * 3;
            this.alpha = 1;
            this.shadow = true;
            this.groundY = null;
            this.seed = Math.random() * 6;
        }

        set(pose) { Object.assign(this.pose, pose); return this; }

        update(dt) {
            this.t += dt;
            for (const k in this.pose) this.p[k] = M.approach(this.p[k], this.pose[k], 3.5, dt);
            this.phase = (this.phase + this.gaitSpeed * dt) % 1;
            this._nextBlink -= dt;
            if (this._nextBlink < 0) { this.blink = 1; this._nextBlink = 2 + Math.random() * 4; }
            this.blink = Math.max(0, this.blink - dt * 7);
        }

        /** breathing excursion 0..1, faster and deeper with dyspnoea */
        get breath() {
            const rate = this.breathRate * (1 + this.p.dyspnoea * 1.9);
            const depth = 1 + this.p.dyspnoea * 1.5;
            return Math.sin(this.t * rate * Math.PI * 2) * depth;
        }

        draw(ctx) {
            const s = this.scale, p = this.p;
            ctx.save();
            ctx.globalAlpha = this.alpha;
            if (this.shadow) {
                const gy = this.groundY !== null ? this.groundY : this.y;
                G.shadow(ctx, this.x, gy + 1, 58 * s, 8 * s, 0.32);
            }
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot + p.collapse * 1.35 * this.facing);
            ctx.scale(this.facing * s, s);

            const br = this.breath;
            const lower = p.crouch * 7 + p.collapse * 12;
            const sway = Math.sin(this.t * 2.6 + this.seed) * 0.06 * p.ataxia;
            const bob = p.walk > 0.1 ? Math.abs(Math.sin(this.phase * Math.PI * 2)) * 1.6 * p.walk : 0;

            ctx.save();
            ctx.translate(0, lower + bob * 0.5);
            ctx.rotate(sway);

            this._legs(ctx, true);
            // ---- body: a broad oval, flank rising and falling with each breath
            ctx.save();
            ctx.translate(0, -26);
            ctx.scale(1 + Math.max(0, br) * 0.012, 1 + br * 0.030 - p.crouch * 0.07);
            ctx.translate(0, 26);
            this._body(ctx);
            ctx.restore();
            this._legs(ctx, false);

            // ---- head, extended forward and up when air-hungry
            ctx.save();
            ctx.translate(46, -30 - p.dyspnoea * 5);
            ctx.rotate(-p.dyspnoea * 0.3 + p.collapse * 0.2);
            this._head(ctx);
            ctx.restore();
            ctx.restore();
            ctx.restore();
        }

        _body(ctx) {
            const g = ctx.createLinearGradient(0, -52, 0, -6);
            g.addColorStop(0, FUR_TOP); g.addColorStop(0.55, FUR_MID); g.addColorStop(1, FUR_LOW);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(40, -42);
            ctx.bezierCurveTo(16, -54, -34, -54, -52, -36);
            ctx.bezierCurveTo(-62, -24, -58, -8, -42, -5);
            ctx.bezierCurveTo(-16, -1, 20, -2, 38, -8);
            ctx.bezierCurveTo(50, -14, 50, -34, 40, -42);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(90,70,48,0.4)'; ctx.lineWidth = 0.9; ctx.stroke();

            ctx.save(); ctx.clip();
            // white belly patch and rump rosette
            ctx.fillStyle = FUR_WHITE;
            ctx.beginPath(); ctx.ellipse(-6, -10, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(248,240,228,0.5)';
            ctx.beginPath(); ctx.ellipse(-36, -30, 18, 16, 0.3, 0, Math.PI * 2); ctx.fill();
            // fur strokes
            ctx.strokeStyle = 'rgba(120,96,66,0.3)'; ctx.lineWidth = 0.8;
            for (let i = 0; i < 22; i++) {
                const fx = -48 + i * 4.4, fy = -14 - (i % 4) * 4;
                ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx - 2, fy + 4, fx - 5, fy + 6); ctx.stroke();
            }
            ctx.restore();
        }

        _head(ctx) {
            const p = this.p;
            const g = ctx.createLinearGradient(0, -18, 0, 12);
            g.addColorStop(0, FUR_TOP); g.addColorStop(1, FUR_LOW);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(-14, -14);
            ctx.bezierCurveTo(0, -22, 22, -16, 30, -1);
            ctx.bezierCurveTo(33, 4, 31, 9, 26, 10);
            ctx.bezierCurveTo(14, 13, -4, 13, -14, 9);
            ctx.bezierCurveTo(-21, 4, -21, -8, -14, -14);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(90,70,48,0.4)'; ctx.lineWidth = 0.9; ctx.stroke();

            // petal-shaped ear
            ctx.save(); ctx.translate(-2, -14); ctx.rotate(-0.25);
            ctx.fillStyle = SKIN;
            ctx.beginPath(); ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(190,120,118,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
            ctx.restore();

            // nose and mouth; nostrils flare with dyspnoea
            const flare = 1 + p.dyspnoea * 0.5;
            ctx.fillStyle = '#d28d8a';
            ctx.beginPath(); ctx.ellipse(30, 2, 3.2 * flare, 2.4 * flare, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(160,100,98,0.75)'; ctx.lineWidth = 0.9;
            ctx.beginPath(); ctx.moveTo(29, 5); ctx.quadraticCurveTo(25, 8, 21, 6.5); ctx.stroke();
            // open-mouth breathing when severely dyspnoeic
            if (p.dyspnoea > 0.55) {
                const o = (p.dyspnoea - 0.55) / 0.45;
                ctx.fillStyle = 'rgba(120,50,55,0.8)';
                ctx.beginPath(); ctx.ellipse(24, 8, 4.5, 2 + o * 2.6, 0.2, 0, Math.PI * 2); ctx.fill();
            }

            // eye
            const eo = Math.max(0.1, 1 - this.blink - p.collapse * 0.7);
            ctx.save(); ctx.translate(13, -5); ctx.scale(1, eo);
            const eg = ctx.createRadialGradient(-0.6, -0.8, 0.2, 0, 0, 3.4);
            eg.addColorStop(0, '#5a3524'); eg.addColorStop(0.6, '#2b1510'); eg.addColorStop(1, '#120806');
            ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(-1, -1.2, 1, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // whiskers
            ctx.strokeStyle = 'rgba(120,100,76,0.5)'; ctx.lineWidth = 0.5;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath(); ctx.moveTo(26, 2);
                ctx.quadraticCurveTo(38, i * 2.4, 50, i * 5.5);
                ctx.stroke();
            }
        }

        _legs(ctx, far) {
            const p = this.p;
            const legs = far
                ? [{ hip: [-30, -14], j: 0.5 }, { hip: [26, -12], j: 0 }]
                : [{ hip: [-36, -14], j: 0 }, { hip: [22, -11], j: 0.5 }];
            const col = far ? '#8d7050' : FUR_MID;
            for (const lg of legs) {
                const [hx, hy] = lg.hip;
                const ph = (this.phase + lg.j) % 1;
                let fx = hx, fy = 0;
                if (p.walk > 0.05) {
                    const st = 11 * p.walk;
                    if (ph < 0.6) { fx = hx + st / 2 - (ph / 0.6) * st; fy = 0; }
                    else { const q = (ph - 0.6) / 0.4; fx = hx - st / 2 + q * st; fy = -Math.sin(q * Math.PI) * 4 * p.walk; }
                }
                fx += Math.sin(this.t * 4 + lg.j * 7) * 3 * p.ataxia;
                fy -= p.crouch * 7 + p.collapse * 12;
                ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(fx, fy - 2); ctx.stroke();
                ctx.fillStyle = SKIN;
                ctx.beginPath(); ctx.ellipse(fx + 2, fy - 1, 4.4, 2, 0, 0, Math.PI * 2); ctx.fill();
            }
        }
    }

    LAB.GuineaPig = GuineaPig;
})();
