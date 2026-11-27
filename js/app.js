/**
 * PharmVR 2D — Main Application Controller
 * Handles routing, directory filtering, Experiment 8 interactions, Viva Voce, and PDF export.
 */

let session = null;
let renderer = null;
let activeFilter = 'all';
let currentMode = 'guided';
let activeTool = 'dropper';
let examUnknownDrugId = null;

document.addEventListener('DOMContentLoaded', () => {
    renderExperimentsGrid();
    tutorialManager = new TutorialManager();
    setupKeyboardShortcuts();
    const deep = new URLSearchParams(location.search).get('exp');
    if (deep) {
        launchExperiment(parseInt(deep, 10));
        // test/demo hook: ?exp=N&tr=<id>&auto=<clicks>&gap=<ms>
        const q = new URLSearchParams(location.search);
        const tr = q.get('tr'), auto = +(q.get('auto') || 0), gap = +(q.get('gap') || 2500);
        let n = 0;
        const tick = () => {
            if (!activeUniversalEngine || n >= auto) return;
            if (tr && activeUniversalEngine.tr && activeUniversalEngine.tr.id !== tr && !activeUniversalEngine.busy) activeUniversalEngine.select(tr);
            const b = document.querySelector('.lab2-actions .lab2-btn.primary:not(:disabled)');
            if (b && !activeUniversalEngine.busy) { b.click(); n++; }
            setTimeout(tick, gap);
        };
        if (auto) setTimeout(tick, 600);
    }
});

/* ============================================
   LANDING PAGE & DIRECTORY
   ============================================ */
function scrollToExperiments() {
    const el = document.getElementById('experiments');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function toggleMobileMenu() {
    const links = document.querySelector('.nav-links');
    if (links) {
        links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
    }
}

function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    filterExperiments();
}

function filterExperiments() {
    const query = (document.getElementById('exp-search')?.value || '').toLowerCase().trim();
    renderExperimentsGrid(query);
}

