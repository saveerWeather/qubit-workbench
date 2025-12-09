// Fresh start - script.js

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

// =====================================================
// Bloch Sphere Rendering with Three.js
// =====================================================

function createBlochSphere(containerId, phiSliderId, thetaSliderId) {
    const container = document.getElementById(containerId);
    const phiSlider = document.getElementById(phiSliderId);
    const thetaSlider = document.getElementById(thetaSliderId);

    if (!container) return;

    // Initialize slider values to match the initial camera angles
    // phiAngle = -Math.PI/8, so slider = 112.5
    // thetaAngle = Math.PI/2.4, so slider = 75
    if (phiSlider) phiSlider.value = 112.5;
    if (thetaSlider) thetaSlider.value = 75;

    // Get container size (fallback to 280x280)
    const containerWidth = container.offsetWidth || 280;
    const containerHeight = container.offsetHeight || 280;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera parameters (adjustable)
    const camera = new THREE.PerspectiveCamera(
        45,  // FOV
        containerWidth / containerHeight,
        0.1,
        100
    );
    let camdist = 3.5;  // Adjustable camera distance
    let phiAngle =-Math.PI/8;
    let thetaAngle = Math.PI/2.4;
    camera.position.x = camdist * Math.cos(phiAngle) * Math.sin(thetaAngle);
    camera.position.y = camdist * Math.cos(thetaAngle);
    camera.position.z = camdist * Math.sin(phiAngle) * Math.sin(thetaAngle);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Ensure canvas fits container
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    // Translucent sphere surface for cross-section projection
    const sphereGeom = new THREE.SphereGeometry(1, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x0080cc,
        transparent: true,
        opacity: 0.15,  // Very translucent
        side: THREE.DoubleSide,
        depthWrite: false  // Prevent z-fighting and weird reflections
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    scene.add(sphere);
    
    // Gray outline around sphere projection (less dense)
    const edgeGeom = new THREE.SphereGeometry(1, 12, 12);  // Lower resolution for less dense lines
    const edges = new THREE.EdgesGeometry(edgeGeom);
    const edgeMaterial = new THREE.LineBasicMaterial({ 
        color: 0x808080,  // Gray instead of black
        linewidth: 2
    });
    const wireframe = new THREE.LineSegments(edges, edgeMaterial);
    scene.add(wireframe);

    // Great circles around axes (black and thick, solid lines)
    function makeGreatCircle(axis) {
        const radius = 1.0;
        const tubeRadius = 0.015;  // Thinner thickness
        const radialSegments = 64;
        const tubularSegments = 32;
        
        // Create a torus (donut) geometry for a thick circle
        const torus = new THREE.TorusGeometry(radius, tubeRadius, radialSegments, tubularSegments);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(torus, material);
        
        // Rotate to align with the correct axis
        // Default torus is in XY plane (circle around Z axis)
        if (axis === 'x') {
            // YZ plane circle (around X axis) - rotate around X axis by 90 degrees
            mesh.rotateX(Math.PI / 2);
        } else if (axis === 'y') {
            // XZ plane circle (around Y axis) - rotate around Y axis by 90 degrees
            mesh.rotateY(Math.PI / 2);
        }
        // axis === 'z' stays in XY plane (default) - no rotation needed
        
        return mesh;
    }
    
    scene.add(makeGreatCircle('x'));  // YZ plane
    scene.add(makeGreatCircle('y'));  // XZ plane
    scene.add(makeGreatCircle('z'));  // XY plane

    // Axes (adjustable)
    const axesLength = 1.15;
    function makeAxis(dir, color) {
        const material = new THREE.LineBasicMaterial({ color: color, linewidth: 4 });
        const points = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(axesLength)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return new THREE.Line(geometry, material);
    }

    const axes = [
        makeAxis(new THREE.Vector3(1,0,0), 0xff0000),   // +X red
        makeAxis(new THREE.Vector3(-1,0,0), 0xaa0000),  // -X dark red
        makeAxis(new THREE.Vector3(0,1,0), 0x00cc00),   // +Y green
        makeAxis(new THREE.Vector3(0,-1,0), 0x008800),  // -Y dark green
        makeAxis(new THREE.Vector3(0,0,1), 0x0000ff),   // +Z blue
        makeAxis(new THREE.Vector3(0,0,-1), 0x000088)   // -Z dark blue
    ];
    axes.forEach(a => scene.add(a));

    // Arrow for Bloch vector (thicker)
    const blochVector = new THREE.Vector3(0, 1, 0).normalize();  // Default |0⟩
    const arrow = new THREE.ArrowHelper(
        blochVector,
        new THREE.Vector3(0, 0, 0),
        1.0,  // length
        0xffaa00,  // color (adjustable)
        0.25,  // head length
        0.35    // head width (increased for thickness)
    );
    // Hide the original thin line and make the arrow shaft thicker
    arrow.line.visible = false;
    const shaftGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8);
    const shaftMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = 0.375;
    arrow.add(shaft);
    scene.add(arrow);

    // Small sphere for non-separable states (initially hidden)
    const nonSeparableSphereGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const nonSeparableSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const nonSeparableSphere = new THREE.Mesh(nonSeparableSphereGeometry, nonSeparableSphereMaterial);
    nonSeparableSphere.position.set(0, 0, 0);
    nonSeparableSphere.visible = false;
    scene.add(nonSeparableSphere);

    // Public updater
    container.updateBloch = function(vec3, isSeparable = true) {
        if (isSeparable && vec3) {
            // Show arrow, hide sphere
            arrow.visible = true;
            nonSeparableSphere.visible = false;
        arrow.setDirection(vec3.clone().normalize());
        } else {
            // Hide arrow, show sphere
            arrow.visible = false;
            nonSeparableSphere.visible = true;
        }
    };

    // Axis Labels (smaller, fixed size)
    function makeLabel(text, position) {
        const canvas = document.createElement("canvas");
        const size = 256;  // Smaller canvas
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.font = "bold 48px sans-serif";  // Smaller font
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, size/2, size/2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            sizeAttenuation: false  // Fixed size regardless of distance
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(0.4, 0.4, 1);  // Smaller scale
        sprite.position.copy(position);
        return sprite;
    }

    scene.add(makeLabel("|i⟩",   new THREE.Vector3(0, 0, -1.2)));
    scene.add(makeLabel("|-i⟩",  new THREE.Vector3(0, 0, 1.2)));
    scene.add(makeLabel("|+⟩",   new THREE.Vector3(1.2, 0, 0)));
    scene.add(makeLabel("|-⟩",   new THREE.Vector3(-1.2, 0, 0)));
    scene.add(makeLabel("|0⟩",   new THREE.Vector3(0, 1.2, 0)));
    scene.add(makeLabel("|1⟩",   new THREE.Vector3(0,-1.2, 0)));

    // Update camera from sliders
    phiSlider.addEventListener("input", () => {
        phiAngle = -phiSlider.value * Math.PI / 180 + Math.PI/2.0;
        if(thetaAngle == 0) {
            camera.position.x = camdist * Math.cos(phiAngle) * 0.0001;
            camera.position.y = camdist;
            camera.position.z = camdist * Math.sin(phiAngle) *0.0001;
        } else {
            camera.position.x = camdist * Math.cos(phiAngle) * Math.sin(thetaAngle);
            camera.position.y = camdist * Math.cos(thetaAngle);
            camera.position.z = camdist * Math.sin(phiAngle) * Math.sin(thetaAngle);
        }
        camera.lookAt(0, 0, 0);
    });

    thetaSlider.addEventListener("input", () => {
        thetaAngle = thetaSlider.value * Math.PI / 180;
        if(thetaAngle == 0) {
            camera.position.x = camdist * Math.cos(phiAngle) * 0.0001;
            camera.position.y = camdist;
            camera.position.z = camdist * Math.sin(phiAngle) *0.0001;
        } else {
            camera.position.x = camdist * Math.cos(phiAngle) * Math.sin(thetaAngle);
            camera.position.y = camdist * Math.cos(thetaAngle);
            camera.position.z = camdist * Math.sin(phiAngle) * Math.sin(thetaAngle);
        }
        camera.lookAt(0, 0, 0);
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener("resize", () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    });
}

// =====================================================
// Gate Matrix Auto-Fill (CNOT & CZ)
// =====================================================

function initGateMatrix() {
    const matrixContainer = document.getElementById("custom-matrix");
    const btnCnot01 = document.getElementById("gate-cnot01");
    const btnCnot10 = document.getElementById("gate-cnot10");
    const btnCz = document.getElementById("gate-cz");
    const btnISwap = document.getElementById("gate-iswap");
    const btnHTensorI = document.getElementById("gate-h-tensor-i");
    const btnITensorH = document.getElementById("gate-i-tensor-h");
    const btnXTensorI = document.getElementById("gate-x-tensor-i");
    const btnITensorX = document.getElementById("gate-i-tensor-x");
    const btnYTensorI = document.getElementById("gate-y-tensor-i");
    const btnITensorY = document.getElementById("gate-i-tensor-y");
    const btnZTensorI = document.getElementById("gate-z-tensor-i");
    const btnITensorZ = document.getElementById("gate-i-tensor-z");

    if (!matrixContainer || !btnCnot01 || !btnCnot10 || !btnCz || !btnISwap) return;

    // Set matrix values (array of complex numbers {re, im})
    function setMatrix(complexValues) {
        const sqrt2 = Math.sqrt(2);
        const oneOverSqrt2 = 1 / sqrt2;
        const tolerance = 1e-10; // For floating point comparison
        
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const idx = r * 4 + c;
                const val = complexValues[idx];

                const input = matrixContainer.querySelector(
                    `input[data-row="${r}"][data-col="${c}"]`
                );

                if (input) {
                    let reStr, imStr;
                    
                    // Check if real part is exactly 1/sqrt(2) or -1/sqrt(2)
                    if (Math.abs(Math.abs(val.re) - oneOverSqrt2) < tolerance) {
                        reStr = val.re > 0 ? "1/sqrt(2)" : "-1/sqrt(2)";
                    } else {
                        // Round to 4 decimals (matching LaTeX display)
                        const re = Math.round(val.re * 10000) / 10000;
                        reStr = re.toString();
                    }
                    
                    // Check if imaginary part is exactly 1/sqrt(2) or -1/sqrt(2)
                    if (Math.abs(Math.abs(val.im) - oneOverSqrt2) < tolerance) {
                        imStr = val.im > 0 ? "1/sqrt(2)" : "-1/sqrt(2)";
                    } else if (Math.abs(val.im) < tolerance) {
                        imStr = "0";
                    } else {
                        // Round to 4 decimals
                        const im = Math.round(val.im * 10000) / 10000;
                        imStr = im.toString();
                    }
                    
                    // Format as complex number string
                    if (imStr === "0") {
                        input.value = reStr;
                    } else {
                        // Check if we need to use symbolic form for imaginary part
                        if (Math.abs(Math.abs(val.im) - oneOverSqrt2) < tolerance) {
                            const imPart = val.im > 0 ? "+1/sqrt(2)i" : "-1/sqrt(2)i";
                            input.value = `${reStr}${imPart}`;
                        } else {
                            const imSign = val.im >= 0 ? "+" : "-";
                            const imValue = Math.abs(val.im);
                            const imPart = imValue === 1 ? "i" : `${imStr}i`;
                            input.value = `${reStr}${imSign}${imPart}`;
                        }
                    }
                }
            }
        }
    }

    // CNOT01: Control on qubit 0 (rightmost), target on qubit 1 (leftmost)
    // Basis order: |00>, |01>, |10>, |11>
    btnCnot01.addEventListener("click", async () => {
        const cnot01Values = [
            {re: 1, im: 0}, {re: 0, im: 0}, {re: 0, im: 0}, {re: 0, im: 0},
            {re: 0, im: 0}, {re: 0, im: 0}, {re: 0, im: 0}, {re: 1, im: 0},
            {re: 0, im: 0}, {re: 0, im: 0}, {re: 1, im: 0}, {re: 0, im: 0},
            {re: 0, im: 0}, {re: 1, im: 0}, {re: 0, im: 0}, {re: 0, im: 0}
        ];
        setMatrix(cnot01Values);
        await updateLatexDisplay();
    });

    // CNOT10: Control on qubit 1 (leftmost), target on qubit 0 (rightmost)
    // Basis order: |00>, |01>, |10>, |11>
    btnCnot10.addEventListener("click", async () => {
        const cnot10Values = [
            {re: 1, im: 0}, {re: 0, im: 0}, {re: 0, im: 0}, {re: 0, im: 0},
            {re: 0, im: 0}, {re: 1, im: 0}, {re: 0, im: 0}, {re: 0, im: 0},
            {re: 0, im: 0}, {re: 0, im: 0}, {re: 0, im: 0}, {re: 1, im: 0},
            {re: 0, im: 0}, {re: 0, im: 0}, {re: 1, im: 0}, {re: 0, im: 0}
        ];
        setMatrix(cnot10Values);
        await updateLatexDisplay();
    });

    // CZ button: set to controlled-Z matrix
    // Basis: |00>, |01>, |10>, |11>
    btnCz.addEventListener("click", async () => {
        const czValues = [
            {re: 1, im: 0}, {re: 0, im: 0}, {re: 0, im: 0}, {re: 0, im: 0},
            {re: 0, im: 0}, {re: 1, im: 0}, {re: 0, im: 0}, {re: 0, im: 0},
            {re: 0, im: 0}, {re: 0, im: 0}, {re: 1, im: 0}, {re: 0, im: 0},
            {re: 0, im: 0}, {re: 0, im: 0}, {re: 0, im: 0}, {re: -1, im: 0}
        ];
        setMatrix(czValues);
        await updateLatexDisplay();
    });

    // iSWAP button: quantum swap with phase
    // Basis: |00>, |01>, |10>, |11>
    btnISwap.addEventListener("click", async () => {
        const iswapValues = [
            {re: 1, im: 0}, {re: 0, im: 0}, {re: 0, im: 0}, {re: 0, im: 0},
            {re: 0, im: 0}, {re: 0, im: 0}, {re: 0, im: 1}, {re: 0, im: 0},
            {re: 0, im: 0}, {re: 0, im: 1}, {re: 0, im: 0}, {re: 0, im: 0},
            {re: 0, im: 0}, {re: 0, im: 0}, {re: 0, im: 0}, {re: 1, im: 0}
        ];
        setMatrix(iswapValues);
        await updateLatexDisplay();
    });

    // Helper function to compute tensor product of two 2x2 matrices
    // Returns a 4x4 matrix as an array of 16 complex numbers
    // A and B are 2x2 matrices represented as arrays: [a00, a01, a10, a11]
    // For A ⊗ B, result[i][j] = A[floor(i/2)][floor(j/2)] * B[i%2][j%2]
    function tensorProduct(A, B) {
        const result = [];
        // Iterate over 4x4 result matrix
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                // Map 4x4 indices to 2x2 indices
                const row_A = Math.floor(i / 2);
                const col_A = Math.floor(j / 2);
                const row_B = i % 2;
                const col_B = j % 2;
                
                // Get elements from A and B
                const a_ij = A[row_A * 2 + col_A];
                const b_kl = B[row_B * 2 + col_B];
                
                // Multiply complex numbers: (a_re + a_im*i) * (b_re + b_im*i)
                const re = a_ij.re * b_kl.re - a_ij.im * b_kl.im;
                const im = a_ij.re * b_kl.im + a_ij.im * b_kl.re;
                result.push({re, im});
            }
        }
        return result;
    }

    // Single qubit gates (2x2 matrices)
    const sqrt2 = Math.sqrt(2);
    const H = [
        {re: 1/sqrt2, im: 0}, {re: 1/sqrt2, im: 0},
        {re: 1/sqrt2, im: 0}, {re: -1/sqrt2, im: 0}
    ];
    const I = [
        {re: 1, im: 0}, {re: 0, im: 0},
        {re: 0, im: 0}, {re: 1, im: 0}
    ];
    const X = [
        {re: 0, im: 0}, {re: 1, im: 0},
        {re: 1, im: 0}, {re: 0, im: 0}
    ];
    const Y = [
        {re: 0, im: 0}, {re: 0, im: -1},
        {re: 0, im: 1}, {re: 0, im: 0}
    ];
    const Z = [
        {re: 1, im: 0}, {re: 0, im: 0},
        {re: 0, im: 0}, {re: -1, im: 0}
    ];

    // H ⊗ I
    if (btnHTensorI) {
        btnHTensorI.addEventListener("click", async () => {
            const values = tensorProduct(H, I);
            setMatrix(values);
            await updateLatexDisplay();
        });
    }

    // I ⊗ H
    if (btnITensorH) {
        btnITensorH.addEventListener("click", async () => {
            const values = tensorProduct(I, H);
            setMatrix(values);
            await updateLatexDisplay();
        });
    }

    // X ⊗ I
    if (btnXTensorI) {
        btnXTensorI.addEventListener("click", async () => {
            const values = tensorProduct(X, I);
            setMatrix(values);
            await updateLatexDisplay();
        });
    }

    // I ⊗ X
    if (btnITensorX) {
        btnITensorX.addEventListener("click", async () => {
            const values = tensorProduct(I, X);
            setMatrix(values);
            await updateLatexDisplay();
        });
    }

    // Y ⊗ I
    if (btnYTensorI) {
        btnYTensorI.addEventListener("click", async () => {
            const values = tensorProduct(Y, I);
            setMatrix(values);
            await updateLatexDisplay();
        });
    }

    // I ⊗ Y
    if (btnITensorY) {
        btnITensorY.addEventListener("click", async () => {
            const values = tensorProduct(I, Y);
            setMatrix(values);
            await updateLatexDisplay();
        });
    }

    // Z ⊗ I
    if (btnZTensorI) {
        btnZTensorI.addEventListener("click", async () => {
            const values = tensorProduct(Z, I);
            setMatrix(values);
            await updateLatexDisplay();
        });
    }

    // I ⊗ Z
    if (btnITensorZ) {
        btnITensorZ.addEventListener("click", async () => {
            const values = tensorProduct(I, Z);
            setMatrix(values);
            await updateLatexDisplay();
        });
    }
}

