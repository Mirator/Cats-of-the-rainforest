import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class BaseModel {
    constructor(position, { onModelLoaded, modelPath, placeholderColor = 0xff8c42, scale = 0.5 } = {}) {
        this.position = position;
        this.mesh = null;
        this.yOffset = 0.5;
        this.modelLoaded = false;
        this.onModelLoaded = onModelLoaded;
        this.modelPath = modelPath;
        this.placeholderColor = placeholderColor;
        this.scale = scale;

        this.createPlaceholder();
    }

    init() {
        if (this.modelPath) {
            return this.loadModel(this.modelPath);
        }
        return Promise.resolve();
    }

    getMesh() {
        return this.mesh;
    }

    getYOffset() {
        return this.yOffset;
    }

    createPlaceholder() {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: this.placeholderColor });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
    }

    getBaseUrl() {
        const pathname = window.location.pathname;
        let baseUrl = '/';
        if (pathname.includes('/Cats-of-the-rainforest/')) {
            baseUrl = '/Cats-of-the-rainforest/';
        } else if (pathname.startsWith('/Cats-of-the-rainforest')) {
            baseUrl = '/Cats-of-the-rainforest/';
        }
        return baseUrl;
    }

    async loadModel(modelPath) {
        const loader = new GLTFLoader();

        try {
            const baseUrl = this.getBaseUrl();
            const gltf = await loader.loadAsync(`${baseUrl}assets/models/${modelPath}`);

            const model = gltf.scene;

            // Setup materials and shadows
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach((material, index) => {
                        if (material) {
                            if (!material.userData.isCloned) {
                                const clonedMaterial = material.clone();
                                clonedMaterial.userData.isCloned = true;
                                clonedMaterial.flatShading = true;

                                if (Array.isArray(child.material)) {
                                    child.material[index] = clonedMaterial;
                                } else {
                                    child.material = clonedMaterial;
                                }
                            } else {
                                material.flatShading = true;
                            }
                        }
                    });
                }
            });

            // Apply scale
            model.scale.set(this.scale, this.scale, this.scale);

            // Calculate yOffset based on model bounds
            const box = new THREE.Box3().setFromObject(model);
            if (box.min.y < 0) {
                this.yOffset = Math.abs(box.min.y);
            } else {
                this.yOffset = 0;
            }

            // Position model
            model.position.set(this.position.x, this.position.y + this.yOffset, this.position.z);

            // Replace placeholder
            const parentScene = this.mesh?.parent;
            if (this.mesh && this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }

            this.mesh = model;
            this.modelLoaded = true;

            // Call subclass-specific setup
            this.onModelLoadedInternal();

            // Restore parent scene
            if (parentScene) {
                parentScene.add(this.mesh);
            }

            // Call callback
            if (this.onModelLoaded) {
                this.onModelLoaded({ mesh: this.mesh, yOffset: this.yOffset });
            }
        } catch (error) {
            console.error(`Error loading model ${modelPath}:`, error);
        }
    }

    // Override this in subclasses for model-specific setup
    onModelLoadedInternal() {
        // Subclasses can override this to do custom setup after model loads
    }
}