function renderExperimentsGrid(searchQuery = '') {
    const grid = document.getElementById('exp-grid');
    if (!grid || typeof EXPERIMENTS_DATA === 'undefined') return;

    const filtered = EXPERIMENTS_DATA.filter(exp => {
        const matchesCat = activeFilter === 'all' || exp.category === activeFilter;
        const matchesSearch = !searchQuery ||
            exp.title.toLowerCase().includes(searchQuery) ||
            exp.desc.toLowerCase().includes(searchQuery) ||
            exp.animal.toLowerCase().includes(searchQuery) ||
            exp.concept.toLowerCase().includes(searchQuery) ||
            String(exp.num).includes(searchQuery);
        return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding: 40px; color: var(--text-secondary);">No experiments match "${searchQuery}".</div>`;
        return;
    }

    grid.innerHTML = filtered.map(exp => {
        const isLive = exp.status === 'live';
        return `
            <div class="exp-card ${isLive ? 'available' : 'coming-soon'}" ${isLive ? `onclick="launchExperiment(${exp.num})"` : ''}>
                <div class="exp-card-header">
                    <span class="exp-num">#${exp.num}</span>
                    <span class="exp-status ${isLive ? 'live' : 'soon'}">${isLive ? '● Interactive Ready' : 'Coming Soon'}</span>
                </div>
                <h3 class="exp-card-title">${exp.title}</h3>
                <p class="exp-card-desc">${exp.desc}</p>
                <div class="exp-card-tags">
                    <span class="exp-tag">🐾 ${exp.animal}</span>
                    <span class="exp-tag">⚙️ ${exp.engine}</span>
                </div>
            </div>
        `;
    }).join('');
}

/* ============================================
   PAGE NAVIGATION
   ============================================ */
let activeUniversalEngine = null;

function launchExperiment(expNum) {
    if (activeUniversalEngine && typeof activeUniversalEngine.destroy === 'function') {
        activeUniversalEngine.destroy();
        activeUniversalEngine = null;
    }

    document.getElementById('landing-page').classList.remove('active');
    window.scrollTo(0, 0);

    if (expNum === 8 && !(window.LAB && LAB.registry[8])) {
        document.getElementById('universal-lab-page').classList.remove('active');
        document.getElementById('experiment-page').classList.add('active');

        if (!session) {
            session = new PharmacologySession();
            window._pharmSession = session;
        }
        if (!renderer) {
            renderer = new LabRenderer('rabbit-canvas', 'eye-canvas');
            initExp8BenchDock();
        }

        renderDrugRack();
        updateUI();

        if (currentMode === 'guided' && tutorialManager) {
            setTimeout(() => tutorialManager.start(), 350);
        }
        return;
    }

    // Route all other 30 experiments to the Universal Multi-Engine Lab
    document.getElementById('experiment-page').classList.remove('active');
    document.getElementById('universal-lab-page').classList.add('active');

    const expMeta = EXPERIMENTS_DATA.find(e => e.num === expNum) || { num: expNum, title: 'Experiment ' + expNum, engine: 'Simulation' };
    document.getElementById('uni-exp-badge').textContent = 'EXP ' + expNum;
    document.getElementById('uni-exp-title').textContent = expMeta.title;
    document.getElementById('uni-engine-badge').textContent = expMeta.engine;

    const mount = document.getElementById('universal-lab-mount');
    if (window.LAB && LAB.registry[expNum]) {
        activeUniversalEngine = new LAB.registry[expNum](expNum, mount);
        return;
    }
    if ([1, 2, 3, 5, 6, 7, 9].includes(expNum)) {
        activeUniversalEngine = new CNSEngine(expNum, mount);
    } else if ([10, 11, 22].includes(expNum)) {
        activeUniversalEngine = new TissueEngine(expNum, mount);
    } else if ([13, 14, 15, 16, 17, 31].includes(expNum)) {
        activeUniversalEngine = new BioassayEngine(expNum, mount);
    } else if ([12, 18, 19, 20].includes(expNum)) {
        activeUniversalEngine = new CardioEngine(expNum, mount);
    } else {
        activeUniversalEngine = new SpecialEngine(expNum, mount);
    }
}

function goHome() {
    if (tutorialManager && tutorialManager.isActive) {
        tutorialManager.stop();
    }
    if (activeUniversalEngine && typeof activeUniversalEngine.destroy === 'function') {
        activeUniversalEngine.destroy();
        activeUniversalEngine = null;
    }
    document.getElementById('experiment-page').classList.remove('active');
    document.getElementById('universal-lab-page').classList.remove('active');
    document.getElementById('landing-page').classList.add('active');
    window.scrollTo(0, 0);
}

/* ============================================
   MODE & DRUG SELECTION
   ============================================ */
function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === 'guided') {
        examUnknownDrugId = null;
        renderDrugRack();
        updateDrugInfoPanel();
        if (tutorialManager) tutorialManager.start();
        setFeedback('info', '📖 Guided Mode active. Follow the white tutorial walkthrough.');
    } else if (mode === 'practice') {
        examUnknownDrugId = null;
        if (tutorialManager) tutorialManager.stop();
        renderDrugRack();
        updateDrugInfoPanel();
        setFeedback('info', '🔬 Practice Mode: Freely test any drug on the rabbit eye.');
    } else if (mode === 'exam') {
        if (tutorialManager) tutorialManager.stop();
        const testDrugs = ['atropine', 'ephedrine', 'physostigmine', 'lignocaine'];
        examUnknownDrugId = testDrugs[Math.floor(Math.random() * testDrugs.length)];
        session.resetRabbitForNextDrug();
        session.selectedDrugId = examUnknownDrugId;
        session.activeEye = 'right';
        renderDrugRack();
        updateUI();
        setFeedback('info', '📝 Exam Mode: An UNKNOWN drug is loaded! Test pupil size, light reflex & corneal reflex to identify it.');
    }
}

