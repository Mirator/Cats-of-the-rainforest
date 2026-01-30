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
        
        // Base
        const baseGeometry = new THREE.CylinderGeometry(0.8, 1, 1, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.5;
        base.castShadow = true;
        group.add(base);
        
        // Middle section
        const middleGeometry = new THREE.CylinderGeometry(0.6, 0.8, 2, 8);
        const middleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const middle = new THREE.Mesh(middleGeometry, middleMaterial);
        middle.position.y = 2;
        middle.castShadow = true;
        group.add(middle);
        
        // Top (decorative)
        const topGeometry = new THREE.ConeGeometry(0.5, 1.5, 8);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 3.75;
        top.castShadow = true;
        group.add(top);
        
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
