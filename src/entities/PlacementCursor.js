import * as THREE from 'three';

export class PlacementCursor {
    constructor() {
        this.position = new THREE.Vector3(0, 0, 0);
        this.mesh = null;
        this.isVisible = false;
        
        this.createMesh();
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Create a crosshair-style cursor
        // Horizontal line
        const horizontalGeometry = new THREE.BoxGeometry(1.0, 0.05, 0.05);
        const horizontalMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const horizontal = new THREE.Mesh(horizontalGeometry, horizontalMaterial);
        group.add(horizontal);
        
        // Vertical line
        const verticalGeometry = new THREE.BoxGeometry(0.05, 0.05, 1.0);
        const verticalMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const vertical = new THREE.Mesh(verticalGeometry, verticalMaterial);
        group.add(vertical);
        
        // Center dot
        const dotGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const dotMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, // Yellow center
            transparent: true,
            opacity: 0.9
        });
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.position.y = 0.1;
        group.add(dot);
        
        // Grid indicator (small square at grid position)
        const gridGeometry = new THREE.RingGeometry(0.4, 0.5, 16);
        const gridMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, // Cyan ring
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const gridRing = new THREE.Mesh(gridGeometry, gridMaterial);
        gridRing.rotation.x = -Math.PI / 2;
        gridRing.position.y = 0.01;
        group.add(gridRing);
        
        group.position.copy(this.position);
        this.mesh = group;
    }
    
    setPosition(x, z, y = 0) {
        this.position.x = x;
        this.position.z = z;
        this.position.y = y + 0.1; // Slightly above ground
        
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    setVisible(visible) {
        this.isVisible = visible;
        
        if (this.mesh) {
            this.mesh.visible = visible;
        }
    }
    
    getMesh() {
        return this.mesh;
    }
    
    remove() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}