// =====================================================
// Math Expression Parser
// =====================================================

async function parseComplexExpression(expr) {
    if (!expr || expr.trim() === "") return { re: 0, im: 0, reLatex: "0", imLatex: "0", error: false };

    const raw = expr.trim();

    try {
        // Call Python backend to evaluate complex expression
        const response = await fetch('/evaluate_complex', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ expression: raw })
        });

        const data = await response.json();

        if (data.success) {
            return {
                re: data.real,
                im: data.imag,
                reLatex: data.latex || raw,
                imLatex: "",
                error: false
            };
        } else {
            console.error('Error evaluating expression:', data.error);
            // Return error state
            return { re: 0, im: 0, reLatex: "0", imLatex: "0", error: true };
        }
    } catch (error) {
        console.error('Error calling Python backend:', error);
        // Return error state
        return { re: 0, im: 0, reLatex: "0", imLatex: "0", error: true };
    }
}

function evaluateImaginaryExpression(expr) {
    // Handle expressions like: i, 2i, +3i, -4i, i*sqrt(2), i/sqrt(2), etc.
    let cleaned = expr.trim();

    // Remove leading +
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1).trim();
    }

    // Handle just "i" or "-i"
    if (cleaned === 'i') {
        return { value: 1, latex: "1" };
    }
    if (cleaned === '-i') {
        return { value: -1, latex: "-1" };
    }

    // Check if it starts with 'i' (like i*2, i/sqrt(2), i*sqrt(2))
    if (cleaned.startsWith('i') || cleaned.startsWith('-i')) {
        const negative = cleaned.startsWith('-i');
        const afterI = negative ? cleaned.substring(2).trim() : cleaned.substring(1).trim();

        if (!afterI) {
            // Just "i" or "-i"
            return { value: negative ? -1 : 1, latex: negative ? "-1" : "1" };
        }

        // If followed by operator (* or /), prepend 1 and evaluate
        // Examples: i*sqrt(2) → 1*sqrt(2), i/sqrt(2) → 1/sqrt(2)
        if (afterI.startsWith('*') || afterI.startsWith('/')) {
            const coeff = evaluateExpression('1' + afterI);
            return { value: negative ? -coeff.value : coeff.value, latex: coeff.latex };
        }

        // Otherwise, implicit multiplication: i2 → i*2
        const coeff = evaluateExpression(afterI);
        return { value: negative ? -coeff.value : coeff.value, latex: coeff.latex };
    }

    // Check if it ends with 'i' (like 2i, sqrt(2)i, sqrt(2)*i)
    if (cleaned.endsWith('i')) {
        cleaned = cleaned.substring(0, cleaned.length - 1).trim();

        // Remove trailing * if present (explicit multiplication like "2*i")
        if (cleaned.endsWith('*')) {
            cleaned = cleaned.substring(0, cleaned.length - 1).trim();
        }

        // If nothing left after removing i, it was just "i"
        if (!cleaned || cleaned === '+') {
            return { value: 1, latex: "1" };
        }
        if (cleaned === '-') {
            return { value: -1, latex: "-1" };
        }

        // Evaluate the coefficient
        return evaluateExpression(cleaned);
    }

    // No 'i' found - return 0
    return { value: 0, latex: "0" };
}

