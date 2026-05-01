/**
 * Calculates distance between two lat/lng points using the Haversine formula.
 * Returns distance in meters.
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const GeofenceService = {
  /**
   * Returns true if the given location is inside the geofence.
   * @param {object} location - { latitude, longitude }
   * @param {object} geofence - { latitude, longitude, radius } (radius in meters)
   */
  isInsideGeofence: (location, geofence) => {
    if (!location || !geofence) return true; // Default safe if no data
    const distance = haversineDistance(
      location.latitude,
      location.longitude,
      geofence.latitude,
      geofence.longitude
    );
    return distance <= geofence.radius;
  },

  /**
   * Returns distance in meters from location to geofence center.
   */
  distanceToCenter: (location, geofence) => {
    if (!location || !geofence) return 0;
    return haversineDistance(
      location.latitude,
      location.longitude,
      geofence.latitude,
      geofence.longitude
    );
  },

  /**
   * Returns distance to nearest safe point and the point itself.
   */
  getNearestSafePoint: (location, safePoints) => {
    if (!location || !safePoints || safePoints.length === 0) return null;
    let nearest = null;
    let minDist = Infinity;
    for (const point of safePoints) {
      const dist = haversineDistance(
        location.latitude, location.longitude,
        point.latitude, point.longitude
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = { ...point, distance: Math.round(dist) };
      }
    }
    return nearest;
  },

  /**
   * Returns compass bearing from location to target point (0–360 degrees).
   */
  getBearing: (from, to) => {
    const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  },
};

export default GeofenceService;
