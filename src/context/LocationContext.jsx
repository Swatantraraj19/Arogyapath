
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState(null);
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 🌍 LOAD GOOGLE MAPS SDK (Only once for the whole app)
  useEffect(() => {
    if (window.google?.maps?.places) {
      if (!autocompleteService) setAutocompleteService(new window.google.maps.places.AutocompleteService());
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-sdk";
    // 🚀 Fixed: Added loading=async and callback to follow best practices
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&loading=async&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    window.initGoogleMaps = () => {
      if (window.google?.maps?.places) setAutocompleteService(new window.google.maps.places.AutocompleteService());
    };

    if (!document.getElementById("google-maps-sdk")) document.head.appendChild(script);
  }, [GOOGLE_API_KEY]);

  // 📍 MANUAL DETECT LOCATION
  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
          );
          const data = await response.json();
          
          let detectedCity = null;
          if (data.results && data.results.length > 0) {
            const addressComponents = data.results[0].address_components;
            const cityObj = addressComponents.find(c => 
              c.types.includes("locality") || c.types.includes("administrative_area_level_2")
            );
            detectedCity = cityObj?.long_name;
          }
          
          if (detectedCity) {
            setSelectedCity(detectedCity);
            toast.success(`Location: ${detectedCity}`, { icon: "📍" });
          }
        } catch (error) {
          toast.error("Could not detect city");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        toast.error("Location access denied");
        setIsLocating(false);
      }
    );
  };

  // 🔍 SEARCH LOGIC (With Debounce to save API hits)
  const searchTimeout = useRef(null);
  const searchCities = (input) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (!input.trim() || !autocompleteService) {
      setPredictions([]);
      return;
    }

    searchTimeout.current = setTimeout(() => {
      autocompleteService.getPlacePredictions(
        { input, types: ["(regions)"], componentRestrictions: { country: "in" } },
        (results, status) => {
          setPredictions(status === "OK" ? results : []);
        }
      );
    }, 400);
  };

  return (
    <LocationContext.Provider value={{ 
      selectedCity, 
      setSelectedCity, 
      predictions, 
      setPredictions,
      isLocating, 
      handleDetectLocation, 
      searchCities 
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocation must be used within a LocationProvider");
  return context;
};
