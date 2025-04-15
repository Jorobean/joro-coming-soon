import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ModelViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        // Set background color to the user's specified dark grey
        this.scene.background = new THREE.Color(0x111111); // #111111

        // Camera default: side/front view, not top-down
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 1.25, 7.8); // Move camera further back for more zoom out
        this.camera.lookAt(0, 0.38, 0); // Look at shoe center
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 2 : 3));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;

        if (this.renderer.outputColorSpace !== undefined) {
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        }

        this.container.appendChild(this.renderer.domElement);

        if (this.isMobile) {
            // Zoom out to z=13 on mobile
            this.camera.position.set(0, 1.5, 13);
        } else {
            // Camera perspective to match hero image (side/front slightly above)
            // this.camera.position.set(0, 2.2, 5.25); // Slightly higher Y for above angle
            // this.camera.lookAt(0, 1, 0); // Focus slightly above ground for natural shadow
            // this.initialCameraPosition = this.camera.position.clone();
        }
        // this.camera.lookAt(0, 1, 0);
        // this.initialCameraPosition = this.camera.position.clone();

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 1.2); // Brighter ambient
        this.scene.add(ambient);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 1.0); // Universal soft light
        hemiLight.position.set(0, 10, 0);
        this.scene.add(hemiLight);

        const directional = new THREE.DirectionalLight(0xffffff, 2.5);
        directional.position.set(5, 10, 7);
        directional.castShadow = true;
        directional.shadow.mapSize.set(2048, 2048);
        directional.shadow.bias = -0.0005;
        this.scene.add(directional);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.7);
        backLight.position.set(0, -4, -6);
        this.scene.add(backLight);

        const rectLight = new THREE.RectAreaLight(0xffffff, 2.5, 6, 6);
        rectLight.position.set(0, 5, 5);
        rectLight.lookAt(0, 0, 0);
        this.scene.add(rectLight);

        const fillLight = new THREE.PointLight(0xffffff, 0.7);
        fillLight.position.set(-4, 3, -4);
        this.scene.add(fillLight);

        // Add infinite grid and floor
        const gridSize = 2000;
        const gridDivisions = 300; // Ultra dense grid
        this.gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0x222222);
        this.gridHelper.material.opacity = 0.18;
        this.gridHelper.material.transparent = true;
        this.gridHelper.position.y = 0.01; // Slightly above floor to avoid z-fighting
        this.scene.add(this.gridHelper);

        // Infinite floor plane with fade
        const floorSize = 2000;
        const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize, 1, 1);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x181818,
            roughness: 1.0,
            metalness: 0.0,
            transparent: true,
            opacity: 0.98
        });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        // Add fog for infinite fade effect
        this.scene.fog = new THREE.Fog(0x111111, 16, 120);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.enableZoom = false;
        this.controls.enablePan = false;
        this.controls.rotateSpeed = this.isMobile ? 1.5 : 1.0;

        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.model = null;
        this.autoRotate = false;

        this.addFallbackObject();

        // In the animation/render loop, hide the grid if camera is below the floor
        const animate = () => {
            requestAnimationFrame(animate);
            if (this.controls) this.controls.update();
            // Hide grid when camera is below the floor (y=0)
            if (this.camera.position.y < 0.01) {
                this.gridHelper.visible = false;
            } else {
                this.gridHelper.visible = true;
            }
            if (this.model && this.autoRotate) this.model.rotation.y += 0.01;
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    addFallbackObject() {
        // Do nothing: remove fallback cube entirely
    }

    loadModel(modelPath) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();

            loader.load(modelPath, (gltf) => {
                try {
                    if (this.fallbackCube) this.scene.remove(this.fallbackCube);
                    if (this.model) this.scene.remove(this.model);

                    this.model = gltf.scene;
                    this.model.traverse((node) => {
                        if (node.isMesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;

                            const mat = node.material;
                            if (mat) {
                                mat.side = THREE.DoubleSide;
                                mat.flatShading = false;
                                mat.transparent = false;
                                mat.opacity = 1;
                                mat.roughness = 0.5;
                                mat.metalness = 0.2;
                                mat.color = new THREE.Color(0xd6a187); // Soft terracotta
                                if (mat.emissive) {
                                    mat.emissive = new THREE.Color(0x222222);
                                    mat.emissiveIntensity = 0.05;
                                }
                            }
                        }
                    });

                    // Compute bounding box for a single shoe to determine width
                    const singleBox = new THREE.Box3().setFromObject(this.model);
                    const shoeWidth = singleBox.max.x - singleBox.min.x;
                    const gap = 0.1 * shoeWidth; // Small gap between shoes

                    // Create left and right shoes
                    const leftShoe = this.model.clone(true);
                    const rightShoe = this.model.clone(true);

                    // Mirror the right shoe across X axis
                    rightShoe.scale.x *= -1;

                    // Place shoes as close as possible, visually touching or overlapping more
                    const tinyGap = -0.18 * shoeWidth; // Shoes are nearly merged
                    leftShoe.position.x = -0.5 * shoeWidth - 0.5 * tinyGap;
                    rightShoe.position.x = 0.5 * shoeWidth + 0.5 * tinyGap;
                    leftShoe.position.z = 0;
                    rightShoe.position.z = 0;

                    // Rotate the right shoe 90 degrees and the left shoe -90 degrees
                    rightShoe.rotation.y = THREE.MathUtils.degToRad(90);
                    leftShoe.rotation.y = THREE.MathUtils.degToRad(-90);

                    // Group them together
                    const pairGroup = new THREE.Group();
                    pairGroup.add(leftShoe);
                    pairGroup.add(rightShoe);

                    // Center the group vertically as before, but move it closer to the floor
                    const pairBox = new THREE.Box3().setFromObject(pairGroup);
                    const minY = pairBox.min.y;
                    const size = pairBox.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 5 / maxDim;
                    pairGroup.scale.setScalar(scale);
                    // Raise the shoes slightly off the floor for a floating effect
                    pairGroup.position.y = -minY * scale + 0.07;

                    // Move the shoes group further back so the center line crosses at or in front of the midpoint
                    pairGroup.position.z = -1.2; // Move further back

                    this.model = pairGroup;
                    this.scene.add(this.model);
                    resolve();
                } catch (e) {
                    this.addFallbackObject();
                    reject(e);
                }
            }, undefined, (err) => {
                console.error('Load error', err);
                this.addFallbackObject();
                reject(err);
            });
        });
    }

    setShoeColor(colorName) {
        // Preset color values
        const colors = {
            'coffee': 0x3a2414, // Much darker coffee brown
            'green': 0x14341b, // Much darker green
            'grey': 0x555555, // Darker grey
            'black': 0x151515, // Much darker black
            'orange': 0xff4d00, // Electric Orange
            'blue': 0x0066ff,  // Royal Blue
            'red': 0x8a1010   // Darker red
        };
        const hex = colors[colorName] || colors['coffee'];
        if (!this.model) return;
        this.model.traverse((node) => {
            if (node.isMesh && node.material) {
                node.material.color = new THREE.Color(hex);
                node.material.needsUpdate = true;
                // Boost red's emissive for vibrancy
                if (colorName === 'red' && node.material.emissive) {
                    node.material.emissive = new THREE.Color(0x660000);
                    node.material.emissiveIntensity = 0.18;
                } else if (colorName === 'black' && node.material) {
                    node.material.roughness = 0.47;
                    if (node.material.emissive) {
                        node.material.emissive = new THREE.Color(0x232323);
                        node.material.emissiveIntensity = 0.14;
                    }
                } else if (node.material.emissive) {
                    node.material.emissive = new THREE.Color(0x222222);
                    node.material.emissiveIntensity = 0.05;
                }
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
}
