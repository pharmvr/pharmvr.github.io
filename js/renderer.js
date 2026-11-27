/**
 * PharmVR 2D — High-Craft Layered 2D Workbench Renderer (Experiment 8)
 * Renders:
 *   - Sunlit university pharmacology lab backdrop (assets/lab-backdrop.jpg)
 *   - Studio-cutout Albino Rabbit in Acrylic Restrainer sitting cleanly on bench
 *   - Crisp anatomical pupil & reflex overlays aligned precisely to the rabbit's eye
 *   - 60fps Magnified Eye Scope with draggable Vernier Caliper measurement
 *   - Seamless integration with DOM DragGame SVG instruments & amber bottles
 */

class LabRenderer {
    constructor(rabbitCanvasId, eyeCanvasId) {
        this.rabbitCanvas = document.getElementById(rabbitCanvasId);
        this.eyeCanvas = document.getElementById(eyeCanvasId);
        if (!this.rabbitCanvas || !this.eyeCanvas) return;

        this.rCtx = this.rabbitCanvas.getContext('2d');
        this.eCtx = this.eyeCanvas.getContext('2d');

        this.W = 640;
        this.H = 420;
        this.EW = 280;

        this._setupHiDPI(this.rabbitCanvas, this.rCtx, this.W, this.H);
        this._setupHiDPI(this.eyeCanvas, this.eCtx, this.EW, this.EW);

        // Position of cutout rabbit on the sunlit lab benchtop
        this.imgW = 410;
        this.imgH = 306;
        this.imgX = 165;
        this.imgY = 58;
        this.eyeX = this.imgX + this.imgW * 0.778;
        this.eyeY = this.imgY + this.imgH * 0.336;

        // Physiology animation state
        this.animTime = 0;
        this.currentPupilDiam = 5.5;
        this.targetPupilDiam = 5.5;
        this.lightReflexActive = false;
        this.lightReflexStart = 0;
        this.cornealReflexActive = false;
        this.cornealReflexStart = 0;
        this.blinkAmount = 0;
        this.torchGlow = 0;
        this.activeToolHighlight = null;
        this.dropAnimation = null;
        this.isOverEye = false;
        this.torchHeldOverEye = false;
        this.floatingTexts = [];

        // Magnified scope caliper state
        this.caliperScopeMode = false;
        this.scopeJawX = 190;
        this.draggingScopeJaw = false;

        // Load sunlit lab backdrop
        this.bgImg = new Image();
        this.bgImgLoaded = false;
        this.bgImg.onload = () => { this.bgImgLoaded = true; };
        this.bgImg.src = 'assets/lab-backdrop.jpg';

        // Load rabbit-in-restrainer and cleanly strip outer white background via border flood-fill
        this.rabbitCutout = null;
        const rawRabbit = new Image();
        rawRabbit.onload = () => {
            this.rabbitCutout = this._stripOuterWhite(rawRabbit);
        };
        rawRabbit.src = 'assets/rabbit-restrainer.jpg';

        this._bindScopeEvents();
        this._animate = this._animate.bind(this);
        requestAnimationFrame(this._animate);
    }