function renderDrugRack() {
    const rack = document.getElementById('drug-rack');
    if (!rack) return;

    if (currentMode === 'exam') {
        rack.innerHTML = `
            <div class="drug-bottle selected" onclick="selectDrug('${examUnknownDrugId}')">
                <div class="drug-bottle-color" style="background: #334155;"></div>
                <div class="drug-bottle-info">
                    <div class="drug-bottle-name">Unknown Sample X</div>
                    <div class="drug-bottle-class">Identify via ocular reflexes</div>
                </div>
            </div>
            <div class="drug-bottle ${session.selectedDrugId === 'saline' ? 'selected' : ''}" onclick="selectDrug('saline')">
                <div class="drug-bottle-color" style="background: ${DRUGS.saline.bottleColor};"></div>
                <div class="drug-bottle-info">
                    <div class="drug-bottle-name">${DRUGS.saline.shortName}</div>
                    <div class="drug-bottle-class">Control Vehicle</div>
                </div>
            </div>
        `;
        return;
    }

    rack.innerHTML = Object.values(DRUGS).map(d => {
        const isSelected = session && session.selectedDrugId === d.id;
        const isTested = session && Boolean(session.records[d.id]);
        return `
            <div class="drug-bottle ${isSelected ? 'selected' : ''} ${isTested ? 'tested' : ''}" onclick="selectDrug('${d.id}')">
                <div class="drug-bottle-color" style="background: ${d.bottleColor};"></div>
                <div class="drug-bottle-info">
                    <div class="drug-bottle-name">${d.shortName}</div>
                    <div class="drug-bottle-class">${d.classMech.split('—')[0].trim()}</div>
                </div>
                <div class="drug-bottle-check">✓</div>
            </div>
        `;
    }).join('');
}

function selectDrug(drugId) {
    if (!session) return;
    session.selectedDrugId = drugId;
    renderDrugRack();
    updateDrugInfoPanel();
    const drug = DRUGS[drugId];
    const dropperWrap = document.querySelector('#dock-tool-dropper .dock-svg-wrap');
    if (dropperWrap && window.PHARM_SVG) {
        dropperWrap.innerHTML = PHARM_SVG.dropper(drug.bottleColor, true);
    }
    const label = currentMode === 'exam' && drugId !== 'saline' ? 'Unknown Sample X' : drug.name;
    setFeedback('info', `Selected ${label}. Use Dropper [4] to instil 2 drops into the ${session.activeEye.toUpperCase()} eye.`);
}

/* ============================================
   EYE & INSTRUMENT INTERACTIONS
   ============================================ */
function switchEye(eyeSide) {
    if (!session) return;
    session.activeEye = eyeSide;
    document.getElementById('btn-eye-left').classList.toggle('active', eyeSide === 'left');
    document.getElementById('btn-eye-right').classList.toggle('active', eyeSide === 'right');

    const magLabel = document.getElementById('magnifier-label');
    if (magLabel) {
        magLabel.textContent = eyeSide === 'left' ? 'LEFT EYE (Control)' : 'RIGHT EYE (Test)';
    }

    updateEyeCanvasState();
    setFeedback('info', `Switched focus to ${eyeSide.toUpperCase()} eye (${eyeSide === 'left' ? 'Control' : 'Test'}).`);
}

