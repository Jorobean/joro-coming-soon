import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ModelViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111); // Dark background to see model better
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        
        // Detect if mobile
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 2 : 3));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Fix for newer Three.js versions
        if (this.renderer.outputEncoding !== undefined) {
            this.renderer.outputEncoding = THREE.sRGBEncoding;
        } else if (this.renderer.outputColorSpace !== undefined) {
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
        this.container.appendChild(this.renderer.domElement);
        
        // Set up camera position - adjust for mobile
        if (this.isMobile) {
            this.camera.position.set(0, 1.5, 6); // Slightly higher FOV for mobile
        } else {
            this.camera.position.set(0, 2, 5.25); // Desktop position
        }
        this.camera.lookAt(0, 1, 0);
        
        // Store initial camera position for maintaining zoom on resize
        this.initialCameraPosition = this.camera.position.clone();
        this.initialLookAt = new THREE.Vector3(0, 1, 0);
        
        // LIGHTING SETUP: Create even, comprehensive lighting from all directions
        
        // Strong universal ambient light for base illumination everywhere
        const ambientLight = new THREE.AmbientLight(0xffffff, 6.0);
        this.scene.add(ambientLight);
        
        // Create a sphere of lights around the model with more intensity
        const lightPositions = [
            [5, 5, 5],    // top-front-right
            [-5, 5, 5],   // top-front-left
            [5, 5, -5],   // top-back-right
            [-5, 5, -5],  // top-back-left
            [5, -3, 5],   // bottom-front-right
            [-5, -3, 5],  // bottom-front-left
            [5, -3, -5],  // bottom-back-right
            [-5, -3, -5], // bottom-back-left
            [0, 8, 0],    // direct top
            [0, -5, 0],   // direct bottom
            [0, 0, -8],   // direct back
            [0, 0, 8],    // direct front
            [8, 0, 0],    // direct right
            [-8, 0, 0]    // direct left
        ];
        
        // Create lights at each position with higher intensity
        for (const pos of lightPositions) {
            const light = new THREE.PointLight(0xffffff, 3.0);
            light.position.set(pos[0], pos[1], pos[2]);
            this.scene.add(light);
        }
        
        // Add hemisphere light for more natural lighting from sky/ground
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 3.0);
        this.scene.add(hemisphereLight);
        
        // Add a directional main light for shadows and definition
        const mainLight = new THREE.DirectionalLight(0xffffff, 4.0);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        this.scene.add(mainLight);
        
        // Add controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1; // Consistent dampening for both mobile and desktop
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        this.controls.enableZoom = false; // Disable zooming
        this.controls.enablePan = false; // Disable panning/dragging for all devices
        
        // Mobile-specific control adjustments
        if (this.isMobile) {
            this.controls.rotateSpeed = 1.5; // Faster rotation on mobile
        }
        
        // Object to store the loaded model
        this.model = null;
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Add a visible axes helper (will be hidden once the model loads)
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        this.axesHelper = axesHelper; // Store reference to hide later
        
        // Add a grid instead of a ground plane
        const gridHelper = new THREE.GridHelper(20, 20, 0x555555, 0x333333);
        gridHelper.position.y = -1; // Position grid below the model
        this.scene.add(gridHelper);
        this.gridHelper = gridHelper; // Store reference to hide/show as needed
        
        // Add a default fallback cube just to verify rendering works
        this.addFallbackObject();
        
        // Start animation loop
        this.animate();
    }
    
    // Add a colored cube as a fallback object to ensure rendering works
    addFallbackObject() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff5533,
            roughness: 0.7,
            metalness: 0.3
        });
        this.fallbackCube = new THREE.Mesh(geometry, material);
        this.fallbackCube.position.set(0, 0, 0);
        this.fallbackCube.castShadow = true;
        this.fallbackCube.receiveShadow = true;
        this.scene.add(this.fallbackCube);
        
        // Add a sphere too for reference
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3355ff,
            roughness: 0.7,
            metalness: 0.3
        });
        this.fallbackSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.fallbackSphere.position.set(2, 0, 0);
        this.fallbackSphere.castShadow = true;
        this.fallbackSphere.receiveShadow = true;
        this.scene.add(this.fallbackSphere);
    }
    
    loadModel(modelPath) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            
            loader.load(
                modelPath,
                (gltf) => {
                    try {
                        console.log('Model loaded successfully', gltf);
                        
                        // Remove fallback objects
                        if (this.fallbackCube) {
                            this.scene.remove(this.fallbackCube);
                            this.scene.remove(this.fallbackSphere);
                        }
                        
                        // Remove any previously loaded model
                        if (this.model) {
                            this.scene.remove(this.model);
                        }
                        
                        this.model = gltf.scene;
                        
                        // Check if there are any meshes in the scene
                        let hasMeshes = false;
                        const meshList = [];
                        
                        // Process all meshes in the model
                        this.model.traverse((node) => {
                            if (node.isMesh) {
                                hasMeshes = true;
                                meshList.push(node.name || "unnamed mesh");
                                console.log('Found mesh:', node.name);
                                node.castShadow = true;
                                node.receiveShadow = true;
                                
                                // Log geometry details
                                if (node.geometry) {
                                    console.log('Geometry vertices:', node.geometry.attributes.position.count);
                                }
                                
                                // Ensure material is visible
                                if (node.material) {
                                    if (Array.isArray(node.material)) {
                                        node.material.forEach(mat => {
                                            console.log('Material:', mat);
                                            mat.side = THREE.DoubleSide;
                                            mat.transparent = false;
                                            mat.opacity = 1;
                                            
                                            // Apply material settings for smooth finish like the image
                                            mat.roughness = 0.9; // Higher roughness for matte finish
                                            mat.metalness = 0.0; // No metallic properties for clay look
                                            mat.flatShading = false; // Smooth shading between polygons
                                            
                                            // Use terracotta clay color
                                            mat.color = new THREE.Color(0x92604f);
                                            
                                            // Minimal emissive for better visibility
                                            if (mat.emissive) {
                                                mat.emissive = new THREE.Color(0x222222);
                                                mat.emissiveIntensity = 0.05; // Very subtle self-illumination
                                            }
                                        });
                                    } else {
                                        console.log('Material:', node.material);
                                        node.material.side = THREE.DoubleSide;
                                        node.material.transparent = false;
                                        node.material.opacity = 1;
                                        
                                        // Apply material settings for smooth finish like the image
                                        node.material.roughness = 0.9; // Higher roughness for matte finish
                                        node.material.metalness = 0.0; // No metallic properties for clay look
                                        node.material.flatShading = false; // Smooth shading between polygons
                                        
                                        // Use terracotta clay color
                                        node.material.color = new THREE.Color(0x92604f);
                                        
                                        // Minimal emissive for better visibility
                                        if (node.material.emissive) {
                                            node.material.emissive = new THREE.Color(0x222222);
                                            node.material.emissiveIntensity = 0.05; // Very subtle self-illumination
                                        }
                                    }
                                } else {
                                    // Create a new material if none exists
                                    node.material = new THREE.MeshStandardMaterial({
                                        color: 0x92604f, // Terracotta clay color
                                        roughness: 0.9,
                                        metalness: 0.0,
                                        flatShading: false,
                                        side: THREE.DoubleSide,
                                        emissive: 0x222222,
                                        emissiveIntensity: 0.05
                                    });
                                }
                            }
                        });
                        
                        if (!hasMeshes) {
                            console.error('No meshes found in the model! Using fallback objects instead.');
                            this.addFallbackObject();
                            resolve();
                            return;
                        }
                        
                        console.log('Meshes found in model:', meshList.join(', '));
                        
                        // Center the model exactly on the axes
                        const box = new THREE.Box3().setFromObject(this.model);
                        if (box.isEmpty()) {
                            console.error('Model bounding box is empty! Using fallback position.');
                            this.model.position.set(0, 0, 0);
                        } else {
                            const center = box.getCenter(new THREE.Vector3());
                            
                            // Store the original position
                            const originalPosition = this.model.position.clone();
                            
                            // Create a new parent object to hold the model
                            const modelParent = new THREE.Object3D();
                            this.scene.add(modelParent);
                            
                            // First, add the model to the parent
                            modelParent.add(this.model);
                            
                            // Then, position the model within the parent so its center is at the parent's origin
                            this.model.position.copy(originalPosition).sub(center);
                            
                            // Now when the parent rotates, the model will rotate around its visual center
                            this.model = modelParent;
                            
                            // Scale the model to fit the view
                            const size = box.getSize(new THREE.Vector3());
                            console.log('Model size:', size);
                            
                            // ALWAYS scale up the model significantly since Blender exports tend to be small
                            const maxDim = Math.max(size.x, size.y, size.z);
                            console.log('Original max dimension:', maxDim);
                            
                            // Apply a smaller scale to make it appropriately sized
                            const scale = 4.75 / maxDim; // Reduced by 5% from 5.0
                            console.log('Using scale:', scale);
                            this.model.scale.multiplyScalar(scale);
                        }
                        
                        // Position the model exactly at the origin
                        this.model.position.set(0, 1, 0); // Position 1 unit above the grid
                        
                        // Hide the axes helper
                        if (this.axesHelper) {
                            this.axesHelper.visible = false;
                        }
                        
                        // Disable automatic rotation
                        this.autoRotate = false;
                        
                        this.scene.add(this.model);
                        resolve();
                    } catch (error) {
                        console.error('Error processing model:', error);
                        // Use fallback objects
                        this.addFallbackObject();
                        reject(error);
                    }
                },
                (xhr) => {
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                (error) => {
                    console.error('Error loading model:', error);
                    // Use fallback objects
                    this.addFallbackObject();
                    reject(error);
                }
            );
        });
    }
    
    onWindowResize() {
        // Maintain aspect ratio without changing the field of view
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        
        // Reset renderer size
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        
        // Reset camera position to maintain the same view distance
        if (this.initialCameraPosition) {
            const distance = this.initialCameraPosition.z;
            const fov = this.camera.fov * (Math.PI / 180);
            const newHeight = 2 * Math.tan(fov / 2) * distance;
            const ratio = this.container.clientHeight / newHeight;
            
            // Keep the model in view by adjusting the camera position based on container size
            if (this.container.clientWidth < 768 && !this.isMobile) {
                // When desktop window gets small, adjust camera to ensure model visibility
                this.camera.position.copy(this.initialCameraPosition);
                this.camera.position.z += 1; // Step back a bit to keep model in view
            } else {
                // Reset to initial positions on larger screens or for mobile
                this.camera.position.copy(this.initialCameraPosition);
            }
        }
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Rotate the fallback cube if it exists
        if (this.fallbackCube) {
            this.fallbackCube.rotation.y += 0.01;
            this.fallbackCube.rotation.x += 0.005;
        }
        
        // Rotate the model slowly if autoRotate is enabled
        if (this.model && this.autoRotate) {
            this.model.rotation.y += 0.01;
        }
        
        // Hide grid when viewing from below
        if (this.gridHelper && this.camera) {
            // Get the camera's vertical angle
            const cameraDirection = new THREE.Vector3();
            this.camera.getWorldDirection(cameraDirection);
            
            // If looking down (positive y direction), hide the grid
            // This reveals the underside of the shoe
            if (cameraDirection.y > 0.1) {
                this.gridHelper.visible = false;
            } else {
                this.gridHelper.visible = true;
            }
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
} 