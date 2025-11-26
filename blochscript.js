import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";

// ----------------------------------------------------
// Bloch Vector (example)
// ----------------------------------------------------
const theta = Math.PI / 3;
const phi   = Math.PI / 4;

const blochVector = new THREE.Vector3(
    Math.sin(theta) * Math.cos(phi),
    Math.sin(theta) * Math.sin(phi),
    Math.cos(theta)
).normalize();

// ----------------------------------------------------
// Create a Bloch Sphere in a given container
// ----------------------------------------------------
function createBlochSphere(containerId, phiSliderId, thetaSliderId) {
    const container = document.getElementById(containerId);
    const phiSlider = document.getElementById(phiSliderId);
    const thetaSlider = document.getElementById(thetaSliderId);

    // ----- Scene -----
    const scene = new THREE.Scene();

    // Light gray background
    scene.background = new THREE.Color(0xf0f0f0);

    // ----- Camera -----
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );
    var camdist = 3.5
    var phiAngle = Math.PI/3.0
    var thetaAngle = Math.PI/2.0
    camera.position.x = camdist * Math.cos(phiAngle) * Math.sin(thetaAngle);
    camera.position.y = camdist * Math.cos(thetaAngle);
    camera.position.z = camdist * Math.sin(phiAngle) * Math.sin(thetaAngle);
    camera.lookAt(0, 0, 0);


    // ----- Renderer -----
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // ----------------------------------------------------
    // Bloch Sphere
    // ----------------------------------------------------
    const sphereGeom = new THREE.SphereGeometry(1, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x0080cc,
        wireframe: true,
        transparent: true,
        opacity: 0.4
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    scene.add(sphere);

    // ----------------------------------------------------
    // Axes
    // ----------------------------------------------------
    const axesLength = 1.15;

    function makeAxis(dir, color) {
        const material = new THREE.LineBasicMaterial({ color: color, linewidth: 4 });
        const points = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(axesLength)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return new THREE.Line(geometry, material);
    }

    const axes = [
        makeAxis(new THREE.Vector3(1,0,0), 0xff0000),   // +X
        makeAxis(new THREE.Vector3(-1,0,0), 0xaa0000),  // -X
        makeAxis(new THREE.Vector3(0,1,0), 0x00cc00),   // +Y
        makeAxis(new THREE.Vector3(0,-1,0), 0x008800),  // -Y
        makeAxis(new THREE.Vector3(0,0,1), 0x0000ff),   // +Z
        makeAxis(new THREE.Vector3(0,0,-1), 0x000088)   // -Z
    ];
    axes.forEach(a => scene.add(a));

    // ----------------------------------------------------
    // Arrow for Bloch vector
    // ----------------------------------------------------
    var arrow = new THREE.ArrowHelper(
        blochVector,
        new THREE.Vector3(0, 0, 0),
        1.0,
        0xffaa00,
        0.25,
        0.2
    );
    scene.add(arrow);

    // ----------------------------------------------------
    // Axis Labels
    // ----------------------------------------------------
    function makeLabel(text, position) {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.font = "48px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, size/2, size/2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(0.5, 0.5, 1);
        sprite.position.copy(position);
        return sprite;
    }

    scene.add(makeLabel("|i⟩",   new THREE.Vector3(0, 0, 1.2)));
    scene.add(makeLabel("|-i⟩",  new THREE.Vector3(0, 0,-1.2)));
    scene.add(makeLabel("|+⟩",   new THREE.Vector3(1.2, 0, 0)));
    scene.add(makeLabel("|-⟩",  new THREE.Vector3(-1.2, 0, 0)));
    scene.add(makeLabel("|0⟩",   new THREE.Vector3(0, 1.2, 0)));
    scene.add(makeLabel("|1⟩",  new THREE.Vector3(0,-1.2, 0)));

    // ----------------------------------------------------
    // Update camera rotation from sliders
    // ----------------------------------------------------

    phiSlider.addEventListener("input", () => {
        phiAngle = -phiSlider.value * Math.PI / 180 + Math.PI/2.0; // degrees → radians
        if(thetaAngle == 0) {
            //this looks ugly but it is important to avoid loss of information in cicular coordinates
            camera.position.x = camdist * Math.cos(phiAngle) * 0.0001;
            camera.position.y = camdist;
            camera.position.z = camdist * Math.sin(phiAngle) *0.0001;
        }
        else{
            camera.position.x = camdist * Math.cos(phiAngle) * Math.sin(thetaAngle);
            camera.position.y = camdist * Math.cos(thetaAngle);
            camera.position.z = camdist * Math.sin(phiAngle) * Math.sin(thetaAngle);
        }
        camera.lookAt(0, 0, 0);
    });
    thetaSlider.addEventListener("input", () => {
        thetaAngle = thetaSlider.value * Math.PI / 180; // degrees → radians
        if(thetaAngle == 0) {
            //this looks ugly but it is important to avoid loss of information in cicular coordinates
            camera.position.x = camdist * Math.cos(phiAngle) * 0.0001;
            camera.position.y = camdist;
            camera.position.z = camdist * Math.sin(phiAngle) *0.0001;
        }
        else{
            camera.position.x = camdist * Math.cos(phiAngle) * Math.sin(thetaAngle);
            camera.position.y = camdist * Math.cos(thetaAngle);
            camera.position.z = camdist * Math.sin(phiAngle) * Math.sin(thetaAngle);
        }
        camera.lookAt(0, 0, 0);
    });

    // ----------------------------------------------------
    // Animation loop
    // ----------------------------------------------------
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // ----------------------------------------------------
    // Resize
    // ----------------------------------------------------
    window.addEventListener("resize", () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    });
}

// ----------------------------------------------------
// Create the two Bloch spheres
// ----------------------------------------------------
createBlochSphere("bloch-sphere-0", "cam-phi-0", "cam-theta-0");
createBlochSphere("bloch-sphere-1", "cam-phi-1", "cam-theta-1");