function evaluateExpression(expr) {
    if (!expr || expr.trim() === "") return { value: 0, latex: "0", raw: "", isComplex: false, im: 0 };

    const raw = expr.trim();

    try {
        // Check for e^(i*something) or e^(something*i) pattern - Euler's formula
        // Two cases: with outer parens e^(...) or without e^i...

        let angleExpr = null;

        // Case 1: e^(i*...) or e^(i...) - outer parentheses delimit the exponent
        const withParens1 = /^e\s*\^\s*\(\s*i\s*\*?\s*(.+)\s*\)$/i;
        const withParens2 = /^e\s*\^\s*\(\s*(.+)\s*\*\s*i\s*\)$/i;

        let match = raw.match(withParens1) || raw.match(withParens2);
        if (match) {
            angleExpr = match[1].trim();
        } else {
            // Case 2: e^i... without outer parens - only capture immediate term
            // Pattern matches: e^ipi, e^i*pi, e^i(pi/2), but NOT e^ipi+2
            // Stops at + or - operators at base level

            // Explicitly match e^i(...) - parenthesized angle
            const withParentheses = /^e\s*\^\s*i\s*\((.+)\)$/i;
            // Match e^i*term or e^iterm (simple terms only, no + or -)
            const withoutParentheses = /^e\s*\^\s*i\s*\*?\s*([a-z0-9.\/\*]+)$/i;
            // Reversed: term*i
            const reversed = /^e\s*\^\s*([a-z0-9.\/\*]+)\s*\*\s*i$/i;

            match = raw.match(withParentheses) || raw.match(withoutParentheses) || raw.match(reversed);
            if (match) {
                angleExpr = match[1].trim();
            }
        }

        if (angleExpr !== null) {
            if (!angleExpr) angleExpr = "1"; // e^i means e^(i*1)

            // Strip outer parentheses from angle if present (e.g., (pi/2) -> pi/2)
            if (angleExpr.startsWith('(') && angleExpr.endsWith(')')) {
                // Check if these are matching outer parens
                let depth = 0;
                let isOuter = true;
                for (let i = 0; i < angleExpr.length - 1; i++) {
                    if (angleExpr[i] === '(') depth++;
                    if (angleExpr[i] === ')') depth--;
                    if (depth === 0) {
                        isOuter = false;
                        break;
                    }
                }
                if (isOuter) {
                    angleExpr = angleExpr.slice(1, -1).trim();
                }
            }

            // Evaluate the angle as a real expression
            const angle = evaluateRealNumber(angleExpr);

            // Use Euler's formula: e^(i*theta) = cos(theta) + i*sin(theta)
            const re = Math.cos(angle);
            const im = Math.sin(angle);

            const latex = expressionToLatex(raw);

            return { value: re, latex, raw, isComplex: true, im };
        }

        // Otherwise evaluate as normal real expression
        const value = evaluateRealNumber(raw);
        const latex = expressionToLatex(raw);

        return { value, latex, raw, isComplex: false, im: 0 };
    } catch (e) {
        // If evaluation fails, try to parse as number
        const num = parseFloat(raw);
        if (!isNaN(num)) {
            return { value: num, latex: num.toString(), raw, isComplex: false, im: 0 };
        }
        return { value: 0, latex: "0", raw, isComplex: false, im: 0 };
    }
}

