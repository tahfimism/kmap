(function() {
    const TOUR_STORAGE_KEY = 'kmap_tour_completed_v1';

    const TOUR_STEPS = [
        {
            target: '#maps-wrapper',
            title: 'Interactive Boolean Grid',
            description: 'Click any cell or use your keyboard (0, 1, X or Arrow keys) to toggle states. Minimal groupings of 2, 4, 8 form automatically.',
            preferredPlacement: 'bottom'
        },
        {
            target: '#input-methods-card',
            title: 'Multi-Modal Inputs',
            description: 'Switch between Truth Table, Minterms list (\u03a3m), and Boolean algebraic expressions with instant two-way synchronization.',
            preferredPlacement: 'bottom'
        },
        {
            target: '#learning-notes-card',
            title: 'Tutor Walkthrough & Playback',
            description: 'Read the Quine-McCluskey minimization logic step-by-step, or use the playback timeline toolbar to watch groupings form one by one.',
            preferredPlacement: 'left'
        },
        {
            target: '#circuit-card',
            title: 'Live Gate Schematic',
            description: 'Real-time logic circuit diagram with Manhattan routing. Click the variable switches (A, B, C...) to simulate electrical signals.',
            preferredPlacement: 'left'
        },
        {
            target: '#practice-toggle',
            title: 'Practice Mode & Exporters',
            description: 'Test your mastery with auto-graded challenges & PYQs, or export your work to LaTeX formulas, QM tables, and high-res PNG images.',
            preferredPlacement: 'bottom'
        }
    ];

    let currentStepIndex = 0;
    let tourContainer = null;
    let isTourActive = false;

    function createTourElements() {
        if (tourContainer) return;

        tourContainer = document.createElement('div');
        tourContainer.id = 'kmap-tour-overlay';
        tourContainer.className = 'fixed inset-0 z-50 pointer-events-auto transition-opacity duration-300 opacity-0 hidden';
        
        tourContainer.innerHTML = `
            <!-- SVG Mask Cutout Backdrop -->
            <svg class="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <mask id="tour-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect id="tour-cutout" x="0" y="0" width="0" height="0" rx="12" fill="black" />
                    </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="rgba(15, 15, 18, 0.65)" mask="url(#tour-mask)" />
            </svg>

            <!-- Spotlight Highlight Border Ring -->
            <div id="tour-highlight-box" class="absolute pointer-events-none rounded-xl border-2 border-accent shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all duration-300 ease-spring"></div>

            <!-- Floating Tooltip Card -->
            <div id="tour-popover" class="absolute z-10 w-[310px] sm:w-[350px] p-5 rounded-2xl bg-white dark:bg-charcoal-card border border-cream-border dark:border-charcoal-border shadow-2xl transition-all duration-300 ease-spring opacity-0 scale-95 flex flex-col gap-3.5">
                <div class="flex items-center justify-between">
                    <span id="tour-step-badge" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">Step 1 of 5</span>
                    <button id="tour-close-btn" class="p-1 rounded-md text-cream-muted dark:text-charcoal-muted hover:text-rose-500 transition-colors" title="Skip Tour (Esc)">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div class="flex flex-col gap-1">
                    <h3 id="tour-title" class="text-sm font-extrabold text-cream-text dark:text-charcoal-text tracking-tight">Feature Title</h3>
                    <p id="tour-desc" class="text-xs text-cream-muted dark:text-charcoal-muted leading-relaxed">Feature description goes here.</p>
                </div>

                <!-- Footer Navigation -->
                <div class="flex items-center justify-between pt-2 border-t border-cream-border/60 dark:border-charcoal-border/60 mt-1">
                    <!-- Progress Dots -->
                    <div id="tour-dots" class="flex items-center gap-1.5"></div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-2">
                        <button id="tour-prev-btn" class="px-2.5 py-1 text-xs font-bold rounded-lg border border-cream-border dark:border-charcoal-border hover:bg-neutral-100 dark:hover:bg-neutral-800 text-cream-text dark:text-charcoal-text transition-colors">Back</button>
                        <button id="tour-next-btn" class="px-3.5 py-1 text-xs font-bold rounded-lg bg-accent hover:bg-accent-hover text-white shadow-sm transition-all active:scale-[0.97]">Next</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(tourContainer);

        // Click outside on backdrop to dismiss
        tourContainer.addEventListener('click', (e) => {
            if (e.target === tourContainer || e.target.tagName.toLowerCase() === 'rect') {
                endTour();
            }
        });

        document.getElementById('tour-close-btn').addEventListener('click', endTour);
        document.getElementById('tour-prev-btn').addEventListener('click', prevStep);
        document.getElementById('tour-next-btn').addEventListener('click', nextStep);

        window.addEventListener('keydown', (e) => {
            if (!isTourActive) return;
            if (e.key === 'Escape') {
                endTour();
            } else if (e.key === 'ArrowRight') {
                nextStep();
            } else if (e.key === 'ArrowLeft') {
                prevStep();
            }
        });

        window.addEventListener('resize', () => {
            if (isTourActive) {
                renderCurrentStep();
            }
        });
    }

    function renderCurrentStep() {
        if (!isTourActive) return;
        const step = TOUR_STEPS[currentStepIndex];
        const targetEl = document.querySelector(step.target);
        
        if (!targetEl) {
            if (currentStepIndex < TOUR_STEPS.length - 1) {
                currentStepIndex++;
                renderCurrentStep();
            } else {
                endTour();
            }
            return;
        }

        // Scroll element into view smoothly if not visible
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

        setTimeout(() => {
            const rect = targetEl.getBoundingClientRect();
            const pad = 6;
            const cutoutX = Math.max(0, rect.left - pad);
            const cutoutY = Math.max(0, rect.top - pad);
            const cutoutW = rect.width + (pad * 2);
            const cutoutH = rect.height + (pad * 2);

            // Update SVG cutout mask
            const cutout = document.getElementById('tour-cutout');
            if (cutout) {
                cutout.setAttribute('x', cutoutX);
                cutout.setAttribute('y', cutoutY);
                cutout.setAttribute('width', cutoutW);
                cutout.setAttribute('height', cutoutH);
            }

            // Update highlight box
            const highlight = document.getElementById('tour-highlight-box');
            if (highlight) {
                highlight.style.left = cutoutX + 'px';
                highlight.style.top = cutoutY + 'px';
                highlight.style.width = cutoutW + 'px';
                highlight.style.height = cutoutH + 'px';
            }

            // Update Text content
            document.getElementById('tour-step-badge').innerText = `Step ${currentStepIndex + 1} of ${TOUR_STEPS.length}`;
            document.getElementById('tour-title').innerText = step.title;
            document.getElementById('tour-desc').innerText = step.description;

            // Update Dots
            const dotsContainer = document.getElementById('tour-dots');
            dotsContainer.innerHTML = '';
            TOUR_STEPS.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.className = `w-1.5 h-1.5 rounded-full transition-all ${idx === currentStepIndex ? 'bg-accent w-3.5' : 'bg-neutral-300 dark:bg-neutral-700'}`;
                dotsContainer.appendChild(dot);
            });

            // Update Navigation Button labels
            const prevBtn = document.getElementById('tour-prev-btn');
            const nextBtn = document.getElementById('tour-next-btn');

            if (currentStepIndex === 0) {
                prevBtn.classList.add('invisible');
            } else {
                prevBtn.classList.remove('invisible');
            }

            if (currentStepIndex === TOUR_STEPS.length - 1) {
                nextBtn.innerText = 'Finish';
            } else {
                nextBtn.innerText = 'Next';
            }

            // Position popover
            positionPopover(rect, step.preferredPlacement);
        }, 150);
    }

    function positionPopover(targetRect, preferred) {
        const popover = document.getElementById('tour-popover');
        if (!popover) return;

        const popoverWidth = popover.offsetWidth || 340;
        const popoverHeight = popover.offsetHeight || 190;
        const margin = 14;
        const vWidth = window.innerWidth;
        const vHeight = window.innerHeight;

        let left = 0;
        let top = 0;

        // Try preferred placement, then fallback
        let placement = preferred || 'bottom';

        if (placement === 'bottom') {
            left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
            top = targetRect.bottom + margin;
            if (top + popoverHeight > vHeight - 20) {
                placement = 'top';
            }
        }

        if (placement === 'top') {
            left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
            top = targetRect.top - popoverHeight - margin;
            if (top < 20) {
                placement = 'right';
            }
        }

        if (placement === 'left') {
            left = targetRect.left - popoverWidth - margin;
            top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
            if (left < 20) {
                placement = 'bottom';
                left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
                top = targetRect.bottom + margin;
            }
        }

        if (placement === 'right') {
            left = targetRect.right + margin;
            top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
            if (left + popoverWidth > vWidth - 20) {
                left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
                top = targetRect.bottom + margin;
            }
        }

        // Clamp bounds to stay nicely within viewport
        left = Math.max(16, Math.min(left, vWidth - popoverWidth - 16));
        top = Math.max(16, Math.min(top, vHeight - popoverHeight - 16));

        popover.style.left = `${left}px`;
        popover.style.top = `${top}px`;
        popover.classList.remove('opacity-0', 'scale-95');
    }

    function nextStep() {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            currentStepIndex++;
            renderCurrentStep();
        } else {
            endTour();
        }
    }

    function prevStep() {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            renderCurrentStep();
        }
    }

    function startTour() {
        createTourElements();
        currentStepIndex = 0;
        isTourActive = true;

        tourContainer.classList.remove('hidden');
        setTimeout(() => {
            tourContainer.classList.remove('opacity-0');
            renderCurrentStep();
        }, 30);
    }

    function endTour() {
        if (!isTourActive) return;
        isTourActive = false;
        if (tourContainer) {
            tourContainer.classList.add('opacity-0');
            const popover = document.getElementById('tour-popover');
            if (popover) popover.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                tourContainer.classList.add('hidden');
            }, 300);
        }
        try {
            localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        } catch (e) {}
    }

    function autoStartIfFirstTime() {
        try {
            const seen = localStorage.getItem(TOUR_STORAGE_KEY);
            if (!seen) {
                setTimeout(() => {
                    startTour();
                }, 700);
            }
        } catch (e) {}
    }

    window.KMapTour = {
        start: startTour,
        next: nextStep,
        prev: prevStep,
        end: endTour,
        autoStart: autoStartIfFirstTime
    };
})();
