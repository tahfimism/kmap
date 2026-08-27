(function() {
    function piToPlainExpression(pi, N, isPOS = false) {
        const varNames = window.KMapState.varNames;
        if (!pi.includes('0') && !pi.includes('1')) {
            return isPOS ? '0' : '1';
        }
        let parts = [];
        for (let i = 0; i < N; i++) {
            if (isPOS) {
                if (pi[i] === '0') {
                    parts.push(varNames[i]);
                } else if (pi[i] === '1') {
                    parts.push(varNames[i] + "'");
                }
            } else {
                if (pi[i] === '1') {
                    parts.push(varNames[i]);
                } else if (pi[i] === '0') {
                    parts.push(varNames[i] + "'");
                }
            }
        }
        if (isPOS) {
            return `(${parts.join(' + ')})`;
        } else {
            return parts.join('');
        }
    }

    function tokenize(str) {
        let tokens = [];
        let i = 0;
        while (i < str.length) {
            let char = str[i];
            if (/\s/.test(char)) {
                i++;
                continue;
            }
            if (/[A-Ea-e]/.test(char)) {
                tokens.push({ type: 'VAR', value: char.toUpperCase() });
                i++;
            } else if (char === "'") {
                tokens.push({ type: 'PRIME' });
                i++;
            } else if (char === '!' || char === '~') {
                tokens.push({ type: 'NOT' });
                i++;
            } else if (char === '+' || char === '|' || char === 'v') {
                if (char === '|' && str[i+1] === '|') {
                    i++;
                }
                tokens.push({ type: 'OR' });
                i++;
            } else if (char === '*' || char === '&') {
                if (char === '&' && str[i+1] === '&') {
                    i++;
                }
                tokens.push({ type: 'AND' });
                i++;
            } else if (char === '(') {
                tokens.push({ type: 'LPAREN' });
                i++;
            } else if (char === ')') {
                tokens.push({ type: 'RPAREN' });
                i++;
            } else {
                i++;
            }
        }
        return tokens;
    }

    class Parser {
        constructor(tokens, context) {
            this.tokens = tokens;
            this.context = context;
            this.index = 0;
        }

        peek() {
            return this.tokens[this.index] || null;
        }

        consume(type) {
            let t = this.peek();
            if (t && t.type === type) {
                this.index++;
                return t;
            }
            return null;
        }

        parseExpression() {
            let val = this.parseOrTerm();
            while (true) {
                if (this.consume('OR')) {
                    let right = this.parseOrTerm();
                    val = val || right;
                } else {
                    break;
                }
            }
            return val;
        }

        parseOrTerm() {
            let val = this.parseFactor();
            while (true) {
                let next = this.peek();
                if (next && next.type === 'AND') {
                    this.consume('AND');
                    let right = this.parseFactor();
                    val = val && right;
                } else if (next && (next.type === 'VAR' || next.type === 'NOT' || next.type === 'LPAREN')) {
                    let right = this.parseFactor();
                    val = val && right;
                } else {
                    break;
                }
            }
            return val;
        }

        parseFactor() {
            let val = this.parsePrimary();
            while (this.consume('PRIME')) {
                val = !val;
            }
            return val;
        }

        parsePrimary() {
            if (this.consume('NOT')) {
                return !this.parsePrimary();
            }
            let t = this.consume('VAR');
            if (t) {
                return !!this.context[t.value];
            }
            if (this.consume('LPAREN')) {
                let val = this.parseExpression();
                this.consume('RPAREN');
                return val;
            }
            return false;
        }
    }

    function parseTermList(str, maxVal) {
        if (!str || !str.trim()) return [];
        return str.split(',')
            .map(s => s.trim())
            .filter(s => s !== '')
            .map(s => parseInt(s, 10))
            .filter(val => !isNaN(val) && val >= 0 && val < maxVal);
    }

    function syncInputPanels() {
        let state = window.KMapState;
        let N = state.N;
        let stateData = state.stateData;

        // 1. Render/Sync Truth Table
        renderTruthTable();

        // 2. Sync Minterms
        const mintermsInput = document.getElementById('input-minterms');
        if (mintermsInput && document.activeElement !== mintermsInput) {
            let minterms = [];
            for (let i = 0; i < stateData.length; i++) {
                if (stateData[i] === 1) minterms.push(i);
            }
            mintermsInput.value = minterms.join(', ');
        }

        // 3. Sync Don't Cares
        const dontcaresInput = document.getElementById('input-dontcares');
        if (dontcaresInput && document.activeElement !== dontcaresInput) {
            let dontcares = [];
            for (let i = 0; i < stateData.length; i++) {
                if (stateData[i] === 2) dontcares.push(i);
            }
            dontcaresInput.value = dontcares.join(', ');
        }

        // 4. Sync Boolean Expression
        const expressionInput = document.getElementById('input-expression');
        if (expressionInput && document.activeElement !== expressionInput) {
            let sol = state.currentSolutionMap || [];
            let isPOS = state.exprType === 'POS';
            if (sol.length === 0) {
                expressionInput.value = isPOS ? '1' : '0';
            } else if (sol.length === 1 && sol[0].pi === '-'.repeat(N)) {
                expressionInput.value = isPOS ? '0' : '1';
            } else {
                let exprStr = sol.map(item => piToPlainExpression(item.pi, N, isPOS)).join(isPOS ? '' : ' + ');
                expressionInput.value = exprStr;
            }
        }
    }

    function renderTruthTable() {
        const ttContainer = document.getElementById('tab-truthtable');
        if (!ttContainer) return;
        
        let state = window.KMapState;
        let N = state.N;
        let stateData = state.stateData;
        let varNames = state.varNames;
        
        let html = `<table class="w-full text-left border-collapse bg-white dark:bg-charcoal-card rounded-lg overflow-hidden border border-cream-border dark:border-charcoal-border">`;
        html += `<thead><tr class="bg-neutral-50 dark:bg-neutral-900 border-b border-cream-border dark:border-charcoal-border">`;
        for (let i = 0; i < N; i++) {
            html += `<th class="py-1 px-2 text-[10px] font-extrabold uppercase tracking-wider text-cream-muted dark:text-charcoal-muted">${varNames[i]}</th>`;
        }
        html += `<th class="py-1 px-2 text-[10px] font-extrabold uppercase tracking-wider text-accent text-right">Y</th>`;
        html += `</tr></thead><tbody>`;
        
        for (let row = 0; row < (1 << N); row++) {
            html += `<tr class="tt-row border-b border-cream-border/50 dark:border-charcoal-border/30 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 cursor-pointer transition-colors" data-row-idx="${row}">`;
            for (let i = 0; i < N; i++) {
                let bit = (row >> (N - 1 - i)) & 1;
                html += `<td class="py-1 px-2 font-mono text-[11px] text-cream-muted dark:text-charcoal-muted">${bit}</td>`;
            }
            
            let val = stateData[row] || 0;
            let text = val === 2 ? 'X' : val;
            let btnClass = "";
            if (val === 0) btnClass = "text-cream-muted dark:text-charcoal-muted";
            if (val === 1) btnClass = "text-cream-text dark:text-charcoal-text font-extrabold text-accent";
            if (val === 2) btnClass = "text-amber-500 font-bold";
            
            html += `<td class="py-0.5 px-2 text-right">
                        <button class="tt-toggle-btn px-2.5 py-0.5 rounded border border-cream-border dark:border-charcoal-border bg-neutral-50/50 dark:bg-neutral-900/30 font-mono text-[11px] min-w-[28px] transition-all hover:bg-accent/10 ${btnClass}" data-idx="${row}">
                            ${text}
                        </button>
                     </td>`;
            html += `</tr>`;
        }
        html += `</tbody></table>`;
        ttContainer.innerHTML = html;
        
        // Bi-directional hover sync
        ttContainer.querySelectorAll('.tt-row').forEach(tr => {
            let idx = parseInt(tr.getAttribute('data-row-idx'));
            tr.addEventListener('mouseenter', () => {
                if (window.KMapGrid && window.KMapGrid.highlightCell) {
                    window.KMapGrid.highlightCell(idx);
                }
            });
            tr.addEventListener('mouseleave', () => {
                if (window.KMapGrid && window.KMapGrid.unhighlightCell) {
                    window.KMapGrid.unhighlightCell();
                }
            });
        });

        ttContainer.querySelectorAll('.tt-toggle-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                let idx = parseInt(this.getAttribute('data-idx'));
                let currentVal = state.stateData[idx];
                let nextVal = (currentVal + 1) % 3;
                state.setData(idx, nextVal);
            });
        });
    }

    function initInputs() {
        let state = window.KMapState;
        
        // 1. Tab selection
        const tabButtons = document.querySelectorAll('#input-tabs .input-tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => {
                    b.classList.remove('active', 'bg-neutral-100', 'dark:bg-neutral-800', 'text-cream-text', 'text-charcoal-text');
                    b.classList.add('text-cream-muted', 'dark:text-charcoal-muted', 'hover:text-cream-text', 'dark:hover:text-charcoal-text');
                });
                btn.classList.add('active', 'bg-neutral-100', 'dark:bg-neutral-800', 'text-cream-text', 'text-charcoal-text');
                btn.classList.remove('text-cream-muted', 'dark:text-charcoal-muted', 'hover:text-cream-text', 'dark:hover:text-charcoal-text');
                
                const activeTab = btn.getAttribute('data-tab');
                document.querySelectorAll('#input-tab-content .input-tab-panel').forEach(panel => {
                    if (panel.id === `tab-${activeTab}`) {
                        panel.classList.remove('hidden');
                    } else {
                        panel.classList.add('hidden');
                    }
                });
                syncInputPanels();
            });
        });

        // 2. Minterms and Don't Cares text inputs
        const mintermsInput = document.getElementById('input-minterms');
        const dontcaresInput = document.getElementById('input-dontcares');

        function handleMinMaxInput() {
            let N = state.N;
            let maxVal = 1 << N;
            let minterms = parseTermList(mintermsInput.value, maxVal);
            let dontcares = parseTermList(dontcaresInput.value, maxVal);

            state.pushHistory();
            for (let i = 0; i < maxVal; i++) {
                if (dontcares.includes(i)) {
                    state.stateData[i] = 2;
                } else if (minterms.includes(i)) {
                    state.stateData[i] = 1;
                } else {
                    state.stateData[i] = 0;
                }
            }
            state.notify();
        }

        if (mintermsInput) mintermsInput.addEventListener('input', handleMinMaxInput);
        if (dontcaresInput) dontcaresInput.addEventListener('input', handleMinMaxInput);

        // 3. Boolean Expression input
        const expressionInput = document.getElementById('input-expression');
        function handleExpressionInput() {
            let N = state.N;
            let exprStr = expressionInput.value.trim();
            if (!exprStr) return; 

            let tokens = tokenize(exprStr);
            state.pushHistory();
            for (let row = 0; row < (1 << N); row++) {
                let context = {};
                for (let i = 0; i < N; i++) {
                    context[state.varNames[i]] = ((row >> (N - 1 - i)) & 1) === 1;
                }
                let val = false;
                try {
                    let parser = new Parser(tokens, context);
                    val = parser.parseExpression();
                } catch (e) {
                    console.error("Expression parse error: ", e);
                }
                state.stateData[row] = val ? 1 : 0;
            }
            state.notify();
        }

        if (expressionInput) expressionInput.addEventListener('input', handleExpressionInput);

        state.subscribe(syncInputPanels);
        syncInputPanels();
    }

    window.KMapInputs = {
        piToPlainExpression,
        syncInputPanels,
        initInputs
    };
})();