function evaluateRealNumber(expr) {
    // Add implicit multiplication
    let evalExpr = expr;

    // Number followed by letter/function (2pi, 3sqrt, etc.)
    evalExpr = evalExpr.replace(/(\d)([a-z])/gi, '$1*$2');

    // Number followed by opening parenthesis: 2(3) -> 2*(3)
    evalExpr = evalExpr.replace(/(\d)\(/g, '$1*(');

    // Closing parenthesis followed by opening: (2)(3) -> (2)*(3)
    evalExpr = evalExpr.replace(/\)\(/g, ')*(');

    // Closing parenthesis followed by number: (2)3 -> (2)*3
    evalExpr = evalExpr.replace(/\)(\d)/g, ')*$1');

    // Closing parenthesis followed by letter: (2)pi -> (2)*pi
    evalExpr = evalExpr.replace(/\)([a-z])/gi, ')*$1');

    // Replace common math symbols/functions for eval
    evalExpr = evalExpr
        .replace(/\bpi\b/gi, 'Math.PI')
        .replace(/\be\b/gi, 'Math.E')
        .replace(/sqrt\s*\(/gi, 'Math.sqrt(')
        .replace(/sin\s*\(/gi, 'Math.sin(')
        .replace(/cos\s*\(/gi, 'Math.cos(')
        .replace(/tan\s*\(/gi, 'Math.tan(')
        .replace(/abs\s*\(/gi, 'Math.abs(')
        .replace(/\^/g, '**'); // Handle power operator

    // Evaluate safely
    return Function('"use strict"; return (' + evalExpr + ')')();
}

function expressionToLatex(expr) {
    let latex = expr;

    // Convert e^(i*something) patterns - handle parentheses carefully
    // With outer parens: e^(i*pi) - capture everything inside
    latex = latex.replace(/e\s*\^\s*\(\s*i\s*\*?\s*(.+)\s*\)/gi, (match, angle) => {
        if (!angle) angle = "1";
        let angleClean = angle.trim();

        // Strip outer parentheses if present
        if (angleClean.startsWith('(') && angleClean.endsWith(')')) {
            let depth = 0;
            let isOuter = true;
            for (let i = 0; i < angleClean.length - 1; i++) {
                if (angleClean[i] === '(') depth++;
                if (angleClean[i] === ')') depth--;
                if (depth === 0) {
                    isOuter = false;
                    break;
                }
            }
            if (isOuter) {
                angleClean = angleClean.slice(1, -1).trim();
            }
        }

        const angleLatex = expressionToLatexInner(angleClean);
        return `e^{i${angleLatex ? '\\,' + angleLatex : ''}}`;
    });

    // e^i(...) format - parenthesized angle
    latex = latex.replace(/e\s*\^\s*i\s*\((.+?)\)/gi, (match, angle) => {
        const angleLatex = expressionToLatexInner(angle.trim());
        return `e^{i${angleLatex ? '\\,' + angleLatex : ''}}`;
    });

    // Without parens: e^ipi or e^i*pi - simple terms only
    latex = latex.replace(/e\s*\^\s*i\s*\*?\s*([a-z0-9.\/\*]+)/gi, (match, angle) => {
        const angleLatex = expressionToLatexInner(angle.trim());
        return `e^{i${angleLatex ? '\\,' + angleLatex : ''}}`;
    });

    // Reversed order: e^(pi*i)
    latex = latex.replace(/e\s*\^\s*\(\s*(.+)\s*\*\s*i\s*\)/gi, (match, angle) => {
        const angleLatex = expressionToLatexInner(angle.trim());
        return `e^{i${angleLatex ? '\\,' + angleLatex : ''}}`;
    });

    return expressionToLatexInner(latex);
}

function expressionToLatexInner(expr) {
    let latex = expr;

    // Convert sqrt() to \sqrt{}
    latex = latex.replace(/sqrt\s*\(([^)]+)\)/gi, '\\sqrt{$1}');

    // Convert fractions a/b to \frac{a}{b} (simple cases)
    latex = latex.replace(/([0-9.]+)\s*\/\s*([0-9.]+)/g, '\\frac{$1}{$2}');
    latex = latex.replace(/([0-9.]+)\s*\/\s*sqrt\s*\(([^)]+)\)/gi, '\\frac{$1}{\\sqrt{$2}}');
    latex = latex.replace(/sqrt\s*\(([^)]+)\)\s*\/\s*([0-9.]+)/gi, '\\frac{\\sqrt{$1}}{$2}');

    // Convert pi to \pi (handle implicit multiplication like 2pi)
    // Match pi that's either standalone or preceded by non-letter characters
    latex = latex.replace(/(?<![a-z])pi(?![a-z])/gi, '\\pi');

    // Convert e to e (or could use \mathrm{e})
    latex = latex.replace(/(?<![a-z])e(?![a-z])/gi, 'e');

    // Convert trig functions
    latex = latex.replace(/sin\s*\(([^)]+)\)/gi, '\\sin($1)');
    latex = latex.replace(/cos\s*\(([^)]+)\)/gi, '\\cos($1)');
    latex = latex.replace(/tan\s*\(([^)]+)\)/gi, '\\tan($1)');

    // Convert power operator
    latex = latex.replace(/\^/g, '^');

    return latex;
}

// =====================================================
// LaTeX Matrix Display
// =====================================================

function formatComplexLatex(re, im) {
    // Helper function to format complex numbers as LaTeX
    if (re === 0 && im === 0) {
        return "0";
    } else if (im === 0) {
        return re.toString();
    } else if (re === 0) {
        if (im === 1) return "i";
        if (im === -1) return "-i";
        return `${im}\\,i`;
    } else {
        const imSign = im >= 0 ? "+" : "";
        const imAbs = Math.abs(im);
        const imPart = imAbs === 1 ? "i" : `${imAbs}\\,i`;
        return `${re}${imSign}${im < 0 ? "-" : ""}${imPart}`;
    }
}

let displayMode = "symbols"; // "symbols" or "values"

async function updateLatexDisplay() {
    const matrixContainer = document.getElementById("custom-matrix");
    const latexDisplay = document.getElementById("latex-display");
    const errorDisplay = document.getElementById("matrix-error");

    if (!matrixContainer || !latexDisplay) return;

    // Track if any errors occurred
    let hasError = false;

    // Collect all matrix values
    const matrix = [];
    for (let r = 0; r < 4; r++) {
        const row = [];
        for (let c = 0; c < 4; c++) {
            const input = matrixContainer.querySelector(
                `input[data-row="${r}"][data-col="${c}"]`
            );

            // Parse complex expression from single input
            const parsed = await parseComplexExpression(input?.value || "0+0i");

            // Check for errors
            if (parsed.error) {
                hasError = true;
            }

            // Format complex number for LaTeX
            let entry = "";

            if (displayMode === "symbols") {
                // Use LaTeX from backend (already properly formatted)
                if (parsed.reLatex) {
                    entry = parsed.reLatex;
                } else if (parsed.re === 0 && parsed.im === 0) {
                    entry = "0";
                } else {
                    // Fallback: construct from real/imag parts
                    entry = formatComplexLatex(parsed.re, parsed.im);
                }
            } else {
                // Use numeric values (rounded to 4 decimals)
                const re = Math.round(parsed.re * 10000) / 10000;
                const im = Math.round(parsed.im * 10000) / 10000;

                if (re === 0 && im === 0) {
                    entry = "0";
                } else if (im === 0) {
                    entry = re.toString();
                } else if (re === 0) {
                    entry = im === 1 ? "i" : im === -1 ? "-i" : `${im}i`;
                } else {
                    const imSign = im >= 0 ? "+" : "";
                    const imPart = Math.abs(im) === 1 ? "i" : `${Math.abs(im)}i`;
                    entry = `${re}${imSign}${im < 0 ? "-" : ""}${imPart}`;
                }
            }

            row.push(entry);
        }
        matrix.push(row);
    }

    // Show/hide error message
    if (errorDisplay) {
        errorDisplay.style.display = hasError ? "block" : "none";
    }

    // Build LaTeX string
    const latexRows = matrix.map(row => row.join(" & ")).join(" \\\\ ");
    const latex = `\\begin{bmatrix} ${latexRows} \\end{bmatrix}`;

    // Update display
    latexDisplay.innerHTML = `$$${latex}$$`;

    // Re-render MathJax
    if (window.MathJax) {
        MathJax.typesetPromise([latexDisplay]).catch((err) => console.error(err));
    }
}

