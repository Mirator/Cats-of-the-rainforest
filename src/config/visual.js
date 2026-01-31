// Visual constants
export const VISUAL_CONFIG = {
    // Model scales
    playerScale: 0.5,
    catScale: 0.5,
    mouseScale: 0.5,
    treeScale: 0.5,
    
    // Y offsets
    defaultYOffset: 0.5,
    
    // Placeholder colors
    playerPlaceholderColor: 0xff8c42,
    catPlaceholderColor: 0xff8c42,
    mousePlaceholderColor: 0x8b7355,
    treePlaceholderColor: 0x228b22,
    towerPlaceholderColor: 0x6a5a4a,
    catDenPlaceholderColor: 0x8b7355,
    
    // Camera settings
    cameraOffset: { x: 0, y: 12, z: 12 },
    cameraSlowdownZone: 30, // Start slowing down 30 units before boundary
    cameraBaseLerpSpeed: 0.1,
    
    // Scene colors
    dayBackground: 0x5a7c69,
    nightBackground: 0x2a3a2a,
    dayFogColor: 0x5a7c69,
    nightFogColor: 0x2a3a2a,
    dayFogNear: 50,
    dayFogFar: 200,
    nightFogNear: 30,
    nightFogFar: 150,
    
    // Lighting
    dayAmbientIntensity: 0.6,
    dayDirectionalIntensity: 0.8,
    nightAmbientIntensity: 0.2,
    nightDirectionalIntensity: 0.3,
    
    // Day/Night transitions
    transitionDuration: 2.0, // seconds for smooth day/night transitions
    
    // Screenshot system
    screenshot: {
        cameraTransitionDuration: 2.0, // seconds to transition camera to map view
        captureDelay: 0.5 // seconds to wait after camera transition before capture
    },
    
    // Visual feedback effects
    effects: {
        treeCutDuration: 1.0, // seconds
        treeCutParticleCount: 8,
        treeCutColor: 0x228b22, // Green particles
        
        catSpawnDuration: 1.5, // seconds
        catSpawnParticleCount: 12,
        catSpawnColor: 0xff8c42, // Orange particles
        
        buildingCompleteDuration: 1.5, // seconds
        buildingCompleteParticleCount: 15,
        buildingCompleteColor: 0xffd700, // Gold particles
        
        enemyDeathDuration: 0.8, // seconds
        enemyDeathParticleCount: 10,
        enemyDeathColor: 0x8b7355 // Brown particles
    }
};
