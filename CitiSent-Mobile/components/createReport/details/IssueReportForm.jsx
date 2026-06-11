import { useEffect, useState, useRef } from "react";
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import * as Location from "expo-location";
import { Colors } from "../../../modules/shared";

const ST_LAT_MIN = 13.9796305;
const ST_LAT_MAX = 14.1473362;
const ST_LON_MIN = 121.1250228;
const ST_LON_MAX = 121.2319705;

export function isWithinStoTomas(lat, lon) {
  if (lat == null || lon == null) return false;
  return lat >= ST_LAT_MIN && lat <= ST_LAT_MAX && lon >= ST_LON_MIN && lon <= ST_LON_MAX;
}

export default function IssueReportForm({
  requestType,
  issueLocation,
  report,
  onChangeIssueLocation,
  onChangeReport,
  onInputLayout,
  onInputFocus,
  onReportSizeChange,
  // New props for coordinates and coordinate status
  latitude,
  longitude,
  onLocationSelected,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [validationError, setValidationError] = useState("");
  const debounceTimer = useRef(null);

  // Run validation on location changes
  useEffect(() => {
    if (issueLocation && latitude && longitude) {
      if (!isWithinStoTomas(Number(latitude), Number(longitude))) {
        setValidationError("The selected location is outside Sto. Tomas City, Batangas.");
      } else {
        setValidationError("");
      }
    } else if (issueLocation && (!latitude || !longitude)) {
      setValidationError("Please select a verified location from the suggestions.");
    } else {
      setValidationError("");
    }
  }, [issueLocation, latitude, longitude]);

  // Fetch autocomplete suggestions from Nominatim restricted to Sto. Tomas bounding box
  const fetchSuggestions = (text) => {
    if (!text || text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    // Restrict using viewbox (lon_min, lat_min, lon_max, lat_max) and bounded=1
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      text
    )}+Sto.+Tomas+Batangas+Philippines&format=json&viewbox=${ST_LON_MIN},${ST_LAT_MIN},${ST_LON_MAX},${ST_LAT_MAX}&bounded=1&limit=5&addressdetails=1`;

    fetch(url, {
      headers: {
        "User-Agent": "CitiSent-Mobile/1.0 (Location autocomplete filter)",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // Ensure suggestion coordinates are validated within Sto. Tomas boundary
        const filtered = (data || []).filter((item) =>
          isWithinStoTomas(Number(item.lat), Number(item.lon))
        );
        setSuggestions(filtered);
      })
      .catch((err) => console.error("Suggestions fetch error:", err))
      .finally(() => setLoadingSuggestions(false));
  };

  const handleLocationTextChange = (text) => {
    onChangeIssueLocation(text);
    // Reset coordinates since the user is typing manually
    onLocationSelected(text, null, null);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 400);
  };

  const handleSelectSuggestion = (item) => {
    const displayName = item.display_name
      .replace(", Batangas, Calabarzon, Philippines", "")
      .replace(", Philippines", "");

    onLocationSelected(displayName, Number(item.lat), Number(item.lon));
    setSuggestions([]);
  };

  const handleUseCurrentLocation = async () => {
    setLoadingGps(true);
    setValidationError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setValidationError("Permission to access location was denied.");
        setLoadingGps(false);
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude: lat, longitude: lon } = locationResult.coords;

      if (!isWithinStoTomas(lat, lon)) {
        setValidationError("Your current location is outside Sto. Tomas City, Batangas.");
        setLoadingGps(false);
        return;
      }

      // Reverse geocode to get a readable address name
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });

      let address = "Sto. Tomas City, Batangas";
      if (reverseGeocode && reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const parts = [
          place.name,
          place.street,
          place.district || place.subregion,
          place.city || place.subregion,
        ].filter(Boolean);
        address = parts.join(", ") || address;
      }

      onLocationSelected(address, lat, lon);
    } catch (error) {
      console.error("GPS error:", error);
      setValidationError("Failed to get your location. Please try again.");
    } finally {
      setLoadingGps(false);
    }
  };

  return (
    <View>
      <View className="mb-5">
        <Text className="mb-2 text-sm font-semibold" style={{ color: Colors.text.fieldLabel }}>
          Issue Type
        </Text>
        <View
          className="rounded-lg border px-3 py-3"
          style={{ borderColor: Colors.border, backgroundColor: Colors.background }}
        >
          <Text className="text-base" style={{ color: Colors.text.primary }}>
            {requestType}
          </Text>
        </View>
      </View>

      <View className="mb-5" onLayout={(e) => onInputLayout?.("issueLocation", e.nativeEvent.layout.y)}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-semibold" style={{ color: Colors.text.fieldLabel }}>
            Issue Location
          </Text>
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            disabled={loadingGps}
            className="flex-row items-center bg-blue-50 px-2 py-1 rounded-md"
            style={{ backgroundColor: Colors.cardBg }}
          >
            {loadingGps ? (
              <ActivityIndicator size="small" color={Colors.primary} className="mr-1" />
            ) : null}
            <Text className="text-xs font-semibold" style={{ color: Colors.primary }}>
              Use My Current Location
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={issueLocation}
          onChangeText={handleLocationTextChange}
          onFocus={() => onInputFocus?.("issueLocation")}
          placeholder="Enter issue location (e.g. Barangay San Jose)"
          className="rounded-lg border px-3 py-3 text-base"
          style={{
            borderColor: Colors.border,
            color: Colors.text.primary,
            backgroundColor: Colors.background,
          }}
          placeholderTextColor={Colors.icon.muted}
        />

        {validationError ? (
          <Text className="mt-1.5 text-xs font-semibold text-red-500">
            ⚠️ {validationError}
          </Text>
        ) : latitude && longitude ? (
          <Text className="mt-1.5 text-xs font-semibold text-green-600">
            ✓ Verified Location (Sto. Tomas City, Batangas)
          </Text>
        ) : null}

        {loadingSuggestions ? (
          <View className="mt-2 p-2">
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : null}

        {suggestions.length > 0 ? (
          <View
            className="border rounded-lg mt-2 overflow-hidden"
            style={{ borderColor: Colors.border, backgroundColor: Colors.background }}
          >
            {suggestions.map((item, index) => {
              const displayName = item.display_name
                .replace(", Batangas, Calabarzon, Philippines", "")
                .replace(", Philippines", "");

              return (
                <TouchableOpacity
                  key={item.place_id || index}
                  onPress={() => handleSelectSuggestion(item)}
                  className="p-3 border-b"
                  style={{ borderBottomColor: Colors.border }}
                >
                  <Text className="text-sm font-medium" style={{ color: Colors.text.primary }}>
                    {displayName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>

      <View className="mb-5" onLayout={(e) => onInputLayout?.("report", e.nativeEvent.layout.y)}>
        <Text className="mb-2 text-sm font-semibold" style={{ color: Colors.text.fieldLabel }}>
          Report
        </Text>
        <TextInput
          value={report}
          onChangeText={onChangeReport}
          onFocus={() => onInputFocus?.("report")}
          onContentSizeChange={onReportSizeChange}
          placeholder="Describe the issue (at least 10 characters)"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          className="rounded-lg border px-3 py-3 text-base min-h-[120px]"
          style={{
            borderColor: Colors.border,
            color: Colors.text.primary,
            backgroundColor: Colors.background,
          }}
          placeholderTextColor={Colors.icon.muted}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
}