function initExp8BenchDock() {
    const dock = document.getElementById('exp8-bench-dock');
    const stage = document.getElementById('exp8-stage');
    const target = document.getElementById('exp8-eye-target');
    if (!dock || !window.PHARM_SVG || !window.DragGame) return;

    const bottlesHtml = Object.values(DRUGS).map(d => `
        <div class="draggable-piece" data-bottle="${d.id}" title="Select ${d.name}" onclick="selectDrug('${d.id}')">
            ${PHARM_SVG.bottle(d.shortName.split(' ')[0], d.shortName.split(' ')[1] || '', d.bottleColor)}
        </div>
    `).join('');

    const tools = [
        { id: 'dropper', label: 'Dropper', svg: () => PHARM_SVG.dropper(DRUGS[session.selectedDrugId]?.bottleColor || '#0ea5e9', true) },
        { id: 'torch', label: 'Pen-Torch', svg: () => PHARM_SVG.torch() },
        { id: 'cotton', label: 'Cotton Wisp', svg: () => PHARM_SVG.cotton() },
        { id: 'caliper', label: 'Caliper', svg: () => PHARM_SVG.caliper() }
    ];

    dock.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;" id="exp8-dock-bottles">${bottlesHtml}</div>
        <div style="width:1px;height:64px;background:#cbd5e1;"></div>
        <div style="display:flex;align-items:center;gap:10px;" id="exp8-dock-tools">
            ${tools.map(t => `
                <div class="draggable-piece" id="dock-tool-${t.id}" data-tool="${t.id}">
                    <div class="dock-svg-wrap" style="transform:scale(0.68);transform-origin:center;height:52px;display:flex;align-items:center;">${t.svg()}</div>
                    <span class="draggable-label">${t.label}</span>
                </div>
            `).join('')}
        </div>
    `;

    tools.forEach(t => {
        const el = document.getElementById('dock-tool-' + t.id);
        if (!el) return;
        DragGame.makeDraggable(el, {
            onStart: () => {
                setActiveToolUI(t.id);
                if (target) target.classList.add('active');
            },
            onMove: (cx, cy) => {
                const over = DragGame.isOverElement(cx, cy, target, 24);
                if (renderer) renderer.isOverEye = over;
                if (t.id === 'torch' && over && renderer) {
                    renderer.torchHeldOverEye = true;
                    renderer.lightReflexActive = true;
                    renderer.lightReflexStart = renderer.animTime - 600;
                    renderer.torchGlow = 0.95;
                } else if (renderer) {
                    renderer.torchHeldOverEye = false;
                }
            },
            onDrop: (cx, cy) => {
                if (target) target.classList.remove('active');
                if (renderer) {
                    renderer.isOverEye = false;
                    renderer.torchHeldOverEye = false;
                }
                if (DragGame.isOverElement(cx, cy, target, 26)) {
                    useTool(t.id);
                    DragGame.spawnFloatingXP(stage, cx, cy, `+10 XP ${t.label}`);
                }
            }
        });
    });
}

function setActiveToolUI(toolName) {
    activeTool = toolName;
    window._activeTool = toolName;
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === toolName);
    });
}

function useTool(toolName) {
    setActiveToolUI(toolName);

    if (!session || !renderer) return;
    renderer.setToolHighlight(toolName);

    if (toolName === 'dropper') {
        const res = session.instilDrop();
        if (res.ok) {
            const drug = DRUGS[session.selectedDrugId];
            renderer.triggerDropAnimation(drug.bottleColor);
        }
        setFeedback(res.type, res.msg);
    } else if (toolName === 'caliper') {
        const res = session.measurePupil();
        setFeedback('success', res.msg);
    } else if (toolName === 'torch') {
        const res = session.testLightReflex();
        renderer.triggerLightReflex(res.present);
        setFeedback(res.present ? 'success' : 'info', res.msg);
    } else if (toolName === 'cotton') {
        const res = session.testCornealReflex();
        renderer.triggerCornealReflex(res.present);
        setFeedback(res.present ? 'success' : 'info', res.msg);
    }

    updateUI();
}

function advanceTime() {
    if (!session) return;
    const eye = session.getActiveEyeState();
    if (!eye.drugId || eye.dropsInstilled < 2) {
        setFeedback('error', '⚠️ Instil 2 drops using the Dropper [4] before waiting for absorption!');
        return;
    }

    const absorbed = session.advanceTime(8);
    if (absorbed) {
        const drug = session.getEffectiveDrug();
        setFeedback('success', `⏱️ 8 minutes elapsed! Drug absorbed. Now measure Pupil [1], Light Reflex [2], and Corneal Reflex [3].`);
        updateEyeCanvasState();
        updateUI();
    }
}

function resetRabbit() {
    if (!session) return;
    session.resetRabbitForNextDrug();
    updateEyeCanvasState();
    updateUI();
    setFeedback('info', '🐇 Fresh albino rabbit placed in restrainer. Ready for the next drug!');
}

/* ============================================
   UI UPDATES
   ============================================ */
function updateUI() {
    if (!session) return;

    // Score & Doubt
    document.getElementById('score-val').textContent = session.score;
    document.getElementById('progress-score').style.width = session.score + '%';
    document.getElementById('doubt-val').textContent = session.doubt;
    document.getElementById('progress-doubt').style.width = session.doubt + '%';
    document.getElementById('drugs-tested').textContent = session.getDrugsTested() + ' / 5';

    updateEyeCanvasState();
    updateDrugInfoPanel();
    updateObservationTable();
    renderDrugRack();
}

function updateEyeCanvasState() {
    if (!session || !renderer) return;
    const eye = session.getActiveEyeState();
    const drug = session.getEffectiveDrug();
    const diam = eye.absorbed ? drug.targetDiameter : session.baselineDiameter;
    renderer.setPupilDiameter(diam);

    const readingEl = document.getElementById('eye-reading');
    if (readingEl) {
        readingEl.textContent = `Pupil: ${diam.toFixed(1)} mm`;
    }
}

function updateDrugInfoPanel() {
    if (!session) return;
    const d = DRUGS[session.selectedDrugId];
    if (!d) return;

    if (currentMode === 'exam' && d.id !== 'saline') {
        document.getElementById('info-drug-name').textContent = 'Unknown Sample X';
        document.getElementById('info-drug-class').textContent = 'Hidden in Exam Mode';
        document.getElementById('info-drug-summary').textContent = 'Measure pupil diameter, light reflex, and corneal reflex to deduce the pharmacological class.';
        document.getElementById('info-pupil').textContent = '???';
        document.getElementById('info-light').textContent = '???';
        document.getElementById('info-corneal').textContent = '???';
        return;
    }

    document.getElementById('info-drug-name').textContent = d.name;
    document.getElementById('info-drug-class').textContent = d.classMech;
    document.getElementById('info-drug-summary').textContent = d.summary;
    document.getElementById('info-pupil').textContent = d.pupilDesc;
    document.getElementById('info-light').textContent = d.lightReflex;
    document.getElementById('info-corneal').textContent = d.cornealReflex;
}

function updateObservationTable() {
    const tbody = document.getElementById('obs-tbody');
    if (!tbody || !session) return;

    const entries = Object.values(session.records);
    if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="obs-cell-pending" style="text-align:center; padding: 16px;">No post-drug readings recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = entries.map(r => {
        const lightCls = r.lightReflex === 'Present' ? 'obs-cell-present' : (r.lightReflex === 'Absent' ? 'obs-cell-absent' : 'obs-cell-pending');
        const cornealCls = r.cornealReflex === 'Present' ? 'obs-cell-present' : (r.cornealReflex === 'Absent' ? 'obs-cell-absent' : 'obs-cell-pending');
        const pupilCls = r.postPupil.includes('Mydriasis') ? 'obs-cell-mydriasis' : (r.postPupil.includes('Miosis') ? 'obs-cell-miosis' : '');
        return `
            <tr>
                <td><strong>${r.drugName.split('(')[0].trim()}</strong></td>
                <td class="${pupilCls}">${r.postPupil}</td>
                <td class="${lightCls}">${r.lightReflex}</td>
                <td class="${cornealCls}">${r.cornealReflex}</td>
            </tr>
        `;
    }).join('');
}

function setFeedback(type, msg) {
    const bar = document.getElementById('feedback-bar');
    const icon = document.getElementById('feedback-icon');
    const text = document.getElementById('feedback-text');
    if (!bar || !text) return;

    bar.classList.remove('error', 'success');
    if (type === 'error') {
        bar.classList.add('error');
        icon.textContent = '⚠️';
    } else if (type === 'success') {
        bar.classList.add('success');
        icon.textContent = '✅';
    } else {
        icon.textContent = 'ℹ️';
    }
    text.textContent = msg;
}

/* ============================================
   LAB JOURNAL & PDF EXPORT
   ============================================ */
function toggleJournal() {
    const modal = document.getElementById('journal-modal');
    if (!modal) return;
    const isVisible = modal.classList.contains('visible');
    if (!isVisible) {
        renderJournalTable();
        modal.classList.add('visible');
    } else {
        modal.classList.remove('visible');
    }
}

function renderJournalTable() {
    const tbody = document.getElementById('journal-tbody');
    if (!tbody || !session) return;

    const entries = Object.values(session.records);
    if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-light); padding: 20px;">Perform the experiment to populate observations.</td></tr>`;
        return;
    }

    tbody.innerHTML = entries.map(r => `
        <tr>
            <td><strong>${r.drugName}</strong></td>
            <td>${r.eyeSide}</td>
            <td>${r.classMech}</td>
            <td>${r.baseline}</td>
            <td>${r.postPupil}</td>
            <td>${r.lightReflex}</td>
            <td>${r.cornealReflex}</td>
        </tr>
    `).join('');
}

