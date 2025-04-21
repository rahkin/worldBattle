/**
 * Converts geographic coordinates (longitude, latitude) to world coordinates (x, z) in meters
 * @param {[number, number]} coords - [longitude, latitude] coordinates
 * @param {[number, number]} origin - [longitude, latitude] of the origin point
 * @returns {[number, number]} - [x, z] coordinates in meters
 */
export function geographicToWorld([lng, lat], origin = [120.9822, 14.5086]) {
    // Earth's circumference at the equator is approximately 40,075 km
    // This gives us meters per degree at the equator
    const scale = 111319.9;
    
    // Convert to meters relative to origin
    const x = (lng - origin[0]) * scale;
    const z = (lat - origin[1]) * -scale; // Negative because we want positive Z to be north
    
    return [x, z];
}

/**
 * Converts world coordinates (x, z) in meters back to geographic coordinates
 * @param {[number, number]} coords - [x, z] coordinates in meters
 * @param {[number, number]} origin - [longitude, latitude] of the origin point
 * @returns {[number, number]} - [longitude, latitude] coordinates
 */
export function worldToGeographic([x, z], origin = [120.9822, 14.5086]) {
    const scale = 111319.9;
    const lng = (x / scale) + origin[0];
    const lat = (-z / scale) + origin[1];
    return [lng, lat];
} 