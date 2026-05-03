import type { WorkLocation } from "@/lib/types";

const EARTH_RADIUS_METERS = 6371000;

export type GeoPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type LocationMatch = {
  location: WorkLocation;
  distanceMeters: number;
  isInside: boolean;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceInMeters(a: GeoPoint, b: GeoPoint) {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function findNearestLocation(point: GeoPoint, locations: WorkLocation[]) {
  if (!locations.length) {
    return null;
  }

  return locations.reduce<LocationMatch | null>((nearest, location) => {
    const distanceMeters = distanceInMeters(point, {
      latitude: Number(location.latitude),
      longitude: Number(location.longitude)
    });

    const match = {
      location,
      distanceMeters,
      isInside: distanceMeters <= Number(location.radius_meters)
    };

    if (!nearest || match.distanceMeters < nearest.distanceMeters) {
      return match;
    }

    return nearest;
  }, null);
}

export function readBrowserPosition() {
  return new Promise<GeoPoint>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("المتصفح لا يدعم قراءة الموقع الجغرافي."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      () => {
        reject(new Error("تعذر قراءة الموقع. تأكد من السماح للمتصفح بالوصول إلى الموقع."));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 15000
      }
    );
  });
}
