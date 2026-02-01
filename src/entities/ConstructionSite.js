import * as THREE from 'three';
import { VISUAL_CONFIG } from '../config/visual.js';

export class ConstructionSite {
    constructor(x, z, buildItem, y = 0) {
        this.position = new THREE.Vector3(x, y, z);
        this.buildItem = buildItem;
        this.mesh = null;
        this.progress = 0.0; // 0.0 to 1.0
        this.duration = 1.0; // 1 second
        this.isComplete = false;
        
        this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Dirt patch (base)
        const dirtGeometry = new THREE.CylinderGeometry(1.0, 1.0, 0.1, 16);
        const dirtMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x5a4a3a, // Brown dirt color
            flatShading: true
        });
        const dirt = new THREE.Mesh(dirtGeometry, dirtMaterial);
        dirt.position.y = 0.05;
        dirt.receiveShadow = true;
        group.add(dirt);
        
        // Wood piles (will be positioned dynamically based on progress)
        this.woodPiles = [];
        for (let i = 0; i < 3; i++) {
            const woodGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.6);
            const woodMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8b4513, // Brown wood color
                flatShading: true
            });
            const wood = new THREE.Mesh(woodGeometry, woodMaterial);
            wood.castShadow = true;
            this.woodPiles.push(wood);
            group.add(wood);
        }
        
        // Leaves (scattered)
        this.leaves = [];
        for (let i = 0; i < 5; i++) {
            const leafGeometry = new THREE.PlaneGeometry(0.2, 0.2);
            const leafMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x228b22, // Green leaf color
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            this.leaves.push(leaf);
            group.add(leaf);
        }
        
        const sizeScale = this.buildItem?.size ?? 1.0;
        group.scale.setScalar(sizeScale);

        group.position.copy(this.position);
        this.mesh = group;
        
        this.updateVisuals();
    }
    
    update(deltaTime) {
        if (this.isComplete) return;
        
        this.progress += deltaTime / this.duration;
        
        if (this.progress >= 1.0) {
            this.progress = 1.0;
            this.isComplete = true;
        }
        
        this.updateVisuals();
    }
    
    updateVisuals() {
        if (!this.mesh) return;
        
        // Position wood piles based on progress
        // Start scattered, move to center as construction progresses
        const baseAngle = Math.PI * 2 / this.woodPiles.length;
        const scatterRadius = 0.6 * (1.0 - this.progress);
        
        this.woodPiles.forEach((wood, index) => {
            const angle = baseAngle * index;
            const x = Math.cos(angle) * scatterRadius;
            const z = Math.sin(angle) * scatterRadius;
            wood.position.x = x;
            wood.position.z = z;
            wood.position.y = 0.15 + this.progress * 0.3; // Rise as construction progresses
            wood.rotation.y = angle + this.progress * Math.PI * 2; // Rotate during construction
        });
        
        // Position leaves randomly, fade out as construction progresses
        this.leaves.forEach((leaf, index) => {
            const angle = (Math.PI * 2 / this.leaves.length) * index;
            const radius = 0.8;
            leaf.position.x = Math.cos(angle) * radius;
            leaf.position.z = Math.sin(angle) * radius;
            leaf.position.y = 0.1 + Math.sin(index) * 0.1;
            leaf.rotation.y = angle;
            leaf.rotation.x = Math.PI / 2;
            
            // Fade out leaves as construction progresses
            if (leaf.material) {
                leaf.material.opacity = 0.7 * (1.0 - this.progress);
            }
        });
    }
    
    getMesh() {
        return this.mesh;
    }
    
    getPosition() {
        return this.position;
    }
    
    getProgress() {
        return this.progress;
    }
    
    isConstructionComplete() {
        return this.isComplete;
    }
    
    remove() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}