function exportLabRecord() {
    renderJournalTable();
    const modal = document.getElementById('journal-modal');
    if (modal && !modal.classList.contains('visible')) {
        modal.classList.add('visible');
    }
    setTimeout(() => window.print(), 200);
}

/* ============================================
   VIVA VOCE QUIZ (Exp 8 + Universal Engines)
   ============================================ */
let activeVivaQuestions = VIVA_QUESTIONS;
let activeVivaIdx = 0;
let activeVivaScore = 0;

function startViva() {
    openGenericViva('Experiment 8 — Rabbit Eye', VIVA_QUESTIONS);
}

function openGenericViva(title, questions) {
    activeVivaQuestions = (questions && questions.length) ? questions : VIVA_QUESTIONS;
    activeVivaIdx = 0;
    activeVivaScore = 0;

    const headerH2 = document.querySelector('#viva-modal .modal-header h2');
    if (headerH2) headerH2.textContent = '🎓 Viva Voce — ' + title;

    document.getElementById('viva-score-display').classList.add('hidden');
    document.getElementById('viva-modal').classList.add('visible');
    renderVivaQuestion();
}

function closeViva() {
    document.getElementById('viva-modal').classList.remove('visible');
}

function renderVivaQuestion() {
    const qIdx = activeVivaIdx;
    const qObj = activeVivaQuestions[qIdx];
    const total = activeVivaQuestions.length;

    document.getElementById('viva-qnum').textContent = `Question ${qIdx + 1} of ${total}`;
    document.getElementById('viva-progress-fill').style.width = (((qIdx + 1) / total) * 100) + '%';
    document.getElementById('viva-question').textContent = qObj.q;

    const expEl = document.getElementById('viva-explanation');
    expEl.classList.add('hidden');
    expEl.textContent = '';

    const nextBtn = document.getElementById('viva-next-btn');
    nextBtn.style.display = 'none';

    const optsEl = document.getElementById('viva-options');
    optsEl.innerHTML = qObj.opts.map((opt, idx) => `
        <button class="viva-opt" onclick="selectVivaOption(${idx})">${opt}</button>
    `).join('');
}

