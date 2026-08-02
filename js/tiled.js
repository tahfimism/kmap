(function() {
    /**
     * Finds a start index and length such that a contiguous sequence (toroidally)
     * covering the indices in the array exists.
     */
    function findContiguousRange(arr, max_val) {
        if (arr.length === 0) return null;
        let len = arr.length;
        if (len === max_val) {
            return { start: 0, end: max_val - 1, len: max_val };
        }
        // Try all starting points
        for (let s = 0; s < max_val; s++) {
            let match = true;
            for (let i = 0; i < len; i++) {
                let val = (s + i) % max_val;
                if (!arr.includes(val)) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return { start: s, end: (s + len - 1) % max_val, len: len };
            }
        }
        return null;
    }

    /**
     * Renders a 3x3 layout of K-Maps.
     * The center K-Map is full opacity. The surrounding 8 K-Maps are translucent.
     */
    function renderTiledKMap(container, onCellClick) {
        container.innerHTML = '';
        
        let state = window.KMapState;
        let N = state.N;
        let numGrids = N === 5 ? 2 : 1;
        let rows = N <= 3 ? 2 : 4;
        let cols = N === 2 ? 2 : 4;
        let gray4 = [0, 1, 3, 2];

        let rowLabels = N === 2 ? ['0', '1'] : (N <= 3 ? ['0', '1'] : ['00', '01', '11', '10']);
        let colLabels = N === 2 ? ['0', '1'] : ['00', '01', '11', '10'];

        let topVar = N === 2 ? 'B' : (N === 3 ? 'BC' : (N === 4 ? 'CD' : 'DE'));
        let sideVar = N <= 3 ? 'A' : (N === 4 ? 'AB' : 'BC');

        // Container for holding all grids
        let flexWrapperHtml = `<div class="flex flex-col md:flex-row gap-12 justify-center items-center max-w-full">`;

        for (let g = 0; g < numGrids; g++) {
            let gridHtml = `<div class="tiled-grid-container flex flex-col items-center gap-3" data-g="${g}">`;
            
            if (N === 5) {
                gridHtml += `
                    <div class="mb-1 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-cream-border dark:border-charcoal-border inline-block shadow-sm">
                        <span class="text-xs font-bold uppercase tracking-widest text-accent">Grid A = ${g}</span>
                    </div>
                `;
            }

            // Wrapper for 3x3 table arrangement and SVG overlay
            gridHtml += `<div class="tiled-grid-wrapper relative inline-block p-1 bg-neutral-50/50 dark:bg-neutral-900/10 rounded-2xl border border-cream-border/60 dark:border-charcoal-border/30">`;
            gridHtml += `<div class="grid grid-cols-3 gap-0">`;

            // Render the 3x3 layout of K-Maps
            for (let mr = 0; mr < 3; mr++) {
                for (let mc = 0; mc < 3; mc++) {
                    let isCenter = (mr === 1 && mc === 1);
                    let tableClass = isCenter 
                        ? "relative z-10 border-collapse bg-white dark:bg-charcoal-card border border-cream-border dark:border-charcoal-border transition-all duration-200"
                        : "relative z-10 border-collapse bg-white dark:bg-charcoal-card border border-cream-border dark:border-charcoal-border opacity-20 dark:opacity-[0.15] hover:opacity-40 transition-all duration-200";

                    gridHtml += `<table class="${tableClass} kmap-tiled-table" data-map-r="${mr}" data-map-c="${mc}">`;
                    gridHtml += `<thead><tr>`;
                    gridHtml += `<th class="relative w-16 h-14 bg-neutral-50 dark:bg-neutral-900 border-b border-r border-cream-border dark:border-charcoal-border select-none">
                                    <div class="absolute top-1 right-1.5 text-[10px] font-bold text-cream-muted dark:text-charcoal-muted">${topVar}</div>
                                    <div class="absolute bottom-1 left-1.5 text-[10px] font-bold text-cream-muted dark:text-charcoal-muted">${sideVar}</div>
                                    <svg class="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20"><line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" stroke-width="1"></line></svg>
                                 </th>`;
                    for (let c = 0; c < cols; c++) {
                        gridHtml += `<th class="text-xs font-semibold text-cream-text dark:text-charcoal-text bg-neutral-50 dark:bg-neutral-900 border-b border-cream-border dark:border-charcoal-border select-none">${colLabels[c]}</th>`;
                    }
                    gridHtml += `</tr></thead><tbody>`;

                    for (let r = 0; r < rows; r++) {
                        gridHtml += `<tr><th class="text-xs font-semibold text-cream-text dark:text-charcoal-text bg-neutral-50 dark:bg-neutral-900 border-r border-cream-border dark:border-charcoal-border select-none">${rowLabels[r]}</th>`;
                        for (let c = 0; c < cols; c++) {
                            let valIndex = 0;
                            if (N === 2) valIndex = (r << 1) | c;
                            else if (N === 3) valIndex = (r << 2) | gray4[c];
                            else if (N === 4) valIndex = (gray4[r] << 2) | gray4[c];
                            else if (N === 5) valIndex = (g << 4) | (gray4[r] << 2) | gray4[c];

                            let stateVal = state.stateData[valIndex];
                            let text = stateVal === 2 ? 'X' : stateVal;
                            gridHtml += `<td class="kmap-cell val-${text}" data-val="${valIndex}" data-r="${r}" data-c="${c}">${text}</td>`;
                        }
                        gridHtml += `</tr>`;
                    }

                    gridHtml += `</tbody></table>`;
                }
            }

            gridHtml += `</div>`; // End of 3x3 table grid
            gridHtml += `<svg class="tiled-svg-overlay absolute top-0 left-0 w-full h-full pointer-events-none z-20"></svg>`;
            gridHtml += `</div>`; // End of wrapper
            gridHtml += `</div>`; // End of tiled-grid-container
            flexWrapperHtml += gridHtml;
        }
        flexWrapperHtml += `</div>`;
        container.innerHTML = flexWrapperHtml;

        // Bind click events on all cells (both center and clone cells)
        container.querySelectorAll('.kmap-cell').forEach(cell => {
            cell.addEventListener('click', function() {
                let valIndex = parseInt(this.getAttribute('data-val'));
                onCellClick(valIndex);
            });
        });
    }

    /**
     * Draws continuous SVG loops across the tiled 3x3 layout.
     */
    function drawTiledSVGs(solutionMap, wrapperEl) {
        let state = window.KMapState;
        let Grid = window.KMapGrid;
        let Solver = window.KMapSolver;
        let N = state.N;
        let rows = N <= 3 ? 2 : 4;
        let cols = N === 2 ? 2 : 4;

        wrapperEl.querySelectorAll('.tiled-svg-overlay').forEach(svg => {
            svg.innerHTML = '';
            let tablesGrid = svg.previousElementSibling; // This is the .grid element containing the 9 tables
            svg.style.width = tablesGrid.offsetWidth + 'px';
            svg.style.height = tablesGrid.offsetHeight + 'px';
        });

        if (!solutionMap || (solutionMap.length === 1 && solutionMap[0].pi === '-'.repeat(N))) return;

        let allVals = Array.from({length: 1<<N}, (_, i) => i);

        solutionMap.forEach((item, idx) => {
            let coveredVals = allVals.filter(v => Solver.covers(item.pi, v.toString(2).padStart(N, '0')));
            let gridsUsed = [0, 1].map(g => coveredVals.filter(v => Grid.getCoords(v, N).g === g));

            gridsUsed.forEach((valsInGrid, gIndex) => {
                if (valsInGrid.length === 0) return;

                let container = wrapperEl.querySelector(`.tiled-grid-container[data-g="${gIndex}"]`);
                if (!container) return;
                
                let svg = container.querySelector('.tiled-svg-overlay');
                let tablesGrid = container.querySelector('.grid');

                // Get the unique active rows and columns
                let activeRows = [...new Set(valsInGrid.map(v => Grid.getCoords(v, N).r))];
                let activeCols = [...new Set(valsInGrid.map(v => Grid.getCoords(v, N).c))];

                let rowRange = findContiguousRange(activeRows, rows);
                let colRange = findContiguousRange(activeCols, cols);

                if (!rowRange || !colRange) return;

                let r_start = rowRange.start;
                let h = rowRange.len;
                let c_start = colRange.start;
                let w = colRange.len;

                let insetBase = 4;
                let inset = insetBase + (idx * 3);

                // Periodically repeat the loops in the 3x3 grid (k and j are vertical and horizontal map offsets)
                for (let k = -1; k <= 2; k++) {
                    for (let j = -1; j <= 2; j++) {
                        let gr_start = r_start + k * rows;
                        let gc_start = c_start + j * cols;
                        let gr_end = gr_start + h - 1;
                        let gc_end = gc_start + w - 1;

                        // Verify if this loop overlaps with the 3x3 layout boundaries
                        if (gr_start < 3 * rows && gr_end >= 0 && gc_start < 3 * cols && gc_end >= 0) {
                            // Clamp coordinates to find corresponding cells in the DOM for measuring layout pixels
                            let start_row_clamp = Math.max(0, gr_start);
                            let end_row_clamp = Math.min(3 * rows - 1, gr_end);
                            let start_col_clamp = Math.max(0, gc_start);
                            let end_col_clamp = Math.min(3 * cols - 1, gc_end);

                            // Find the start table and cell
                            let start_mr = Math.floor(start_row_clamp / rows);
                            let start_mc = Math.floor(start_col_clamp / cols);
                            let start_r = start_row_clamp % rows;
                            let start_c = start_col_clamp % cols;

                            let startTable = tablesGrid.querySelector(`table[data-map-r="${start_mr}"][data-map-c="${start_mc}"]`);
                            if (!startTable) continue;
                            let startCell = startTable.querySelectorAll('tbody tr')[start_r].querySelectorAll('td')[start_c];

                            // Find the end table and cell
                            let end_mr = Math.floor(end_row_clamp / rows);
                            let end_mc = Math.floor(end_col_clamp / cols);
                            let end_r = end_row_clamp % rows;
                            let end_c = end_col_clamp % cols;

                            let endTable = tablesGrid.querySelector(`table[data-map-r="${end_mr}"][data-map-c="${end_mc}"]`);
                            if (!endTable) continue;
                            let endCell = endTable.querySelectorAll('tbody tr')[end_r].querySelectorAll('td')[end_c];

                            if (startCell && endCell) {
                                let svgRect = svg.getBoundingClientRect();
                                let startRect = startCell.getBoundingClientRect();
                                let endRect = endCell.getBoundingClientRect();

                                let cell_width = startRect.width;
                                let cell_height = startRect.height;

                                let x = (startRect.left - svgRect.left);
                                let y = (startRect.top - svgRect.top);

                                // Extrapolate coordinates if they were clamped
                                if (gc_start < 0) {
                                    x -= (0 - gc_start) * cell_width;
                                }
                                if (gr_start < 0) {
                                    y -= (0 - gr_start) * cell_height;
                                }

                                let w_rect = (endRect.right - (startRect.left - (gc_start < 0 ? (0 - gc_start) * cell_width : 0)));
                                if (gc_end >= 3 * cols) {
                                    w_rect += (gc_end - (3 * cols - 1)) * cell_width;
                                }

                                let h_rect = (endRect.bottom - (startRect.top - (gr_start < 0 ? (0 - gr_start) * cell_height : 0)));
                                if (gr_end >= 3 * rows) {
                                    h_rect += (gr_end - (3 * rows - 1)) * cell_height;
                                }

                                // Apply loop insets
                                x += inset;
                                y += inset;
                                w_rect -= inset * 2;
                                h_rect -= inset * 2;

                                // Render SVG rectangle loop
                                let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                                rect.setAttribute("x", x);
                                rect.setAttribute("y", y);
                                rect.setAttribute("width", w_rect);
                                rect.setAttribute("height", h_rect);
                                
                                rect.setAttribute("rx", "8");
                                rect.setAttribute("fill", item.color);
                                rect.setAttribute("fill-opacity", "0.08");
                                rect.setAttribute("stroke", item.color);
                                rect.setAttribute("stroke-width", "3");
                                rect.setAttribute("class", `svg-loop loop-${idx} transition-all duration-[220ms] ease-spring`);

                                svg.appendChild(rect);
                            }
                        }
                    }
                }
            });
        });
    }

    window.KMapTiled = {
        renderTiledKMap,
        drawTiledSVGs
    };
})();