function initLatexDisplay() {
    const matrixContainer = document.getElementById("custom-matrix");
    if (!matrixContainer) return;

    // Update on any input change
    const allInputs = matrixContainer.querySelectorAll('input[type="text"]');
    allInputs.forEach(input => {
        input.addEventListener("input", async () => {
            await updateLatexDisplay();
        });
    });

    // Handle display mode toggle buttons
    const btnSymbols = document.getElementById("display-symbols");
    const btnValues = document.getElementById("display-values");

    if (btnSymbols && btnValues) {
        btnSymbols.addEventListener("click", async () => {
            displayMode = "symbols";
            btnSymbols.classList.add("active");
            btnValues.classList.remove("active");
            await updateLatexDisplay();
        });

        btnValues.addEventListener("click", async () => {
            displayMode = "values";
            btnValues.classList.add("active");
            btnSymbols.classList.remove("active");
            await updateLatexDisplay();
        });
    }

    // Initial render
    updateLatexDisplay();
}

// =====================================================
// Main Tab Switching (Operations / Quantum Gates / Initialize State / Bloch Sphere View)
// =====================================================

function initMainTabs() {
    const tabs = document.querySelectorAll(".main-tab");
    const panels = [
        document.getElementById("operations-panel-left"),
        document.getElementById("gate-matrix-panel"),
        document.getElementById("state-info-panel"),
        document.getElementById("bloch-view-panel")
    ];

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove("active"));

            // Hide all panels
            panels.forEach(p => p?.classList.add("hidden"));

            // Activate clicked tab + show its panel
            tab.classList.add("active");
            const targetPanel = document.getElementById(tab.dataset.target);
            targetPanel?.classList.remove("hidden");
        });
    });
}

// =====================================================
// State Tabs (Complex Vector / Full 2-Qubit State)
// =====================================================

function initStateTabs() {
    const stateTabs = document.querySelectorAll(".state-tab");
    const statePanels = [
        document.getElementById("state-vector"),
        document.getElementById("state-full")
    ];

    stateTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            // Remove active from all state tabs
            stateTabs.forEach(t => t.classList.remove("active"));

            // Hide all state panels
            statePanels.forEach(p => p?.classList.add("hidden"));

            // Activate clicked tab + show its panel
            tab.classList.add("active");
            const targetPanel = document.getElementById(tab.dataset.target);
            targetPanel?.classList.remove("hidden");
        });
    });
}

// =====================================================
// Decompose Button
// =====================================================

async function initDecompose() {
    const decomposeBtn = document.getElementById("gate-decompose");
    const matrixContainer = document.getElementById("custom-matrix");

    if (!decomposeBtn || !matrixContainer) return;

    decomposeBtn.addEventListener("click", async () => {
        // First, check if any expressions have errors
        let hasError = false;
        const matrix = [];

        for (let r = 0; r < 4; r++) {
            const row = [];
            for (let c = 0; c < 4; c++) {
                const input = matrixContainer.querySelector(
                    `input[data-row="${r}"][data-col="${c}"]`
                );

                const expr = input?.value || "0";
                row.push(expr);

                // Validate expression
                const parsed = await parseComplexExpression(expr);
                if (parsed.error) {
                    hasError = true;
                }
            }
            matrix.push(row);
        }

        // If there are errors, show alert and don't proceed
        if (hasError) {
            alert("Invalid Expression in Matrix");
            return;
        }

        // Get frequency parameters from the UI
        const q1DriveFreqInput = document.getElementById('q1-drive-freq');
        const q0DriveFreqInput = document.getElementById('q0-drive-freq');
        const rabiFreqInput = document.getElementById('rabi-freq');
        
        const rabi_frequency = rabiFreqInput?.dataset.value ? parseFloat(rabiFreqInput.dataset.value) : 20e6;
        const q0drive_freq = q0DriveFreqInput?.dataset.value ? parseFloat(q0DriveFreqInput.dataset.value) : 5.3e9;
        const q1drive_freq = q1DriveFreqInput?.dataset.value ? parseFloat(q1DriveFreqInput.dataset.value) : 5e9;
        
        // Get current state vector if available
        const state_vector = currentStateVector?.coefficients || null;

        // Send to backend
        try {
            const response = await fetch('/decompose', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    matrix,
                    rabi_frequency,
                    q0drive_freq,
                    q1drive_freq,
                    state_vector
                })
            });

            const data = await response.json();
            console.log('Decompose response:', data);

            // Check if matrix is unitary or if there was an error
            if (!response.ok || !data.success) {
                // Matrix is not unitary or other error occurred
                const errorMessage = data.error || 'Matrix is not unitary';
                alert(`Error: ${errorMessage}`);
                return; // Stop processing
            }
            
            // Matrix is unitary - continue with decomposition
            console.log('Matrix is unitary:', data.message);
            
            // Append new instructions to the global list
            if (data.instructions && Array.isArray(data.instructions)) {
                physicalInstructions.push(...data.instructions);
                updateOperationsDisplay();
                alert("Matrix has been decomposed and inputted into the Operations tab");
            }

        } catch (error) {
            console.error('Error calling decompose:', error);
            alert('Error: Failed to check matrix unitarity');
        }
    });
}

// =====================================================
// Panel Resize
// =====================================================

