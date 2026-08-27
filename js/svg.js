(function() {
    function getSegments(indices) {
        if (indices.length === 0) return [];
        indices.sort((a, b) => a - b);
        let segments = [];
        let start = indices[0];
        let prev = indices[0];
        
        for (let i = 1; i < indices.length; i++) {
            if (indices[i] === prev + 1) prev = indices[i];
            else {
                segments.push([start, prev]);
                start = indices[i];
                prev = indices[i];
            }
        }
        segments.push([start, prev]);
        return segments;
    }

    function drawSVGs(solutionMap, wrapperEl) {
        let state = window.KMapState;
        let Grid = window.KMapGrid;
        let Solver = window.KMapSolver;
        let N = state.N;
        
        if (!wrapperEl) return;

        wrapperEl.querySelectorAll('.svg-overlay').forEach(svg => {
            svg.innerHTML = '';
            let table = svg.previousElementSibling;
            if (table) {
                svg.style.width = table.offsetWidth + 'px';
                svg.style.height = table.offsetHeight + 'px';
            }
        });

        if (!solutionMap || (solutionMap.length === 1 && solutionMap[0].pi === '-'.repeat(N))) return;

        let allVals = Array.from({length: 1<<N}, (_, i) => i);

        solutionMap.forEach((item, idx) => {
            // If in playback mode, filter loops past the current step
            if (state.playbackStep !== null && idx > state.playbackStep) {
                return;
            }

            let coveredVals = allVals.filter(v => Solver.covers(item.pi, v.toString(2).padStart(N, '0')));
            let gridsUsed = [0, 1].map(g => coveredVals.filter(v => Grid.getCoords(v, N).g === g));

            gridsUsed.forEach((valsInGrid, gIndex) => {
                if (valsInGrid.length === 0) return;

                let container = wrapperEl.querySelector(`.kmap-grid-container[data-g="${gIndex}"]`);
                if (!container) return;
                let svg = container.querySelector('.svg-overlay');
                let table = container.querySelector('table');
                if (!svg || !table) return;

                let activeRows = [...new Set(valsInGrid.map(v => Grid.getCoords(v, N).r))];
                let activeCols = [...new Set(valsInGrid.map(v => Grid.getCoords(v, N).c))];

                let rowSegs = getSegments(activeRows);
                let colSegs = getSegments(activeCols);

                let isWrapping = rowSegs.length > 1 || colSegs.length > 1;
                let insetBase = 4;
                let inset = insetBase + (idx * 3.5); 

                rowSegs.forEach(rs => {
                    colSegs.forEach(cs => {
                        let tl_val = Grid.findValByIndex(gIndex, rs[0], cs[0], N);
                        let br_val = Grid.findValByIndex(gIndex, rs[1], cs[1], N);

                        let tl_td = table.querySelector(`td[data-val="${tl_val}"]`);
                        let br_td = table.querySelector(`td[data-val="${br_val}"]`);

                        if (tl_td && br_td) {
                            let svgRect = svg.getBoundingClientRect();
                            let tlRect = tl_td.getBoundingClientRect();
                            let brRect = br_td.getBoundingClientRect();

                            let x = (tlRect.left - svgRect.left) + inset;
                            let y = (tlRect.top - svgRect.top) + inset;
                            let w = (brRect.right - tlRect.left) - (inset * 2);
                            let h = (brRect.bottom - tlRect.top) - (inset * 2);

                            let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                            rect.setAttribute("x", x);
                            rect.setAttribute("y", y);
                            rect.setAttribute("width", w);
                            rect.setAttribute("height", h);
                            
                            rect.setAttribute("rx", "6");
                            rect.setAttribute("fill", item.color);
                            rect.setAttribute("fill-opacity", "0.06");
                            rect.setAttribute("stroke", item.color);
                            rect.setAttribute("stroke-width", "2");

                            if (isWrapping) {
                                rect.setAttribute("stroke-dasharray", "6,4");
                            }

                            rect.setAttribute("class", `svg-loop loop-${idx} transition-all duration-[220ms] ease-spring`);
                            svg.appendChild(rect);
                        }
                    });
                });
            });
        });
    }

    function highlightGroup(idx, isolate = true) {
        document.querySelectorAll('.svg-loop').forEach(el => {
            if (el.classList.contains(`loop-${idx}`)) {
                el.setAttribute("stroke-width", "4");
                el.setAttribute("fill-opacity", "0.22");
                el.setAttribute("stroke-opacity", "1");
            } else if (isolate) {
                el.setAttribute("stroke-opacity", "0.12");
                el.setAttribute("fill-opacity", "0.01");
            }
        });
    }

    function unhighlightGroup() {
        document.querySelectorAll('.svg-loop').forEach(el => {
            el.setAttribute("stroke-width", "2");
            el.setAttribute("stroke-opacity", "1");
            el.setAttribute("fill-opacity", "0.06");
        });
    }

    window.highlightGroup = highlightGroup;
    window.unhighlightGroup = unhighlightGroup;

    window.KMapSVG = {
        drawSVGs,
        highlightGroup,
        unhighlightGroup
    };
})();
