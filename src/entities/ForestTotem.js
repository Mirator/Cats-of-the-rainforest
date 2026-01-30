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
        
        // Base (cube)
        const baseGeometry = new THREE.BoxGeometry(1, 1, 1);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.5; // Half of height (1/2)
        base.castShadow = true;
        group.add(base);
        
        // Middle section (cube)
        const middleGeometry = new THREE.BoxGeometry(0.8, 2, 0.8);
        const middleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const middle = new THREE.Mesh(middleGeometry, middleMaterial);
        middle.position.y = 2; // 1 (base top) + 1 (half of middle height)
        middle.castShadow = true;
        group.add(middle);
        
        // Top (decorative cube)
        const topGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.6);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 3.75; // 1 (base) + 2 (middle) + 0.75 (half of top height)
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
