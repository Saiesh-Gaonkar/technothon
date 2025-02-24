import { useState, useCallback, useEffect } from "react";
import { geminiModel } from "./firebase";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
  InfoWindow,
  DirectionsRenderer,
} from "@react-google-maps/api";

const containerStyle = {
  width: "600%",
  height: "600px",
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
  const [placesOnRoute, setPlacesOnRoute] = useState([]);

  const [activeMarker, setActiveMarker] = useState(null);

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
  async function run() {
    alert("run is running", mess);

    const prompt = `${mess} just generate me json of keywords from the given text of place and destination in this way "{
  "place": "Savordem",
  "destination": "Ponda"
}
"`;
    const result = await geminiModel.generateContent(prompt);

    const response = result.response;
    const text = response.text();
    const txt = text.slice(7, -4);
    console.log(`trimmed text = ${txt}`);
    const obj = JSON.parse(txt);
    setplace(obj.place);
    setdest(obj.destination);
    console.log(obj);
  }

  {
    /* <form>
        <input
          type="text"
          placeholder="enter text"
          onChange={(e) => setmess(e.target.value)}
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            alert(mess);
            run();
            console.log("run is running");
          }}
        >
          SUBMIT
        </button>
      </form> */
  }
  return (
    <>
      <div>
        <form>
          <input
            style={{ width: "400px" }}
            type="text"
            placeholder="enter your prompt"
            onChange={(e) => setmess(e.target.value)}
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              run();
            }}
          >
            SUBMIT
          </button>
        </form>
      </div>
      <div>
        <p>
          place is {place} and destination is {dest} | the distance is{" "}
          {Distance} and the duration is {Duration}
        </p>
      </div>
      <button
        style={{ marginBottom: "50px" }}
        onClick={async () => {
          console.log(`place = ${place} destination = ${dest}`);
          const directionsService = new google.maps.DirectionsService();
          const results = await directionsService.route({
            origin: `${place} goa`,
            destination: `${dest} goa`,

            travelMode: google.maps.TravelMode.DRIVING,
          });
          setDirectionsResponse(results);
          console.log("the respose is got", results);
          setDistance(results.routes[0].legs[0].distance.text);
          setDuration(results.routes[0].legs[0].duration.text);
        }}
      >
        TAP
      </button>
      <div>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {placesOnRoute.map((placeObj, idx) => {
              console.log("placeObj", placeObj);
              return (
                <Marker
                  key={idx}
                  onClick={() => console.log("clicked")}
                  onMouseOver={() => setActiveMarker(idx)}
                  onMouseOut={() => setActiveMarker(null)}
                  position={placeObj.geometry.location}
                >
                  {activeMarker === idx && (
                    <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                      <div>
                        <h3>{placeObj.name}</h3>
                        <h3>{placeObj.rating}</h3>
                        {placeObj.photos && placeObj.photos.length > 0 && (
                          <img
                            src={placeObj.photos[0].getUrl()}
                            alt={placeObj.name}
                            style={{ width: "100px", height: "100px" }}
                          />
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </Marker>
              );
            })}

            {directionsResponse && (
              <DirectionsRenderer directions={directionsResponse} />
            )}
          </GoogleMap>
        ) : (
          <>loading</>
        )}
      </div>
    </>
  );
}

export default App;
