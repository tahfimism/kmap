(function() {
    function generateLaTeX(solutionMap, N, exprType) {
        const varNames = window.KMapState.varNames;
        const isPOS = exprType === 'POS';

        if (!solutionMap || solutionMap.length === 0) {
            return `% Minimized Boolean Expression\n\\begin{equation}\nY = ${isPOS ? '1' : '0'}\n\\end{equation}`;
        }

        if (solutionMap.length === 1 && solutionMap[0].pi === '-'.repeat(N)) {
            return `% Minimized Boolean Expression\n\\begin{equation}\nY = ${isPOS ? '0' : '1'}\n\\end{equation}`;
        }

        const terms = solutionMap.map(item => {
            const pi = item.pi;
            const literals = [];
            for (let i = 0; i < N; i++) {
                if (pi[i] !== '-') {
                    const v = varNames[i];
                    if (isPOS) {
                        literals.push(pi[i] === '0' ? v : `\\overline{${v}}`);
                    } else {
                        literals.push(pi[i] === '1' ? v : `\\overline{${v}}`);
                    }
                }
            }
            if (isPOS) {
                return `(${literals.join(' + ')})`;
            } else {
                return literals.join('');
            }
        });

        const connector = isPOS ? ' \\cdot ' : ' + ';
        const expr = terms.join(connector);

        return `% Minimized Boolean Expression (${exprType})\n\\begin{equation}\nY = ${expr}\n\\end{equation}`;
    }

    function generateQMTableLaTeX(stateData, N) {
        const Solver = window.KMapSolver;
        const qm = Solver.solveQM(stateData, N);
        const minterms = [];
        for (let i = 0; i < stateData.length; i++) {
            if (stateData[i] === 1) minterms.push(i);
        }

        let latex = `% Quine-McCluskey Prime Implicant Coverage Chart\n`;
        latex += `\\begin{table}[h!]\n\\centering\n`;
        latex += `\\begin{tabular}{|l|${'c|'.repeat(minterms.length)}}\n\\hline\n`;
        latex += `\\textbf{Prime Implicants} & ${minterms.map(m => `$m_{${m}}$`).join(' & ')} \\\\ \\hline\n`;

        qm.PIs.forEach(pi => {
            const isEPI = qm.EPIs.includes(pi);
            const rowLabel = isEPI ? `\\textbf{${pi}}*` : pi;
            const marks = minterms.map(m => {
                const bin = m.toString(2).padStart(N, '0');
                return Solver.covers(pi, bin) ? '$\\times$' : '';
            });
            latex += `${rowLabel} & ${marks.join(' & ')} \\\\ \\hline\n`;
        });

        latex += `\\end{tabular}\n`;
        latex += `\\caption{QM Coverage Chart (* indicates Essential Prime Implicant)}\n`;
        latex += `\\end{table}`;
        return latex;
    }

    function copyToClipboard(text, successMsg = 'Copied to clipboard!') {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMsg);
        }).catch(() => {
            // Fallback prompt
            prompt('Copy LaTeX code below:', text);
        });
    }

    function showToast(message) {
        let toast = document.getElementById('kmap-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'kmap-toast';
            toast.className = 'fixed bottom-6 right-6 px-4 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl shadow-2xl text-xs font-bold z-50 transition-all duration-300 transform translate-y-12 opacity-0 pointer-events-none flex items-center gap-2 border border-accent/30';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<span class="text-accent">✓</span> ${message}`;
        toast.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
        
        setTimeout(() => {
            toast.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
        }, 2200);
    }

    function exportPNG() {
        const wrapper = document.getElementById('maps-wrapper');
        if (!wrapper) return;

        // Use canvas to capture table + SVG overlays
        const container = wrapper.querySelector('.kmap-grid-container');
        if (!container) return;

        const table = container.querySelector('table');
        const svg = container.querySelector('.svg-overlay');
        if (!table) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const rect = table.getBoundingClientRect();
        
        const scale = 2; // high-res Retina
        canvas.width = (rect.width + 40) * scale;
        canvas.height = (rect.height + 40) * scale;
        ctx.scale(scale, scale);

        // Draw background
        const isDark = document.documentElement.classList.contains('dark');
        ctx.fillStyle = isDark ? '#141311' : '#FAF8F5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Serialize SVG for overlay rendering
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = function() {
            // Draw grid lines and text onto canvas
            ctx.fillStyle = isDark ? '#FFFFFF' : '#1F1E1D';
            ctx.font = 'bold 13px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const cells = table.querySelectorAll('.kmap-cell');
            cells.forEach(c => {
                const cRect = c.getBoundingClientRect();
                const x = (cRect.left - rect.left) + 20;
                const y = (cRect.top - rect.top) + 20;
                const w = cRect.width;
                const h = cRect.height;

                ctx.strokeStyle = isDark ? '#333333' : '#E6E2DA';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, w, h);

                const text = c.innerText.trim();
                ctx.fillText(text, x + w / 2, y + h / 2);
            });

            // Draw SVG loop overlay
            ctx.drawImage(img, 20, 20);
            URL.revokeObjectURL(blobURL);

            // Download PNG
            const link = document.createElement('a');
            link.download = `kmap_${window.KMapState.N}vars_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('K-Map image exported!');
        };
        img.src = blobURL;
    }

    window.KMapExport = {
        generateLaTeX,
        generateQMTableLaTeX,
        copyToClipboard,
        exportPNG,
        showToast
    };
})();