function initPanelResize() {
    const controlsResizeHandle = document.getElementById("controls-resize");
    const detailsResizeHandle = document.getElementById("details-resize");
    const controlsPanel = document.getElementById("controls-panel");
    const blochPanel = document.getElementById("bloch-sphere-panel");
    const detailsPanel = document.getElementById("details-panel");
    const blochContainer = document.getElementById("bloch-container");

    if (!controlsPanel || !blochPanel || !detailsPanel) return;

    let isResizing = false;
    let resizingSide = null; // 'left' or 'right'
    let startX = 0;
    let startControlsWidth = 0;
    let startDetailsWidth = 0;
    let startBlochWidth = 0;

    // Use a fixed baseline width for scaling calculations
    // This represents the "ideal" width when flex was 2 with side panels at 0.8
    const originalBlochWidth = 1000; // Fixed reference width
    const originalBlochHeight = 450;

    // Left panel resize (controls)
    if (controlsResizeHandle) {
        controlsResizeHandle.addEventListener("mousedown", (e) => {
            isResizing = true;
            resizingSide = 'left';
            startX = e.clientX;
            startControlsWidth = controlsPanel.offsetWidth;
            startBlochWidth = blochPanel.offsetWidth;

            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";

            e.preventDefault();
        });
    }

    // Right panel resize (details)
    if (detailsResizeHandle) {
        detailsResizeHandle.addEventListener("mousedown", (e) => {
            isResizing = true;
            resizingSide = 'right';
            startX = e.clientX;
            startDetailsWidth = detailsPanel.offsetWidth;
            startBlochWidth = blochPanel.offsetWidth;

            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";

            e.preventDefault();
        });
    }

    document.addEventListener("mousemove", (e) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startX;

        if (resizingSide === 'left') {
            const newControlsWidth = startControlsWidth + deltaX;
            const newBlochWidth = startBlochWidth - deltaX;

            if (newControlsWidth > 200 && newBlochWidth > 400) {
                controlsPanel.style.flex = "none";
                controlsPanel.style.width = `${newControlsWidth}px`;

                blochPanel.style.flex = "none";
                blochPanel.style.width = `${newBlochWidth}px`;

                // Let details panel keep its flex to fill remaining space
                detailsPanel.style.flex = "1";
                detailsPanel.style.width = "";

                scaleBlochSpheres(newBlochWidth);
            }
        } else if (resizingSide === 'right') {
            const newDetailsWidth = startDetailsWidth - deltaX;
            const newBlochWidth = startBlochWidth + deltaX;

            if (newDetailsWidth > 200 && newBlochWidth > 400) {
                // Let controls panel keep its flex to fill remaining space
                controlsPanel.style.flex = "1";
                controlsPanel.style.width = "";

                blochPanel.style.flex = "none";
                blochPanel.style.width = `${newBlochWidth}px`;

                detailsPanel.style.flex = "none";
                detailsPanel.style.width = `${newDetailsWidth}px`;

                scaleBlochSpheres(newBlochWidth);
            }
        }
    });

    document.addEventListener("mouseup", () => {
        if (isResizing) {
            isResizing = false;
            resizingSide = null;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    });

    // Removed old scaling logic - Bloch spheres now handle their own sizing
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Bloch spheres
    createBlochSphere("bloch-sphere-0", "cam-phi-0", "cam-theta-0");
    createBlochSphere("bloch-sphere-1", "cam-phi-1", "cam-theta-1");

    // Arrow controls for Bloch spheres
    document.querySelectorAll('.bloch-arrow-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const qubit = btn.dataset.qubit;
            const direction = btn.dataset.direction;
            const phiSlider = document.getElementById(`cam-phi-${qubit}`);
            const thetaSlider = document.getElementById(`cam-theta-${qubit}`);
            
            const increment = 5; // degrees
            
            if (direction === 'up') {
                // Increase theta (move camera up)
                const newValue = Math.min(180, parseInt(thetaSlider.value) + increment);
                thetaSlider.value = newValue;
                thetaSlider.dispatchEvent(new Event('input'));
            } else if (direction === 'down') {
                // Decrease theta (move camera down)
                const newValue = Math.max(0, parseInt(thetaSlider.value) - increment);
                thetaSlider.value = newValue;
                thetaSlider.dispatchEvent(new Event('input'));
            } else if (direction === 'left') {
                // Decrease phi (rotate left)
                const newValue = Math.max(0, parseInt(phiSlider.value) - increment);
                phiSlider.value = newValue;
                phiSlider.dispatchEvent(new Event('input'));
            } else if (direction === 'right') {
                // Increase phi (rotate right)
                const newValue = Math.min(360, parseInt(phiSlider.value) + increment);
                phiSlider.value = newValue;
                phiSlider.dispatchEvent(new Event('input'));
            }
        });
    });

    initGateMatrix();
    initLatexDisplay();
    initMainTabs();
    initStateTabs();
    initDecompose();
    initPanelResize();
    initApplyState();
    initMeasureButtons();
    
    // Initialize state to |00⟩ = [1, 0, 0, 0]
    initializeDefaultState();
    
    // Initialize frequency displays
    initializeFrequencies();
    
    // Initialize operations display
    updateOperationsDisplay();
});

// =====================================================
// Initialize Default State
// =====================================================

function initializeDefaultState() {
    // Create initial state |00⟩ = [1, 0, 0, 0]
    const initialState = {
        success: true,
        coefficients: [
            { re: 1, im: 0 },  // c1 = |00⟩
            { re: 0, im: 0 },  // c2 = |01⟩
            { re: 0, im: 0 },  // c3 = |10⟩
            { re: 0, im: 0 }   // c4 = |11⟩
        ],
        probabilities: [1, 0, 0, 0],
        is_separable: true,
        bloch_qubit1: [0, 0, 1],  // |0⟩ state
        bloch_qubit0: [0, 0, 1],  // |0⟩ state
        qubit1_state: {
            alpha: { re: 1, im: 0 },
            beta: { re: 0, im: 0 }
        },
        qubit0_state: {
            gamma: { re: 1, im: 0 },
            delta: { re: 0, im: 0 }
        }
    };
    
    // Store globally
    currentStateVector = initialState;
    
    // Update UI
    updateQuantumState(initialState);
}

// =====================================================
// Initialize Frequency Displays
// =====================================================

function initializeFrequencies() {
    // Q1 Drive Freq: 5e9 Hz -> display as 5.0 GHz
    const q1DriveFreq = 5e9;
    const q1Display = (q1DriveFreq / 1e9).toFixed(1) + ' GHz';
    const q1Input = document.getElementById('q1-drive-freq');
    if (q1Input) {
        q1Input.value = q1Display;
        q1Input.dataset.value = q1DriveFreq; // Store actual value
    }
    
    // Q0 Drive Freq: 5.3e9 Hz -> display as 5.3 GHz
    const q0DriveFreq = 5.3e9;
    const q0Display = (q0DriveFreq / 1e9).toFixed(1) + ' GHz';
    const q0Input = document.getElementById('q0-drive-freq');
    if (q0Input) {
        q0Input.value = q0Display;
        q0Input.dataset.value = q0DriveFreq; // Store actual value
    }
    
    // Rabi Freq: 20e6 Hz -> display as 20.0 MHz
    const rabiFreq = 20e6;
    const rabiDisplay = (rabiFreq / 1e6).toFixed(1) + ' MHz';
    const rabiInput = document.getElementById('rabi-freq');
    if (rabiInput) {
        rabiInput.value = rabiDisplay;
        rabiInput.dataset.value = rabiFreq; // Store actual value
    }
    
    // Store original frequencies for restoration
    window.originalQ1DriveFreq = q1Display;
    window.originalQ0DriveFreq = q0Display;
}

// =====================================================
// Apply State Button Handler
// =====================================================

// Global state vector storage
let currentStateVector = null;

// Global physical instructions storage (sequential list of all operations)
let physicalInstructions = [];

function initApplyState() {
    const applyBtn = document.getElementById('apply-state-btn');
    if (!applyBtn) return;
    
    applyBtn.addEventListener('click', async () => {
        // Determine which tab is active
        const activeTab = document.querySelector('.state-tab.active');
        if (!activeTab) return;
        
        const mode = activeTab.dataset.target === 'state-vector' ? 'vector' : 'full';
        let expressions = [];
        
        if (mode === 'vector') {
            // Get values from vector inputs
            expressions = [
                document.getElementById('vec-00')?.value || '0',
                document.getElementById('vec-01')?.value || '0',
                document.getElementById('vec-10')?.value || '0',
                document.getElementById('vec-11')?.value || '0'
            ];
        } else {
            // Get values from full 2-qubit state inputs
            expressions = [
                document.getElementById('alpha')?.value || '1',
                document.getElementById('beta')?.value || '0',
                document.getElementById('gamma')?.value || '1',
                document.getElementById('delta')?.value || '0'
            ];
        }
        
        try {
            const response = await fetch('/decompose_state', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expressions: expressions,
                    mode: mode
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store the state vector globally
                currentStateVector = data;
                
                // Update the UI
                updateQuantumState(data);
            } else {
                console.error('Error:', data.error);
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error applying state:', error);
            alert('Error applying state: ' + error.message);
        }
    });
}

// =====================================================
// Measure Button Handlers
// =====================================================

function initMeasureButtons() {
    // Measure button for Qubit 1
    const measureBtn1 = document.getElementById('measure-btn-1');
    if (measureBtn1) {
        measureBtn1.addEventListener('click', async () => {
            await measureQubit(1);
        });
    }
    
    // Measure button for Qubit 0
    const measureBtn0 = document.getElementById('measure-btn-0');
    if (measureBtn0) {
        measureBtn0.addEventListener('click', async () => {
            await measureQubit(0);
        });
    }
}

async function measureQubit(qubitIndex) {
    try {
        // Check if we have a current state vector
        if (!currentStateVector || !currentStateVector.coefficients) {
            alert('Please apply a state first before measuring.');
            return;
        }
        
        const response = await fetch('/measure_qubit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                qubit_index: qubitIndex,
                state_vector: currentStateVector.coefficients
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store the new state vector globally
            currentStateVector = data;
            
            // Update the UI with the collapsed state (silently)
            updateQuantumState(data);
        } else {
            console.error('Error:', data.error);
            alert('Error measuring qubit: ' + data.error);
        }
    } catch (error) {
        console.error('Error measuring qubit:', error);
        alert('Error measuring qubit: ' + error.message);
    }
}

// =====================================================
// Update Quantum State Display
// =====================================================

function updateQuantumState(data) {
    // Update coefficient values (the 2x2 grid SVGs)
    const coefficients = data.coefficients;
    updateCoefficientValues(coefficients);
    
    // Update measurement probabilities
    const probabilities = data.probabilities;
    updateMeasurementProbabilities(probabilities);
    
    // Update quantum state display text
    updateStateVectorDisplay(coefficients);
    
    // Update Bloch spheres (handles both separable and non-separable)
    updateBlochSpheres(
        data.is_separable && data.bloch_qubit1 ? data.bloch_qubit1 : null,
        data.is_separable && data.bloch_qubit0 ? data.bloch_qubit0 : null,
        data.is_separable && data.qubit1_state ? data.qubit1_state : null,
        data.is_separable && data.qubit0_state ? data.qubit0_state : null,
        data.is_separable
    );
}

function updateStateVectorDisplay(coefficients) {
    // Format coefficients for display
    const formatComplex = (c) => {
        const re = c.re.toFixed(3);
        const im = c.im >= 0 ? `+${c.im.toFixed(3)}i` : `${c.im.toFixed(3)}i`;
        if (Math.abs(c.re) < 1e-6) return im;
        if (Math.abs(c.im) < 1e-6) return re;
        return `${re}${im}`;
    };
    
    const display = document.getElementById('quantum-state-display');
    if (display) {
        const c1 = formatComplex(coefficients[0]);
        const c2 = formatComplex(coefficients[1]);
        const c3 = formatComplex(coefficients[2]);
        const c4 = formatComplex(coefficients[3]);
        
        // Wrap complex numbers in parentheses for proper LaTeX multiplication
        const wrapComplex = (c) => {
            // Always wrap in parentheses to ensure proper multiplication with basis states
            // This handles complex numbers, negative numbers, and expressions with operators
            return `(${c})`;
        };
        
        display.innerHTML = `$$|\\psi\\rangle = ${wrapComplex(c1)}|00\\rangle + ${wrapComplex(c2)}|01\\rangle + ${wrapComplex(c3)}|10\\rangle + ${wrapComplex(c4)}|11\\rangle$$`;
        
        // Trigger MathJax to re-render
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([display]).catch((err) => console.error('MathJax error:', err));
        }
    }
}

