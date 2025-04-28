createTerrain() {
    const positions = this.geometrySystem.geometry.attributes.position.array;
    const indices = this.geometrySystem.geometry.index.array;
    
    // Create heightfield data
    const elementSize = this.geometrySystem.worldSize / (this.geometrySystem.resolution - 1);
    const heights = [];
    
    // Extract heights from geometry
    for (let i = 0; i < this.geometrySystem.resolution; i++) {
        heights[i] = [];
        for (let j = 0; j < this.geometrySystem.resolution; j++) {
            const vertexIndex = (i * this.geometrySystem.resolution + j) * 3 + 1;
            heights[i][j] = positions[vertexIndex];
        }
    }

    // Create heightfield shape
    const heightfieldShape = new CANNON.Heightfield(heights, {
        elementSize: elementSize
    });

    // Create terrain body
    const terrainBody = new CANNON.Body({
        mass: 0,
        shape: heightfieldShape,
        material: this.groundMaterial
    });

    // Rotate and position the terrain body to match the visual terrain
    terrainBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    terrainBody.position.set(
        -this.geometrySystem.worldSize / 2,
        -this.geometrySystem.maxHeight / 2,
        this.geometrySystem.worldSize / 2
    );

    return terrainBody;
} 