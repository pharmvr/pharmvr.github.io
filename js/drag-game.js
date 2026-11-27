/**
 * PharmVR 2D — Unified Interactive DOM Drag-and-Drop Game Kit
 * Enables crisp SVG instruments & reagent vials to be picked up, dragged smoothly
 * across studio 2D lab stages, and dropped onto glowing physiological targets.
 */

window.DragGame = {
    makeDraggable(el, opts) {
        let dragging = false;
        let offsetX = 0, offsetY = 0;

        el.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            offsetX = e.clientX - rect.left - rect.width / 2;
            offsetY = e.clientY - rect.top - rect.height / 2;
            dragging = true;
            el.classList.add('dragging');
            el.style.left = (e.clientX - rect.width / 2 - offsetX) + 'px';
            el.style.top = (e.clientY - rect.height / 2 - offsetY) + 'px';
            if (opts.onStart) opts.onStart(e);
        });

        const onMove = (e) => {
            if (!dragging) return;
            const rect = el.getBoundingClientRect();
            el.style.left = (e.clientX - rect.width / 2) + 'px';
            el.style.top = (e.clientY - rect.height / 2) + 'px';
            if (opts.onMove) opts.onMove(e.clientX, e.clientY);
        };

        const onUp = (e) => {
            if (!dragging) return;
            dragging = false;
            el.classList.remove('dragging');
            el.style.left = '';
            el.style.top = '';
            if (opts.onDrop) opts.onDrop(e.clientX, e.clientY);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);

        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
    },

    isOverElement(clientX, clientY, targetEl, pad = 24) {
        if (!targetEl) return false;
        const r = targetEl.getBoundingClientRect();
        return clientX >= r.left - pad && clientX <= r.right + pad &&
               clientY >= r.top - pad && clientY <= r.bottom + pad;
    },

    spawnFloatingXP(stageEl, clientX, clientY, text) {
        if (!stageEl) return;
        const sr = stageEl.getBoundingClientRect();
        const badge = document.createElement('div');
        badge.className = 'float-xp';
        badge.textContent = text;
        badge.style.left = (clientX - sr.left) + 'px';
        badge.style.top = (clientY - sr.top) + 'px';
        stageEl.appendChild(badge);
        setTimeout(() => badge.remove(), 1250);
    }
};