function updateCoefficientValues(coefficients) {
    // Update the SVG visualizations for each coefficient
    // coefficients = [c1, c2, c3, c4] corresponding to |00⟩, |01⟩, |10⟩, |11⟩
    const states = ['00', '01', '10', '11'];
    
    states.forEach((state, index) => {
        const c = coefficients[index];
        const magnitude = Math.min(1.0, Math.sqrt(c.re * c.re + c.im * c.im)); // Clamp to 1
        const angle = Math.atan2(c.im, c.re);
        
        // Update SVG visualization
        const line = document.getElementById(`vec-${state}-line`);
        const point = document.getElementById(`vec-${state}-pt`);
        
        if (line && point) {
            const center = 40;
            const radius = 32;
            const x = center + magnitude * radius * Math.cos(angle);
            const y = center - magnitude * radius * Math.sin(angle);
            
            line.setAttribute('x2', x);
            line.setAttribute('y2', y);
            point.setAttribute('cx', x);
            point.setAttribute('cy', y);
        }
    });
}

function updateMeasurementProbabilities(probabilities) {
    // Update probability bars
    const states = ['00', '01', '10', '11'];
    
    states.forEach((state, index) => {
        const prob = probabilities[index];
        const fill = document.getElementById(`prob-${state}`);
        if (fill) {
            fill.style.width = `${prob * 100}%`;
        }
    });
}

function updateBlochSpheres(bloch1, bloch0, qubit1State, qubit0State, isSeparable) {
    // Update Bloch sphere for qubit 1
    const container1 = document.getElementById('bloch-sphere-1');
    if (container1 && container1.updateBloch) {
        if (isSeparable && bloch1) {
            // Transform from quantum convention [x, y, z] to THREE.js convention [x, z, -y]
            const vec1 = new THREE.Vector3(bloch1[0], bloch1[2], -bloch1[1]);
            container1.updateBloch(vec1, true);
        } else {
            // Non-separable: show sphere, hide arrow
            container1.updateBloch(null, false);
        }
    }
    
    // Update Bloch sphere for qubit 0
    const container0 = document.getElementById('bloch-sphere-0');
    if (container0 && container0.updateBloch) {
        if (isSeparable && bloch0) {
            const vec0 = new THREE.Vector3(bloch0[0], bloch0[2], -bloch0[1]);
            container0.updateBloch(vec0, true);
        } else {
            // Non-separable: show sphere, hide arrow
            container0.updateBloch(null, false);
        }
    }
    
    // Update the alpha/beta and gamma/delta displays
    const alpha1Input = document.getElementById('alpha-1');
    const beta1Input = document.getElementById('beta-1');
    const gamma0Input = document.getElementById('gamma-0');
    const delta0Input = document.getElementById('delta-0');
    
    if (isSeparable && qubit1State) {
        if (alpha1Input) {
            const alpha = qubit1State.alpha;
            alpha1Input.value = formatComplexString(alpha.re, alpha.im);
        }
        if (beta1Input) {
            const beta = qubit1State.beta;
            beta1Input.value = formatComplexString(beta.re, beta.im);
        }
    } else {
        // Non-separable: show "unseparable"
        if (alpha1Input) alpha1Input.value = "unseparable";
        if (beta1Input) beta1Input.value = "unseparable";
    }
    
    if (isSeparable && qubit0State) {
        if (gamma0Input) {
            const gamma = qubit0State.gamma;
            gamma0Input.value = formatComplexString(gamma.re, gamma.im);
        }
        if (delta0Input) {
            const delta = qubit0State.delta;
            delta0Input.value = formatComplexString(delta.re, delta.im);
        }
    } else {
        // Non-separable: show "unseparable"
        if (gamma0Input) gamma0Input.value = "unseparable";
        if (delta0Input) delta0Input.value = "unseparable";
    }
}

function formatComplexString(re, im) {
    if (Math.abs(im) < 1e-6) {
        return re.toFixed(4);
    } else if (Math.abs(re) < 1e-6) {
        return im >= 0 ? `${im.toFixed(4)}i` : `${im.toFixed(4)}i`;
    } else {
        return im >= 0 ? `${re.toFixed(4)}+${im.toFixed(4)}i` : `${re.toFixed(4)}${im.toFixed(4)}i`;
    }
}

// =====================================================
// Operations Display
// =====================================================

