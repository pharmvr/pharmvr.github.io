/* Headless smoke-test harness for PharmVR 2D lab engines (runs under macOS `jsc`).
   Usage: jsc harness.js -- <projectDir> <expNum> [frames] [treatmentIds,comma]   */
var ARG = (function () {
    var a = arguments.length ? [] : [];
    return a;
})();
if (typeof console === 'undefined') { console = { log: print, error: print, warn: print, info: print }; }

var ARGS = (typeof arguments !== 'undefined') ? arguments : [];
var DEBUG = (typeof arguments !== 'undefined' && arguments[4] === 'debug');
var DIR = ARGS[0], EXP = +ARGS[1], FRAMES = +(ARGS[2] || 2400), TRS = (ARGS[3] || '').split(',').filter(Boolean);

/* ---------------- virtual clock & timers ---------------- */
var CLICKLOG = [];
var NOW = 0;                 // ms
var timers = [], tid = 1, rafCbs = [];
function setTimeout(fn, ms) { timers.push({ id: tid, t: NOW + (ms || 0), fn: fn }); return tid++; }
function clearTimeout(id) { timers = timers.filter(function (x) { return x.id !== id; }); }
function setInterval(fn, ms) { return setTimeout(fn, ms); }
function clearInterval(id) { clearTimeout(id); }
function requestAnimationFrame(cb) { rafCbs.push(cb); return rafCbs.length; }
function cancelAnimationFrame() { rafCbs.length = 0; }
var performance = { now: function () { return NOW; } };
function confirm() { return true; }
function alert() {}

/* ---------------- canvas 2d stub ---------------- */
function gradient() { return { addColorStop: function () {} }; }
function makeCtx() {
    var store = {};
    var fns = {
        createLinearGradient: gradient, createRadialGradient: gradient, createPattern: function () { return {}; },
        measureText: function (s) { return { width: String(s == null ? '' : s).length * 6 }; },
        getLineDash: function () { return []; },
        getImageData: function () { return { data: [0, 0, 0, 0] }; },
        isPointInPath: function () { return false; }
    };
    return new Proxy(store, {
        get: function (t, k) {
            if (k in fns) return fns[k];
            if (k in t) return t[k];
            return function () {};
        },
        set: function (t, k, v) { t[k] = v; return true; }
    });
}
function makeCanvas() {
    return {
        tagName: 'CANVAS', width: 0, height: 0, style: {}, dataset: {},
        getContext: function () { if (!this._c) this._c = makeCtx(); return this._c; },
        addEventListener: function () {}, removeEventListener: function () {},
        setPointerCapture: function () {}, releasePointerCapture: function () {},
        getBoundingClientRect: function () { return { left: 0, top: 0, width: 960, height: 540 }; },
        toDataURL: function () { return ''; }, classList: makeClassList(), appendChild: function () {},
        querySelector: function () { return null; }, querySelectorAll: function () { return []; }
    };
}
function makeClassList() {
    var set = {};
    return {
        add: function () { for (var i = 0; i < arguments.length; i++) set[arguments[i]] = 1; },
        remove: function () { for (var i = 0; i < arguments.length; i++) delete set[arguments[i]]; },
        toggle: function (c, on) { if (on === undefined) { set[c] ? delete set[c] : set[c] = 1; } else { on ? set[c] = 1 : delete set[c]; } },
        contains: function (c) { return !!set[c]; }
    };
}

/* ---------------- element stub ---------------- */
function makeEl(sel) {
    var el = {
        tagName: 'DIV', _sel: sel || '', _kids: [], style: {}, dataset: {}, classList: makeClassList(),
        innerHTML: '', textContent: '', value: '', disabled: false, title: '', checked: true,
        scrollTop: 0, scrollHeight: 100, onclick: null, oninput: null, onchange: null,
        appendChild: function (c) { this._kids.push(c); return c; },
        removeChild: function (c) { this._kids = this._kids.filter(function (k) { return k !== c; }); },
        addEventListener: function () {}, removeEventListener: function () {},
        setAttribute: function () {}, getAttribute: function () { return null; },
        closest: function () { return makeEl('closest'); },
        focus: function () {}, click: function () { if (this.onclick) this.onclick(); },
        getBoundingClientRect: function () { return { left: 0, top: 0, width: 300, height: 200 }; },
        querySelector: function (s) { return cachedEl(this, s); },
        querySelectorAll: function () { return []; }
    };
    return el;
}
function cachedEl(parent, sel) {
    parent._cache = parent._cache || {};
    if (!parent._cache[sel]) {
        parent._cache[sel] = (sel === '#l2-canvas' || sel === '#l2-chart' || /canvas/i.test(sel)) ? makeCanvas() : makeEl(sel);
    }
    return parent._cache[sel];
}

