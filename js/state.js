(function() {
    window.KMapState = {
        groupColors: [
            '#10B981', // Emerald
            '#6366F1', // Indigo
            '#F59E0B', // Amber
            '#0EA5E9', // Sky
            '#F43F5E', // Rose
            '#A855F7', // Purple
        ],
        varNames: ['A', 'B', 'C', 'D', 'E'],
        gray4: [0, 1, 3, 2],
        N: 2,
        stateData: [],
        currentSolutionMap: [],
        listeners: new Set(),
        exprType: 'SOP',
        practiceMode: false,
        
        // Linear Undo/Redo Stacks
        historyUndo: [],
        historyRedo: [],
        
        // Brush & Interaction Modes
        brushMode: 'click', // 'click' | 'paint_1' | 'paint_0' | 'paint_x'
        
        // Timeline Playback
        playbackStep: null, // null = all visible, or integer index 0..K-1
        playbackTimer: null,
        
        // Circuit Interactive Inputs
        circuitInputs: { A: false, B: false, C: false, D: false, E: false },
        
        init(n, skipHistory = false) {
            if (!skipHistory && this.stateData && this.stateData.length > 0) {
                this.pushHistory();
            }
            this.N = n;
            this.stateData = new Array(1 << n).fill(0);
            this.currentSolutionMap = [];
            this.playbackStep = null;
            this.notify();
        },
        
        pushHistory() {
            if (!this.stateData || this.stateData.length === 0) return;
            this.historyUndo.push({
                N: this.N,
                stateData: [...this.stateData],
                exprType: this.exprType
            });
            if (this.historyUndo.length > 50) {
                this.historyUndo.shift();
            }
            this.historyRedo = []; // clear redo stack on new action
        },
        
        undo() {
            if (this.historyUndo.length === 0) return false;
            const prev = this.historyUndo.pop();
            this.historyRedo.push({
                N: this.N,
                stateData: [...this.stateData],
                exprType: this.exprType
            });
            this.N = prev.N;
            this.stateData = [...prev.stateData];
            this.exprType = prev.exprType;
            this.notify();
            return true;
        },
        
        redo() {
            if (this.historyRedo.length === 0) return false;
            const next = this.historyRedo.pop();
            this.historyUndo.push({
                N: this.N,
                stateData: [...this.stateData],
                exprType: this.exprType
            });
            this.N = next.N;
            this.stateData = [...next.stateData];
            this.exprType = next.exprType;
            this.notify();
            return true;
        },
        
        setData(index, val, pushHist = true) {
            if (this.stateData[index] === val) return;
            if (pushHist) this.pushHistory();
            this.stateData[index] = val;
            this.notify();
        },
        
        setBrushMode(mode) {
            this.brushMode = mode;
            this.notify();
        },
        
        fillAllOnes() {
            this.pushHistory();
            this.stateData.fill(1);
            this.notify();
        },
        
        clearAll() {
            this.pushHistory();
            this.stateData.fill(0);
            this.notify();
        },

        setExprType(type) {
            if (this.exprType === type) return;
            this.pushHistory();
            this.exprType = type;
            this.notify();
        },

        setSolution(sol) {
            this.currentSolutionMap = sol;
        },
        
        setPlaybackStep(step) {
            this.playbackStep = step;
            this.notify();
        },
        
        toggleCircuitInput(varName) {
            if (this.circuitInputs.hasOwnProperty(varName)) {
                this.circuitInputs[varName] = !this.circuitInputs[varName];
                this.notify();
            }
        },

        subscribe(listener) {
            this.listeners.add(listener);
        },

        unsubscribe(listener) {
            this.listeners.delete(listener);
        },

        notify() {
            for (const listener of this.listeners) {
                listener();
            }
        },

        // URL Serialization
        serializeToHash() {
            if (!this.stateData || this.stateData.length === 0) return '';
            const dataStr = this.stateData.map(v => v === 2 ? 'X' : v).join('');
            return `n=${this.N}&data=${dataStr}&type=${this.exprType}`;
        },

        loadFromHash() {
            const hash = window.location.hash.replace(/^#/, '');
            if (!hash) return false;
            const params = new URLSearchParams(hash);
            const n = parseInt(params.get('n'), 10);
            const dataStr = params.get('data');
            const type = params.get('type') || 'SOP';
            
            if (n >= 2 && n <= 5 && dataStr && dataStr.length === (1 << n)) {
                this.N = n;
                this.exprType = type === 'POS' ? 'POS' : 'SOP';
                this.stateData = dataStr.split('').map(c => {
                    if (c === 'X' || c === 'x') return 2;
                    if (c === '1') return 1;
                    return 0;
                });
                this.currentSolutionMap = [];
                this.notify();
                return true;
            }
            return false;
        }
    };
})();