function updateOperationsDisplay() {
    const operationsList = document.getElementById('operations-list');
    if (!operationsList) return;
    
    // Clear existing content
    operationsList.innerHTML = '';
    
    if (physicalInstructions.length === 0) {
        operationsList.innerHTML = '<div style="color: #999; font-style: italic; padding: 1rem; text-align: center;">No operations yet. Decompose a gate to see physical instructions.</div>';
        return;
    }
    
    // Display each instruction
    physicalInstructions.forEach((instr, index) => {
        const instructionDiv = document.createElement('div');
        instructionDiv.style.cssText = 'border: 1px solid #ddd; border-radius: 6px; overflow: hidden; background: white; margin-bottom: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
        
        // Title tab (header)
        const titleTab = document.createElement('div');
        titleTab.style.cssText = 'background: #3498db; color: white; padding: 0.6rem 0.9rem; font-weight: 600; font-size: 0.8rem; border-bottom: 2px solid #2980b9;';
        titleTab.textContent = `${index + 1}. ${instr.title}`;
        instructionDiv.appendChild(titleTab);
        
        // Main content area
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = 'padding: 0.9rem;';
        
        // Instruction string with More button
        const instructionRow = document.createElement('div');
        instructionRow.style.cssText = 'display: flex; align-items: flex-start; gap: 0.75rem;';
        
        const instructionStringDiv = document.createElement('div');
        instructionStringDiv.style.cssText = 'flex: 1; font-size: 0.9rem; color: #333; line-height: 1.5;';
        instructionStringDiv.textContent = instr.instruction_string;
        instructionRow.appendChild(instructionStringDiv);
        
        // More button
        const moreButton = document.createElement('button');
        moreButton.textContent = 'More';
        moreButton.style.cssText = 'padding: 0.4rem 0.8rem; font-size: 0.8rem; background: #ecf0f1; color: #2c3e50; border: 1px solid #bdc3c7; border-radius: 4px; cursor: pointer; white-space: nowrap; transition: all 0.2s;';
        moreButton.addEventListener('mouseenter', () => {
            moreButton.style.background = '#d5dbdb';
        });
        moreButton.addEventListener('mouseleave', () => {
            if (!moreButton.dataset.expanded) {
                moreButton.style.background = '#ecf0f1';
            }
        });
        
        // Split details string at <split> token
        let defaultDetails = '';
        let expandableDetails = '';
        if (instr.details && instr.details.includes('<split>')) {
            const parts = instr.details.split('<split>');
            defaultDetails = parts[0].trim();
            expandableDetails = parts.length > 1 ? parts[1].trim() : '';
        } else {
            // If no split token, show all in expandable section
            expandableDetails = instr.details || '';
        }
        
        // Default details section (always shown if exists)
        let defaultDetailsDiv = null;
        if (defaultDetails) {
            defaultDetailsDiv = document.createElement('div');
            defaultDetailsDiv.style.cssText = 'margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #ecf0f1; font-size: 0.85rem; color: #555; line-height: 1.6; white-space: pre-wrap;';
            defaultDetailsDiv.textContent = defaultDetails;
        }
        
        // Expandable details section (initially hidden)
        const detailsDiv = document.createElement('div');
        detailsDiv.style.cssText = 'display: none; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #ecf0f1; font-size: 0.85rem; color: #555; line-height: 1.6; white-space: pre-wrap;';
        detailsDiv.textContent = expandableDetails;
        
        // Toggle details on More button click (only if expandable details exist)
        if (expandableDetails) {
            moreButton.addEventListener('click', () => {
                const isExpanded = detailsDiv.style.display !== 'none';
                if (isExpanded) {
                    detailsDiv.style.display = 'none';
                    moreButton.textContent = 'More';
                    moreButton.style.background = '#ecf0f1';
                    moreButton.style.color = '#2c3e50';
                    moreButton.style.borderColor = '#bdc3c7';
                    moreButton.dataset.expanded = 'false';
                } else {
                    detailsDiv.style.display = 'block';
                    moreButton.textContent = 'Less';
                    moreButton.style.background = '#3498db';
                    moreButton.style.color = 'white';
                    moreButton.style.borderColor = '#2980b9';
                    moreButton.dataset.expanded = 'true';
                }
            });
            moreButton.dataset.expanded = 'false';
        }
        
        instructionRow.appendChild(moreButton);
        contentDiv.appendChild(instructionRow);
        
        // Add default details if they exist
        if (defaultDetailsDiv) {
            contentDiv.appendChild(defaultDetailsDiv);
        }
        
        // Only add expandable details if there's content and show More button only if there are expandable details
        if (expandableDetails) {
            contentDiv.appendChild(detailsDiv);
        } else {
            // Hide More button if there are no expandable details
            moreButton.style.display = 'none';
        }
        
        // Action buttons row (Delete and Execute)
        const actionRow = document.createElement('div');
        actionRow.style.cssText = 'display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #ecf0f1;';
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.style.cssText = 'padding: 0.4rem 0.8rem; font-size: 0.8rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;';
        deleteButton.addEventListener('mouseenter', () => {
            deleteButton.style.background = '#c0392b';
        });
        deleteButton.addEventListener('mouseleave', () => {
            deleteButton.style.background = '#e74c3c';
        });
        deleteButton.addEventListener('click', () => {
            // Remove instruction from array using the index from forEach
            // We re-render immediately so indices will be correct
            physicalInstructions.splice(index, 1);
            // Re-render the display
            updateOperationsDisplay();
        });
        actionRow.appendChild(deleteButton);
        
        // Execute button
        const executeButton = document.createElement('button');
        executeButton.textContent = 'Execute';
        executeButton.style.cssText = 'padding: 0.4rem 0.8rem; font-size: 0.8rem; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;';
        executeButton.addEventListener('mouseenter', () => {
            executeButton.style.background = '#229954';
        });
        executeButton.addEventListener('mouseleave', () => {
            executeButton.style.background = '#27ae60';
        });
        executeButton.addEventListener('click', async () => {
            await executeInstruction(instr, index);
        });
        actionRow.appendChild(executeButton);
        
        contentDiv.appendChild(actionRow);
        instructionDiv.appendChild(contentDiv);
        
        operationsList.appendChild(instructionDiv);
    });
}

// =====================================================
// Execute Instruction
// =====================================================

// Global variable to track last executed operation
let lastExecutedOperation = null;

async function executeInstruction(instruction, instructionIndex) {
    try {
        // Check if we have a current state vector
        if (!currentStateVector || !currentStateVector.coefficients) {
            alert('Please apply a state first before executing an instruction.');
            return;
        }
        
        // Check if instruction has underlying_gate
        if (!instruction.underlying_gate) {
            alert('Instruction does not have a gate matrix to apply.');
            return;
        }
        
        const response = await fetch('/apply_gate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                state_vector: currentStateVector.coefficients,
                gate_matrix: instruction.underlying_gate
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store the new state vector globally
            currentStateVector = data;
            
            // Store the last executed operation
            lastExecutedOperation = instruction;
            
            // Update the UI with the transformed state
            updateQuantumState(data);
            
            // Update Physical Implementation section
            updatePhysicalImplementation(instruction);
            
            // Delete the instruction after successful execution
            physicalInstructions.splice(instructionIndex, 1);
            updateOperationsDisplay();
        } else {
            console.error('Error:', data.error);
            alert('Error executing instruction: ' + data.error);
        }
    } catch (error) {
        console.error('Error executing instruction:', error);
        alert('Error executing instruction: ' + error.message);
    }
}

// =====================================================
// Update Physical Implementation Section
// =====================================================

function updatePhysicalImplementation(instruction) {
    const imageElement = document.getElementById('physical-implementation-image');
    const titleElement = document.getElementById('physical-implementation-title');
    const q1DriveFreqInput = document.getElementById('q1-drive-freq');
    const q0DriveFreqInput = document.getElementById('q0-drive-freq');
    
    if (!imageElement || !titleElement) return;
    
    // Store original frequencies if not already stored
    if (!window.originalQ1DriveFreq) {
        window.originalQ1DriveFreq = q1DriveFreqInput.value;
    }
    if (!window.originalQ0DriveFreq) {
        window.originalQ0DriveFreq = q0DriveFreqInput.value;
    }
    
    const code = instruction.code;
    const tag = instruction.tag;
    
    if (code === 'ISWAP') {
        // ISWAP: Set Q1 drive freq to match Q0 drive freq
        const q0Freq = q0DriveFreqInput.value;
        q1DriveFreqInput.value = q0Freq;
        
        // Update title
        titleElement.textContent = 'PHYSICAL IMPLEMENTATION: ISwap gate via qubit resonance';
        
        // Update image
        imageElement.src = 'assets/animations/iswap.gif';
    } else if (code === 'RY') {
        // RY gate: Show single qubit rotation
        // Restore original frequencies
        q1DriveFreqInput.value = window.originalQ1DriveFreq;
        q0DriveFreqInput.value = window.originalQ0DriveFreq;
        
        // Update title
        titleElement.textContent = 'PHYSICAL IMPLEMENTATION: Single Qubit Rotation by applying EM radiation';
        
        // Update image based on qubit
        if (tag === 0) {
            imageElement.src = 'assets/animations/qubit0_single.gif';
        } else if (tag === 1) {
            imageElement.src = 'assets/animations/qubit1_single.gif';
        }
    } else if (code === 'RZ') {
        // RZ gate: Virtual rotation, restore defaults
        q1DriveFreqInput.value = window.originalQ1DriveFreq;
        q0DriveFreqInput.value = window.originalQ0DriveFreq;
        
        // Update title
        titleElement.textContent = 'PHYSICAL IMPLEMENTATION';
        
        // Restore default image
        imageElement.src = 'assets/animations/basic.png';
    } else {
        // Default: restore everything
        q1DriveFreqInput.value = window.originalQ1DriveFreq;
        q0DriveFreqInput.value = window.originalQ0DriveFreq;
        titleElement.textContent = 'PHYSICAL IMPLEMENTATION';
        imageElement.src = 'assets/animations/basic.png';
    }
}