var document = {
    createElement: function (t) { return t === 'canvas' ? makeCanvas() : makeEl(t); },
    createElementNS: function (n, t) { return makeEl(t); },
    querySelector: function (s) { return cachedEl(document, s); },
    querySelectorAll: function () { return []; },
    getElementById: function (id) { return cachedEl(document, '#' + id); },
    addEventListener: function () {}, body: makeEl('body'), documentElement: makeEl('html')
};
// `window` must BE the global object: the lab sources set window.LAB and then
// read the bare global `LAB`, exactly as a browser does.
var window = (function () { return this; })() || globalThis;
window.window = window;
window.devicePixelRatio = 1; window.innerWidth = 1440; window.innerHeight = 900;
window.addEventListener = function () {}; window.removeEventListener = function () {};
window.requestAnimationFrame = requestAnimationFrame; window.performance = performance;
window.setTimeout = setTimeout; window.clearTimeout = clearTimeout; window.document = document;
var navigator = { userAgent: 'jsc' };
var localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
function openGenericViva() {}

/* ---------------- load the lab sources ---------------- */
var ERRORS = [];
function loadFile(p) {
    var src;
    try { src = readFile(p); } catch (e) { ERRORS.push('cannot read ' + p); return; }
    try {
        // indirect eval keeps the globals above visible to the loaded script
        (0, eval)(src);
    } catch (e) {
        ERRORS.push('LOAD ' + p + ' :: ' + e + (e && e.stack ? '\n' + e.stack : ''));
    }
}
['js/lab/core.js', 'js/lab/rodent.js', 'js/lab/engine.js'].forEach(function (f) { loadFile(DIR + '/' + f); });

var EXPFILES = {
    1: 'exp01-rotarod', 2: 'exp02-actophotometer', 3: 'exp03-tailflick', 5: 'exp05-hotplate',
    6: 'exp06-epm', 7: 'exp07-mes', 8: 'exp08-rabbiteye', 23: 'exp23-ld50',
    24: 'exp24-pawoedema', 25: 'exp25-antipyretic', 26: 'exp26-diuretic'
};
loadFile(DIR + '/js/lab/exp/' + EXPFILES[EXP] + '.js');

if (ERRORS.length) { ERRORS.forEach(function (e) { console.log('✗ ' + e); }); throw new Error('load failed'); }
if (!LAB.registry[EXP]) { console.log('✗ experiment ' + EXP + ' did not register'); throw new Error('not registered'); }

/* ---------------- run it ---------------- */
var mount = makeEl('#mount');
var eng, fails = [], clicks = 0, selects = 0;
function guard(label, fn) {
    try { return fn(); } catch (e) { fails.push(label + ' :: ' + e + (e && e.stack ? '\n   ' + String(e.stack).split('\n').slice(0, 4).join('\n   ') : '')); }
}

guard('construct', function () { eng = new LAB.registry[EXP](EXP, mount); });
if (!eng) { fails.forEach(function (f) { console.log('✗ ' + f); }); throw new Error('construct failed'); }

var ROWS_ADDED = 0, MILESTONES = [];
(function () {
    var origAdd = eng.addRow.bind(eng);
    eng.addRow = function (cells, cls) { ROWS_ADDED++; return origAdd(cells, cls); };
    ['_calculate', '_finish', '_record', '_outcome'].forEach(function (n) {
        if (typeof eng[n] !== 'function') return;
        var o = eng[n].bind(eng);
        eng[n] = function () {
            MILESTONES.push(n);
            var r = o.apply(null, arguments);
            if (n === '_calculate' && eng.result) console.log('DATA ld50=' + eng.result.ld50.toFixed(3) + ' lit=' + eng.result.lit + ' n=' + eng.series.doses.length);
            return r;
        };
    });
})();
var acts = [];
var origActions = eng.actions.bind(eng);
eng.actions = function (list) { acts = list || []; return origActions(list); };
if (DEBUG) {
    ['resetAnimal', 'select', '_newSeries', '_outcome', '_die'].forEach(function (name) {
        if (typeof eng[name] !== 'function') return;
        var orig = eng[name].bind(eng);
        eng[name] = function () {
            console.log('  >> ' + name + '(' + Array.prototype.slice.call(arguments).join(',') + ') t=' + (NOW / 1000).toFixed(1) +
                ' phase=' + eng.phase + ' busy=' + eng.busy + ' obs=' + !!eng.obs);
            return orig.apply(null, arguments);
        };
    });
}
// setup() already built its action bar before the wrapper existed — ask for it again
guard('initial refresh', function () { if (eng._refresh) eng._refresh(); });
// when a single treatment is requested, make it the active one from the start
if (TRS.length === 1) guard('initial select', function () { eng.select(TRS[0]); });

var trIds = TRS.length ? TRS : eng.cfg.treatments.map(function (t) { return t.id; });
var trIdx = 0;
var lastClick = -1e9, lastSelect = -1e9;

