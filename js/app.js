(function() {
    const mapsWrapper = document.getElementById('maps-wrapper');
    const resultExpr = document.getElementById('result-expression');
    const stepsContainer = document.getElementById('steps-container');
    const fsOverlay = document.getElementById('fullscreen-overlay');
    const fsContent = document.getElementById('fullscreen-content');

    function solveAndRender() {
        let state = window.KMapState;
        let Solver = window.KMapSolver;
        let SVG = window.KMapSVG;
        let UI = window.KMapUI;
        let Tutorial = window.KMapTutorial;
        let Circuit = window.KMapCircuit;
        let Practice = window.KMapPractice;
        let Tiled = window.KMapTiled;

        let result = state.exprType === 'POS'
            ? Solver.solveQMPOS(state.stateData, state.N)
            : Solver.solveQM(state.stateData, state.N);
        
        let vizSolution = result.solution.map((pi, idx) => ({ 
            pi: pi, 
            color: state.groupColors[idx % state.groupColors.length] 
        }));
        state.setSolution(vizSolution);

        if (state.practiceMode) {
            Practice.drawPracticeSVGs(mapsWrapper);
        } else {
            UI.renderOutput(result.PIs, result.EPIs, vizSolution, resultExpr, stepsContainer);
            SVG.drawSVGs(vizSolution, mapsWrapper);
        }

        // Render logic circuit diagram
        Circuit.drawCircuit(vizSolution, state.N, state.exprType);

        // Update step-by-step tutorial
        Tutorial.updateTutorial(result.PIs, result.EPIs, vizSolution, state.stateData, state.N, state.exprType);
        
        if (fsOverlay.classList.contains('active')) {
            if (fsOverlay.dataset.mode === 'tiled') {
                Tiled.drawTiledSVGs(vizSolution, fsContent);
            } else {
                const clone = document.getElementById('fs-maps-wrapper');
                if (clone) {
                    if (state.practiceMode) {
                        Practice.drawPracticeSVGs(clone);
                    } else {
                        SVG.drawSVGs(vizSolution, clone);
                    }
                }
            }
        }
    }

    // Subscribe solve & render to state changes
    window.KMapState.subscribe(() => {
        window.KMapGrid.updateCellVisuals();
        solveAndRender();
    });

    // Initialization
    document.addEventListener('DOMContentLoaded', () => {
        let state = window.KMapState;
        let Grid = window.KMapGrid;
        let SVG = window.KMapSVG;
        let Inputs = window.KMapInputs;
        let Tiled = window.KMapTiled;
        let Practice = window.KMapPractice;

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            setTimeout(() => {
                if (state.practiceMode) {
                    Practice.drawPracticeSVGs(mapsWrapper);
                } else {
                    SVG.drawSVGs(state.currentSolutionMap, mapsWrapper);
                }
            }, 100);
        });

        // Variable buttons
        document.querySelectorAll('.var-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.var-btn').forEach(b => {
                    b.className = 'var-btn px-3 py-1.5 text-xs font-semibold rounded-md text-cream-muted dark:text-charcoal-muted hover:text-cream-text dark:hover:text-charcoal-text transition-all';
                });
                const target = e.target;
                target.className = 'var-btn active px-3 py-1.5 text-xs font-semibold rounded-md shadow-sm bg-white dark:bg-charcoal-card text-cream-text dark:text-charcoal-text border border-cream-border dark:border-charcoal-border transition-all';
                let newN = parseInt(target.getAttribute('data-vars'));
                state.init(newN);
                if (state.practiceMode) {
                    Grid.renderGrids(mapsWrapper, () => {});
                    Practice.generateChallenge();
                } else {
                    Grid.renderGrids(mapsWrapper, (idx) => {
                        state.setData(idx, (state.stateData[idx] + 1) % 3);
                    });
                }
            });
        });

        document.getElementById('btn-clear').addEventListener('click', () => {
            state.clearAll();
        });
        
        document.getElementById('btn-fill').addEventListener('click', () => {
            state.fillAllOnes();
        });

        // Fullscreen Logic
        document.getElementById('btn-fullscreen').addEventListener('click', () => {
            fsOverlay.classList.add('active');
            fsOverlay.dataset.mode = 'normal';
            document.getElementById('fs-title').innerText = 'Pattern Viewer';
            fsContent.innerHTML = ''; // Clear old
            
            // Clone the maps wrapper into fullscreen
            const clone = mapsWrapper.cloneNode(true);
            clone.id = 'fs-maps-wrapper';
            // Adjust scale for fullscreen
            clone.classList.remove('overflow-x-auto');
            clone.classList.add('scale-110', 'md:scale-125', 'transform-origin-center'); 
            fsContent.appendChild(clone);
            
            // Re-bind click events on the clone
            clone.querySelectorAll('.kmap-cell').forEach(cell => {
                cell.addEventListener('click', function() {
                    let valIndex = parseInt(this.getAttribute('data-val'));
                    state.setData(valIndex, (state.stateData[valIndex] + 1) % 3);
                });
            });
            
            // Redraw SVGs immediately for the clone
            setTimeout(() => SVG.drawSVGs(state.currentSolutionMap, clone), 50);
        });

        // Tiled Wrap View Logic
        document.getElementById('btn-tiled-view').addEventListener('click', () => {
            fsOverlay.classList.add('active');
            fsOverlay.dataset.mode = 'tiled';
            document.getElementById('fs-title').innerText = 'Tiled Wrap-Around View';
            
            // Render tiled K-map into fullscreen content
            Tiled.renderTiledKMap(fsContent, (idx) => {
                state.setData(idx, (state.stateData[idx] + 1) % 3);
            });
            
            // Draw SVGs immediately
            setTimeout(() => Tiled.drawTiledSVGs(state.currentSolutionMap, fsContent), 50);
        });

        document.getElementById('btn-close-fs').addEventListener('click', () => {
            fsOverlay.classList.remove('active');
            fsOverlay.removeAttribute('data-mode');
            // Re-render main view to ensure sync
            setTimeout(() => {
                Grid.renderGrids(mapsWrapper, (idx) => {
                    state.setData(idx, (state.stateData[idx] + 1) % 3);
                });
                solveAndRender();
            }, 200);
        });

        window.addEventListener('resize', () => {
            if (state.practiceMode) {
                Practice.drawPracticeSVGs(mapsWrapper);
            } else {
                if (!fsOverlay.classList.contains('active')) {
                    SVG.drawSVGs(state.currentSolutionMap, mapsWrapper);
                } else {
                    if (fsOverlay.dataset.mode === 'tiled') {
                        Tiled.drawTiledSVGs(state.currentSolutionMap, fsContent);
                    } else {
                        const clone = document.getElementById('fs-maps-wrapper');
                        if (clone) SVG.drawSVGs(state.currentSolutionMap, clone);
                    }
                }
            }
        });

        // Initialize inputs management
        Inputs.initInputs();

        // SOP/POS toggles
        const optSop = document.getElementById('opt-sop');
        const optPos = document.getElementById('opt-pos');

        function updateToggleButtons() {
            if (state.exprType === 'SOP') {
                optSop.className = 'active px-2 py-1 rounded bg-white dark:bg-charcoal-card text-cream-text dark:text-charcoal-text shadow-sm transition-all';
                optPos.className = 'px-2 py-1 rounded text-cream-muted dark:text-charcoal-muted hover:text-cream-text dark:hover:text-charcoal-text transition-all';
            } else {
                optPos.className = 'active px-2 py-1 rounded bg-white dark:bg-charcoal-card text-cream-text dark:text-charcoal-text shadow-sm transition-all';
                optSop.className = 'px-2 py-1 rounded text-cream-muted dark:text-charcoal-muted hover:text-cream-text dark:hover:text-charcoal-text transition-all';
            }
        }

        if (optSop && optPos) {
            optSop.addEventListener('click', () => {
                state.setExprType('SOP');
                updateToggleButtons();
            });
            optPos.addEventListener('click', () => {
                state.setExprType('POS');
                updateToggleButtons();
            });
            updateToggleButtons();
        }

        // Practice Mode Toggle
        const practiceToggleBtn = document.getElementById('practice-toggle');
        if (practiceToggleBtn) {
            practiceToggleBtn.addEventListener('click', () => {
                if (state.practiceMode) {
                    Practice.disablePracticeMode();
                } else {
                    Practice.enablePracticeMode();
                }
            });
        }

        // Difficulty selection / Custom PYQ file upload hooks
        const difficultySelect = document.getElementById('practice-difficulty');
        const pyqLoadBtn = document.getElementById('pyq-load-btn');
        const pyqFileInput = document.getElementById('pyq-file-input');

        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                if (e.target.value === 'pyq_custom') {
                    pyqLoadBtn.classList.remove('hidden');
                } else {
                    pyqLoadBtn.classList.add('hidden');
                }
                Practice.generateChallenge();
            });
        }

        if (pyqLoadBtn && pyqFileInput) {
            pyqLoadBtn.addEventListener('click', () => {
                pyqFileInput.click();
            });

            pyqFileInput.addEventListener('change', (e) => {
                let file = e.target.files[0];
                if (file) {
                    let reader = new FileReader();
                    reader.onload = function(evt) {
                        try {
                            let parsed = JSON.parse(evt.target.result);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                window.KMapCustomProblems = parsed;
                                window.KMapCustomProblemsIndex = 0;
                                alert(`Successfully loaded ${parsed.length} custom PYQ problems!`);
                                Practice.generateChallenge();
                            } else {
                                alert("Invalid file format: JSON must be a non-empty array of problems.");
                            }
                        } catch (err) {
                            alert("Error parsing JSON: " + err.message);
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        // Initialize practice event listeners
        Practice.setupPracticeEventListeners();
        Practice.setupPracticeModalListeners();

        // Initial state data setup
        state.init(2);
        Grid.renderGrids(mapsWrapper, (idx) => {
            if (state.practiceMode) {
                // Clicks handled by practice.js listeners
            } else {
                state.setData(idx, (state.stateData[idx] + 1) % 3);
            }
        });
        solveAndRender();
    });
})();
