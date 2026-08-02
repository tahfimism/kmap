(function() {
    function drawCircuit(solutionMap, N, exprType) {
        const container = document.getElementById('circuit-container');
        if (!container) return;

        const varNames = window.KMapState.varNames;

        // Reset container style for dynamic sizing
        container.style.height = 'auto';
        container.style.minHeight = '11rem'; // 176px

        // Filter out solutions that represent "0" or "1" constants
        const isPOS = exprType === 'POS';
        
        // Check for constant cases
        if (!solutionMap || solutionMap.length === 0) {
            renderConstantCircuit(container, isPOS ? "1" : "0");
            return;
        }

        if (solutionMap.length === 1 && solutionMap[0].pi === '-'.repeat(N)) {
            renderConstantCircuit(container, isPOS ? "0" : "1");
            return;
        }

        // Process terms
        const terms = solutionMap.map((item, idx) => {
            const pi = item.pi;
            const activeInputs = [];
            for (let i = 0; i < N; i++) {
                if (pi[i] !== '-') {
                    // For SOP: active if 1 (normal) or 0 (inverted)
                    // For POS: active if 0 (normal) or 1 (inverted)
                    const isInverted = isPOS ? (pi[i] === '1') : (pi[i] === '0');
                    activeInputs.push({
                        varIdx: i,
                        varName: varNames[i],
                        isInverted: isInverted
                    });
                }
            }
            return {
                pi: pi,
                color: item.color,
                inputs: activeInputs,
                idx: idx
            };
        });

        const M = terms.length;
        // Height calculated dynamically based on number of terms
        const svgHeight = Math.max(180, M * 55 + 40);
        const svgWidth = 420;

        let svgHtml = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full max-w-[420px] h-auto text-neutral-800 dark:text-neutral-200" xmlns="http://www.w3.org/2000/svg">`;

        // 1. Draw input rails (variables A, B, C...)
        const railSpacing = 20;
        const railsStartX = 35;
        const railsYStart = 30;
        const railsYEnd = svgHeight - 20;

        for (let i = 0; i < N; i++) {
            const rx = railsStartX + i * railSpacing;
            // Rail label
            svgHtml += `
                <text x="${rx}" y="${railsYStart - 10}" text-anchor="middle" font-size="11" font-weight="800" class="fill-neutral-500 dark:fill-neutral-400 font-sans">${varNames[i]}</text>
                <line x1="${rx}" y1="${railsYStart}" x2="${rx}" y2="${railsYEnd}" stroke="currentColor" stroke-dasharray="2 2" stroke-width="1.5" class="opacity-30" />
            `;
        }

        // 2. Draw first level gates (AND for SOP, OR for POS)
        // If M = 1 and it has only 1 input variable, we draw a direct connection to output.
        if (M === 1 && terms[0].inputs.length === 1) {
            const term = terms[0];
            const input = term.inputs[0];
            const cy = svgHeight / 2;
            const rx = railsStartX + input.varIdx * railSpacing;

            // Line from rail to near output
            const lineY = cy;
            const color = term.color;

            // Draw rail connection dot
            svgHtml += `<circle cx="${rx}" cy="${lineY}" r="3" fill="${color}" />`;

            if (input.isInverted) {
                // NOT gate
                svgHtml += `
                    <line x1="${rx}" y1="${lineY}" x2="160" y2="${lineY}" stroke="${color}" stroke-width="2.5" />
                    <path d="M 160 ${lineY - 7} v 14 l 14 -7 z" fill="none" stroke="${color}" stroke-width="2" />
                    <circle cx="177" cy="${lineY}" r="3" fill="none" stroke="${color}" stroke-width="2" />
                    <line x1="180" y1="${lineY}" x2="360" y2="${lineY}" stroke="${color}" stroke-width="2.5" />
                `;
            } else {
                svgHtml += `<line x1="${rx}" y1="${lineY}" x2="360" y2="${lineY}" stroke="${color}" stroke-width="2.5" />`;
            }

            // Final output label Y
            svgHtml += `
                <line x1="360" y1="${lineY}" x2="385" y2="${lineY}" stroke="currentColor" stroke-width="2.5" />
                <text x="395" y="${lineY + 4}" font-size="13" font-weight="800" class="fill-neutral-800 dark:fill-neutral-200 font-sans">Y</text>
            `;
            
            svgHtml += `</svg>`;
            container.innerHTML = svgHtml;
            return;
        }

        // Compute gate y coordinates
        const gateStartX = 175;
        const gateWidth = 40;
        const gateHeight = 28;
        const gateSpacing = (svgHeight - 60) / M;
        const firstGateY = 40;

        const termGateY = [];

        // Draw first level gates
        terms.forEach((term, j) => {
            const cy = firstGateY + j * gateSpacing + gateHeight / 2;
            termGateY.push(cy);

            const K = term.inputs.length;
            const gateTop = cy - gateHeight / 2;
            const gateBottom = cy + gateHeight / 2;
            const color = term.color;

            // Draw input lines from rails to the gate
            term.inputs.forEach((input, k) => {
                const rx = railsStartX + input.varIdx * railSpacing;
                let iy = cy;
                if (K > 1) {
                    // Distribute inputs along the back of the gate
                    iy = gateTop + 5 + k * ((gateHeight - 10) / (K - 1));
                }

                // Connection dot on rail
                svgHtml += `<circle cx="${rx}" cy="${iy}" r="3" fill="${color}" />`;

                if (input.isInverted) {
                    // NOT gate on horizontal input line
                    svgHtml += `
                        <line x1="${rx}" y1="${iy}" x2="130" y2="${iy}" stroke="${color}" stroke-width="2" />
                        <path d="M 130 ${iy - 6} v 12 l 12 -6 z" fill="none" stroke="${color}" stroke-width="1.8" />
                        <circle cx="145" cy="${iy}" r="2.5" fill="none" stroke="${color}" stroke-width="1.8" />
                        <line x1="148" y1="${iy}" x2="${gateStartX}" y2="${iy}" stroke="${color}" stroke-width="2" />
                    `;
                } else {
                    svgHtml += `<line x1="${rx}" y1="${iy}" x2="${gateStartX}" y2="${iy}" stroke="${color}" stroke-width="2" />`;
                }
            });

            // Draw gate shape
            if (isPOS) {
                // OR gate path
                svgHtml += `
                    <path d="M ${gateStartX} ${gateTop} Q ${gateStartX + 7} ${cy} ${gateStartX} ${gateBottom} Q ${gateStartX + 22} ${gateBottom} ${gateStartX + gateWidth} ${cy} Q ${gateStartX + 22} ${gateTop} ${gateStartX} ${gateTop}" 
                          fill="${color}0B" stroke="${color}" stroke-width="2.5" class="transition-all duration-300" />
                    <text x="${gateStartX + 15}" y="${cy + 3}" text-anchor="middle" font-size="8" font-weight="900" fill="currentColor" class="opacity-40 font-sans pointer-events-none">OR</text>
                `;
            } else {
                // AND gate path
                const flatWidth = gateWidth / 2;
                svgHtml += `
                    <path d="M ${gateStartX} ${gateTop} h ${flatWidth} a ${gateHeight/2} ${gateHeight/2} 0 0 1 0 ${gateHeight} h -${flatWidth} z" 
                          fill="${color}0B" stroke="${color}" stroke-width="2.5" class="transition-all duration-300" />
                    <text x="${gateStartX + 15}" y="${cy + 3}" text-anchor="middle" font-size="8" font-weight="900" fill="currentColor" class="opacity-40 font-sans pointer-events-none">AND</text>
                `;
            }
        });

        // 3. Draw second level gate (OR for SOP, AND for POS)
        const secGateX = 300;
        const secGateWidth = 45;
        const secGateHeight = 34;
        const secGateCy = svgHeight / 2;
        const secGateTop = secGateCy - secGateHeight / 2;
        const secGateBottom = secGateCy + secGateHeight / 2;

        // Draw routing lines from first-level gate outputs to second-level inputs
        terms.forEach((term, j) => {
            const outY = termGateY[j];
            const outX = gateStartX + gateWidth;
            const color = term.color;

            let iy = secGateCy;
            if (M > 1) {
                iy = secGateTop + 6 + j * ((secGateHeight - 12) / (M - 1));
            }

            // Draw orthogonal routing line
            svgHtml += `
                <path d="M ${outX} ${outY} H 270 V ${iy} H ${secGateX}" 
                      fill="none" stroke="${color}" stroke-width="2" class="transition-all duration-300" />
            `;
        });

        // Draw second level gate
        if (isPOS) {
            // AND gate at second level
            const flatWidth = secGateWidth / 2;
            svgHtml += `
                <path d="M ${secGateX} ${secGateTop} h ${flatWidth} a ${secGateHeight/2} ${secGateHeight/2} 0 0 1 0 ${secGateHeight} h -${flatWidth} z" 
                      fill="none" stroke="currentColor" stroke-width="2.5" />
                <text x="${secGateX + 16}" y="${secGateCy + 3.5}" text-anchor="middle" font-size="9" font-weight="900" fill="currentColor" class="opacity-50 font-sans pointer-events-none">AND</text>
            `;
        } else {
            // OR gate at second level
            svgHtml += `
                <path d="M ${secGateX} ${secGateTop} Q ${secGateX + 8} ${secGateCy} ${secGateX} ${secGateBottom} Q ${secGateX + 25} ${secGateBottom} ${secGateX + secGateWidth} ${secGateCy} Q ${secGateX + 25} ${secGateTop} ${secGateX} ${secGateTop}" 
                      fill="none" stroke="currentColor" stroke-width="2.5" />
            <text x="${secGateX + 16}" y="${secGateCy + 3.5}" text-anchor="middle" font-size="9" font-weight="900" fill="currentColor" class="opacity-50 font-sans pointer-events-none">OR</text>
            `;
        }

        // Output line
        const finalOutX = secGateX + secGateWidth;
        svgHtml += `
            <line x1="${finalOutX}" y1="${secGateCy}" x2="${finalOutX + 25}" y2="${secGateCy}" stroke="currentColor" stroke-width="2.5" />
            <text x="${finalOutX + 35}" y="${secGateCy + 4}" font-size="13" font-weight="800" class="fill-neutral-800 dark:fill-neutral-200 font-sans">Y</text>
        `;

        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;
    }

    function renderConstantCircuit(container, value) {
        container.style.height = '11rem'; // reset to default height

        const svgHtml = `
            <svg viewBox="0 0 300 150" class="w-full max-w-[300px] h-auto text-neutral-800 dark:text-neutral-200" xmlns="http://www.w3.org/2000/svg">
                <!-- Ground or VCC source box -->
                <rect x="70" y="55" width="80" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="2" class="opacity-50" />
                <text x="110" y="80" text-anchor="middle" font-size="13" font-weight="800" class="fill-neutral-500 dark:fill-neutral-400 font-sans">
                    ${value === "1" ? "VCC (1)" : "GND (0)"}
                </text>
                
                <!-- Connection to Y -->
                <line x1="150" y1="75" x2="220" y2="75" stroke="currentColor" stroke-width="2.5" />
                <text x="235" y="80" font-size="14" font-weight="800" class="fill-neutral-800 dark:fill-neutral-200 font-sans">Y</text>
            </svg>
        `;
        container.innerHTML = svgHtml;
    }

    window.KMapCircuit = {
        drawCircuit
    };
})();
