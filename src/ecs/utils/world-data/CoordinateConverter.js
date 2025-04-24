// Simple coordinate converter for mapping geographic coordinates to local game space
export class CoordinateConverter {
    constructor() {
        // NAIA Airport coordinates as origin
        this.originLat = 14.5086;
        this.originLon = 121.0194;
        
        // Approximate conversion factors
        // At the equator, 1 degree of longitude ≈ 111.32 km
        // 1 degree of latitude ≈ 110.57 km
        this.metersPerDegreeLat = 110570;
        this.metersPerDegreeLon = 111320 * Math.cos(this.originLat * Math.PI / 180);
        
        // Scale factor to make world more compact for gameplay
        this.scaleFactor = 10; // 1/10th real world scale
    }

    // Convert from WGS84 to local game coordinates (x-east, y-up, z-south)
    geoToLocal(lat, lon, height = 0) {
        // Calculate offsets in meters
        const latOffset = (lat - this.originLat) * this.metersPerDegreeLat;
        const lonOffset = (lon - this.originLon) * this.metersPerDegreeLon;
        
        // Apply scale and convert to game coordinates
        // Note: In our game, +x is east, +y is up, and +z is south
        return {
            x: lonOffset * this.scaleFactor, // East-west
            y: height * this.scaleFactor,    // Up-down
            z: -latOffset * this.scaleFactor // North-south (inverted for south = +z)
        };
    }

    // Convert from local game coordinates to WGS84
    localToGeo(x, y, z) {
        // Convert from game scale back to real-world meters
        const lonOffset = x / this.scaleFactor;
        const height = y / this.scaleFactor;
        const latOffset = -z / this.scaleFactor; // Note the negative for north-south conversion
        
        // Calculate actual coordinates
        const lon = this.originLon + (lonOffset / this.metersPerDegreeLon);
        const lat = this.originLat + (latOffset / this.metersPerDegreeLat);
        
        return { lat, lon, height };
    }

    // Calculate distance between two geographic points in meters
    getDistance(lat1, lon1, lat2, lon2) {
        // Use Haversine formula for distance calculation
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Check if a point is within our 5km radius
    isInPlayArea(lat, lon) {
        const distance = this.getDistance(this.originLat, this.originLon, lat, lon);
        return distance <= 5000; // 5km radius
    }
} 