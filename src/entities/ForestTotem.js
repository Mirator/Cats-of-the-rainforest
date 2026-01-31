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
        
        // Single tall cube totem
        const totemGeometry = new THREE.BoxGeometry(1.0, 5.0, 1.0);
        const totemMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, flatShading: true }); // Brown-gray stone
        const totem = new THREE.Mesh(totemGeometry, totemMaterial);
        totem.position.y = 2.5; // Half of height (5.0/2)
        totem.castShadow = true;
        group.add(totem);
        
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
    
    getInfluenceRadius() {
        return 15.0; // 15 units influence radius
    }
}