function pump(frames) {
    for (var i = 0; i < frames; i++) {
        NOW += 16.7;
        // due timers
        var due = timers.filter(function (t) { return t.t <= NOW; });
        timers = timers.filter(function (t) { return t.t > NOW; });
        due.forEach(function (t) { guard('timer', t.fn); });
        // one animation frame
        var cbs = rafCbs; rafCbs = [];
        cbs.forEach(function (cb) { guard('frame@' + Math.round(NOW), function () { cb(NOW); }); });
        // hover the pointer around so hotspot/callout code runs
        eng.ptr.over = true;
        eng.ptr.x = 120 + (i * 7) % 760;
        eng.ptr.y = 90 + (i * 11) % 380;
        if (eng.cursorAt) guard('cursorAt', function () { eng.cursorAt(eng.ptr.x, eng.ptr.y); });
        guard('getInjectZone', function () { eng.getInjectZone(); });
        // drive the UI: click the primary action whenever idle
        if (DEBUG && eng.where === 'maze' && eng.sess && !eng.injected) { console.log('  !! maze session with NO injected drug, t=' + (NOW/1000).toFixed(1) + ' phase=' + eng.phase + ' sess.t=' + eng.sess.t.toFixed(1) + ' lastClicks=' + CLICKLOG.slice(-5).join(' > ')); DEBUG = false; }
        if (DEBUG && i % 180 === 0) console.log('  t=' + (NOW/1000).toFixed(1) + 's busy=' + eng.busy + ' phase=' + eng.phase + ' acts=[' + acts.map(function(a){return a.label+(a.disabled?'(d)':'');}).join(' | ') + ']');
        if (!eng.busy && NOW - lastClick > 700) {
            lastClick = NOW;
            var a = null;
            for (var k = 0; k < acts.length; k++) { if (acts[k].primary && !acts[k].disabled) { a = acts[k]; break; } }
            if (!a) for (var k2 = 0; k2 < acts.length; k2++) { if (!acts[k2].disabled) { a = acts[k2]; break; } }
            if (a) { clicks++; CLICKLOG.push(a.label.replace(/<[^>]*>/g,'')); guard('click:' + a.label, function () { a.onClick(); }); }
            else if (NOW - lastSelect > 3000) {
                lastSelect = NOW; selects++;
                var id = trIds[trIdx++ % trIds.length]; CLICKLOG.push('select:' + id);
                guard('select:' + id, function () { eng.select(id); });
            }
        }
        // rotate treatments periodically so every drug profile is exercised
        if (!eng.busy && NOW - lastSelect > 9000) {
            lastSelect = NOW; selects++;
            var id2 = trIds[trIdx++ % trIds.length];
            guard('select:' + id2, function () { eng.select(id2); });
        }
    }
}

pump(FRAMES);

/* pointer interactions: try grabbing/dropping draggable props at many points */
if (eng.onPointerDown) {
    var pts = [];
    for (var gx = 40; gx < 960; gx += 90) for (var gy = 60; gy < 530; gy += 90) pts.push([gx, gy]);
    pts.forEach(function (p) {
        guard('pointerDown', function () { if (!eng.busy) eng.onPointerDown(p[0], p[1], {}); });
        if (eng.drag) {
            eng.drag.x = p[0] + 30; eng.drag.y = p[1] - 20;
            guard('pointerUp(miss)', function () { eng.onPointerUp(p[0] + 30, p[1] - 20, {}); });
        }
        pump(14);
    });
}
pump(600);

/* exercise the syringe drag path through the base engine */
guard('loadSyringe', function () { if (!eng.busy) eng.loadSyringe(); });
pump(60);
guard('autoInject', function () { if (!eng.busy) eng.autoInject(); });
pump(400);
guard('reset', function () { eng.syringeFill = 0; eng.resetAnimal(); });
pump(400);
guard('destroy', function () { eng.destroy(); });

/* ---------------- report ---------------- */
var mcount = {};
MILESTONES.forEach(function (m) { mcount[m] = (mcount[m] || 0) + 1; });
var msum = Object.keys(mcount).map(function (k) { return k + '×' + mcount[k]; }).join(', ') || 'none';
console.log('— exp ' + EXP + ': ' + FRAMES + '+ frames, ' + clicks + ' clicks, ' + selects + ' drug switches, ' +
    ROWS_ADDED + ' readings recorded (' + eng.rows.length + ' on screen); completions: ' + msum);
if (eng.results) {
    Object.keys(eng.results).forEach(function (k) {
        var arr = eng.results[k];
        if (!arr || !arr.length || typeof arr[0] !== 'object') return;
        var keys = Object.keys(arr[0]).filter(function (f) { return typeof arr[0][f] === 'number' || typeof arr[0][f] === 'boolean'; });
        var parts = keys.map(function (f) {
            var vals = arr.map(function (x) { return typeof x[f] === 'boolean' ? (x[f] ? 1 : 0) : x[f]; });
            var m = vals.reduce(function (a2, b2) { return a2 + b2; }, 0) / vals.length;
            return f + '=' + m.toFixed(2);
        });
        console.log('DATA ' + k + ' n=' + arr.length + ' ' + parts.join(' '));
    });
}
if (fails.length) {
    var seen = {}, uniq = [];
    fails.forEach(function (f) { var key = f.split(' :: ')[1] || f; if (!seen[key]) { seen[key] = 1; uniq.push(f); } });
    console.log('✗ ' + fails.length + ' error(s), ' + uniq.length + ' unique:');
    uniq.slice(0, 12).forEach(function (f) { console.log('  • ' + f); });
} else {
    console.log('✓ no runtime errors');
}
