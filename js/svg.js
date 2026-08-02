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
        
        wrapperEl.querySelectorAll('.svg-overlay').forEach(svg => {
            svg.innerHTML = '';
            let table = svg.previousElementSibling;
            svg.style.width = table.offsetWidth + 'px';
            svg.style.height = table.offsetHeight + 'px';
        });

        if (!solutionMap || (solutionMap.length === 1 && solutionMap[0].pi === '-'.repeat(N))) return;

        let allVals = Array.from({length: 1<<N}, (_, i) => i);

        solutionMap.forEach((item, idx) => {
            let coveredVals = allVals.filter(v => Solver.covers(item.pi, v.toString(2).padStart(N, '0')));
            let gridsUsed = [0, 1].map(g => coveredVals.filter(v => Grid.getCoords(v, N).g === g));

            gridsUsed.forEach((valsInGrid, gIndex) => {
                if (valsInGrid.length === 0) return;

                let container = wrapperEl.querySelector(`.kmap-grid-container[data-g="${gIndex}"]`);
                if (!container) return;
                let svg = container.querySelector('.svg-overlay');
                let table = container.querySelector('table');

                let activeRows = [...new Set(valsInGrid.map(v => Grid.getCoords(v, N).r))];
                let activeCols = [...new Set(valsInGrid.map(v => Grid.getCoords(v, N).c))];

                let rowSegs = getSegments(activeRows);
                let colSegs = getSegments(activeCols);

                let insetBase = 4;
                let inset = insetBase + (idx * 3); 

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
                            
                            rect.setAttribute("rx", "8");
                            rect.setAttribute("fill", item.color);
                            rect.setAttribute("fill-opacity", "0.08");
                            rect.setAttribute("stroke", item.color);
                            rect.setAttribute("stroke-width", "3");
                            rect.setAttribute("class", `svg-loop loop-${idx} transition-all duration-[220ms] ease-spring`);

                            svg.appendChild(rect);
                        }
                    });
                });
            });
        });
    }

    window.KMapSVG = {
        drawSVGs
    };
})();
