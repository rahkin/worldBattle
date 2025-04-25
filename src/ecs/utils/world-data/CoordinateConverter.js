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
        this.scaleFactor = 1; // Real-world scale (meters)

        console.log('CoordinateConverter initialized:', {
            origin: { lat: this.originLat, lon: this.originLon },
            conversionFactors: {
                metersPerDegreeLat: this.metersPerDegreeLat,
                metersPerDegreeLon: this.metersPerDegreeLon
            },
            scaleFactor: this.scaleFactor
        });
    }

    validateCoordinates(lat, lon, height = 0) {
        const issues = [];
        
        if (typeof lat !== 'number' || isNaN(lat)) {
            issues.push(`Invalid latitude: ${lat}`);
        }
        if (typeof lon !== 'number' || isNaN(lon)) {
            issues.push(`Invalid longitude: ${lon}`);
        }
        if (typeof height !== 'number' || isNaN(height)) {
            issues.push(`Invalid height: ${height}`);
        }
        
        if (Math.abs(lat) > 90) {
            issues.push(`Latitude out of range [-90,90]: ${lat}`);
        }
        if (Math.abs(lon) > 180) {
            issues.push(`Longitude out of range [-180,180]: ${lon}`);
        }
        
        return issues;
    }

    // Get the origin position in local coordinates
    getOriginPosition() {
        return { x: 0, y: 0, z: 0 };
    }

    // Convert from WGS84 to local game coordinates (x-east, y-up, z-south)
    geoToLocal(lat, lon, height = 0) {
        const validationIssues = this.validateCoordinates(lat, lon, height);
        if (validationIssues.length > 0) {
            console.warn('Coordinate validation issues:', validationIssues);
            return { x: 0, y: 0, z: 0 };
        }

        // Calculate offsets in meters
        const latOffset = (lat - this.originLat) * this.metersPerDegreeLat;
        const lonOffset = (lon - this.originLon) * this.metersPerDegreeLon;
        
        // Apply scale and convert to game coordinates (real-world meters)
        const result = {
            x: lonOffset * this.scaleFactor, // East-west
            y: height * this.scaleFactor,    // Up-down
            z: -latOffset * this.scaleFactor // North-south (inverted for south = +z)
        };

        // Log conversion details for debugging
        console.log('Coordinate conversion:', {
            input: { lat, lon, height },
            offsets: { lat: latOffset, lon: lonOffset },
            output: result,
            scaleFactor: this.scaleFactor
        });

        return result;
    }

    // Convert from local game coordinates to WGS84
    localToGeo(x, y, z) {
        // Convert from local coordinates back to offset from origin
        const uncenteredX = x / this.scaleFactor;
        const uncenteredZ = -z / this.scaleFactor;
        
        // Calculate actual coordinates
        const result = {
            lon: this.originLon + (uncenteredX / this.metersPerDegreeLon),
            lat: this.originLat + (uncenteredZ / this.metersPerDegreeLat),
            height: y / this.scaleFactor
        };

        // Log conversion details for debugging
        console.log('Reverse coordinate conversion:', {
            input: { x, y, z },
            uncentered: { x: uncenteredX, z: uncenteredZ },
            output: result
        });

        return result;
    }

    // Calculate distance between two geographic points in meters
    getDistance(lat1, lon1, lat2, lon2) {
        const validationIssues1 = this.validateCoordinates(lat1, lon1);
        const validationIssues2 = this.validateCoordinates(lat2, lon2);
        
        if (validationIssues1.length > 0 || validationIssues2.length > 0) {
            console.warn('Distance calculation validation issues:', {
                point1: validationIssues1,
                point2: validationIssues2
            });
            return 0;
        }

        // Use Haversine formula for distance calculation
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        // Log distance calculation for debugging
        console.log('Distance calculation:', {
            points: {
                p1: { lat: lat1, lon: lon1 },
                p2: { lat: lat2, lon: lon2 }
            },
            deltas: { lat: dLat * 180/Math.PI, lon: dLon * 180/Math.PI },
            distance
        });

        return distance;
    }

    // Check if a point is within our 5km radius
    isInPlayArea(lat, lon) {
        const validationIssues = this.validateCoordinates(lat, lon);
        if (validationIssues.length > 0) {
            console.warn('Play area check validation issues:', validationIssues);
            return false;
        }

        const distance = this.getDistance(this.originLat, this.originLon, lat, lon);
        const inArea = distance <= 5000;

        console.log('Play area check:', {
            point: { lat, lon },
            distance,
            inArea
        });

        return inArea;
    }
} 