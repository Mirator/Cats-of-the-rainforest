import * as THREE from 'three';

export class ForestTotem {
    constructor(x, z) {
        this.position = new THREE.Vector3(x, 0, z);
        this.health = 100;
        this.maxHealth = 100;
        this.mesh = null;
        
        this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Base platform (wider, more stable)
        const baseGeometry = new THREE.BoxGeometry(1.4, 0.6, 1.4);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, flatShading: true }); // Dark gray stone
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.3; // Half of height (0.6/2)
        base.castShadow = true;
        group.add(base);
        
        // Lower section (wider base of totem)
        const lowerGeometry = new THREE.BoxGeometry(1.0, 1.2, 1.0);
        const lowerMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, flatShading: true }); // Brown-gray stone
        const lower = new THREE.Mesh(lowerGeometry, lowerMaterial);
        lower.position.y = 1.2; // 0.6 (base top) + 0.6 (half of lower height)
        lower.castShadow = true;
        group.add(lower);
        
        // Middle section (main body)
        const middleGeometry = new THREE.BoxGeometry(0.85, 1.8, 0.85);
        const middleMaterial = new THREE.MeshStandardMaterial({ color: 0x6b5a4a, flatShading: true }); // Lighter brown-gray
        const middle = new THREE.Mesh(middleGeometry, middleMaterial);
        middle.position.y = 2.7; // 0.6 (base) + 1.2 (lower) + 0.9 (half of middle height)
        middle.castShadow = true;
        group.add(middle);
        
        // Upper section (narrower)
        const upperGeometry = new THREE.BoxGeometry(0.7, 1.4, 0.7);
        const upperMaterial = new THREE.MeshStandardMaterial({ color: 0x7b6a5a, flatShading: true }); // Even lighter
        const upper = new THREE.Mesh(upperGeometry, upperMaterial);
        upper.position.y = 4.0; // 0.6 + 1.2 + 1.8 + 0.7 (half of upper height)
        upper.castShadow = true;
        group.add(upper);
        
        // Top decorative piece (smaller, distinct)
        const topGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7a6a, flatShading: true }); // Lightest stone
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 5.0; // Previous sections + 0.4 (half of top height)
        top.castShadow = true;
        group.add(top);
        
        // Decorative accent cubes on sides (adds totem character)
        const accentMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2a1a, flatShading: true }); // Dark brown accent
        const accentSize = 0.15;
        
        // Add small decorative cubes on the middle section
        const accentPositions = [
            { x: 0.5, y: 2.7, z: 0 },   // Front
            { x: -0.5, y: 2.7, z: 0 },  // Back
            { x: 0, y: 2.7, z: 0.5 },   // Right
            { x: 0, y: 2.7, z: -0.5 }   // Left
        ];
        
        accentPositions.forEach(pos => {
            const accent = new THREE.Mesh(
                new THREE.BoxGeometry(accentSize, accentSize, accentSize),
                accentMaterial
            );
            accent.position.set(pos.x, pos.y, pos.z);
            accent.castShadow = true;
            group.add(accent);
        });
        
        group.position.copy(this.position);
        this.mesh = group;
    }
    
    getMesh() {
        return this.mesh;
    }
    
    getPosition() {
        return this.position;
    }
    
    getHealth() {
        return this.health;
    }
    
    getMaxHealth() {
        return this.maxHealth;
    }
    
    getHealthPercentage() {
        return this.health / this.maxHealth;
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    isDestroyed() {
        return this.health <= 0;
    }
}
