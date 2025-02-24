import { useState, useCallback } from "react";
import { geminiModel } from "./firebase";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";

const containerStyle = {
  width: "600px",
  height: "600px",
};

const center = {
  lat: 28.6448,
  lng: 77.216721,
};

async function calculateRoute() {
  // if (originRef.current.value === "" || destiantionRef.current.value === "") {
  //   return;
  // }
  // eslint-disable-next-line no-undef
  console.log("calculating");
  // const directionsService = new google.maps.DirectionsService();
  // const results = await directionsService.route({
  //   // origin: originRef.current.value,
  //   // destination: destiantionRef.current.value,
  //   // eslint-disable-next-line no-undef

  //   origin: "New Delhi",
  //   destination: "Mumbai",
  //   travelMode: google.maps.TravelMode.DRIVING,
  // });
  // setDirectionsResponse(results);
  // setDistance(results.routes[0].legs[0].distance.text);
  // setDuration(results.routes[0].legs[0].duration.text);
}

function App() {
  const [mess, setmess] = useState("");
  const [directionsResponse, setDirectionsResponse] = useState(null);

  const { isLoaded } = useJsApiLoader({
    // id: "google-map-script",
    googleMapsApiKey: "AIzaSyB2rs0uDLILULcxJmljxKGUBHh9uoY-Wt8",
    libraries: ["places"],
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback(function callback(map) {
    // This is just an example of getting and using the map instance!!! don't just blindly copy!
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);

    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  // Wrap in an async function so you can use await
  async function run() {
    alert("run is running", mess);
    // Provide a prompt that contains text
    // const prompt = `Generate a response to the following text: "${mess}" just generate me keywords that i can feed it to google maps api only keywords`;
    const prompt = `${mess} just generate me keywords place and destination `;
    // To generate text output, call generateContent with the text input AIzaSyB2rs0uDLILULcxJmljxKGUBHh9uoY-Wt8
    const result = await geminiModel.generateContent(prompt);

    const response = result.response;
    const text = response.text();
    console.log(text);
    const obj = JSON.parse(text);
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
          {" "}
          <input
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

      <button
        style={{ marginBottom: "300px" }}
        onClick={async () => {
          const directionsService = new google.maps.DirectionsService();
          const results = await directionsService.route({
            // origin: originRef.current.value,
            // destination: destiantionRef.current.value,
            // eslint-disable-next-line no-undef

            origin: "margoa",
            destination: "sanguem",
            travelMode: google.maps.TravelMode.DRIVING,
          });
          setDirectionsResponse(results);
          // setDistance(results.routes[0].legs[0].distance.text);
          // setDuration(results.routes[0].legs[0].duration.text);
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
            {directionsResponse && (
              <DirectionsRenderer directions={directionsResponse} />
            )}
          </GoogleMap>
        ) : (
          <>lund nahi ho reha</>
        )}
      </div>
    </>
  );
}

export default App;
