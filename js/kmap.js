(function() {
    let currentHoveredCell = null;
    let focusedCellIndex = 0;
    let isPainting = false;

    function getCoords(val, N) {
        const gray4 = window.KMapState.gray4;
        if (N === 2) return { g: 0, r: (val >> 1) & 1, c: val & 1 };
        if (N === 3) return { g: 0, r: (val >> 2) & 1, c: gray4.indexOf(val & 3) };
        if (N === 4) return { g: 0, r: gray4.indexOf((val >> 2) & 3), c: gray4.indexOf(val & 3) };
        if (N === 5) return { g: (val >> 4) & 1, r: gray4.indexOf((val >> 2) & 3), c: gray4.indexOf(val & 3) };
    }

    function findValByIndex(g, r, c, N) {
        for (let i = 0; i < (1 << N); i++) {
            let coords = getCoords(i, N);
            if (coords.g === g && coords.r === r && coords.c === c) return i;
        }
        return 0;
    }

    function applyBrush(valIndex) {
        let state = window.KMapState;
        if (state.practiceMode) return;
        
        let brush = state.brushMode || 'click';
        if (brush === 'paint_1') {
            state.setData(valIndex, 1);
        } else if (brush === 'paint_0') {
            state.setData(valIndex, 0);
        } else if (brush === 'paint_x') {
            state.setData(valIndex, 2);
        } else {
            // cycle
            state.setData(valIndex, (state.stateData[valIndex] + 1) % 3);
        }
    }

    function renderGrids(container, onCellClick) {
        container.innerHTML = '';
        
        let state = window.KMapState;
        let N = state.N;
        let numGrids = N === 5 ? 2 : 1;
        let rows = N <= 3 ? 2 : 4;
        let cols = N === 2 ? 2 : 4;

        let rowLabels = N === 2 ? ['0', '1'] : (N <= 3 ? ['0', '1'] : ['00', '01', '11', '10']);
        let colLabels = N === 2 ? ['0', '1'] : ['00', '01', '11', '10'];

        let topVar = N === 2 ? 'B' : (N === 3 ? 'BC' : (N === 4 ? 'CD' : 'DE'));
        let sideVar = N <= 3 ? 'A' : (N === 4 ? 'AB' : 'BC');

        for (let g = 0; g < numGrids; g++) {
            let gridHtml = `<div class="relative inline-block kmap-grid-container select-none" data-g="${g}">`;
            
            if (N === 5) {
                gridHtml += `
                    <div class="mb-3 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-cream-border dark:border-charcoal-border inline-block shadow-sm">
                        <span class="text-xs font-bold uppercase tracking-widest text-accent">Grid A = ${g}</span>
                    </div>
                `;
            }

            gridHtml += `<table class="relative z-10 border-collapse bg-white dark:bg-charcoal-card rounded-xl overflow-hidden border border-cream-border dark:border-charcoal-border shadow-sm">`;
            
            gridHtml += `<thead><tr>`;
            gridHtml += `<th class="relative w-16 h-14 bg-neutral-50 dark:bg-neutral-900 border-b border-r border-cream-border dark:border-charcoal-border">
                            <div class="absolute top-1 right-1.5 text-[10px] font-bold text-cream-muted dark:text-charcoal-muted">${topVar}</div>
                            <div class="absolute bottom-1 left-1.5 text-[10px] font-bold text-cream-muted dark:text-charcoal-muted">${sideVar}</div>
                            <svg class="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20"><line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" stroke-width="1"></line></svg>
                         </th>`;
            for (let c = 0; c < cols; c++) {
                gridHtml += `<th class="text-xs font-semibold text-cream-text dark:text-charcoal-text bg-neutral-50 dark:bg-neutral-900 border-b border-cream-border dark:border-charcoal-border">${colLabels[c]}</th>`;
            }
            gridHtml += `</tr></thead><tbody>`;

            for (let r = 0; r < rows; r++) {
                gridHtml += `<tr><th class="text-xs font-semibold text-cream-text dark:text-charcoal-text bg-neutral-50 dark:bg-neutral-900 border-r border-cream-border dark:border-charcoal-border">${rowLabels[r]}</th>`;
                for (let c = 0; c < cols; c++) {
                    let valIndex = 0;
                    if (N === 2) valIndex = (r << 1) | c;
                    else if (N === 3) valIndex = (r << 2) | state.gray4[c];
                    else if (N === 4) valIndex = (state.gray4[r] << 2) | state.gray4[c];
                    else if (N === 5) valIndex = (g << 4) | (state.gray4[r] << 2) | state.gray4[c];

                    let stateVal = state.stateData[valIndex] || 0;
                    let text = stateVal === 2 ? 'X' : stateVal;
                    let isFirstCell = (valIndex === 0);
                    let pulseDotHtml = isFirstCell ? `<span class="pulse-guide-dot absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent animate-ping hidden"></span>` : '';
                    gridHtml += `<td class="kmap-cell relative val-${text}" data-val="${valIndex}" tabindex="0">${text}${pulseDotHtml}</td>`;
                }
                gridHtml += `</tr>`;
            }

            gridHtml += `</tbody></table>`;
            gridHtml += `<svg class="svg-overlay absolute top-0 left-0 w-full h-full pointer-events-none z-20"></svg>`;
            gridHtml += `</div>`;

            container.insertAdjacentHTML('beforeend', gridHtml);
        }

        bindInteractions(container, onCellClick);
        updateEmptyStateWatermark();
    }

    function bindInteractions(container, onCellClick) {
        container.querySelectorAll('.kmap-cell').forEach(cell => {
            let valIndex = parseInt(cell.getAttribute('data-val'));
            
            cell.addEventListener('mouseenter', function() {
                currentHoveredCell = valIndex;
                if (isPainting && window.KMapState.brushMode !== 'click') {
                    applyBrush(valIndex);
                }
            });

            cell.addEventListener('mouseleave', function() {
                if (currentHoveredCell === valIndex) {
                    currentHoveredCell = null;
                }
            });

            cell.addEventListener('mousedown', function(e) {
                if (window.KMapState.practiceMode) return;
                isPainting = true;
                applyBrush(valIndex);
            });

            cell.addEventListener('focus', function() {
                focusedCellIndex = valIndex;
                updateFocusRing();
            });
        });
    }

    // Window global mouse and keyboard hooks
    window.addEventListener('mouseup', () => {
        isPainting = false;
    });

    window.addEventListener('keydown', (e) => {
        let state = window.KMapState;
        if (state.practiceMode) return;

        // Target cell: active hovered cell or focused cell
        let targetIdx = (currentHoveredCell !== null) ? currentHoveredCell : focusedCellIndex;
        if (targetIdx === null || targetIdx < 0 || targetIdx >= (1 << state.N)) return;

        // Keystroke value setting
        if (e.key === '0') {
            state.setData(targetIdx, 0);
        } else if (e.key === '1') {
            state.setData(targetIdx, 1);
        } else if (e.key.toLowerCase() === 'x') {
            state.setData(targetIdx, 2);
        } else if (e.key === ' ' || e.key === 'Enter') {
            applyBrush(targetIdx);
            e.preventDefault();
        } else if (e.key.startsWith('Arrow')) {
            navigateFocus(e.key);
            e.preventDefault();
        }
    });

    function navigateFocus(arrowKey) {
        let state = window.KMapState;
        let N = state.N;
        let coords = getCoords(focusedCellIndex, N);
        let rows = N <= 3 ? 2 : 4;
        let cols = N === 2 ? 2 : 4;
        
        let r = coords.r;
        let c = coords.c;
        let g = coords.g;

        if (arrowKey === 'ArrowUp') r = (r - 1 + rows) % rows;
        if (arrowKey === 'ArrowDown') r = (r + 1) % rows;
        if (arrowKey === 'ArrowLeft') c = (c - 1 + cols) % cols;
        if (arrowKey === 'ArrowRight') c = (c + 1) % cols;

        focusedCellIndex = findValByIndex(g, r, c, N);
        updateFocusRing();
    }

    function updateFocusRing() {
        document.querySelectorAll('.kmap-cell').forEach(cell => {
            let idx = parseInt(cell.getAttribute('data-val'));
            if (idx === focusedCellIndex) {
                cell.classList.add('ring-2', 'ring-accent', 'ring-offset-1', 'z-30');
            } else {
                cell.classList.remove('ring-2', 'ring-accent', 'ring-offset-1', 'z-30');
            }
        });
    }

    function updateCellVisuals() {
        let state = window.KMapState;
        document.querySelectorAll('.kmap-cell').forEach(cell => {
            let valIndex = parseInt(cell.getAttribute('data-val'));
            let stateVal = state.stateData[valIndex];
            let text = stateVal === 2 ? 'X' : stateVal;
            // Preserve child pulse dot on m0
            let isFirst = (valIndex === 0);
            let pulseDot = isFirst ? `<span class="pulse-guide-dot absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent animate-ping hidden"></span>` : '';
            cell.innerHTML = `${text}${pulseDot}`;
            cell.className = `kmap-cell relative val-${text}`;
        });
        updateEmptyStateWatermark();
    }

    function updateEmptyStateWatermark() {
        let state = window.KMapState;
        let isAllZero = state.stateData && state.stateData.every(v => v === 0);
        let statusEl = document.getElementById('status-bar-text');
        let pulseDot = document.querySelector('.pulse-guide-dot');

        if (statusEl) {
            if (isAllZero) {
                statusEl.innerText = "STATUS // AWAITING INPUT — Press 0, 1, X or Click";
                statusEl.classList.add('animate-pulse');
            } else {
                statusEl.innerText = "STATUS // ACTIVE CALCULATION";
                statusEl.classList.remove('animate-pulse');
            }
        }

        if (pulseDot) {
            if (isAllZero) pulseDot.classList.remove('hidden');
            else pulseDot.classList.add('hidden');
        }
    }

    function highlightCell(idx) {
        let cell = document.querySelector(`.kmap-cell[data-val="${idx}"]`);
        if (cell) {
            cell.classList.add('ring-4', 'ring-accent/80', 'scale-105', 'z-30', 'transition-transform');
        }
    }

    function unhighlightCell() {
        document.querySelectorAll('.kmap-cell').forEach(cell => {
            cell.classList.remove('ring-4', 'ring-accent/80', 'scale-105', 'z-30');
        });
    }

    window.KMapGrid = {
        getCoords,
        findValByIndex,
        renderGrids,
        updateCellVisuals,
        updateEmptyStateWatermark,
        highlightCell,
        unhighlightCell
    };
})();
