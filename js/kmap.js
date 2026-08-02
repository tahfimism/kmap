(function() {
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
            let gridHtml = `<div class="relative inline-block kmap-grid-container" data-g="${g}">`;
            
            if (N === 5) {
                gridHtml += `
                    <div class="mb-3 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-cream-border dark:border-charcoal-border inline-block shadow-sm">
                        <span class="text-xs font-bold uppercase tracking-widest text-accent">Grid A = ${g}</span>
                    </div>
                `;
            }

            gridHtml += `<table class="relative z-10 border-collapse bg-white dark:bg-charcoal-card rounded-xl overflow-hidden border border-cream-border dark:border-charcoal-border">`;
            
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

                    let stateVal = state.stateData[valIndex];
                    let text = stateVal === 2 ? 'X' : stateVal;
                    gridHtml += `<td class="kmap-cell val-${text}" data-val="${valIndex}">${text}</td>`;
                }
                gridHtml += `</tr>`;
            }

            gridHtml += `</tbody></table>`;
            gridHtml += `<svg class="svg-overlay absolute top-0 left-0 w-full h-full pointer-events-none z-20"></svg>`;
            gridHtml += `</div>`;

            container.insertAdjacentHTML('beforeend', gridHtml);
        }

        bindCellClicks(container, onCellClick);
    }

    function bindCellClicks(container, onCellClick) {
        container.querySelectorAll('.kmap-cell').forEach(cell => {
            cell.addEventListener('click', function() {
                let valIndex = parseInt(this.getAttribute('data-val'));
                onCellClick(valIndex);
            });
        });
    }

    function updateCellVisuals() {
        let state = window.KMapState;
        document.querySelectorAll('.kmap-cell').forEach(cell => {
            let valIndex = parseInt(cell.getAttribute('data-val'));
            let stateVal = state.stateData[valIndex];
            let text = stateVal === 2 ? 'X' : stateVal;
            cell.innerText = text;
            cell.className = `kmap-cell val-${text}`;
        });
    }

    window.KMapGrid = {
        getCoords,
        findValByIndex,
        renderGrids,
        bindCellClicks,
        updateCellVisuals
    };
})();