function selectVivaOption(selectedIdx) {
    const qObj = activeVivaQuestions[activeVivaIdx];
    const opts = document.querySelectorAll('.viva-opt');

    opts.forEach((btn, idx) => {
        btn.classList.add('disabled');
        btn.onclick = null;
        if (idx === qObj.ans) btn.classList.add('correct');
        else if (idx === selectedIdx) btn.classList.add('wrong');
    });

    if (selectedIdx === qObj.ans) {
        activeVivaScore++;
        if (session) session.score = Math.min(100, session.score + 5);
    }

    const expEl = document.getElementById('viva-explanation');
    expEl.textContent = '💡 ' + (qObj.explanation || qObj.exp || '');
    expEl.classList.remove('hidden');

    const nextBtn = document.getElementById('viva-next-btn');
    nextBtn.style.display = 'inline-flex';
    nextBtn.textContent = activeVivaIdx === activeVivaQuestions.length - 1 ? 'Finish Viva ✓' : 'Next Question →';
}

function vivaNext() {
    if (activeVivaIdx < activeVivaQuestions.length - 1) {
        activeVivaIdx++;
        renderVivaQuestion();
    } else {
        document.getElementById('viva-next-btn').style.display = 'none';
        const scoreEl = document.getElementById('viva-score-display');
        scoreEl.textContent = `🎉 Viva Complete! Score: ${activeVivaScore} / ${activeVivaQuestions.length}`;
        scoreEl.classList.remove('hidden');
        if (session) updateUI();
    }
}

/* ============================================
   KEYBOARD SHORTCUTS
   ============================================ */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const expPage = document.getElementById('experiment-page');
        if (!expPage || !expPage.classList.contains('active')) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === '1') useTool('caliper');
        else if (e.key === '2') useTool('torch');
        else if (e.key === '3') useTool('cotton');
        else if (e.key === '4') useTool('dropper');
        else if (e.key === '5') toggleJournal();
        else if (e.key.toLowerCase() === 't') advanceTime();
    });
}
