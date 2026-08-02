(function() {
    let practiceState = {
        active: false,
        type: 'random_minterms', // 'random_minterms' or 'target_expression'
        targetExpression: '',
        targetMinterms: [],
        targetDontCares: [],
        userLoops: [], // Array of arrays of cell indices
        selectedCells: new Set(), // Set of cell indices representing the active group selection
        isDragging: false,
        dragActive: false,
        startCellIdx: null,
        source: '',
        hints: []
    };

    // Practice problem dataset counters
    window.KMapCustomProblems = [];
    window.KMapCustomProblemsIndex = 0;
    window.KMapDefaultProblemsIndex = 0;

    // Base targeted templates for concept-driven generation
    const templates = {
        easy: [
            // 2-var
            { N: 2, minterms: [0, 1], dontcares: [] },
            { N: 2, minterms: [0, 2], dontcares: [] },
            // 3-var
            { N: 3, minterms: [0, 1], dontcares: [] },
            { N: 3, minterms: [0, 4], dontcares: [] },
            { N: 3, minterms: [0, 1, 4, 5], dontcares: [] },
            // 4-var
            { N: 4, minterms: [0, 1], dontcares: [] },
            { N: 4, minterms: [0, 4], dontcares: [] },
            { N: 4, minterms: [0, 1, 4, 5], dontcares: [] },
            { N: 4, minterms: [0, 1, 2, 3, 4, 5, 6, 7], dontcares: [] }
        ],
        edge_wrap: [
            // 3-var
            { N: 3, minterms: [0, 2], dontcares: [] }, // wraps columns 0 & 2
            { N: 3, minterms: [0, 2, 4, 6], dontcares: [] }, // wraps entire outer columns
            // 4-var
            { N: 4, minterms: [0, 2, 8, 10], dontcares: [] }, // corners!
            { N: 4, minterms: [0, 8], dontcares: [] }, // wraps top/bottom rows
            { N: 4, minterms: [0, 1, 8, 9], dontcares: [] }, // wraps top/bottom (double)
            { N: 4, minterms: [4, 6, 12, 14], dontcares: [] } // wraps columns 1 & 3
        ],
        dont_care_guide: [
            // 3-var
            { N: 3, minterms: [0, 1], dontcares: [2, 3] }, // merges 2 to 4
            { N: 3, minterms: [0, 4], dontcares: [1, 5] },
            // 4-var
            { N: 4, minterms: [0, 1, 8, 9], dontcares: [2, 3, 10, 11] }, // merges 4 to 8
            { N: 4, minterms: [5, 13], dontcares: [7, 15] }
        ],
        redundancy: [
            // 3-var
            { N: 3, minterms: [1, 3, 5], dontcares: [] },
            // 4-var
            { N: 4, minterms: [1, 3, 4, 5, 9, 11], dontcares: [] },
            { N: 4, minterms: [0, 2, 5, 7, 8, 10, 13, 15], dontcares: [] } // Naive overlapping group of 4 is redundant
        ]
    };

    // Helper: Apply random variable swaps and coordinate inversions to preserve Gray code adjacency
    function permuteAndInvertIndices(indices, N) {
        // Random permutation of variables [0..N-1]
        let perm = [];
        let src = Array.from({length: N}, (_, i) => i);
        while (src.length > 0) {
            let idx = Math.floor(Math.random() * src.length);
            perm.push(src.splice(idx, 1)[0]);
        }

        // Random inversion bitmask
        let invertMask = Math.floor(Math.random() * (1 << N));

        return indices.map(idx => {
            // Extract bits
            let bits = [];
            for (let i = 0; i < N; i++) {
                bits.push((idx >> i) & 1);
            }
            // Invert (XOR)
            for (let i = 0; i < N; i++) {
                let maskBit = (invertMask >> i) & 1;
                bits[i] = bits[i] ^ maskBit;
            }
            // Permute
            let permutedBits = new Array(N);
            for (let i = 0; i < N; i++) {
                permutedBits[perm[i]] = bits[i];
            }
            // Reconstruct integer
            let newIdx = 0;
            for (let i = 0; i < N; i++) {
                if (permutedBits[i]) {
                    newIdx |= (1 << i);
                }
            }
            return newIdx;
        });
    }

    // Helper: Convert a list of cell indices to gray code order / consensus term (PI representation)
    function loopToPi(indices, N) {
        if (!indices || indices.length === 0) return null;
        let pi = '';
        for (let k = 0; k < N; k++) {
            let hasZero = false;
            let hasOne = false;
            indices.forEach(idx => {
                let bit = (idx >> (N - 1 - k)) & 1;
                if (bit === 0) hasZero = true;
                else hasOne = true;
            });
            if (hasZero && hasOne) pi += '-';
            else if (hasOne) pi += '1';
            else pi += '0';
        }
        return pi;
    }

    // Helper: Translate a PI string to plain-text expression (e.g. "A'B")
    function piToText(pi, N) {
        if (!pi.includes('0') && !pi.includes('1')) return '1';
        let str = '';
        const vars = ['A', 'B', 'C', 'D', 'E'];
        for (let i = 0; i < N; i++) {
            if (pi[i] === '1') str += vars[i];
            if (pi[i] === '0') str += vars[i] + "'";
        }
        return str;
    }

    // Helper: segment finder for SVG drawing
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

    // Generate practice challenge based on selected difficulty or PYQ preset
    function generateChallenge() {
        let state = window.KMapState;
        let N = state.N;
        if (N < 2 || N > 4) {
            N = 3;
            state.init(3);
        }

        let difficultySelect = document.getElementById('practice-difficulty');
        let mode = difficultySelect ? difficultySelect.value : 'easy';

        let targetMinterms = [];
        let targetDontCares = [];
        let sourceName = "";
        let hintsList = [];
        let targetExpr = "";

        if (mode === 'pyq') {
            // Load preset PYQ problem
            let dataset = window.KMapDefaultProblems || [];
            if (dataset.length === 0) {
                alert("Default PYQ database is empty.");
                return;
            }
            let prob = dataset[window.KMapDefaultProblemsIndex];
            window.KMapDefaultProblemsIndex = (window.KMapDefaultProblemsIndex + 1) % dataset.length;

            N = prob.N;
            if (state.N !== N) {
                state.init(N);
                window.KMapGrid.renderGrids(document.getElementById('maps-wrapper'), () => {});
            }

            targetMinterms = [...prob.minterms];
            targetDontCares = [...prob.dontcares];
            sourceName = prob.source || "Preset PYQ";
            hintsList = prob.hints || [];
        } else if (mode === 'pyq_custom') {
            // Load custom PYQ problem uploaded by user
            let dataset = window.KMapCustomProblems || [];
            if (dataset.length === 0) {
                alert("Please click the 'Load JSON' button to choose your custom PYQs file first.");
                return;
            }
            let prob = dataset[window.KMapCustomProblemsIndex];
            window.KMapCustomProblemsIndex = (window.KMapCustomProblemsIndex + 1) % dataset.length;

            N = prob.N;
            if (state.N !== N) {
                state.init(N);
                window.KMapGrid.renderGrids(document.getElementById('maps-wrapper'), () => {});
            }

            targetMinterms = [...prob.minterms];
            targetDontCares = [...prob.dontcares];
            sourceName = prob.source || "Uploaded PYQ";
            hintsList = prob.hints || [];
        } else {
            // Concept-targeted generation using base templates & symmetries
            let categoryTemplates = templates[mode] || templates['easy'];
            let matching = categoryTemplates.filter(t => t.N === N);
            let template;
            
            if (matching.length > 0) {
                template = matching[Math.floor(Math.random() * matching.length)];
            } else {
                template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
                N = template.N;
                state.init(N);
                window.KMapGrid.renderGrids(document.getElementById('maps-wrapper'), () => {});
            }

            // Apply Gray code coordinate permutations and XOR bit-inversion isomorphisms
            targetMinterms = permuteAndInvertIndices(template.minterms, N);
            targetDontCares = permuteAndInvertIndices(template.dontcares, N);
            sourceName = `Targeted Challenge (${mode.toUpperCase().replace('_', ' ')})`;
            hintsList = [
                `This is a concept-targeted map focusing on adjacent cell coverage.`,
                `Look for symmetric groupings and make sure to use valid power-of-2 dimensions.`
            ];
        }

        // Calculate target expression for prompt verification
        let tempState = new Array(1 << N).fill(0);
        targetMinterms.forEach(m => tempState[m] = 1);
        targetDontCares.forEach(m => tempState[m] = 2);

        let result = window.KMapSolver.solveQM(tempState, N);
        targetExpr = result.solution.map(pi => piToText(pi, N)).join(' + ');

        // Populate practice state
        practiceState.targetMinterms = targetMinterms;
        practiceState.targetDontCares = targetDontCares;
        practiceState.targetExpression = targetExpr;
        practiceState.source = sourceName;
        practiceState.hints = hintsList;

        // Reset variables in stateData
        state.clearAll();
        practiceState.targetMinterms.forEach(m => state.setData(m, 1));
        practiceState.targetDontCares.forEach(m => state.setData(m, 2));

        practiceState.userLoops = [];
        practiceState.selectedCells.clear();
        practiceState.isDragging = false;
        practiceState.dragActive = false;
        practiceState.startCellIdx = null;

        updatePracticeBanner();
        updatePracticeExpression();
        renderUserLoopsList();
    }

    // Update the banner prompt text
    function updatePracticeBanner() {
        let promptEl = document.getElementById('practice-prompt');
        if (!promptEl) return;
        
        let headerLabel = practiceState.source ? `<div class="text-[10px] text-accent uppercase tracking-widest font-extrabold mb-0.5">${practiceState.source}</div>` : '';
        
        if (practiceState.type === 'target_expression' || practiceState.source.includes("PYQ")) {
            promptEl.innerHTML = `${headerLabel}Practice: Group the cells to simplify target <span class="text-accent font-extrabold">Y = ${practiceState.targetExpression}</span>`;
        } else {
            promptEl.innerHTML = `${headerLabel}Practice: Find the minimized expression for the given K-Map`;
        }
    }

    // Validate if a selection is a valid power-of-2 rectangular loop
    function validateSelection(cellsArray) {
        let state = window.KMapState;
        let Solver = window.KMapSolver;
        if (!cellsArray || cellsArray.length === 0) {
            return { valid: false, message: 'No cells selected.' };
        }
        
        let N = state.N;
        let len = cellsArray.length;
        
        // Check if size is power of 2
        if (len !== 1 && len !== 2 && len !== 4 && len !== 8 && len !== 16) {
            return { valid: false, message: `Invalid size (${len}): must be a power of 2!` };
        }
        
        // Get consensus PI string
        let pi = loopToPi(cellsArray, N);
        
        // Find all cells covered by this PI
        let covered = [];
        for (let i = 0; i < (1 << N); i++) {
            let iBin = i.toString(2).padStart(N, '0');
            if (Solver.covers(pi, iBin)) {
                covered.push(i);
            }
        }
        
        // Check if covered cells match the selected cells exactly
        let sortedSelected = [...cellsArray].sort((a, b) => a - b);
        let sortedCovered = [...covered].sort((a, b) => a - b);
        
        if (sortedSelected.length !== sortedCovered.length || !sortedSelected.every((val, idx) => val === sortedCovered[idx])) {
            return { valid: false, message: 'Invalid shape: cells must form a single rectangular loop!' };
        }
        
        // Check if the loop contains any '0' cell
        let hasZero = sortedSelected.some(idx => state.stateData[idx] === 0);
        if (hasZero) {
            return { valid: false, message: 'Invalid: loops cannot cover cells with value 0!' };
        }
        
        return { valid: true, message: `Valid group of ${len}!`, pi: pi };
    }

    // Draw the user's loops and current selection on the SVG overlay
    function drawPracticeSVGs(wrapperEl) {
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

        let loopsToDraw = [];

        // Add existing user loops
        practiceState.userLoops.forEach((loop, idx) => {
            let pi = loopToPi(loop, N);
            loopsToDraw.push({
                pi: pi,
                color: '#8B5CF6', // Purple for user confirmed loops
                isDashed: true,
                isUser: true,
                userIndex: idx
            });
        });

        // Add active selection if any
        if (practiceState.selectedCells.size > 0) {
            let activeCells = Array.from(practiceState.selectedCells);
            let validation = validateSelection(activeCells);
            let pi = loopToPi(activeCells, N);
            loopsToDraw.push({
                pi: pi,
                color: validation.valid ? '#F59E0B' : '#F43F5E', // Amber if valid, Rose if invalid
                isDashed: true,
                isActiveSelection: true
            });
        }

        let allVals = Array.from({length: 1<<N}, (_, i) => i);

        loopsToDraw.forEach((item, idx) => {
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
                            rect.setAttribute("fill-opacity", item.isActiveSelection ? "0.12" : "0.06");
                            rect.setAttribute("stroke", item.color);
                            rect.setAttribute("stroke-width", "3");
                            if (item.isDashed) {
                                rect.setAttribute("stroke-dasharray", "6,4");
                            }
                            
                            rect.setAttribute("class", `svg-loop ${item.isActiveSelection ? 'active-selection-loop' : `user-loop-${item.userIndex}`} transition-all duration-[220ms] ease-spring`);

                            svg.appendChild(rect);
                        }
                    });
                });
            });
        });
    }

    // Selection handling and visualization
    function updateSelection() {
        // Sync table cell selections
        document.querySelectorAll('.kmap-cell').forEach(cell => {
            let valIndex = parseInt(cell.getAttribute('data-val'));
            if (practiceState.selectedCells.has(valIndex)) {
                cell.classList.add('selected');
            } else {
                cell.classList.remove('selected');
            }
        });

        drawPracticeSVGs(document.getElementById('maps-wrapper'));
        updateSelectionFeedback();
    }

    function updateSelectionFeedback() {
        let feedbackEl = document.getElementById('selection-feedback');
        let addBtn = document.getElementById('practice-add-loop-btn');
        if (!feedbackEl || !addBtn) return;
        
        let cells = Array.from(practiceState.selectedCells);
        if (cells.length === 0) {
            feedbackEl.innerText = 'No cells selected. Drag or click cells to select.';
            feedbackEl.className = 'text-xs font-semibold text-cream-muted dark:text-charcoal-muted bg-neutral-100 dark:bg-neutral-800/50 px-3 py-1.5 rounded-lg border border-cream-border dark:border-charcoal-border flex-grow';
            addBtn.disabled = true;
            return;
        }
        
        let validation = validateSelection(cells);
        feedbackEl.innerText = validation.message;
        
        if (validation.valid) {
            feedbackEl.className = 'text-xs font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/25 flex-grow';
            addBtn.disabled = false;
        } else {
            feedbackEl.className = 'text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/25 flex-grow';
            addBtn.disabled = true;
        }
    }

    function updatePracticeExpression() {
        let state = window.KMapState;
        let exprEl = document.getElementById('practice-expression');
        if (!exprEl) return;
        
        if (practiceState.userLoops.length === 0) {
            exprEl.innerHTML = `<span class="text-cream-muted dark:text-charcoal-muted font-normal mr-2">Y =</span> 0`;
            return;
        }
        
        let terms = practiceState.userLoops.map(loop => {
            let pi = loopToPi(loop, state.N);
            return `<span class="inline-block px-1 text-violet-500 font-bold">${window.KMapUI.piToExpression(pi, state.N)}</span>`;
        });
        
        exprEl.innerHTML = `<span class="text-cream-muted dark:text-charcoal-muted font-normal mr-2">Y =</span> ${terms.join('<span class="text-cream-muted dark:text-charcoal-muted font-normal mx-2">+</span>')}`;
    }

    function renderUserLoopsList() {
        let state = window.KMapState;
        let container = document.getElementById('practice-loops-container');
        if (!container) return;
        
        if (practiceState.userLoops.length === 0) {
            container.innerHTML = `<div class="text-xs text-cream-muted dark:text-charcoal-muted italic">No loops drawn yet. Drag or select cells and click Add Loop.</div>`;
            return;
        }
        
        let html = '';
        practiceState.userLoops.forEach((loop, idx) => {
            let pi = loopToPi(loop, state.N);
            html += `
                <div class="utility-card p-3 flex items-center justify-between group/loop hover:border-violet-500/30 transition-colors" data-loop-idx="${idx}">
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full bg-violet-500 shadow-sm"></div>
                        <div class="font-bold text-sm text-violet-500">${window.KMapUI.piToExpression(pi, state.N)}</div>
                        <div class="text-[10px] text-cream-muted dark:text-charcoal-muted uppercase font-bold tracking-wider">Size ${loop.length}</div>
                    </div>
                    <button class="delete-loop-btn p-1 rounded hover:bg-rose-500/10 text-cream-muted dark:text-charcoal-muted hover:text-rose-500 transition-colors" data-idx="${idx}">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
        });
        container.innerHTML = html;
        
        // Bind delete events
        container.querySelectorAll('.delete-loop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                let idx = parseInt(btn.getAttribute('data-idx'));
                practiceState.userLoops.splice(idx, 1);
                renderUserLoopsList();
                updatePracticeExpression();
                drawPracticeSVGs(document.getElementById('maps-wrapper'));
            });
        });

        // Add hover highlighting
        container.querySelectorAll('[data-loop-idx]').forEach(el => {
            el.addEventListener('mouseenter', () => {
                let idx = el.getAttribute('data-loop-idx');
                highlightUserLoop(idx);
            });
            el.addEventListener('mouseleave', () => {
                unhighlightUserLoop();
            });
        });
    }

    function highlightUserLoop(idx) {
        document.querySelectorAll('.svg-loop').forEach(el => {
            if (el.classList.contains(`user-loop-${idx}`)) {
                el.setAttribute("stroke-width", "5");
                el.setAttribute("fill-opacity", "0.15");
            } else {
                el.setAttribute("stroke-opacity", "0.15");
                el.setAttribute("fill-opacity", "0.02");
            }
        });
    }

    function unhighlightUserLoop() {
        document.querySelectorAll('.svg-loop').forEach(el => {
            el.setAttribute("stroke-width", "3");
            el.setAttribute("stroke-opacity", "1");
            el.setAttribute("fill-opacity", "0.06");
        });
    }

    // Bounding box calculations between two cells
    function getBoundingBoxCells(startIdx, endIdx) {
        let state = window.KMapState;
        let Grid = window.KMapGrid;
        let N = state.N;
        let coord1 = Grid.getCoords(startIdx, N);
        let coord2 = Grid.getCoords(endIdx, N);
        
        let r1 = Math.min(coord1.r, coord2.r);
        let r2 = Math.max(coord1.r, coord2.r);
        let c1 = Math.min(coord1.c, coord2.c);
        let c2 = Math.max(coord1.c, coord2.c);
        
        let cells = [];
        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                cells.push(Grid.findValByIndex(0, r, c, N));
            }
        }
        return cells;
    }

    // Cell click and drag interaction handlers
    function handlePracticeCellClick(idx) {
        // When click starts, mouse mousedown event is handled by delegation in app.js
    }

    function setupPracticeEventListeners() {
        const mapsWrapper = document.getElementById('maps-wrapper');
        if (!mapsWrapper) return;
        
        // Mousedown on cell
        mapsWrapper.addEventListener('mousedown', (e) => {
            if (!window.KMapState.practiceMode) return;
            let cell = e.target.closest('.kmap-cell');
            if (!cell) return;
            
            let valIndex = parseInt(cell.getAttribute('data-val'));
            practiceState.isDragging = true;
            practiceState.dragActive = false;
            practiceState.startCellIdx = valIndex;
            
            e.preventDefault(); // Prevent text selection
        });
        
        // Mouseover cell
        mapsWrapper.addEventListener('mouseover', (e) => {
            if (!window.KMapState.practiceMode || !practiceState.isDragging) return;
            let cell = e.target.closest('.kmap-cell');
            if (!cell) return;
            
            let valIndex = parseInt(cell.getAttribute('data-val'));
            if (valIndex === practiceState.startCellIdx) return;
            
            practiceState.dragActive = true;
            practiceState.selectedCells.clear();
            
            let boxCells = getBoundingBoxCells(practiceState.startCellIdx, valIndex);
            boxCells.forEach(c => practiceState.selectedCells.add(c));
            
            updateSelection();
        });
        
        // Mouseup on document
        document.addEventListener('mouseup', () => {
            if (!window.KMapState.practiceMode || !practiceState.isDragging) return;
            practiceState.isDragging = false;
            
            // If it was a simple click without dragging
            if (!practiceState.dragActive && practiceState.startCellIdx !== null) {
                let idx = practiceState.startCellIdx;
                if (practiceState.selectedCells.has(idx)) {
                    practiceState.selectedCells.delete(idx);
                } else {
                    practiceState.selectedCells.add(idx);
                }
                updateSelection();
            }
            
            practiceState.startCellIdx = null;
        });
        
        // Add Loop Button
        const addBtn = document.getElementById('practice-add-loop-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (practiceState.selectedCells.size === 0) return;
                let cellsArray = Array.from(practiceState.selectedCells);
                let validation = validateSelection(cellsArray);
                
                if (validation.valid) {
                    // Add to user loops (avoid exact duplicates)
                    let sortedStr = [...cellsArray].sort((a,b)=>a-b).join(',');
                    let exists = practiceState.userLoops.some(loop => {
                        return [...loop].sort((a,b)=>a-b).join(',') === sortedStr;
                    });
                    
                    if (!exists) {
                        practiceState.userLoops.push(cellsArray);
                        renderUserLoopsList();
                        updatePracticeExpression();
                    }
                    
                    practiceState.selectedCells.clear();
                    updateSelection();
                }
            });
        }
        
        // Clear Selection Button
        const clearSelBtn = document.getElementById('practice-clear-selection-btn');
        if (clearSelBtn) {
            clearSelBtn.addEventListener('click', () => {
                practiceState.selectedCells.clear();
                updateSelection();
            });
        }
        
        // Clear All Loops Button
        const clearLoopsBtn = document.getElementById('practice-clear-loops-btn');
        if (clearLoopsBtn) {
            clearLoopsBtn.addEventListener('click', () => {
                practiceState.userLoops = [];
                renderUserLoopsList();
                updatePracticeExpression();
                drawPracticeSVGs(mapsWrapper);
            });
        }
        
        // Submit / Check Answer Button
        const submitBtn = document.getElementById('practice-submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                gradePracticeSolution();
            });
        }

        // Quit Practice Button
        const quitBtn = document.getElementById('practice-quit-btn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                disablePracticeMode();
            });
        }
    }

    // Disable practice mode and return to normal solver mode
    function disablePracticeMode() {
        let state = window.KMapState;
        state.practiceMode = false;
        
        // Restore sidebar and header states
        const normSidebar = document.getElementById('normal-sidebar');
        const pracSidebar = document.getElementById('practice-sidebar');
        if (normSidebar) normSidebar.classList.remove('hidden');
        if (pracSidebar) pracSidebar.classList.add('hidden');
        
        const inputCard = document.getElementById('input-methods-card');
        const pracCard = document.getElementById('practice-banner-card');
        if (inputCard) inputCard.classList.remove('hidden');
        if (pracCard) pracCard.classList.add('hidden');
        
        // Restore buttons
        const fsBtn = document.getElementById('btn-fullscreen');
        const tiledBtn = document.getElementById('btn-tiled-view');
        if (fsBtn) fsBtn.classList.remove('pointer-events-none', 'opacity-30');
        if (tiledBtn) tiledBtn.classList.remove('pointer-events-none', 'opacity-30');
        
        // Reset control banner text
        const cb = document.getElementById('control-banner-text');
        if (cb) cb.innerText = "Tap cells to cycle 0 \u2192 1 \u2192 X";
        
        // Un-highlight cells
        document.querySelectorAll('.kmap-cell').forEach(cell => cell.classList.remove('selected'));
        
        // Toggle active classes on Practice Mode button
        const toggleBtn = document.getElementById('practice-toggle');
        if (toggleBtn) {
            toggleBtn.className = "px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800/50 text-cream-muted dark:text-charcoal-muted hover:text-cream-text dark:hover:text-charcoal-text border border-cream-border dark:border-charcoal-border transition-all flex items-center gap-1.5 shadow-sm";
        }
        
        // Force a normal solve and draw
        state.notify();
    }

    // Enable practice mode
    function enablePracticeMode() {
        let state = window.KMapState;
        state.practiceMode = true;
        
        // Hide standard cards, show practice cards
        const normSidebar = document.getElementById('normal-sidebar');
        const pracSidebar = document.getElementById('practice-sidebar');
        if (normSidebar) normSidebar.classList.add('hidden');
        if (pracSidebar) pracSidebar.classList.remove('hidden');
        
        const inputCard = document.getElementById('input-methods-card');
        const pracCard = document.getElementById('practice-banner-card');
        if (inputCard) inputCard.classList.add('hidden');
        if (pracCard) pracCard.classList.remove('hidden');
        
        // Disable fullscreen and tiled views in practice
        const fsBtn = document.getElementById('btn-fullscreen');
        const tiledBtn = document.getElementById('btn-tiled-view');
        if (fsBtn) fsBtn.classList.add('pointer-events-none', 'opacity-30');
        if (tiledBtn) tiledBtn.classList.add('pointer-events-none', 'opacity-30');
        
        // Set banner info
        const cb = document.getElementById('control-banner-text');
        if (cb) cb.innerText = "Practice Mode: Drawing and grading active";
        
        // Toggle active classes on Practice Mode button
        const toggleBtn = document.getElementById('practice-toggle');
        if (toggleBtn) {
            toggleBtn.className = "px-3 py-1.5 text-xs font-bold rounded-lg bg-accent/20 border-accent/40 text-accent transition-all flex items-center gap-1.5 shadow-sm ring-2 ring-accent/30";
        }
        
        generateChallenge();
    }

    // Grading logic and modal execution
    function generateChecklistItem(label, passed, desc = '') {
        let icon = passed 
            ? `<svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>`
            : `<svg class="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>`;
        
        return `
            <div class="flex items-start gap-2.5">
                <div class="mt-0.5">${icon}</div>
                <div>
                    <div class="font-bold text-sm text-cream-text dark:text-charcoal-text">${label}</div>
                    ${desc ? `<div class="text-[11px] text-cream-muted dark:text-charcoal-muted mt-0.5">${desc}</div>` : ''}
                </div>
            </div>
        `;
    }

    function gradePracticeSolution() {
        let state = window.KMapState;
        let Solver = window.KMapSolver;
        let Grid = window.KMapGrid;
        let N = state.N;
        
        // Solve K-map optimally
        let optimalResult = Solver.solveQM(state.stateData, N);
        let optSolution = optimalResult.solution; // Array of PI strings
        let optPIs = optimalResult.PIs; // All prime implicants
        
        // User's terms
        let userLoops = practiceState.userLoops;
        let userPIs = userLoops.map(loop => loopToPi(loop, N));
        
        // 1. Minterterm coverage check
        let minterms = [];
        for (let i = 0; i < state.stateData.length; i++) {
            if (state.stateData[i] === 1) minterms.push(i);
        }
        
        let coveredByUser = new Set();
        userLoops.forEach(loop => {
            loop.forEach(idx => {
                if (state.stateData[idx] === 1) {
                    coveredByUser.add(idx);
                }
            });
        });
        
        let missedMinterms = minterms.filter(m => !coveredByUser.has(m));
        let coverAllMinterms = missedMinterms.length === 0;
        
        // 2. Zero-cell coverage check
        let zeroCellsCovered = [];
        userLoops.forEach((loop, lIdx) => {
            loop.forEach(idx => {
                if (state.stateData[idx] === 0) {
                    zeroCellsCovered.push({ cell: idx, loopIndex: lIdx });
                }
            });
        });
        let noZerosCovered = zeroCellsCovered.length === 0;
        
        // 3. Primality check (loops must be maximized, i.e. be PIs)
        let nonPrimeLoops = [];
        userPIs.forEach((pi, idx) => {
            if (!optPIs.includes(pi)) {
                nonPrimeLoops.push({ pi: pi, index: idx });
            }
        });
        let allLoopsMaximized = nonPrimeLoops.length === 0;
        
        // 4. Minimality check (number of loops)
        let minimalLoopsUsed = false;
        if (coverAllMinterms && noZerosCovered) {
            minimalLoopsUsed = userLoops.length <= optSolution.length;
        }
        
        // Determine overall success
        let success = coverAllMinterms && noZerosCovered && allLoopsMaximized && minimalLoopsUsed;
        
        // Render Modal results
        let badgeContainer = document.getElementById('practice-grade-badge-container');
        let checklistContainer = document.getElementById('practice-checklist');
        let detailsContainer = document.getElementById('practice-grade-details');
        
        if (!badgeContainer || !checklistContainer || !detailsContainer) return;
        
        // Badge rendering
        if (success) {
            badgeContainer.innerHTML = `
                <div class="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-4xl mb-3">🎉</div>
                <div class="text-xl font-extrabold text-emerald-500">Perfect Score!</div>
                <div class="text-xs text-cream-muted dark:text-charcoal-muted mt-1">Excellent minimization and coverage.</div>
            `;
        } else {
            badgeContainer.innerHTML = `
                <div class="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center text-4xl mb-3">❌</div>
                <div class="text-xl font-extrabold text-rose-500">Not Quite Perfect</div>
                <div class="text-xs text-cream-muted dark:text-charcoal-muted mt-1">Review the checklist and try again.</div>
            `;
        }
        
        // Checklist items
        let checklistHtml = '';
        checklistHtml += generateChecklistItem(
            "Zero Cells Excluded", 
            noZerosCovered, 
            noZerosCovered ? "No cell with logic '0' was grouped." : `You grouped cell(s) that are 0.`
        );
        checklistHtml += generateChecklistItem(
            "Minterm Coverage", 
            coverAllMinterms, 
            coverAllMinterms ? "All required minterms (1s) are covered." : `Missed minterm(s): ${missedMinterms.map(m => `m${m}`).join(', ')}`
        );
        checklistHtml += generateChecklistItem(
            "Maximized Loops", 
            allLoopsMaximized, 
            allLoopsMaximized ? "All loops are expanded to their largest size." : `Some loop(s) could be made larger!`
        );
        checklistHtml += generateChecklistItem(
            "Minimal Loop Count", 
            minimalLoopsUsed, 
            minimalLoopsUsed ? "Used the minimal number of loops." : `Used ${userLoops.length} loops, but can be solved in ${optSolution.length}.`
        );
        checklistContainer.innerHTML = checklistHtml;
        
        // Details pane
        let detailsHtml = '<h4 class="font-bold text-cream-text dark:text-charcoal-text border-b border-cream-border dark:border-charcoal-border pb-1 mb-2">Detailed Analysis</h4>';
        if (success) {
            detailsHtml += `
                <p class="leading-relaxed text-emerald-600 dark:text-emerald-400 font-semibold mb-2">Your solution is mathematically optimal!</p>
                <p class="leading-relaxed text-cream-muted dark:text-charcoal-muted">You found a valid minimal cover representing the simplified expression.</p>
            `;
        } else {
            detailsHtml += '<div class="flex flex-col gap-2 leading-relaxed text-cream-muted dark:text-charcoal-muted">';
            if (missedMinterms.length > 0) {
                detailsHtml += `<p>• You need to cover all <strong>1</strong>s on the map. You missed: <span class="font-semibold text-rose-500">${missedMinterms.map(m => `m${m}`).join(', ')}</span>.</p>`;
            }
            if (!noZerosCovered) {
                detailsHtml += `<p>• Loops cannot include any <strong>0</strong> cells. Remove loops covering zero cells.</p>`;
            }
            if (nonPrimeLoops.length > 0) {
                detailsHtml += `<p>• Suboptimal loops detected: <span class="font-semibold text-amber-500">${nonPrimeLoops.map(np => piToText(np.pi, N)).join(', ')}</span>. In K-maps, always combine cells into the largest possible groups of 2, 4, 8, etc.</p>`;
            }
            if (coverAllMinterms && noZerosCovered && !minimalLoopsUsed) {
                detailsHtml += `<p>• Your cover is valid but redundant. You used <strong>${userLoops.length}</strong> loops, but the optimal solution requires only <strong>${optSolution.length}</strong>. Check for overlapping loops that can be eliminated or combined.</p>`;
            }
            detailsHtml += '</div>';
        }
        
        // Display Target and Optimal expressions
        let optExprPlain = optSolution.map(pi => piToText(pi, N)).join(' + ');
        detailsHtml += `
            <div class="mt-4 pt-3 border-t border-cream-border dark:border-charcoal-border flex flex-col gap-1.5">
                <div><span class="font-bold text-cream-muted dark:text-charcoal-muted uppercase text-[9px] tracking-wider">Optimal Expression:</span></div>
                <div class="text-sm font-bold text-accent">Y = ${optExprPlain}</div>
            </div>
        `;
        detailsContainer.innerHTML = detailsHtml;
        
        // Draw Comparison Maps in Modal
        let userMapEl = document.getElementById('practice-modal-user-map');
        let optMapEl = document.getElementById('practice-modal-opt-map');
        
        if (userMapEl && optMapEl) {
            // Render grids
            Grid.renderGrids(userMapEl, () => {});
            Grid.renderGrids(optMapEl, () => {});
            
            // Draw user loops on user map
            drawPracticeSVGs(userMapEl);
            
            // Draw optimal loops on optimal map
            let vizOptSolution = optSolution.map((pi, idx) => ({ 
                pi: pi, 
                color: state.groupColors[idx % state.groupColors.length] 
            }));
            window.KMapSVG.drawSVGs(vizOptSolution, optMapEl);
        }
        
        // Display the modal
        let modal = document.getElementById('practice-modal');
        let modalContent = document.getElementById('practice-modal-content');
        if (modal && modalContent) {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modalContent.classList.remove('opacity-0', 'scale-95');
        }
    }

    // Modal handlers
    function setupPracticeModalListeners() {
        const modal = document.getElementById('practice-modal');
        const modalContent = document.getElementById('practice-modal-content');
        
        const closeBtn = document.getElementById('practice-modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                hidePracticeModal();
            });
        }
        
        const retryBtn = document.getElementById('practice-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                hidePracticeModal();
                // Clear loops and retry
                practiceState.userLoops = [];
                practiceState.selectedCells.clear();
                renderUserLoopsList();
                updatePracticeExpression();
                updateSelection();
            });
        }
        
        const nextBtn = document.getElementById('practice-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                hidePracticeModal();
                generateChallenge();
            });
        }
    }

    function hidePracticeModal() {
        let modal = document.getElementById('practice-modal');
        let modalContent = document.getElementById('practice-modal-content');
        if (modal && modalContent) {
            modal.classList.add('opacity-0', 'pointer-events-none');
            modalContent.classList.add('opacity-0', 'scale-95');
        }
    }

    window.KMapPractice = {
        practiceState,
        loopToPi,
        validateSelection,
        drawPracticeSVGs,
        updateSelection,
        updatePracticeExpression,
        renderUserLoopsList,
        getBoundingBoxCells,
        handlePracticeCellClick,
        setupPracticeEventListeners,
        disablePracticeMode,
        enablePracticeMode,
        setupPracticeModalListeners
    };
})();
