import { useState, useCallback, useEffect } from "react";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import "./App.css";
import toast, { Toaster } from "react-hot-toast";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
  InfoWindow,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { FaSun, FaMoon } from "react-icons/fa";
import SOSButton from './components/SOSButton';
import UserLogin from './components/UserLogin';

const containerStyle = {
  width: "100%",
  height: "600px",
};

const center = {
  lat: 15.496777,
  lng: 73.827827,
};

const currentMonth = new Date().getMonth();

const isValidLocation = (loc) => {
  return loc && typeof loc === 'string' && loc.trim() !== '';
};

const formatLocation = (loc) => {
  if (!loc) return null;
  return loc.trim().toLowerCase().includes('goa') ? loc : `${loc}, Goa, India`;
};

// Add this simple helper function to clean location names
const cleanLocationText = (text) => {
  if (!text) return '';
  return text
    .replace(/, Goa(?:, India)?$/i, '')
    .trim();
};

function App() {
  const [mess, setmess] = useState("");
  const [place, setplace] = useState("");
  const [dest, setdest] = useState("");
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [Distance, setDistance] = useState(null);
  const [Duration, setDuration] = useState(null);
  const [placesOnRoute, setPlacesOnRoute] = useState([]);
  const [backendResponse, setBackendResponse] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [timeRange, setTimeRange] = useState(1); // Default to 1 month
  const [userLocationDefined, setuserLocationDefined] = useState(null);
  const [userLocationPlace, setUserLocationPlace] = useState(""); // Store the place name of user location
  const [test, settest] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [waypoints, setWaypoints] = useState([]);
  const [isAttractionsMinimized, setIsAttractionsMinimized] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark-mode", !darkMode);
  };

  const reverseGeocodeLocation = (location) => {
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location }, (results, status) => {
      settest(results);
      if (status === "OK" && results[0]) {
        console.log("Geocoder results: ", results);
        setUserLocationPlace(results[0].formatted_address);
      } else {
        console.error("Geocoder failed due to: " + status);
      }
    });
  };

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyB2rs0uDLILULcxJmljxKGUBHh9uoY-Wt8",
    libraries: ["places"],
  });

  useEffect(() => {
    if (!isLoaded) return;

    const getUserLocation = async () => {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
      } catch (error) {
        console.log('Location access not granted or error:', error);
        // Don't set error, just continue without location
      } finally {
        setIsMapLoading(false);
      }
    };

    getUserLocation();
  }, [isLoaded]);

  console.log("user is staying at", userLocationPlace);
  const [map, setMap] = useState(null);

  const onLoad = useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);

    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && directionsResponse) {
      const routeBounds = directionsResponse.routes[0].bounds;
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        bounds: routeBounds,
        type: "tourist_attraction",
      };
      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setPlacesOnRoute(results);
        }
      });
    }
  }, [map, directionsResponse]);

  const filteredFestivals = backendResponse.filter((placeObj) => {
    if (placeObj.date && placeObj.date.seconds) {
      const eventDate = new Date(placeObj.date.seconds * 1000);
      const currentDate = new Date();
      const diffMonths =
        (eventDate.getFullYear() - currentDate.getFullYear()) * 12 +
        (eventDate.getMonth() - currentDate.getMonth());

      if (timeRange === "all") {
        return true;
      }
      return diffMonths <= timeRange;
    }
    return false;
  });
  //this call firestore function
  async function getDestinations(db) {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const response = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        response.push({
          ...data,
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
          name: doc.id,
        });
      });
      setBackendResponse(response);

      console.log("backendResponse", response);
      console.log("user loc", userLocation);
    } catch (e) {
      console.error("Error getting documents: ", e);
    }
  }

  const extractLocations = (text) => {
    // Clean up the text
    const cleanText = text.toLowerCase()
      .replace(/i want to go to|take me to|how to reach|route to/g, '')
      .replace(/then|after that|and then|next/g, ',')
      .trim();

    // Split by commas or 'to' to get multiple destinations
    const locations = cleanText.split(/,|\sto\s/)
      .map(loc => loc.trim())
      .filter(loc => loc.length > 0);

    // Check if text contains "from" or "i am at" to get starting point
    const fromMatch = text.toLowerCase().match(/(?:from|i am at)\s+([^,]+)/);
    const startingPoint = fromMatch ? fromMatch[1].trim() : 'current';

    if (locations.length === 0) return null;

    return {
      place: startingPoint,
      destinations: locations
    };
  };

  async function run() {
    try {
      toast.loading('Planning your route...');
    getDestinations(db);
      
      const locationInfo = extractLocations(mess);
      if (!locationInfo) {
        throw new Error('Could not understand the destinations');
      }

      // Set starting point
      if (locationInfo.place === 'current') {
        if (userLocation) {
          setplace(`${userLocation.lat},${userLocation.lng}`);
        } else {
          setplace('Navelim, Goa'); // Default to Navelim if no location
        }
      } else {
        setplace(locationInfo.place + " Goa");
      }
      
      // Set destinations
      const formattedDestinations = locationInfo.destinations.map(dest => dest + " Goa");
      setDestinations(formattedDestinations);
      setdest(formattedDestinations[0]); // Set first destination
      
      // Create waypoints for remaining destinations
      const waypointsList = formattedDestinations.slice(1).map(dest => ({
        location: dest,
        stopover: true
      }));
      setWaypoints(waypointsList);
      
      toast.dismiss();
      toast.success('Route planned! Click "Show Route" to view.');
    } catch (error) {
      console.error('Error in run function:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to process your request');
    }
  }

  const calculateRoute = async () => {
    if (!place || destinations.length === 0) {
      toast.error('Please enter starting point and at least one destination');
      return;
    }

    try {
      toast.loading('Calculating route and finding attractions...');
      const directionsService = new google.maps.DirectionsService();
      
      const origin = place.includes(',') ? place : `${place}, Goa, India`;
      const destination = `${destinations[destinations.length - 1]}, Goa, India`;

      const results = await directionsService.route({
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      setDirectionsResponse(results);
      
      // Calculate total distance and duration
      let totalDistance = 0;
      let totalDuration = 0;
      results.routes[0].legs.forEach(leg => {
        totalDistance += leg.distance.value;
        totalDuration += leg.duration.value;
      });

      setDistance(`${(totalDistance / 1000).toFixed(1)} km`);
      setDuration(formatDuration(totalDuration));

      // Find tourist attractions along the route
      if (map) {
        const bounds = results.routes[0].bounds;
        const service = new google.maps.places.PlacesService(map);
        
        const request = {
          bounds: bounds,
          type: ['tourist_attraction'],
          rankBy: google.maps.places.RankBy.RATING
        };

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Sort by rating and limit to top 6
            const sortedPlaces = results
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 6);
            setPlacesOnRoute(sortedPlaces);
          }
        });
      }

      // Adjust map to show the entire route
      if (map && results.routes[0].bounds) {
        map.fitBounds(results.routes[0].bounds);
      }

      toast.dismiss();
      toast.success('Route and attractions found!');
    } catch (error) {
      console.error('Direction Service Error:', error);
      toast.dismiss();
      toast.error('Could not calculate route. Please check the locations and try again.');
    }
  };

  // Helper function to format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
  };

  const handleUserLogin = (userData) => {
    try {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success(`Welcome ${userData.name}!`);
    } catch (error) {
      console.error('Error in handleUserLogin:', error);
      toast.error('Failed to complete login');
    }
  };

  // Load saved user data
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading saved user:', error);
      localStorage.removeItem('user');
    }
  }, []);

  useEffect(() => {
    // Check if Google Maps is loaded and user location is available
    if (isLoaded && userLocation) {
      setIsLoading(false);
    }
  }, [isLoaded, userLocation]);

  const handleAttractionClick = (attraction) => {
    if (map) {
      map.panTo(attraction.geometry.location);
      map.setZoom(15);
      setActiveMarker(attraction.place_id);
    }
  };

  if (loadError) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: 'red' 
      }}>
        Error loading maps. Please try again later.
      </div>
    );
  }

  if (isMapLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: '1rem',
        background: darkMode ? '#1a1a1a' : '#ffffff',
        color: darkMode ? '#ffffff' : '#1a1a1a'
      }}>
        <div>Loading Maps...</div>
        <div style={{ fontSize: '0.9rem' }}>Location access is optional</div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: 'red' 
      }}>
        {mapError}
      </div>
    );
  }

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="header">
        <h1>Explore Goa</h1>
        <p>Discover the beauty of beaches, culture, and adventure</p>
      </div>
      <div>
        <Toaster />
      </div>
      <button className="toggle-button" onClick={toggleDarkMode}>
        {darkMode ? <FaSun /> : <FaMoon />}
      </button>
      {!user ? (
        <UserLogin onLogin={handleUserLogin} />
      ) : (
        <>
      <div className="form-container">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!mess.trim()) {
                toast.error('Please enter your destination');
                return;
              }
              run();
            }}>
          <input
            className="input-field"
            type="text"
                placeholder="Tell me your travel plan (e.g., 'I am at Navelim, want to go to Quepem then Ponda')"
                value={mess}
            onChange={(e) => setmess(e.target.value)}
          />
          <button
            className="submit-button"
                type="submit"
          >
            Find Route
          </button>
        </form>
        <div className="filter-buttons">
          {[1, 2, 5, 10, "all"].map((range) => (
            <button
              key={range}
              className={`filter-button ${timeRange === range ? "active" : ""}`}
              onClick={() => setTimeRange(range)}
            >
              {range === "all"
                ? "All Events"
                : `${range} ${range === 1 ? "Month" : "Months"}`}
            </button>
          ))}
        </div>
      </div>

      <div className="info-container">
        <div className="info-text">
          <div className="route-stop">
            <div className="stop-number">S</div>
          <div>
              <span className="info-label">Starting Point:</span>
              <div>{cleanLocationText(place)}</div>
            </div>
          </div>
          
          {destinations.map((dest, index) => (
            <div key={index} className="route-stop">
              <div className="stop-number">{index === destinations.length - 1 ? 'F' : (index + 1)}</div>
          <div>
                <span className="info-label">
                  {index === destinations.length - 1 ? 'Final Destination' : `Stop ${index + 1}`}:
                </span>
                <div>{cleanLocationText(dest)}</div>
              </div>
          </div>
          ))}

          {Distance && Duration && (
            <>
          <div>
                <span className="info-label">Total Distance:</span> {Distance}
          </div>
          <div>
                <span className="info-label">Total Duration:</span> {Duration}
          </div>
            </>
          )}
        </div>

        {placesOnRoute.length > 0 && (
          <div className={`floating-attractions ${isAttractionsMinimized ? 'minimized' : ''}`}>
            <div className="attractions-header">
              <h3 className="attractions-title">
                {isAttractionsMinimized ? '🎯' : 'Tourist Attractions'}
              </h3>
              <button 
                className="minimize-button"
                onClick={() => setIsAttractionsMinimized(!isAttractionsMinimized)}
              >
                {isAttractionsMinimized ? '↔' : '←'}
              </button>
            </div>
            
            <div className="attractions-content">
              {placesOnRoute.map((place, index) => (
                <div 
                  key={index} 
                  className="attraction-item"
                  onClick={() => handleAttractionClick(place)}
                >
                  {place.photos && (
                    <img 
                      src={place.photos[0].getUrl()}
                      alt={place.name}
                      className="attraction-thumbnail"
                    />
                  )}
                  <div className="attraction-info">
                    <div className="attraction-name">{place.name}</div>
                    <div className="attraction-rating">
                      <span>★ {place.rating || 'N/A'}</span>
                      <span>•</span>
                      <span>{place.user_ratings_total || 0} reviews</span>
                </div>
              </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        className="tap-button"
            onClick={calculateRoute}
            disabled={!place || destinations.length === 0}
      >
        Show Route
      </button>

      <div className="map-container">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            <Marker
              position={userLocation}
              icon={{
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                scaledSize: new window.google.maps.Size(40, 40),
              }}
            />

            {filteredFestivals.map((placeObj, idx) => (
              <Marker
                key={idx + 10000}
                onClick={() => console.log("clicked")}
                onMouseOver={() => setActiveMarker(idx + 10000)}
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
                onMouseOut={() => setActiveMarker(null)}
                position={{
                  lat: parseFloat(placeObj.lat),
                  lng: parseFloat(placeObj.lng),
                }}
              >
                {activeMarker === idx + 10000 && (
                  <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                    <div className="info-window">
                      <img
                        src={placeObj.imageUrl || "default-image-url.jpg"}
                        alt={placeObj.name}
                        className="info-window-image"
                      />
                      <div className="info-window-text">
                        <h3>{placeObj.name}</h3>
                        <p>{placeObj.description}</p>
                        <div className="info-window-rating">
                          <span className="star">★</span>
                          <span>{placeObj.rating || "N/A"}</span>
                        </div>
                        <p>
                          Date:{" "}
                          {placeObj.date && (
                            <span>
                              {new Date(
                                placeObj.date.seconds * 1000
                              ).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            ))}

            {placesOnRoute.map((placeObj, idx) => (
              <Marker
                    key={placeObj.place_id || idx}
                    onClick={() => setActiveMarker(placeObj.place_id)}
                position={placeObj.geometry.location}
                    animation={activeMarker === placeObj.place_id ? window.google.maps.Animation.BOUNCE : null}
              >
                    {activeMarker === placeObj.place_id && (
                  <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                    <div className="info-window">
                      <img
                        src={
                          placeObj.photos && placeObj.photos.length > 0
                            ? placeObj.photos[0].getUrl()
                            : "default-image-url.jpg"
                        }
                        alt={placeObj.name}
                        className="info-window-image"
                      />
                      <div className="info-window-text">
                        <h3>{placeObj.name}</h3>
                        <div className="info-window-rating">
                          <span className="star">★</span>
                          <span>{placeObj.rating || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            ))}

            {directionsResponse && (
              <DirectionsRenderer directions={directionsResponse} />
            )}

                {user && (
                  <SOSButton user={user} userLocation={userLocation} />
            )}
          </GoogleMap>
        ) : (
          <>loading</>
        )}
      </div>
        </>
      )}
    </div>
  );
}

export default App;
