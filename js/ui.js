(function() {
    function piToExpression(pi, N, isPOS = false) {
        const varNames = window.KMapState.varNames;
        if (!pi.includes('0') && !pi.includes('1')) {
            return isPOS ? '0' : '1';
        }
        let parts = [];
        for (let i = 0; i < N; i++) {
            if (isPOS) {
                if (pi[i] === '0') {
                    parts.push(`<span>${varNames[i]}</span>`);
                } else if (pi[i] === '1') {
                    parts.push(`<span>${varNames[i]}<span class="text-cream-muted dark:text-charcoal-muted">'</span></span>`);
                }
            } else {
                if (pi[i] === '1') {
                    parts.push(`<span>${varNames[i]}</span>`);
                } else if (pi[i] === '0') {
                    parts.push(`<span>${varNames[i]}<span class="text-cream-muted dark:text-charcoal-muted">'</span></span>`);
                }
            }
        }
        if (isPOS) {
            let joined = parts.join('<span class="text-cream-muted dark:text-charcoal-muted font-normal mx-1">+</span>');
            return `<span class="font-normal">(</span>${joined}<span class="font-normal">)</span>`;
        } else {
            return parts.join('');
        }
    }

    function renderOutput(PIs, EPIs, solutionMap, resultExpr, stepsContainer) {
        let state = window.KMapState;
        let N = state.N;
        let isPOS = state.exprType === 'POS';
        
        if (!resultExpr || !stepsContainer) return;

        if (solutionMap.length === 0) {
            if (state.stateData.every(v => v === 2 || v === 0) && state.stateData.some(v => v === 2)) {
                 resultExpr.innerHTML = `<span class="text-cream-muted dark:text-charcoal-muted mr-2 font-normal">Y =</span> <span class="text-accent">X (Don't Care)</span>`;
            } else {
                 resultExpr.innerHTML = `<span class="text-cream-muted dark:text-charcoal-muted mr-2 font-normal">Y =</span> ${isPOS ? '1' : '0'}`;
            }
            stepsContainer.innerHTML = `<div class="utility-card p-4 text-sm font-medium text-cream-muted dark:text-charcoal-muted">${isPOS ? 'No Low (0) logic detected.' : 'No High (1) logic detected.'}</div>`;
            return;
        }

        if (solutionMap.length === 1 && solutionMap[0].pi === '-'.repeat(N)) {
            resultExpr.innerHTML = `<span class="text-cream-muted dark:text-charcoal-muted mr-2 font-normal">Y =</span> ${isPOS ? '0' : '1'}`;
            stepsContainer.innerHTML = `<div class="utility-card p-4 text-sm font-medium text-cream-muted dark:text-charcoal-muted">${isPOS ? 'Entire map is grouped (all Maxterms). Output is always Low.' : 'Entire map is grouped. Output is always High.'}</div>`;
            return;
        }

        let separator = isPOS 
            ? '' 
            : '<span class="text-cream-muted dark:text-charcoal-muted font-normal mx-2">+</span>';

        let eqHtml = solutionMap.map((item, i) => {
            return `<span class="inline-block cursor-pointer px-1 py-0.5 rounded transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800" 
                          style="color: ${item.color}"
                          onmouseenter="window.KMapSVG.highlightGroup(${i})" onmouseleave="window.KMapSVG.unhighlightGroup()">
                        ${piToExpression(item.pi, N, isPOS)}
                    </span>`;
        }).join(separator);
        
        resultExpr.innerHTML = `<span class="text-cream-muted dark:text-charcoal-muted mr-2 font-normal">Y =</span> ${eqHtml}`;

        let stepsHtml = '';
        solutionMap.forEach((item, i) => {
            let isEPI = EPIs.includes(item.pi);
            let badgeClass = isEPI ? 'text-accent bg-accent/10 border-accent/20' : 'text-neutral-500 bg-neutral-100 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700';
            
            stepsHtml += `
                <div class="utility-card p-3 flex items-center justify-between cursor-pointer group hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
                     onmouseenter="window.KMapSVG.highlightGroup(${i})" onmouseleave="window.KMapSVG.unhighlightGroup()">
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full shadow-sm" style="background-color: ${item.color}"></div>
                        <div class="font-bold text-base" style="color: ${item.color}">${piToExpression(item.pi, N, isPOS)}</div>
                    </div>
                    <div class="text-[9px] font-extrabold uppercase tracking-widest px-2 py-1 rounded border ${badgeClass}">
                        ${isEPI ? 'Essential' : 'Coverage'}
                    </div>
                </div>
            `;
        });
        stepsContainer.innerHTML = stepsHtml;
    }

    window.KMapUI = {
        piToExpression,
        renderOutput
    };
})();
