import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  GeoPoint, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import './SOSButton.css';
import { Marker, InfoWindow } from '@react-google-maps/api';

const SOSButton = ({ user, userLocation }) => {
  const [nearbyHelpers, setNearbyHelpers] = useState([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedSOS, setSelectedSOS] = useState(null);
  const [error, setError] = useState(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  // Auto-hide SOS after 30 seconds
  useEffect(() => {
    let timer;
    if (isEmergency) {
      timer = setTimeout(() => {
        setIsEmergency(false);
        setShowAlerts(false);
      }, 30000); // 30 seconds
    }
    return () => clearTimeout(timer);
  }, [isEmergency]);

  // Listen for nearby SOS signals
  useEffect(() => {
    if (!user?.userId || !userLocation?.lat || !userLocation?.lng) return;

    try {
      // Simplified query that only filters by 'active' status
      const sosQuery = query(
        collection(db, 'sosSignals'),
        where('active', '==', true)
      );

      const unsubscribe = onSnapshot(sosQuery, (snapshot) => {
        const signals = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Filter nearby signals in JavaScript instead of in the query
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            data.location.latitude,
            data.location.longitude
          );
          
          // Only include signals within 5km and from other users
          if (distance <= 5 && data.userId !== user.userId) {
            signals.push({ id: doc.id, ...data });
          }
        });
        setNearbyHelpers(signals);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up SOS listener:', error);
      setError(error.message);
    }
  }, [user?.userId, userLocation?.lat, userLocation?.lng]);

  // Add this helper function to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  // Function to get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('Unable to get your location. Please enable location services.'));
        }
      );
    });
  };

  const sendSOS = async () => {
    try {
      setError(null);
      setIsRequestingLocation(true);
      setShowLocationPrompt(true);

      const location = await getCurrentLocation();
      
      await addDoc(collection(db, 'sosSignals'), {
        userId: user.userId,
        userName: user.name,
        age: user.age,
        gender: user.gender,
        location: new GeoPoint(location.lat, location.lng),
        timestamp: serverTimestamp(),
        active: true,
        description: 'Need immediate assistance'
      });

      setIsEmergency(true);
      setShowAlerts(true);
      toast.success('SOS signal sent! Help is on the way.');
    } catch (error) {
      console.error('Error sending SOS:', error);
      setError(error.message);
      toast.error('Failed to send SOS: ' + error.message);
    } finally {
      setIsRequestingLocation(false);
      setShowLocationPrompt(false);
    }
  };

  const cancelSOS = async () => {
    setIsEmergency(false);
    // Add logic to deactivate SOS signal in database
  };

  const closeAlerts = () => {
    setShowAlerts(false);
  };

  // Update the click handler for the main SOS button
  const handleSOSClick = () => {
    if (isEmergency) {
      cancelSOS();
    } else {
      setShowPanel(true);
    }
  };

  // Add this function to your component
  const isMobile = () => window.innerWidth <= 768;

  if (!user?.userId || !userLocation?.lat || !userLocation?.lng) {
    return null;
  }

  return (
    <div className="sos-container">
      {error && <div className="sos-error">{error}</div>}
      
      {showLocationPrompt && (
        <div className="location-prompt">
          <h3>Location Access Required</h3>
          <p>Please allow location access to send an SOS signal.</p>
          <p>This helps nearby users find and assist you.</p>
        </div>
      )}

      <button 
        className={`sos-button ${isEmergency ? 'active' : ''} ${isRequestingLocation ? 'requesting' : ''}`}
        onClick={handleSOSClick}
        disabled={isRequestingLocation}
      >
        {isRequestingLocation ? '...' : isEmergency ? 'SOS' : 'SOS'}
      </button>

      {showPanel && (
        <div className="sos-side-panel">
          <div className="sos-panel-header">
            <span className="sos-panel-title">Emergency Alerts</span>
            <button 
              className="close-panel-button"
              onClick={() => setShowPanel(false)}
            >
              ×
            </button>
          </div>

          <button
            className="send-sos-button"
            onClick={sendSOS}
            disabled={isRequestingLocation || isEmergency}
          >
            {isRequestingLocation ? 'Sending...' : isEmergency ? 'SOS Active' : 'Send SOS Signal'}
          </button>

          {nearbyHelpers.length > 0 ? (
            <div className="sos-alerts-list">
              {nearbyHelpers.map((signal) => (
                <div key={signal.id} className="alert-card">
                  <div className="alert-info">
                    {isMobile() ? (
                      // Mobile view - simplified
                      <p><strong>{signal.userName}</strong> needs help</p>
                    ) : (
                      // Desktop view - full info
                      <>
                        <p><strong>{signal.userName}</strong> needs assistance</p>
                        <p>Age: {signal.age}</p>
                        <p>Gender: {signal.gender}</p>
                        <p>Time: {signal.timestamp?.toDate().toLocaleString()}</p>
                      </>
                    )}
                  </div>
                  <button 
                    className="view-on-map-button"
                    onClick={() => {
                      setSelectedSOS(signal);
                      setShowPanel(false);
                    }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-alerts">
              No active SOS signals nearby
            </div>
          )}
        </div>
      )}

      {selectedSOS && (
        <InfoWindow
          position={{
            lat: selectedSOS.location.latitude,
            lng: selectedSOS.location.longitude
          }}
          onCloseClick={() => setSelectedSOS(null)}
        >
          <div className="sos-info-window">
            <h3>{selectedSOS.userName} Needs Help!</h3>
            <p>Age: {selectedSOS.age}</p>
            <p>Gender: {selectedSOS.gender}</p>
            <p>Time: {selectedSOS.timestamp?.toDate().toLocaleString()}</p>
            <p>{selectedSOS.description}</p>
          </div>
        </InfoWindow>
      )}
    </div>
  );
};

export default SOSButton; 