export const searchLocation = async (query) => {
  // Search restricted to Tunisia (countrycodes=tn)
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=tn`);
  const data = await res.json();
  return data;
};

export const reverseGeocode = async (lat, lon) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
  const data = await res.json();
  return data;
};