    _stripOuterWhite(img) {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 1200;
        c.height = img.naturalHeight || 896;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
            const imgData = ctx.getImageData(0, 0, c.width, c.height);
            const d = imgData.data;
            const w = c.width, h = c.height;
            const visited = new Uint8Array(w * h);
            const stack = [0, w - 1, (h - 1) * w, w * h - 1];

            while (stack.length > 0) {
                const idx = stack.pop();
                if (idx < 0 || idx >= w * h || visited[idx]) continue;
                visited[idx] = 1;
                const p = idx * 4;
                if (d[p] > 236 && d[p + 1] > 236 && d[p + 2] > 236) {
                    d[p + 3] = 0; // transparent outer bg
                    const x = idx % w;
                    if (x > 0) stack.push(idx - 1);
                    if (x < w - 1) stack.push(idx + 1);
                    if (idx >= w) stack.push(idx - w);
                    if (idx < w * (h - 1)) stack.push(idx + w);
                }
            }
            ctx.putImageData(imgData, 0, 0);
        } catch (e) {
            // fallback if tainted
        }
        return c;
    }

    _setupHiDPI(canvas, ctx, w, h) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
    }

    _getCanvasCoords(canvas, clientX, clientY, logicalW, logicalH) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((clientX - rect.left) / rect.width) * logicalW,
            y: ((clientY - rect.top) / rect.height) * logicalH
        };
    }

    getEyeClientRect() {
        const rect = this.rabbitCanvas.getBoundingClientRect();
        const scaleX = rect.width / this.W;
        const scaleY = rect.height / this.H;
        return {
            left: rect.left + (this.eyeX - 30) * scaleX,
            right: rect.left + (this.eyeX + 30) * scaleX,
            top: rect.top + (this.eyeY - 30) * scaleY,
            bottom: rect.top + (this.eyeY + 30) * scaleY,
            cx: rect.left + this.eyeX * scaleX,
            cy: rect.top + this.eyeY * scaleY
        };
    }

    _bindScopeEvents() {
        this.rabbitCanvas.addEventListener('pointerdown', (e) => {
            const pt = this._getCanvasCoords(this.rabbitCanvas, e.clientX, e.clientY, this.W, this.H);
            if (Math.hypot(pt.x - this.eyeX, pt.y - this.eyeY) < 36) {
                if (typeof useTool === 'function') useTool(window._activeTool || 'dropper');
            }
        });

        this.eyeCanvas.addEventListener('pointerdown', (e) => {
            const pt = this._getCanvasCoords(this.eyeCanvas, e.clientX, e.clientY, this.EW, this.EW);
            if (!this.caliperScopeMode) {
                if (typeof useTool === 'function') useTool('caliper');
                return;
            }
            if (Math.abs(pt.x - this.scopeJawX) < 22) {
                this.draggingScopeJaw = true;
                this.eyeCanvas.style.cursor = 'ew-resize';
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.draggingScopeJaw) return;
            const pt = this._getCanvasCoords(this.eyeCanvas, e.clientX, e.clientY, this.EW, this.EW);
            this.scopeJawX = Math.max(145, Math.min(245, pt.x));
        });

        window.addEventListener('pointerup', () => {
            if (this.draggingScopeJaw) {
                this.draggingScopeJaw = false;
                this.eyeCanvas.style.cursor = 'pointer';
            }
        });
    }

    spawnFloatingText(x, y, text, color = '#0d9488') {
        this.floatingTexts.push({ x, y, text, color, start: this.animTime });
    }

    _animate(timestamp) {
        this.animTime = timestamp;
        this.currentPupilDiam += (this.targetPupilDiam - this.currentPupilDiam) * 0.06;

        if (this.lightReflexActive && !this.torchHeldOverEye) {
            const elapsed = timestamp - this.lightReflexStart;
            if (elapsed < 1800) {
                this.torchGlow = Math.sin((elapsed / 1800) * Math.PI);
            } else {
                this.lightReflexActive = false;
                this.torchGlow = 0;
            }
        }

        if (this.cornealReflexActive) {
            const elapsed = timestamp - this.cornealReflexStart;
            if (elapsed < 800) {
                const drug = window._pharmSession ? window._pharmSession.getEffectiveDrug() : null;
                const shouldBlink = !drug || drug.cornealReflex === 'Present';
                this.blinkAmount = (shouldBlink && elapsed > 200) ? Math.sin(((elapsed - 200) / 600) * Math.PI) : 0;
            } else {
                this.cornealReflexActive = false;
                this.blinkAmount = 0;
            }
        } else {
            this.blinkAmount *= 0.9;
        }

        this._drawRabbitScene();
        this._drawEyeScope();
        requestAnimationFrame(this._animate);
    }

    _drawRabbitScene() {
        const ctx = this.rCtx;
        const W = this.W, H = this.H;
        ctx.clearRect(0, 0, W, H);

        // 1. Rich Sunlit University Pharmacology Lab Backdrop
        if (this.bgImgLoaded) {
            ctx.drawImage(this.bgImg, 0, 0, W, H);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
            ctx.fillRect(0, 0, W, H);
        } else {
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(0, 0, W, H);
        }

        // 2. Soft contact shadow on benchtop under restrainer
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
        ctx.beginPath();
        ctx.ellipse(this.imgX + this.imgW * 0.48, this.imgY + this.imgH * 0.88, 162, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Studio-cutout Albino Rabbit in Acrylic Restrainer
        if (this.rabbitCutout) {
            ctx.drawImage(this.rabbitCutout, this.imgX, this.imgY, this.imgW, this.imgH);
            this._drawDynamicPupilOverlay(ctx, this.eyeX, this.eyeY, this.currentPupilDiam, this.blinkAmount);
        }

        // 4. Optical target reticle + leader line
        this._drawOpticalReticle(ctx, this.eyeX, this.eyeY, W);

        // 5. Drop & Torch effects on the rabbit eye
        this._drawMainCanvasToolEffects(ctx, this.eyeX, this.eyeY);

        // 6. Floating status badge
        const session = window._pharmSession;
        const eyeLabel = session ? (session.activeEye === 'left' ? 'LEFT EYE (CONTROL)' : 'RIGHT EYE (TEST)') : 'RIGHT EYE (TEST)';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
        ctx.beginPath(); ctx.roundRect(14, 14, 168, 28, 8); ctx.fill();
        ctx.fillStyle = '#5eead4'; ctx.font = '700 11px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('● ' + eyeLabel, 24, 32);

        // Floating XP texts
        this.floatingTexts = this.floatingTexts.filter(ft => this.animTime - ft.start < 1400);
        this.floatingTexts.forEach(ft => {
            const p = (this.animTime - ft.start) / 1400;
            ctx.save(); ctx.globalAlpha = 1 - p; ctx.fillStyle = '#ffffff';
            ctx.font = '800 13px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4;
            ctx.fillText(ft.text, ft.x, ft.y - p * 28);
            ctx.restore();
        });
    }

    _drawDynamicPupilOverlay(ctx, x, y, pupilMM, blink) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x, y, 8.2, 5.2, -0.1, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = 'rgba(244, 114, 182, 0.25)';
        ctx.fillRect(x - 10, y - 8, 20, 16);

        let r = 1.2 + (pupilMM / 10) * 4.4;
        if (this.lightReflexActive && this.torchGlow > 0.25) {
            const drug = window._pharmSession ? window._pharmSession.getEffectiveDrug() : null;
            if (!drug || drug.lightReflex === 'Present') r *= 0.62;
        }
        ctx.fillStyle = '#111827';
        ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.92, 0, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(x - 1.4, y - 1.4, 1.0, 0, Math.PI * 2); ctx.fill();

        if (blink > 0.05) {
            ctx.fillStyle = '#fce7f3';
            ctx.fillRect(x - 10, y - 7, 20, 14 * blink);
        }
        ctx.restore();
    }

    _drawOpticalReticle(ctx, eyeX, eyeY, W) {
        ctx.save();
        const r = this.isOverEye ? 26 : 19;
        ctx.strokeStyle = this.isOverEye ? '#fbbf24' : '#2dd4bf';
        ctx.lineWidth = this.isOverEye ? 2.5 : 1.6;
        ctx.beginPath(); ctx.arc(eyeX, eyeY, r, 0, Math.PI * 2); ctx.stroke();

        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.75)';
        ctx.beginPath();
        ctx.moveTo(eyeX + r + 4, eyeY);
        ctx.lineTo(W - 8, eyeY - 12);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#2dd4bf';
        ctx.beginPath(); ctx.arc(W - 8, eyeY - 12, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    _drawMainCanvasToolEffects(ctx, eyeX, eyeY) {
        if (this.dropAnimation) {
            const elapsed = this.animTime - this.dropAnimation.start;
            if (elapsed < 1200) {
                const p = elapsed / 1200;
                const dropY = (eyeY - 34) + Math.min(1, p * 1.3) * 34;
                ctx.fillStyle = this.dropAnimation.color || '#38bdf8';
                ctx.beginPath(); ctx.arc(eyeX + 2, dropY, 4.5, 0, Math.PI * 2); ctx.fill();
            }
        }

        if (this.lightReflexActive && this.torchGlow > 0) {
            ctx.save();
            ctx.globalAlpha = this.torchGlow * 0.55;
            const beam = ctx.createLinearGradient(eyeX + 95, eyeY - 30, eyeX, eyeY);
            beam.addColorStop(0, 'rgba(250, 204, 21, 0.95)');
            beam.addColorStop(1, 'rgba(254, 240, 138, 0.12)');
            ctx.fillStyle = beam;
            ctx.beginPath();
            ctx.moveTo(eyeX + 95, eyeY - 34); ctx.lineTo(eyeX + 95, eyeY - 22);
            ctx.lineTo(eyeX, eyeY + 14); ctx.lineTo(eyeX, eyeY - 14);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }

    _drawEyeScope() {
        const ctx = this.eCtx;
        const size = this.EW;
        const cx = size / 2, cy = size / 2;
        ctx.clearRect(0, 0, size, size);

        const scleraGrad = ctx.createRadialGradient(cx, cy, 35, cx, cy, 136);
        scleraGrad.addColorStop(0, '#fffafa');
        scleraGrad.addColorStop(0.65, '#ffe4e6');
        scleraGrad.addColorStop(1, '#fecdd3');
        ctx.fillStyle = scleraGrad;
        ctx.beginPath(); ctx.arc(cx, cy, 136, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.28)'; ctx.lineWidth = 0.8;
        [[24,70,58,92,84,98],[250,62,210,84,186,94],[28,185,68,165,92,152],[248,195,206,170,182,156]]
            .forEach(([x1,y1,x2,y2,x3,y3]) => { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(x2,y2,x3,y3); ctx.stroke(); });
        ctx.restore();

        const irisR = 68;
        const irisGrad = ctx.createRadialGradient(cx, cy, 14, cx, cy, irisR);
        irisGrad.addColorStop(0, '#fecdd3'); irisGrad.addColorStop(0.35, '#fda4af');
        irisGrad.addColorStop(0.75, '#f472b6'); irisGrad.addColorStop(1, '#db2777');
        ctx.fillStyle = irisGrad;
        ctx.beginPath(); ctx.arc(cx, cy, irisR, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.strokeStyle = 'rgba(157, 23, 77, 0.18)'; ctx.lineWidth = 0.9;
        for (let i = 0; i < 48; i++) {
            const a = (i / 48) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16);
            ctx.lineTo(cx + Math.cos(a) * (irisR - 2), cy + Math.sin(a) * (irisR - 2)); ctx.stroke();
        }
        ctx.restore();

        const pupilScale = this.currentPupilDiam / 10;
        let actualPupilR = irisR * pupilScale * 0.92;
        if (this.lightReflexActive && this.torchGlow > 0.25) {
            const drug = window._pharmSession ? window._pharmSession.getEffectiveDrug() : null;
            if (!drug || drug.lightReflex === 'Present') actualPupilR *= 0.62;
        }
        actualPupilR = Math.max(8, actualPupilR);

        const pupilGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, actualPupilR);
        pupilGrad.addColorStop(0, '#09090b'); pupilGrad.addColorStop(0.85, '#18181b'); pupilGrad.addColorStop(1, '#3b0764');
        ctx.fillStyle = pupilGrad;
        ctx.beginPath(); ctx.arc(cx, cy, actualPupilR, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.beginPath(); ctx.ellipse(cx - actualPupilR * 0.34, cy - actualPupilR * 0.34, actualPupilR * 0.24, actualPupilR * 0.16, -0.45, 0, Math.PI * 2); ctx.fill();

        if (this.torchGlow > 0) {
            ctx.save(); ctx.globalAlpha = this.torchGlow * 0.32;
            const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 130);
            g.addColorStop(0, '#fef08a'); g.addColorStop(0.55, '#fde047'); g.addColorStop(1, 'transparent');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 130, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }

        if (this.cornealReflexActive) {
            const elapsed = this.animTime - this.cornealReflexStart;
            const p = Math.min(1, elapsed / 320);
            const wx = cx + 115 - p * 95;
            ctx.save(); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#cbd5e1';
            ctx.beginPath(); ctx.ellipse(wx, cy + 6, 12, 16, 0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
        }

        if (this.blinkAmount > 0.05) {
            ctx.save(); ctx.fillStyle = '#fce7f3';
            ctx.fillRect(0, 0, size, (size / 2) * this.blinkAmount);
            ctx.fillRect(0, size - (size / 2) * this.blinkAmount, size, (size / 2) * this.blinkAmount);
            ctx.restore();
        }

        if (this.dropAnimation) {
            const elapsed = this.animTime - this.dropAnimation.start;
            if (elapsed < 1200) {
                const p = elapsed / 1200;
                const dy = -10 + p * (cy + 30);
                ctx.save(); ctx.globalAlpha = p < 0.8 ? 1 : (1 - p) / 0.2;
                ctx.fillStyle = this.dropAnimation.color || '#0ea5e9';
                ctx.beginPath(); ctx.arc(cx, dy, 8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            } else {
                this.dropAnimation = null;
            }
        }

        if (this.activeToolHighlight === 'caliper' || this.caliperScopeMode) {
            const leftX = cx - actualPupilR;
            const rightX = this.draggingScopeJaw ? this.scopeJawX : cx + actualPupilR;
            const measuredMM = (((rightX - leftX) / (irisR * 0.92)) * 5).toFixed(1);

            ctx.save();
            ctx.strokeStyle = '#0d9488'; ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath(); ctx.moveTo(leftX - 16, cy); ctx.lineTo(rightX + 16, cy); ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath(); ctx.moveTo(leftX, cy - 16); ctx.lineTo(leftX, cy + 16); ctx.stroke();
            ctx.fillStyle = '#0d9488';
            ctx.beginPath(); ctx.moveTo(rightX, cy - 16); ctx.lineTo(rightX, cy + 16); ctx.stroke();
            ctx.beginPath(); ctx.arc(rightX, cy + 20, 6, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#0f766e'; ctx.font = 'bold 13px JetBrains Mono, monospace'; ctx.textAlign = 'center';
            ctx.fillText((this.draggingScopeJaw ? measuredMM : this.currentPupilDiam.toFixed(1)) + ' mm', cx, cy + actualPupilR + 40);
            ctx.restore();
        }
    }

    setPupilDiameter(mm) { this.targetPupilDiam = mm; }

    triggerLightReflex() {
        this.lightReflexActive = true;
        this.lightReflexStart = this.animTime;
        this.torchGlow = 1;
        const drug = window._pharmSession ? window._pharmSession.getEffectiveDrug() : null;
        const present = !drug || drug.lightReflex === 'Present';
        this.spawnFloatingText(this.eyeX, this.eyeY - 26, present ? 'Light Reflex: Brisk' : 'Light Reflex: Absent', present ? '#2dd4bf' : '#f43f5e');
    }

    triggerCornealReflex() {
        this.cornealReflexActive = true;
        this.cornealReflexStart = this.animTime;
        this.blinkAmount = 0;
        const drug = window._pharmSession ? window._pharmSession.getEffectiveDrug() : null;
        const present = !drug || drug.cornealReflex === 'Present';
        this.spawnFloatingText(this.eyeX, this.eyeY - 26, present ? 'Corneal Blink: Intact' : 'Corneal Blink: Anesthetized', present ? '#2dd4bf' : '#f43f5e');
    }

    triggerDropAnimation(color) {
        this.dropAnimation = { start: this.animTime, color: color || '#38bdf8' };
        this.spawnFloatingText(this.eyeX, this.eyeY - 26, 'Instilled 1 Drop', '#2dd4bf');
    }

    setToolHighlight(tool) {
        this.activeToolHighlight = tool;
        if (tool !== 'caliper') this.caliperScopeMode = false;
        if (tool === 'caliper') {
            this.caliperScopeMode = true;
            const r = Math.max(8, 68 * (this.currentPupilDiam / 10) * 0.92);
            this.scopeJawX = 140 + r;
            setTimeout(() => {
                if (this.activeToolHighlight === 'caliper') this.activeToolHighlight = null;
            }, 3500);
        }
    }
}
