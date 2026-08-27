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

        // Async background solver dispatch (with instantaneous fallback)
        Solver.solveAsync(state.stateData, state.N, state.exprType, function(result) {
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

            // Render logic circuit diagram with live signal levels
            Circuit.drawCircuit(vizSolution, state.N, state.exprType);

            // Update step-by-step tutorial walkthrough
            Tutorial.updateTutorial(result.PIs, result.EPIs, vizSolution, state.stateData, state.N, state.exprType);
            
            // Sync with Fullscreen viewer if open
            if (fsOverlay && fsOverlay.classList.contains('active')) {
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

            // Sync URL hash state seamlessly
            if (!state.practiceMode && window.history && window.history.replaceState) {
                const hash = state.serializeToHash();
                if (hash) {
                    window.history.replaceState(null, '', '#' + hash);
                }
            }
        });
    }

    // Subscribe solve & render to state changes
    window.KMapState.subscribe(() => {
        window.KMapGrid.updateCellVisuals();
        solveAndRender();
    });

    // Global Initialization
    document.addEventListener('DOMContentLoaded', () => {
        let state = window.KMapState;
        let Grid = window.KMapGrid;
        let SVG = window.KMapSVG;
        let Inputs = window.KMapInputs;
        let Tiled = window.KMapTiled;
        let Practice = window.KMapPractice;
        let Export = window.KMapExport;
        let Tour = window.KMapTour;

        // 1. Tour / Interactive Guide
        const tourBtn = document.getElementById('btn-start-tour');
        if (tourBtn && Tour) {
            tourBtn.addEventListener('click', () => {
                Tour.start();
            });
        }

        // Theme toggle
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                setTimeout(() => {
                    if (state.practiceMode) {
                        Practice.drawPracticeSVGs(mapsWrapper);
                    } else {
                        SVG.drawSVGs(state.currentSolutionMap, mapsWrapper);
                    }
                }, 100);
            });
        }

        // 2. Undo / Redo buttons & keyboard shortcuts
        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');

        function handleUndo() {
            if (state.practiceMode) {
                Practice.undoPractice();
            } else {
                state.undo();
            }
        }

        function handleRedo() {
            if (state.practiceMode) {
                Practice.redoPractice();
            } else {
                state.redo();
            }
        }

        if (btnUndo) btnUndo.addEventListener('click', handleUndo);
        if (btnRedo) btnRedo.addEventListener('click', handleRedo);

        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
                e.preventDefault();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                handleRedo();
                e.preventDefault();
            }
        });

        // 3. Brush Segmented Controls
        const brushButtons = document.querySelectorAll('.brush-btn');
        brushButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                brushButtons.forEach(b => {
                    b.className = 'brush-btn px-2.5 py-1 text-[11px] font-bold rounded-md text-cream-muted dark:text-charcoal-muted hover:text-cream-text dark:hover:text-charcoal-text transition-all';
                });
                const target = e.currentTarget;
                target.className = 'brush-btn active px-2.5 py-1 text-[11px] font-bold rounded-md bg-white dark:bg-charcoal-card text-cream-text dark:text-charcoal-text shadow-sm transition-all';
                state.setBrushMode(target.getAttribute('data-brush'));
            });
        });

        // 4. Export Buttons
        const btnLatex = document.getElementById('btn-export-latex');
        if (btnLatex) {
            btnLatex.addEventListener('click', () => {
                const latex = Export.generateLaTeX(state.currentSolutionMap, state.N, state.exprType);
                Export.copyToClipboard(latex, 'LaTeX formula copied to clipboard!');
            });
        }

        const btnPng = document.getElementById('btn-export-png');
        if (btnPng) {
            btnPng.addEventListener('click', () => {
                Export.exportPNG();
            });
        }

        const btnShare = document.getElementById('btn-share-link');
        if (btnShare) {
            btnShare.addEventListener('click', () => {
                const hash = state.serializeToHash();
                const shareUrl = window.location.origin + window.location.pathname + '#' + hash;
                Export.copyToClipboard(shareUrl, 'Shareable problem URL copied!');
            });
        }

        // 5. Variable count tabs (2V, 3V, 4V, 5V)
        document.querySelectorAll('.var-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.var-btn').forEach(b => {
                    b.className = 'var-btn px-3 py-1.5 text-xs font-semibold rounded-md text-cream-muted dark:text-charcoal-muted hover:text-cream-text dark:hover:text-charcoal-text transition-all';
                });
                const target = e.target;
                target.className = 'var-btn active px-3 py-1.5 text-xs font-semibold rounded-md shadow-sm bg-white dark:bg-charcoal-card text-cream-text dark:text-charcoal-text border border-cream-border dark:border-charcoal-border transition-all';
                let newN = parseInt(target.getAttribute('data-vars'), 10);
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

        // 6. Clear and Fill 1s
        const btnClear = document.getElementById('btn-clear');
        if (btnClear) btnClear.addEventListener('click', () => state.clearAll());

        const btnFill = document.getElementById('btn-fill');
        if (btnFill) btnFill.addEventListener('click', () => state.fillAllOnes());

        // 7. Fullscreen & Tiled Views
        const btnFullscreen = document.getElementById('btn-fullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                fsOverlay.classList.add('active');
                fsOverlay.dataset.mode = 'normal';
                document.getElementById('fs-title').innerText = 'Pattern Viewer';
                fsContent.innerHTML = '';
                
                const clone = mapsWrapper.cloneNode(true);
                clone.id = 'fs-maps-wrapper';
                clone.classList.remove('overflow-x-auto');
                clone.classList.add('scale-110', 'md:scale-125', 'transform-origin-center'); 
                fsContent.appendChild(clone);
                
                clone.querySelectorAll('.kmap-cell').forEach(cell => {
                    cell.addEventListener('click', function() {
                        let valIndex = parseInt(this.getAttribute('data-val'));
                        state.setData(valIndex, (state.stateData[valIndex] + 1) % 3);
                    });
                });
                
                setTimeout(() => SVG.drawSVGs(state.currentSolutionMap, clone), 50);
            });
        }

        const btnTiled = document.getElementById('btn-tiled-view');
        if (btnTiled) {
            btnTiled.addEventListener('click', () => {
                fsOverlay.classList.add('active');
                fsOverlay.dataset.mode = 'tiled';
                document.getElementById('fs-title').innerText = 'Tiled Wrap-Around View';
                
                Tiled.renderTiledKMap(fsContent, (idx) => {
                    state.setData(idx, (state.stateData[idx] + 1) % 3);
                });
                
                setTimeout(() => Tiled.drawTiledSVGs(state.currentSolutionMap, fsContent), 50);
            });
        }

        const btnCloseFs = document.getElementById('btn-close-fs');
        if (btnCloseFs) {
            btnCloseFs.addEventListener('click', () => {
                fsOverlay.classList.remove('active');
                fsOverlay.removeAttribute('data-mode');
                setTimeout(() => {
                    Grid.renderGrids(mapsWrapper, (idx) => {
                        state.setData(idx, (state.stateData[idx] + 1) % 3);
                    });
                    solveAndRender();
                }, 200);
            });
        }

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

        // 8. Initialize Input Sync
        Inputs.initInputs();

        // 9. SOP / POS toggles
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

        // 10. Practice Mode
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

        const practiceGenBtn = document.getElementById('practice-generate-btn');
        if (practiceGenBtn) {
            practiceGenBtn.addEventListener('click', () => {
                Practice.generateChallenge();
            });
        }

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
                                Export.showToast(`Loaded ${parsed.length} custom PYQs!`);
                                Practice.generateChallenge();
                            } else {
                                alert("Invalid JSON: Expected non-empty array of problem objects.");
                            }
                        } catch (err) {
                            alert("Error parsing JSON: " + err.message);
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        Practice.setupPracticeEventListeners();
        Practice.setupPracticeModalListeners();

        // 11. Hydrate state from URL hash or default
        const loadedFromHash = state.loadFromHash();
        if (!loadedFromHash) {
            state.init(2);
        } else {
            // Update active Var button to match N
            document.querySelectorAll('.var-btn').forEach(btn => {
                if (parseInt(btn.getAttribute('data-vars'), 10) === state.N) {
                    btn.className = 'var-btn active px-3 py-1.5 text-xs font-semibold rounded-md shadow-sm bg-white dark:bg-charcoal-card text-cream-text dark:text-charcoal-text border border-cream-border dark:border-charcoal-border transition-all';
                } else {
                    btn.className = 'var-btn px-3 py-1.5 text-xs font-semibold rounded-md text-cream-muted dark:text-charcoal-muted hover:text-cream-text dark:hover:text-charcoal-text transition-all';
                }
            });
            updateToggleButtons();
        }

        Grid.renderGrids(mapsWrapper, (idx) => {
            if (!state.practiceMode) {
                state.setData(idx, (state.stateData[idx] + 1) % 3);
            }
        });
        solveAndRender();

        // 12. Auto-start onboarding guide on first visit
        if (Tour) {
            Tour.autoStart();
        }
    });
})();
