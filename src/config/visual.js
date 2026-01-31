// Visual constants
export const VISUAL_CONFIG = {
    // Model scales
    playerScale: 0.5,
    catScale: 0.5,
    mouseScale: 0.5,
    treeScale: 0.5,
    totemScale: 1.0,
    catDenScale: 1.0,
    towerScale: 0.75,
    
    // Y offsets
    defaultYOffset: 0.5,
    
    // Placeholder colors
    playerPlaceholderColor: 0xff8c42,
    catPlaceholderColor: 0xff8c42,
    mousePlaceholderColor: 0x8b7355,
    treePlaceholderColor: 0x228b22,
    towerPlaceholderColor: 0x6a5a4a,
    catDenPlaceholderColor: 0x8b7355,
    totemPlaceholderColor: 0x5a4a3a,
    
    // Camera settings
    cameraOffset: { x: 0, y: 9, z: 9 },
    cameraSlowdownZone: 22.5, // Start slowing down 22.5 units before boundary
    cameraBaseLerpSpeed: 0.1,
    
    // Scene colors
    dayBackground: 0x5a7c69,
    nightBackground: 0x344437,
    dayFogColor: 0x5a7c69,
    nightFogColor: 0x344437,
    dayFogNear: 37.5,
    dayFogFar: 150,
    nightFogNear: 22.5,
    nightFogFar: 112.5,
    dayGroundColor: 0x4a7c59,
    nightGroundColor: 0x2f4338,
    dayExtendedGroundColor: 0x3a5c49,
    nightExtendedGroundColor: 0x28392f,
    
    // Lighting
    dayAmbientIntensity: 0.6,
    dayDirectionalIntensity: 0.8,
    nightAmbientIntensity: 0.32,
    nightDirectionalIntensity: 0.45,
    
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
