(function() {
    let worker = null;
    let reqId = 0;
    const pendingCallbacks = new Map();

    // Try initializing Web Worker gracefully
    try {
        if (typeof Worker !== 'undefined') {
            worker = new Worker('js/solver-worker.js');
            worker.onmessage = function(e) {
                const { id, result } = e.data;
                if (pendingCallbacks.has(id)) {
                    const cb = pendingCallbacks.get(id);
                    pendingCallbacks.delete(id);
                    cb(result);
                }
            };
            worker.onerror = function() {
                // If local security policies block local worker file, gracefully fallback
                worker = null;
            };
        }
    } catch (e) {
        worker = null;
    }

    function solveAsync(stateData, N, exprType, callback) {
        if (worker) {
            const id = ++reqId;
            pendingCallbacks.set(id, callback);
            worker.postMessage({ id, stateData, N, exprType });
        } else {
            // Immediate synchronous calculation fallback
            const res = exprType === 'POS' ? solveQMPOS(stateData, N) : solveQM(stateData, N);
            callback(res);
        }
    }

    function solveQM(stateData, N) {
        let minterms = [];
        let dontcares = [];
        
        for (let i = 0; i < stateData.length; i++) {
            if (stateData[i] === 1) minterms.push(i);
            if (stateData[i] === 2) dontcares.push(i);
        }

        if (minterms.length === 0) {
            return { solution: [], PIs: [], EPIs: [] };
        }
        if (minterms.length + dontcares.length === (1 << N)) {
            return {
                solution: ['-'.repeat(N)],
                PIs: ['-'.repeat(N)],
                EPIs: ['-'.repeat(N)]
            };
        }

        let terms = [...minterms, ...dontcares].map(m => m.toString(2).padStart(N, '0'));
        let PIs = new Set();
        let currentGroups = [terms];
        let used = new Set();

        while (currentGroups.length > 0 && currentGroups[0].length > 0) {
            let nextGroup = [];
            let newlyUsed = new Set();
            let prevTerms = currentGroups[currentGroups.length - 1];

            for (let i = 0; i < prevTerms.length; i++) {
                for (let j = i + 1; j < prevTerms.length; j++) {
                    let diff = 0;
                    let diffIdx = -1;
                    for (let k = 0; k < N; k++) {
                        if (prevTerms[i][k] !== prevTerms[j][k]) {
                            diff++;
                            diffIdx = k;
                        }
                    }
                    if (diff === 1) {
                        newlyUsed.add(prevTerms[i]);
                        newlyUsed.add(prevTerms[j]);
                        let newTerm = prevTerms[i].substring(0, diffIdx) + '-' + prevTerms[i].substring(diffIdx + 1);
                        if (!nextGroup.includes(newTerm)) nextGroup.push(newTerm);
                    }
                }
            }
            
            prevTerms.forEach(t => { if (!newlyUsed.has(t)) PIs.add(t); });
            if (nextGroup.length === 0) break;
            currentGroups.push(nextGroup);
            used = new Set([...used, ...newlyUsed]);
        }

        let PI_list = Array.from(PIs);
        let mintermStrs = minterms.map(m => m.toString(2).padStart(N, '0'));
        let chart = {}; 
        mintermStrs.forEach(m => { chart[m] = PI_list.filter(pi => covers(pi, m)); });

        let EPIs = new Set();
        let coveredMinterms = new Set();

        for (let m in chart) {
            if (chart[m].length === 1) EPIs.add(chart[m][0]);
        }

        EPIs.forEach(epi => {
            mintermStrs.forEach(m => { if (covers(epi, m)) coveredMinterms.add(m); });
        });

        let solution = Array.from(EPIs);
        let remainingMinterms = mintermStrs.filter(m => !coveredMinterms.has(m));
        let availablePIs = PI_list.filter(pi => !EPIs.has(pi));

        while (remainingMinterms.length > 0 && availablePIs.length > 0) {
            availablePIs.sort((a, b) => {
                let aCov = remainingMinterms.filter(m => covers(a, m)).length;
                let bCov = remainingMinterms.filter(m => covers(b, m)).length;
                return bCov - aCov;
            });
            let best = availablePIs.shift();
            let covered = remainingMinterms.filter(m => covers(best, m));
            if (covered.length > 0) {
                solution.push(best);
                covered.forEach(m => coveredMinterms.add(m));
                remainingMinterms = remainingMinterms.filter(m => !coveredMinterms.has(m));
            }
        }

        return {
            solution: solution,
            PIs: PI_list,
            EPIs: Array.from(EPIs)
        };
    }

    function covers(pi, m) {
        for (let i = 0; i < pi.length; i++) {
            if (pi[i] !== '-' && pi[i] !== m[i]) return false;
        }
        return true;
    }

    function solveQMPOS(stateData, N) {
        let posStateData = stateData.map(val => {
            if (val === 0) return 1;
            if (val === 2) return 2;
            return 0;
        });
        return solveQM(posStateData, N);
    }

    window.KMapSolver = {
        solveQM,
        solveQMPOS,
        solveAsync,
        covers
    };
})();
