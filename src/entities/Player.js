import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
    constructor(x, z) {
        this.position = new THREE.Vector3(x, 0, z);
        this.mesh = null;
        this.speed = 5;
        this.interactionRange = 2.5;
        this.modelLoaded = false;
        this.yOffset = 0.5; // Default offset, will be calculated from model
        
        // Create placeholder mesh while loading
        this.createPlaceholder();
        this.loadModel();
    }
    
    createPlaceholder() {
        // Simple placeholder while model loads
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: 0xff8c42 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
    }
    
    async loadModel() {
        const loader = new GLTFLoader();
        
        try {
            const gltf = await loader.loadAsync('/assets/models/cat.glb');
            
            // Get the model from the scene
            const model = gltf.scene;
            
            // Enable shadows on all meshes
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Scale and position the model appropriately
            // Scale to 50% of original size
            model.scale.set(0.5, 0.5, 0.5);
            
            // Calculate proper Y offset based on model's bounding box
            // The bounding box is calculated after scaling, so we need to check
            // where the bottom of the model is relative to the pivot
            const box = new THREE.Box3().setFromObject(model);
            
            // If min.y is negative, the model extends below the pivot (common for character models)
            // We need to raise it by the absolute value of min.y to place feet on ground
            if (box.min.y < 0) {
                this.yOffset = Math.abs(box.min.y);
            } else {
                // If pivot is at bottom, no offset needed (or very small)
                this.yOffset = 0;
            }
            
            // Position model so feet are on the ground
            model.position.set(this.position.x, this.position.y + this.yOffset, this.position.z);
            
            // Store reference to parent scene before removing placeholder
            const parentScene = this.mesh.parent;
            
            // Replace placeholder with actual model
            if (this.mesh && this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
            
            this.mesh = model;
            this.modelLoaded = true;
            
            // Add new model to the same parent scene
            if (parentScene) {
                parentScene.add(this.mesh);
            }
            
            // Notify that model is ready (if parent needs to know)
            if (this.onModelLoaded) {
                this.onModelLoaded();
            }
        } catch (error) {
            console.error('Error loading cat model:', error);
            // Keep placeholder if loading fails
        }
    }
    
    getMesh() {
        return this.mesh;
    }
    
    getPosition() {
        return this.position;
    }
    
    update(deltaTime, inputManager, mapSystem) {
        const move = inputManager.getMovementVector();
        
        if (move.x !== 0 || move.z !== 0) {
            const moveSpeed = this.speed * deltaTime;
            const newX = this.position.x + move.x * moveSpeed;
            const newZ = this.position.z + move.z * moveSpeed;
            
            // Clamp to map boundaries
            const clamped = mapSystem.clampPosition(newX, newZ);
            this.position.x = clamped.x;
            this.position.z = clamped.z;
            
            // Update mesh position (maintain Y offset for proper leg visibility)
            this.mesh.position.x = this.position.x;
            this.mesh.position.y = this.position.y + this.yOffset;
            this.mesh.position.z = this.position.z;
            
            // Rotate player to face movement direction
            // Add Math.PI to flip 180 degrees if model is facing backwards
            if (move.x !== 0 || move.z !== 0) {
                const angle = Math.atan2(move.x, move.z) + Math.PI;
                this.mesh.rotation.y = angle;
            }
        }
    }
    
    canInteractWith(tree) {
        return tree && !tree.isCut && tree.isWithinRange(this.position);
    }
}
