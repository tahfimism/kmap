(function() {
    function drawCircuit(solutionMap, N, exprType) {
        const container = document.getElementById('circuit-container');
        if (!container) return;

        const state = window.KMapState;
        const varNames = state.varNames;
        const circuitInputs = state.circuitInputs || {};

        container.style.height = 'auto';
        container.style.minHeight = '11rem';

        const isPOS = exprType === 'POS';
        
        // Constant cases
        if (!solutionMap || solutionMap.length === 0) {
            renderConstantCircuit(container, isPOS ? "1" : "0");
            return;
        }

        if (solutionMap.length === 1 && solutionMap[0].pi === '-'.repeat(N)) {
            renderConstantCircuit(container, isPOS ? "0" : "1");
            return;
        }

        // Process terms & logic levels
        const terms = solutionMap.map((item, idx) => {
            const pi = item.pi;
            const activeInputs = [];
            let termLogicValue = isPOS ? false : true; // AND default true, OR default false

            for (let i = 0; i < N; i++) {
                if (pi[i] !== '-') {
                    const varName = varNames[i];
                    const rawVal = !!circuitInputs[varName];
                    const isInverted = isPOS ? (pi[i] === '1') : (pi[i] === '0');
                    const signalVal = isInverted ? !rawVal : rawVal;

                    activeInputs.push({
                        varIdx: i,
                        varName: varName,
                        isInverted: isInverted,
                        rawVal: rawVal,
                        signalVal: signalVal
                    });

                    if (isPOS) {
                        // POS term is OR: output is 1 if any input is 1
                        termLogicValue = termLogicValue || signalVal;
                    } else {
                        // SOP term is AND: output is 1 only if all inputs are 1
                        termLogicValue = termLogicValue && signalVal;
                    }
                }
            }
            return {
                pi: pi,
                color: item.color,
                inputs: activeInputs,
                logicOutput: activeInputs.length > 0 ? termLogicValue : false,
                idx: idx
            };
        });

        // Compute overall Y output
        let overallY = isPOS ? true : false;
        if (isPOS) {
            // Second level is AND
            overallY = terms.every(t => t.logicOutput);
        } else {
            // Second level is OR
            overallY = terms.some(t => t.logicOutput);
        }

        const M = terms.length;
        const svgHeight = Math.max(180, M * 55 + 50);
        const svgWidth = 430;

        let svgHtml = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full max-w-[430px] h-auto text-neutral-800 dark:text-neutral-200" xmlns="http://www.w3.org/2000/svg">`;

        // 1. Draw input rails (variables A, B, C...) with interactive toggle buttons
        const railSpacing = 22;
        const railsStartX = 40;
        const railsYStart = 38;
        const railsYEnd = svgHeight - 18;

        for (let i = 0; i < N; i++) {
            const rx = railsStartX + i * railSpacing;
            const vName = varNames[i];
            const isHigh = !!circuitInputs[vName];
            const railColor = isHigh ? '#10B981' : 'currentColor';
            const railOpacity = isHigh ? '0.9' : '0.25';

            svgHtml += `
                <g class="cursor-pointer group select-none" onclick="window.KMapState.toggleCircuitInput('${vName}')">
                    <rect x="${rx - 9}" y="6" width="18" height="22" rx="4" fill="${isHigh ? '#10B98120' : 'transparent'}" stroke="${isHigh ? '#10B981' : '#6E6A6450'}" stroke-width="1.2" />
                    <text x="${rx}" y="17" text-anchor="middle" font-size="9" font-weight="800" class="${isHigh ? 'fill-emerald-500 font-bold' : 'fill-neutral-500'} font-sans">${vName}</text>
                    <text x="${rx}" y="25" text-anchor="middle" font-size="7.5" font-weight="900" class="${isHigh ? 'fill-emerald-500' : 'fill-neutral-400'} font-mono">${isHigh ? '1' : '0'}</text>
                </g>
                <line x1="${rx}" y1="${railsYStart}" x2="${rx}" y2="${railsYEnd}" stroke="${railColor}" stroke-dasharray="${isHigh ? 'none' : '2 2'}" stroke-width="${isHigh ? '2' : '1.5'}" opacity="${railOpacity}" class="transition-colors duration-200" />
            `;
        }

        // Single Term Single Variable direct connection
        if (M === 1 && terms[0].inputs.length === 1) {
            const term = terms[0];
            const input = term.inputs[0];
            const cy = svgHeight / 2;
            const rx = railsStartX + input.varIdx * railSpacing;
            const lineY = cy;
            const isSigHigh = input.signalVal;
            const wireColor = isSigHigh ? '#10B981' : '#6E6A64';
            const wireOpacity = isSigHigh ? '1' : '0.4';

            svgHtml += `<circle cx="${rx}" cy="${lineY}" r="3" fill="${wireColor}" />`;

            if (input.isInverted) {
                svgHtml += `
                    <line x1="${rx}" y1="${lineY}" x2="160" y2="${lineY}" stroke="${input.rawVal ? '#10B981' : '#6E6A64'}" stroke-width="2" opacity="${input.rawVal ? '1' : '0.4'}" />
                    <path d="M 160 ${lineY - 7} v 14 l 14 -7 z" fill="none" stroke="${wireColor}" stroke-width="2" />
                    <circle cx="177" cy="${lineY}" r="3" fill="none" stroke="${wireColor}" stroke-width="2" />
                    <line x1="180" y1="${lineY}" x2="360" y2="${lineY}" stroke="${wireColor}" stroke-width="2.5" opacity="${wireOpacity}" />
                `;
            } else {
                svgHtml += `<line x1="${rx}" y1="${lineY}" x2="360" y2="${lineY}" stroke="${wireColor}" stroke-width="2.5" opacity="${wireOpacity}" />`;
            }

            svgHtml += `
                <line x1="360" y1="${lineY}" x2="385" y2="${lineY}" stroke="${overallY ? '#10B981' : '#6E6A64'}" stroke-width="2.5" />
                <text x="395" y="${lineY + 4}" font-size="13" font-weight="800" class="${overallY ? 'fill-emerald-500' : 'fill-neutral-700 dark:fill-neutral-300'} font-sans">Y=${overallY ? '1' : '0'}</text>
            `;
            svgHtml += `</svg>`;
            container.innerHTML = svgHtml;
            return;
        }

        // Multiple Gates Rendering
        const gateStartX = 180;
        const gateWidth = 40;
        const gateHeight = 28;
        const gateSpacing = (svgHeight - 60) / M;
        const firstGateY = 40;
        const termGateY = [];

        terms.forEach((term, j) => {
            const cy = firstGateY + j * gateSpacing + gateHeight / 2;
            termGateY.push(cy);

            const K = term.inputs.length;
            const gateTop = cy - gateHeight / 2;
            const gateBottom = cy + gateHeight / 2;
            const isTermHigh = term.logicOutput;

            term.inputs.forEach((input, k) => {
                const rx = railsStartX + input.varIdx * railSpacing;
                let iy = cy;
                if (K > 1) {
                    iy = gateTop + 5 + k * ((gateHeight - 10) / (K - 1));
                }

                const rawColor = input.rawVal ? '#10B981' : '#6E6A64';
                const sigColor = input.signalVal ? '#10B981' : '#6E6A64';
                const sigOpacity = input.signalVal ? '1' : '0.4';

                svgHtml += `<circle cx="${rx}" cy="${iy}" r="3" fill="${rawColor}" />`;

                if (input.isInverted) {
                    svgHtml += `
                        <line x1="${rx}" y1="${iy}" x2="135" y2="${iy}" stroke="${rawColor}" stroke-width="1.8" opacity="${input.rawVal ? '1' : '0.4'}" />
                        <path d="M 135 ${iy - 6} v 12 l 12 -6 z" fill="none" stroke="${sigColor}" stroke-width="1.8" />
                        <circle cx="150" cy="${iy}" r="2.5" fill="none" stroke="${sigColor}" stroke-width="1.8" />
                        <line x1="153" y1="${iy}" x2="${gateStartX}" y2="${iy}" stroke="${sigColor}" stroke-width="1.8" opacity="${sigOpacity}" />
                    `;
                } else {
                    svgHtml += `<line x1="${rx}" y1="${iy}" x2="${gateStartX}" y2="${iy}" stroke="${sigColor}" stroke-width="1.8" opacity="${sigOpacity}" />`;
                }
            });

            // Gate shape
            const gateColor = isTermHigh ? term.color : '#6E6A64';
            if (isPOS) {
                // OR gate
                svgHtml += `
                    <path d="M ${gateStartX} ${gateTop} Q ${gateStartX + 7} ${cy} ${gateStartX} ${gateBottom} Q ${gateStartX + 22} ${gateBottom} ${gateStartX + gateWidth} ${cy} Q ${gateStartX + 22} ${gateTop} ${gateStartX} ${gateTop}" 
                          fill="${term.color}0D" stroke="${gateColor}" stroke-width="${isTermHigh ? '2.5' : '1.8'}" class="transition-all duration-300" />
                    <text x="${gateStartX + 15}" y="${cy + 3}" text-anchor="middle" font-size="8" font-weight="900" fill="${gateColor}" class="font-sans pointer-events-none">OR</text>
                `;
            } else {
                // AND gate
                const flatWidth = gateWidth / 2;
                svgHtml += `
                    <path d="M ${gateStartX} ${gateTop} h ${flatWidth} a ${gateHeight/2} ${gateHeight/2} 0 0 1 0 ${gateHeight} h -${flatWidth} z" 
                          fill="${term.color}0D" stroke="${gateColor}" stroke-width="${isTermHigh ? '2.5' : '1.8'}" class="transition-all duration-300" />
                    <text x="${gateStartX + 15}" y="${cy + 3}" text-anchor="middle" font-size="8" font-weight="900" fill="${gateColor}" class="font-sans pointer-events-none">AND</text>
                `;
            }
        });

        // 3. Second-level Gate Routing (Strict 90-degree Manhattan channels)
        const secGateX = 310;
        const secGateWidth = 45;
        const secGateHeight = 34;
        const secGateCy = svgHeight / 2;
        const secGateTop = secGateCy - secGateHeight / 2;
        const secGateBottom = secGateCy + secGateHeight / 2;

        terms.forEach((term, j) => {
            const outY = termGateY[j];
            const outX = gateStartX + gateWidth;
            const isHigh = term.logicOutput;
            const wireColor = isHigh ? term.color : '#6E6A64';
            const wireOpacity = isHigh ? '1' : '0.4';

            let iy = secGateCy;
            if (M > 1) {
                iy = secGateTop + 6 + j * ((secGateHeight - 12) / (M - 1));
            }

            const channelX = 275 + (j % 2) * 8; // staggered vertical channels
            svgHtml += `
                <path d="M ${outX} ${outY} H ${channelX} V ${iy} H ${secGateX}" 
                      fill="none" stroke="${wireColor}" stroke-width="${isHigh ? '2.2' : '1.5'}" opacity="${wireOpacity}" class="transition-all duration-300" />
            `;
        });

        // Second-level gate shape
        const secGateColor = overallY ? '#10B981' : '#6E6A64';
        if (isPOS) {
            const flatWidth = secGateWidth / 2;
            svgHtml += `
                <path d="M ${secGateX} ${secGateTop} h ${flatWidth} a ${secGateHeight/2} ${secGateHeight/2} 0 0 1 0 ${secGateHeight} h -${flatWidth} z" 
                      fill="${overallY ? '#10B98115' : 'transparent'}" stroke="${secGateColor}" stroke-width="${overallY ? '2.8' : '1.8'}" />
                <text x="${secGateX + 16}" y="${secGateCy + 3.5}" text-anchor="middle" font-size="9" font-weight="900" fill="${secGateColor}" class="font-sans pointer-events-none">AND</text>
            `;
        } else {
            svgHtml += `
                <path d="M ${secGateX} ${secGateTop} Q ${secGateX + 8} ${secGateCy} ${secGateX} ${secGateBottom} Q ${secGateX + 25} ${secGateBottom} ${secGateX + secGateWidth} ${secGateCy} Q ${secGateX + 25} ${secGateTop} ${secGateX} ${secGateTop}" 
                      fill="${overallY ? '#10B98115' : 'transparent'}" stroke="${secGateColor}" stroke-width="${overallY ? '2.8' : '1.8'}" />
                <text x="${secGateX + 16}" y="${secGateCy + 3.5}" text-anchor="middle" font-size="9" font-weight="900" fill="${secGateColor}" class="font-sans pointer-events-none">OR</text>
            `;
        }

        // Final output pin
        const finalOutX = secGateX + secGateWidth;
        svgHtml += `
            <line x1="${finalOutX}" y1="${secGateCy}" x2="${finalOutX + 25}" y2="${secGateCy}" stroke="${secGateColor}" stroke-width="${overallY ? '3' : '2'}" />
            <text x="${finalOutX + 32}" y="${secGateCy + 4.5}" font-size="12" font-weight="800" class="${overallY ? 'fill-emerald-500' : 'fill-neutral-600 dark:fill-neutral-400'} font-sans">Y=${overallY ? '1' : '0'}</text>
        `;

        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;
    }

    function renderConstantCircuit(container, value) {
        container.style.height = '11rem';
        const isHigh = (value === "1");

        const svgHtml = `
            <svg viewBox="0 0 300 140" class="w-full max-w-[300px] h-auto text-neutral-800 dark:text-neutral-200" xmlns="http://www.w3.org/2000/svg">
                <rect x="60" y="50" width="90" height="40" rx="6" fill="${isHigh ? '#10B98115' : '#6E6A6415'}" stroke="${isHigh ? '#10B981' : '#6E6A64'}" stroke-width="2" />
                <text x="105" y="75" text-anchor="middle" font-size="12" font-weight="800" class="${isHigh ? 'fill-emerald-500' : 'fill-neutral-500'} font-sans">
                    ${isHigh ? "VCC (HIGH)" : "GND (LOW)"}
                </text>
                <line x1="150" y1="70" x2="220" y2="70" stroke="${isHigh ? '#10B981' : '#6E6A64'}" stroke-width="2.5" />
                <text x="235" y="75" font-size="13" font-weight="800" class="${isHigh ? 'fill-emerald-500' : 'fill-neutral-500'} font-sans">Y = ${value}</text>
            </svg>
        `;
        container.innerHTML = svgHtml;
    }

    window.KMapCircuit = {
        drawCircuit
    };
})();
