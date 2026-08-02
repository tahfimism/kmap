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
        
        init(n) {
            this.N = n;
            this.stateData = new Array(1 << n).fill(0);
            this.currentSolutionMap = [];
            this.notify();
        },
        
        setData(index, val) {
            this.stateData[index] = val;
            this.notify();
        },
        
        fillAllOnes() {
            this.stateData.fill(1);
            this.notify();
        },
        
        clearAll() {
            this.stateData.fill(0);
            this.notify();
        },

        setExprType(type) {
            this.exprType = type;
            this.notify();
        },

        setSolution(sol) {
            this.currentSolutionMap = sol;
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
        }
    };
})();
