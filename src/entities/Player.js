import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
    constructor(x, z) {
        this.position = new THREE.Vector3(x, 0, z);
        this.mesh = null;
        this.speed = 6.5;
        this.interactionRange = 2.5;
        this.modelLoaded = false;
        this.yOffset = 0.5; // Default offset, will be calculated from model
        
        // Animation properties
        this.animationTime = 0;
        this.legMeshes = [];
        this.headMesh = null;
        this.maskMesh = null;
        this.tailMesh = null;
        this.headOriginalPosition = null; // Store original head position to prevent drift
        this.tailOriginalRotation = null; // Store original tail rotation
        
        // Color properties
        this.bodyColor = null;
        this.maskColor = null;
        
        // Body color palette (cat-friendly colors)
        this.bodyColorPalette = [
            0xff8c42, 0xff6b35, 0xffa500, // Orange/Ginger
            0x8b4513, 0xa0522d, 0xcd853f, // Brown/Tabby
            0x808080, 0x696969, 0x778899, // Gray
            0xfff8dc, 0xfffdd0,           // Cream
            0xff6b6b, 0xffa07a            // Calico patterns
        ];
        
        // Mask color palette (distinct from body, suitable for masks)
        // No black colors - all colors have at least 0x20 in each RGB channel
        this.maskColorPalette = [
            0x2a3a5e, 0x263a5e, 0x1f4a80, // Deep colors (replaced near-black with dark blues)
            0x8b0000, 0x4b0082, 0x2d5016, // Rich colors
            0xff1493, 0x00ced1, 0xff6347, // Vibrant colors
            0x654321, 0x556b2f, 0x6b4423, // Earth tones
            0x4682b4, 0x708090, 0x3f5f5f  // Metallic (replaced 0x2f4f4f with lighter shade)
        ];
        
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
            // Calculate base URL from current pathname for GitHub Pages compatibility
            const pathname = window.location.pathname;
            let baseUrl = '/';
            if (pathname.includes('/Cats-of-the-rainforest/')) {
                baseUrl = '/Cats-of-the-rainforest/';
            } else if (pathname.startsWith('/Cats-of-the-rainforest')) {
                baseUrl = '/Cats-of-the-rainforest/';
            }
            const gltf = await loader.loadAsync(`${baseUrl}assets/models/cat2.glb`);
            
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
            
            // Find model parts (legs, head, mask) for animation and coloring
            this.findModelParts();
            
            // Select and apply colors
            this.selectRandomColors();
            this.applyColors();
            
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
    
    findModelParts() {
        // Reset arrays
        this.legMeshes = [];
        this.headMesh = null;
        this.maskMesh = null;
        this.tailMesh = null;
        
        if (!this.mesh) return;
        
        // Traverse the model to find parts
        this.mesh.traverse((child) => {
            const name = child.name.toLowerCase();
            
            // Find legs (common naming patterns)
            if (name.includes('leg') || name.includes('foot') || name.includes('paw')) {
                if (child.isMesh || child.isGroup) {
                    this.legMeshes.push(child);
                }
            }
            
            // Find head
            if (name.includes('head') && !name.includes('mask')) {
                if (child.isMesh || child.isGroup) {
                    if (!this.headMesh) {
                        this.headMesh = child;
                        // Store original position to prevent drift during animation
                        this.headOriginalPosition = child.position.clone();
                    }
                }
            }
            
            // Find mask
            if (name.includes('mask')) {
                if (child.isMesh || child.isGroup) {
                    this.maskMesh = child;
                }
            }
            
            // Find tail
            if (name.includes('tail')) {
                if (child.isMesh || child.isGroup) {
                    if (!this.tailMesh) {
                        this.tailMesh = child;
                        // Store original rotation to prevent drift during animation
                        this.tailOriginalRotation = {
                            y: child.rotation.y,
                            z: child.rotation.z
                        };
                    }
                }
            }
        });
        
        // If we didn't find parts by name, try to find by structure
        // Look for child meshes/groups that might be legs (typically 4 legs)
        if (this.legMeshes.length === 0 && this.mesh.children) {
            // Try to identify legs by position or as direct children
            const children = this.mesh.children;
            for (let i = 0; i < Math.min(children.length, 6); i++) {
                const child = children[i];
                if (child.isMesh || child.isGroup) {
                    // Check if it's likely a leg (lower Y position, or just assume first few children)
                    if (i < 4) {
                        this.legMeshes.push(child);
                    }
                }
            }
        }
        
        // If still no head found, try to find a prominent child mesh
        // Updated to handle new head position - check for any elevated part
        if (!this.headMesh && this.mesh.children) {
            let highestChild = null;
            let highestY = -Infinity;
            
            for (const child of this.mesh.children) {
                if (child.isMesh || child.isGroup) {
                    // Check bounding box - head is usually higher up
                    const box = new THREE.Box3().setFromObject(child);
                    // Lowered threshold to 0.2 to accommodate new head position
                    if (box.max.y > 0.2 && box.max.y > highestY) {
                        highestY = box.max.y;
                        highestChild = child;
                    }
                }
            }
            
            if (highestChild) {
                this.headMesh = highestChild;
                // Store original position to prevent drift during animation
                this.headOriginalPosition = highestChild.position.clone();
            }
        }
        
        // If tail not found by name, try to find by structure (typically at the back/rear)
        if (!this.tailMesh && this.mesh.children) {
            let rearMostChild = null;
            let rearMostZ = Infinity; // Assuming model faces forward, tail is at negative Z
            
            for (const child of this.mesh.children) {
                if (child.isMesh || child.isGroup) {
                    // Skip if already identified as another part
                    if (child === this.headMesh || child === this.maskMesh || 
                        this.legMeshes.includes(child)) {
                        continue;
                    }
                    
                    const box = new THREE.Box3().setFromObject(child);
                    // Tail is typically at the rear (negative Z in forward-facing models)
                    // or could be identified by being elongated/extended
                    const centerZ = (box.min.z + box.max.z) / 2;
                    if (centerZ < rearMostZ) {
                        rearMostZ = centerZ;
                        rearMostChild = child;
                    }
                }
            }
            
            // Only assign if we found something that seems like a tail
            // (check if it's positioned behind the body center)
            if (rearMostChild) {
                const bodyBox = new THREE.Box3().setFromObject(this.mesh);
                const bodyCenterZ = (bodyBox.min.z + bodyBox.max.z) / 2;
                if (rearMostZ < bodyCenterZ - 0.1) { // At least 0.1 units behind body center
                    this.tailMesh = rearMostChild;
                    // Store original rotation to prevent drift during animation
                    this.tailOriginalRotation = {
                        y: rearMostChild.rotation.y,
                        z: rearMostChild.rotation.z
                    };
                }
            }
        }
    }
    
    selectRandomColors() {
        // Select random body color
        const bodyIndex = Math.floor(Math.random() * this.bodyColorPalette.length);
        this.bodyColor = this.bodyColorPalette[bodyIndex];
        
        // Select random mask color, ensuring it's different from body color
        let maskIndex;
        let attempts = 0;
        do {
            maskIndex = Math.floor(Math.random() * this.maskColorPalette.length);
            this.maskColor = this.maskColorPalette[maskIndex];
            attempts++;
            // Prevent infinite loop - if palette is too small, just accept it
        } while (this.maskColor === this.bodyColor && attempts < 10);
    }
    
    applyColors() {
        if (!this.mesh) return;
        
        // Traverse all meshes and apply colors
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                // Check if this is the mask
                const isMask = this.maskMesh && (
                    child === this.maskMesh || 
                    (this.maskMesh.isGroup && this.maskMesh.children.includes(child)) ||
                    child.name.toLowerCase().includes('mask')
                );
                
                // Apply color based on whether it's mask or body
                const targetColor = isMask ? this.maskColor : this.bodyColor;
                
                // Handle both single material and material arrays
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                
                materials.forEach((material, index) => {
                    if (material) {
                        let materialToUse = material;
                        
                        // Clone material if it's shared to avoid affecting other meshes
                        if (!material.userData.isCloned) {
                            const clonedMaterial = material.clone();
                            clonedMaterial.userData.isCloned = true;
                            materialToUse = clonedMaterial;
                            
                            // Replace in array if needed
                            if (Array.isArray(child.material)) {
                                child.material[index] = clonedMaterial;
                            } else {
                                child.material = clonedMaterial;
                            }
                        }
                        
                        // Set color while preserving other properties
                        if (materialToUse.color) {
                            materialToUse.color.setHex(targetColor);
                        }
                    }
                });
            }
        });
    }
    
    updateAnimation(deltaTime, isMoving) {
        if (!this.modelLoaded || !this.mesh) return;
        
        this.animationTime += deltaTime;
        
        // Leg animation (alternating when moving)
        if (isMoving && this.legMeshes.length >= 2) {
            const legSpeed = 2.8; // cycles per second
            const legAmplitude = 25 * (Math.PI / 180); // 25 degrees in radians
            
            // Animate legs in alternating pattern for smooth walking motion
            for (let i = 0; i < this.legMeshes.length; i++) {
                const leg = this.legMeshes[i];
                // Alternate legs: even indices move one way, odd indices move opposite
                const phase = i % 2 === 0 ? 0 : Math.PI;
                const rotation = Math.sin(this.animationTime * legSpeed * 2 * Math.PI + phase) * legAmplitude;
                
                // Apply rotation on X axis (forward/backward leg movement)
                leg.rotation.x = rotation;
            }
        } else {
            // Smoothly reset leg rotation when not moving
            this.legMeshes.forEach(leg => {
                // Smooth interpolation to zero for more natural stop
                leg.rotation.x *= 0.9; // Gradually reduce rotation
                if (Math.abs(leg.rotation.x) < 0.01) {
                    leg.rotation.x = 0; // Snap to zero when close enough
                }
            });
        }
        
        // Head animation (continuous gentle bobbing)
        if (this.headMesh && this.headOriginalPosition) {
            const headSpeed = 1.5; // cycles per second
            const headAmplitude = 2.5 * (Math.PI / 180); // 2.5 degrees in radians
            
            // Gentle rotation animation (preserves original rotation)
            this.headMesh.rotation.x = Math.sin(this.animationTime * headSpeed * 2 * Math.PI) * headAmplitude;
            
            // Slight translation bobbing (relative to original position to prevent drift)
            const bobAmplitude = 0.03;
            const bobOffset = Math.sin(this.animationTime * headSpeed * 2 * Math.PI) * bobAmplitude;
            this.headMesh.position.y = this.headOriginalPosition.y + bobOffset;
        }
        
        // Tail animation (subtle continuous swaying)
        if (this.tailMesh && this.tailOriginalRotation) {
            const tailSpeed = 1.0; // cycles per second (slower than head)
            
            // More pronounced when running, subtle when idle
            const idleAmplitude = 3 * (Math.PI / 180); // 3 degrees in radians (subtle when idle)
            const runningAmplitude = 6 * (Math.PI / 180); // 6 degrees in radians (more pronounced when running)
            const tailAmplitude = isMoving ? runningAmplitude : idleAmplitude;
            
            // Swaying motion on Y axis (side to side)
            // Preserve original rotation and add animation offset
            const tailPhase = Math.sin(this.animationTime * tailSpeed * 2 * Math.PI) * tailAmplitude;
            this.tailMesh.rotation.y = this.tailOriginalRotation.y + tailPhase;
            
            // Add slight Z rotation for more natural tail movement
            const zRotation = Math.sin(this.animationTime * tailSpeed * 2 * Math.PI + Math.PI / 4) * tailAmplitude * 0.5;
            this.tailMesh.rotation.z = this.tailOriginalRotation.z + zRotation;
        }
    }
    
    update(deltaTime, inputManager, mapSystem) {
        const move = inputManager.getMovementVector();
        const isMoving = move.x !== 0 || move.z !== 0;
        
        // Update animation
        this.updateAnimation(deltaTime, isMoving);
        
        if (isMoving) {
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
            const angle = Math.atan2(move.x, move.z) + Math.PI;
            this.mesh.rotation.y = angle;
        }
    }
    
    canInteractWith(tree) {
        return tree && !tree.isCut && tree.isWithinRange(this.position);
    }
}
