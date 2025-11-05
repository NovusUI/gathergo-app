import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useState } from "react";

export function useLocationManager() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async (force = false) => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();

      // If never asked or forced (like toggle on)
      if (status !== "granted") {
        const res = await Location.requestForegroundPermissionsAsync();
        status = res.status;
      }

      if (status !== "granted") {
        setError("Permission denied");
        return null;
      }

      const services = await Location.hasServicesEnabledAsync();
      if (!services) {
        setError("Please enable GPS in settings");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coordsObj = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setCoords(coordsObj);
      setError(null);
      return coordsObj;
    } catch (e) {
      setError("Failed to get location");
      return null;
    }
  };

  const openSettings = () => Linking.openSettings();

  return { coords, error, requestLocation, openSettings };
}
