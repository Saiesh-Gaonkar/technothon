import { useState, useCallback } from "react";
import { geminiModel } from "./firebase";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";
import './App.css'; // Import the CSS file for styling

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 15.496777,
  lng: 73.827827,
};

async function calculateRoute() {
  console.log("calculating");
}

function App() {
  const [mess, setmess] = useState("");
  const [place, setplace] = useState("");
  const [dest, setdest] = useState("");
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [Distance, setDistance] = useState(null);
  const [Duration, setDuration] = useState(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyB2rs0uDLILULcxJmljxKGUBHh9uoY-Wt8",
    libraries: ["places"],
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  async function run() {
    alert("run is running", mess);
    const prompt = `${mess} just generate me json of keywords from the given text of place and destination in this way "{
      "place": "Savordem",
      "destination": "Ponda"
    }"`;
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const txt = text.slice(7, -4);
    const obj = JSON.parse(txt);
    setplace(obj.place);
    setdest(obj.destination);
  }

  return (
    <div className="app-container">
      <div className="form-container">
        <form>
          <input
            className="input-field"
            type="text"
            placeholder="Enter your prompt"
            onChange={(e) => setmess(e.target.value)}
          />
          <button
            className="submit-button"
            onClick={(e) => {
              e.preventDefault();
              run();
            }}
          >
            SUBMIT
          </button>
        </form>
      </div>
      <div className="info-container">
        <p>
          Place: {place} | Destination: {dest} | Distance: {Distance} | Duration: {Duration}
        </p>
      </div>
      <button
        className="tap-button"
        onClick={async () => {
          const directionsService = new google.maps.DirectionsService();
          const results = await directionsService.route({
            origin: `${place} goa`,
            destination: `${dest} goa`,
            travelMode: google.maps.TravelMode.DRIVING,
          });
          setDirectionsResponse(results);
          setDistance(results.routes[0].legs[0].distance.text);
          setDuration(results.routes[0].legs[0].duration.text);
        }}
      >
        TAP
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
            {directionsResponse && (
              <DirectionsRenderer directions={directionsResponse} />
            )}
          </GoogleMap>
        ) : (
          <>Loading...</>
        )}
      </div>
    </div>
  );
}

export default App;
