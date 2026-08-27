(function() {
    function getCoveredCells(pi, N) {
        let cells = [];
        for (let i = 0; i < (1 << N); i++) {
            let bin = i.toString(2).padStart(N, '0');
            let match = true;
            for (let j = 0; j < N; j++) {
                if (pi[j] !== '-' && pi[j] !== bin[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                cells.push(i);
            }
        }
        return cells;
    }

    function togglePlayback() {
        const state = window.KMapState;
        const sol = state.currentSolutionMap || [];
        if (sol.length === 0) return;

        if (state.playbackTimer) {
            clearInterval(state.playbackTimer);
            state.playbackTimer = null;
            updatePlaybackControls();
            return;
        }

        if (state.playbackStep === null || state.playbackStep >= sol.length - 1) {
            state.playbackStep = -1;
        }

        state.playbackTimer = setInterval(() => {
            if (state.playbackStep === null) state.playbackStep = -1;
            state.playbackStep++;
            if (state.playbackStep >= sol.length) {
                clearInterval(state.playbackTimer);
                state.playbackTimer = null;
                state.playbackStep = null; // show all
            }
            state.notify();
        }, 1200);

        state.notify();
    }

    function stepPrev() {
        const state = window.KMapState;
        const sol = state.currentSolutionMap || [];
        if (sol.length === 0) return;
        if (state.playbackTimer) {
            clearInterval(state.playbackTimer);
            state.playbackTimer = null;
        }
        if (state.playbackStep === null) {
            state.playbackStep = sol.length - 1;
        }
        state.playbackStep = Math.max(0, state.playbackStep - 1);
        state.notify();
    }

    function stepNext() {
        const state = window.KMapState;
        const sol = state.currentSolutionMap || [];
        if (sol.length === 0) return;
        if (state.playbackTimer) {
            clearInterval(state.playbackTimer);
            state.playbackTimer = null;
        }
        if (state.playbackStep === null) {
            state.playbackStep = 0;
        } else {
            state.playbackStep = Math.min(sol.length - 1, state.playbackStep + 1);
        }
        state.notify();
    }

    function stepAll() {
        const state = window.KMapState;
        if (state.playbackTimer) {
            clearInterval(state.playbackTimer);
            state.playbackTimer = null;
        }
        state.playbackStep = null;
        state.notify();
    }

    function updatePlaybackControls() {
        const state = window.KMapState;
        const sol = state.currentSolutionMap || [];
        const container = document.getElementById('playback-controls');
        if (!container) return;

        if (sol.length <= 1) {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');

        const isPlaying = !!state.playbackTimer;
        const currentStepText = state.playbackStep === null 
            ? `Showing All (${sol.length} Loops)`
            : `Step ${state.playbackStep + 1} of ${sol.length}`;

        container.innerHTML = `
            <div class="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800/60 p-2 rounded-xl border border-cream-border dark:border-charcoal-border text-xs mb-3">
                <div class="flex items-center gap-1.5">
                    <button onclick="window.KMapTutorial.stepPrev()" class="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md font-bold text-neutral-600 dark:text-neutral-300 transition-colors" title="Previous Loop">⏮</button>
                    <button onclick="window.KMapTutorial.togglePlayback()" class="px-2.5 py-1 bg-accent text-white font-bold rounded-lg shadow-sm hover:brightness-110 transition-all flex items-center gap-1">
                        ${isPlaying ? '⏸ Pause' : '▶ Play Timeline'}
                    </button>
                    <button onclick="window.KMapTutorial.stepNext()" class="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md font-bold text-neutral-600 dark:text-neutral-300 transition-colors" title="Next Loop">⏭</button>
                    <button onclick="window.KMapTutorial.stepAll()" class="px-2 py-1 text-[10px] uppercase tracking-wider font-extrabold text-cream-muted dark:text-charcoal-muted hover:text-accent rounded-md">All</button>
                </div>
                <span class="font-mono font-bold text-accent">${currentStepText}</span>
            </div>
        `;
    }

    function updateTutorial(PIs, EPIs, solutionMap, stateData, N, exprType) {
        updatePlaybackControls();

        const container = document.getElementById('learning-notes');
        if (!container) return;

        const varNames = window.KMapState.varNames;
        const piToExpression = window.KMapUI.piToExpression;
        const covers = window.KMapSolver.covers;

        const isPOS = exprType === 'POS';
        const targetName = isPOS ? 'Maxterm' : 'Minterm';
        const targetVal = isPOS ? 0 : 1;

        if (solutionMap.length === 0) {
            container.innerHTML = `
                <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-cream-border dark:border-charcoal-border rounded-xl">
                    <span class="font-bold text-accent uppercase tracking-wider text-[10px]">Result: Constant Output</span>
                    <p class="mt-1">The map contains no active ${targetName}s. The logic output is constant <strong>${isPOS ? '1' : '0'}</strong>.</p>
                </div>
            `;
            return;
        }

        if (solutionMap.length === 1 && solutionMap[0].pi === '-'.repeat(N)) {
            container.innerHTML = `
                <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-cream-border dark:border-charcoal-border rounded-xl">
                    <span class="font-bold text-accent uppercase tracking-wider text-[10px]">Result: Constant Output</span>
                    <p class="mt-1">All cells in the map are completely grouped. The logic output is constant <strong>${isPOS ? '0' : '1'}</strong>.</p>
                </div>
            `;
            return;
        }

        // Step 1: Listing minterms/dont-cares (or maxterms/dont-cares for POS)
        let targets = [];
        let dontcares = [];
        for (let i = 0; i < stateData.length; i++) {
            if (stateData[i] === targetVal) targets.push(i);
            else if (stateData[i] === 2) dontcares.push(i);
        }

        let step1Html = `
            <div class="mb-4">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 border border-accent/20 text-accent font-extrabold text-[10px]">1</span>
                    <span class="font-extrabold uppercase tracking-widest text-[10px] text-cream-text dark:text-charcoal-text">Identify Active Cells</span>
                </div>
                <div class="pl-7 space-y-1">
                    <p>We start by identifying all target <strong>${targetName}s</strong> (where output is ${targetVal}) and <strong>Don't-Care conditions</strong> (where output is X).</p>
                    <div class="flex flex-wrap gap-3 mt-1 text-[11px]">
                        <div><span class="font-bold text-cream-text dark:text-charcoal-text">${targetName}s (Output = ${targetVal}):</span> <code class="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono">${targets.length > 0 ? targets.join(', ') : 'None'}</code></div>
                        <div><span class="font-bold text-cream-text dark:text-charcoal-text">Don't-Cares (Output = X):</span> <code class="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono">${dontcares.length > 0 ? dontcares.join(', ') : 'None'}</code></div>
                    </div>
                </div>
            </div>
        `;

        // Step 2: Grouping process
        let step2GroupsHtml = '';
        solutionMap.forEach((item, idx) => {
            let cells = getCoveredCells(item.pi, N);
            let expr = piToExpression(item.pi, N, isPOS);
            step2GroupsHtml += `
                <div class="flex items-center justify-between p-2 rounded-lg border border-cream-border dark:border-charcoal-border hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer transition-colors group"
                     onmouseenter="window.KMapSVG.highlightGroup(${idx})" onmouseleave="window.KMapSVG.unhighlightGroup()">
                    <div class="flex items-center gap-2">
                        <div class="w-2.5 h-2.5 rounded-full shadow-sm" style="background-color: ${item.color}"></div>
                        <div>
                            <span class="font-bold text-cream-text dark:text-charcoal-text">Group of ${cells.length} cells:</span>
                            <code class="font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1 rounded">{${cells.join(', ')}}</code>
                        </div>
                    </div>
                    <div class="font-bold text-sm tracking-tight" style="color: ${item.color}">${expr}</div>
                </div>
            `;
        });

        let step2Html = `
            <div class="mb-4">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 border border-accent/20 text-accent font-extrabold text-[10px]">2</span>
                    <span class="font-extrabold uppercase tracking-widest text-[10px] text-cream-text dark:text-charcoal-text">Grouping Process</span>
                </div>
                <div class="pl-7 space-y-1.5">
                    <p>We look for the largest rectangular blocks of adjacent cells (sizes 16, 8, 4, 2, 1) that cover all target cells. Hover to highlight loops on the K-Map:</p>
                    <div class="space-y-1">${step2GroupsHtml}</div>
                </div>
            </div>
        `;

        // Step 3: Prime Implicant selection
        let step3PIsHtml = '';
        PIs.forEach((pi) => {
            let cells = getCoveredCells(pi, N);
            let expr = piToExpression(pi, N, isPOS);
            let solIdx = solutionMap.findIndex(item => item.pi === pi);
            let isInSolution = solIdx !== -1;
            let borderClass = isInSolution ? `border-l-4 pl-2` : `border border-transparent pl-2 opacity-50`;
            let borderStyle = isInSolution ? `border-left-color: ${solutionMap[solIdx].color}` : '';

            let hoverAttrs = isInSolution
                ? `onmouseenter="window.KMapSVG.highlightGroup(${solIdx})" onmouseleave="window.KMapSVG.unhighlightGroup()"`
                : '';

            step3PIsHtml += `
                <div class="flex items-center justify-between py-1 border-b border-cream-border dark:border-charcoal-border/50 text-[11px] ${hoverAttrs}" style="${borderStyle}; ${isInSolution ? 'cursor: pointer;' : ''}">
                    <div class="${borderClass}" style="${borderStyle}">
                        <span class="font-bold text-cream-text dark:text-charcoal-text">${expr}</span>
                        <span class="text-neutral-500 font-mono text-[10px] ml-1">covers {${cells.join(', ')}}</span>
                    </div>
                    <div class="text-[9px] uppercase tracking-wider font-semibold">
                        ${isInSolution ? `<span class="text-accent bg-accent/10 px-1.5 py-0.5 rounded">Selected</span>` : `<span class="text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">Redundant</span>`}
                    </div>
                </div>
            `;
        });

        let step3Html = `
            <div class="mb-4">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 border border-accent/20 text-accent font-extrabold text-[10px]">3</span>
                    <span class="font-extrabold uppercase tracking-widest text-[10px] text-cream-text dark:text-charcoal-text">Prime Implicants</span>
                </div>
                <div class="pl-7 space-y-1.5">
                    <p>Prime Implicants (PIs) are the largest possible groupings. Redundant PIs are eliminated to yield the minimal cover:</p>
                    <div class="bg-neutral-50 dark:bg-neutral-900/30 p-2 rounded-xl border border-cream-border dark:border-charcoal-border space-y-1">${step3PIsHtml}</div>
                </div>
            </div>
        `;

        // Step 4: Essential Prime Implicant determination
        let cellCoverage = {};
        targets.forEach(cell => {
            let bin = cell.toString(2).padStart(N, '0');
            cellCoverage[cell] = PIs.filter(pi => covers(pi, bin));
        });

        let epiReasoningHtml = '';
        let epiCount = 0;

        solutionMap.forEach((item, idx) => {
            let isEPI = EPIs.includes(item.pi);
            let cells = getCoveredCells(item.pi, N);
            let targetCellsInPI = cells.filter(c => targets.includes(c));
            let uniqueMinterms = targetCellsInPI.filter(c => cellCoverage[c].length === 1);

            if (isEPI && uniqueMinterms.length > 0) {
                epiCount++;
                let expr = piToExpression(item.pi, N, isPOS);
                epiReasoningHtml += `
                    <div class="p-2 rounded-lg bg-accent/5 border border-accent/10 text-[11px] cursor-pointer hover:bg-accent/10 transition-colors"
                         onmouseenter="window.KMapSVG.highlightGroup(${idx})" onmouseleave="window.KMapSVG.unhighlightGroup()">
                        <div class="flex items-center gap-2 mb-1">
                            <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${item.color}"></div>
                            <span class="font-bold text-accent">${expr}</span>
                            <span class="text-[9px] uppercase tracking-widest text-accent font-extrabold px-1 rounded bg-accent/10">Essential</span>
                        </div>
                        <p class="text-neutral-500">Uniquely covers ${targetName} cell(s): <span class="font-bold text-cream-text dark:text-charcoal-text font-mono">{${uniqueMinterms.join(', ')}}</span>. No other groups cover these cells, making it essential.</p>
                    </div>
                `;
            } else {
                let expr = piToExpression(item.pi, N, isPOS);
                epiReasoningHtml += `
                    <div class="p-2 rounded-lg bg-neutral-100/50 dark:bg-neutral-800/40 border border-cream-border dark:border-charcoal-border text-[11px] cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
                         onmouseenter="window.KMapSVG.highlightGroup(${idx})" onmouseleave="window.KMapSVG.unhighlightGroup()">
                        <div class="flex items-center gap-2 mb-1">
                            <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${item.color}"></div>
                            <span class="font-bold text-cream-text dark:text-charcoal-text">${expr}</span>
                            <span class="text-[9px] uppercase tracking-widest text-neutral-400 font-semibold px-1 rounded bg-neutral-100 dark:bg-neutral-800">Coverage Only</span>
                        </div>
                        <p class="text-neutral-500">Selected to complete the cover of remaining cells: <span class="font-bold text-cream-text dark:text-charcoal-text font-mono">{${targetCellsInPI.join(', ')}}</span>.</p>
                    </div>
                `;
            }
        });

        let step4Html = `
            <div class="mb-4">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 border border-accent/20 text-accent font-extrabold text-[10px]">4</span>
                    <span class="font-extrabold uppercase tracking-widest text-[10px] text-cream-text dark:text-charcoal-text">Essential Prime Implicants</span>
                </div>
                <div class="pl-7 space-y-1.5">
                    <p>EPIs are groups that cover a minterm/maxterm that no other group covers. We found <strong>${epiCount}</strong> Essential Prime Implicant(s):</p>
                    <div class="space-y-1.5">${epiReasoningHtml}</div>
                </div>
            </div>
        `;

        // Step 5: Writing the expression
        let step5ExplainHtml = '';
        solutionMap.forEach((item, idx) => {
            let pi = item.pi;
            let expr = piToExpression(pi, N, isPOS);
            let constantList = [];
            let eliminatedList = [];

            for (let i = 0; i < N; i++) {
                let vName = varNames[i];
                if (pi[i] === '-') {
                    eliminatedList.push(vName);
                } else {
                    if (isPOS) {
                        let representation = pi[i] === '0' ? vName : `${vName}'`;
                        constantList.push(`${vName} = ${pi[i]} (<span class="font-bold">${representation}</span>)`);
                    } else {
                        let representation = pi[i] === '1' ? vName : `${vName}'`;
                        constantList.push(`${vName} = ${pi[i]} (<span class="font-bold">${representation}</span>)`);
                    }
                }
            }

            let eliminationText = eliminatedList.length > 0 
                ? `Variables <code class="font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1 rounded">${eliminatedList.join(', ')}</code> change states and are eliminated.`
                : `No variables change state.`;

            step5ExplainHtml += `
                <div class="p-2.5 rounded-xl border border-cream-border dark:border-charcoal-border bg-neutral-50/50 dark:bg-neutral-900/30 text-[11px] cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/80 transition-colors"
                     onmouseenter="window.KMapSVG.highlightGroup(${idx})" onmouseleave="window.KMapSVG.unhighlightGroup()">
                    <div class="flex items-center gap-2 mb-1">
                        <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${item.color}"></div>
                        <span class="font-extrabold text-base" style="color: ${item.color}">${expr}</span>
                        <span class="text-neutral-400 font-mono text-[10px]">from binary ${pi}</span>
                    </div>
                    <div class="text-neutral-600 dark:text-neutral-400 space-y-0.5">
                        <p>&bull; ${eliminationText}</p>
                        <p>&bull; Constant variables: ${constantList.join(', ')}.</p>
                    </div>
                </div>
            `;
        });

        let step5Html = `
            <div class="mb-2">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 border border-accent/20 text-accent font-extrabold text-[10px]">5</span>
                    <span class="font-extrabold uppercase tracking-widest text-[10px] text-cream-text dark:text-charcoal-text">Final Equation Minimization</span>
                </div>
                <div class="pl-7 space-y-1.5">
                    <p>For each selected group, we translate its binary code to algebraic terms:</p>
                    <div class="space-y-1.5">${step5ExplainHtml}</div>
                </div>
            </div>
        `;

        container.innerHTML = `
            <div class="flex flex-col gap-4 py-1">
                ${step1Html}
                ${step2Html}
                ${step3Html}
                ${step4Html}
                ${step5Html}
            </div>
        `;
    }

    window.KMapTutorial = {
        getCoveredCells,
        updateTutorial,
        togglePlayback,
        stepPrev,
        stepNext,
        stepAll
    };
})();
