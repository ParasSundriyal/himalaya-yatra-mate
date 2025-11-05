import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hotel as HotelIcon, Car, MapPin, Star, Phone, IndianRupee } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Hotel {
  name: string;
  location: string;
  lat: number;
  lon: number;
  rating: number;
  price: number;
  available: boolean;
  amenities: string[];
}

interface Taxi {
  driver: string;
  vehicle: string;
  seats: number;
  rating: number;
  rate: number;
  lat: number;
  lon: number;
  available: boolean;
}

interface Route {
  name: string;
  coordinates: [number, number][];
  color: string;
}

const InteractiveMap = () => {
  // Char Dham locations
  const charDhams = [
    { name: 'Badrinath', lat: 30.7433, lon: 79.4938, color: '#EF4444' },
    { name: 'Kedarnath', lat: 30.7346, lon: 79.0669, color: '#F59E0B' },
    { name: 'Gangotri', lat: 30.9996, lon: 78.9408, color: '#3B82F6' },
    { name: 'Yamunotri', lat: 31.0118, lon: 78.4270, color: '#10B981' }
  ];

  // Hotels with approximate locations near Char Dhams
  const hotels: Hotel[] = [
    { 
      name: "Divine Heights Hotel", 
      location: "Badrinath", 
      lat: 30.7420, 
      lon: 79.4920,
      rating: 4.5, 
      price: 2500, 
      available: true,
      amenities: ["WiFi", "Restaurant", "Parking"]
    },
    { 
      name: "Mountain View Resort", 
      location: "Kedarnath", 
      lat: 30.7330, 
      lon: 79.0650,
      rating: 4.8, 
      price: 3200, 
      available: true,
      amenities: ["WiFi", "Spa", "Temple View"]
    },
    { 
      name: "Ganga Retreat", 
      location: "Gangotri", 
      lat: 30.9980, 
      lon: 78.9390,
      rating: 4.3, 
      price: 2000, 
      available: true,
      amenities: ["River View", "Restaurant"]
    },
    { 
      name: "Yamuna Palace", 
      location: "Yamunotri", 
      lat: 31.0100, 
      lon: 78.4250,
      rating: 4.6, 
      price: 2800, 
      available: false,
      amenities: ["WiFi", "Parking", "Hot Water"]
    },
  ];

  // Taxi locations (scattered around the region)
  const taxis: Taxi[] = [
    { 
      driver: "Rajesh Kumar", 
      vehicle: "Toyota Innova", 
      seats: 7, 
      rating: 4.7, 
      rate: 15,
      lat: 30.0668,
      lon: 79.0193,
      available: true
    },
    { 
      driver: "Amit Sharma", 
      vehicle: "Maruti Ertiga", 
      seats: 7, 
      rating: 4.5, 
      rate: 12,
      lat: 30.3165,
      lon: 78.0322,
      available: true
    },
    { 
      driver: "Vikram Singh", 
      vehicle: "Mahindra Scorpio", 
      seats: 8, 
      rating: 4.8, 
      rate: 18,
      lat: 30.7000,
      lon: 79.0800,
      available: true
    },
  ];

  // Routes connecting the Char Dhams
  const routes: Route[] = [
    {
      name: "Rishikesh to Badrinath",
      coordinates: [
        [30.0668, 79.0193], // Rishikesh
        [30.1460, 78.9330],
        [30.3850, 79.0630],
        [30.5290, 79.2040],
        [30.7433, 79.4938]  // Badrinath
      ],
      color: "#8B5CF6"
    },
    {
      name: "Gaurikund to Kedarnath",
      coordinates: [
        [30.5275, 79.0580], // Gaurikund
        [30.6200, 79.0600],
        [30.7346, 79.0669]  // Kedarnath
      ],
      color: "#10B981"
    },
    {
      name: "Rishikesh to Gangotri",
      coordinates: [
        [30.0668, 79.0193], // Rishikesh
        [30.1200, 78.7500],
        [30.4800, 78.8900],
        [30.9996, 78.9408]  // Gangotri
      ],
      color: "#3B82F6"
    },
    {
      name: "Janki Chatti to Yamunotri",
      coordinates: [
        [30.9850, 78.4480], // Janki Chatti
        [31.0000, 78.4370],
        [31.0118, 78.4270]  // Yamunotri
      ],
      color: "#F59E0B"
    }
  ];

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden shadow-elevated">
      {/* @ts-ignore - MapContainer props type mismatch */}
      <MapContainer 
        center={[30.5, 78.8]} 
        zoom={9} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* @ts-ignore - TileLayer props type mismatch */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Char Dham Markers */}
        {charDhams.map((dham, index) => (
          <Marker key={`dham-${index}`} position={[dham.lat, dham.lon]}>
            <Popup>
              <div style={{ padding: '8px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>{dham.name}</h3>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>Sacred Char Dham Site</p>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${dham.lat},${dham.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    backgroundColor: '#8B5CF6',
                    color: 'white',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    textAlign: 'center',
                    width: '100%'
                  }}
                >
                  Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Char Dham Circles */}
        {charDhams.map((dham, index) => (
          <Circle 
            key={`circle-${index}`}
            center={[dham.lat, dham.lon]}
            radius={5000}
            pathOptions={{ color: dham.color, fillColor: dham.color, fillOpacity: 0.1 }}
          />
        ))}

        {/* Hotel Markers */}
        {hotels.map((hotel, index) => (
          <Marker 
            key={`hotel-${index}`} 
            position={[hotel.lat, hotel.lon]}
          >
            <Popup>
              <div style={{ padding: '8px', minWidth: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontWeight: 'bold', fontSize: '16px' }}>🏨 {hotel.name}</h3>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: hotel.available ? '#10B981' : '#EF4444',
                    color: 'white'
                  }}>
                    {hotel.available ? "Available" : "Booked"}
                  </span>
                </div>
                <p style={{ fontSize: '14px', marginBottom: '4px' }}>📍 {hotel.location}</p>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>⭐ {hotel.rating}</p>
                <p style={{ fontSize: '12px', marginBottom: '8px' }}>
                  {hotel.amenities.join(' • ')}
                </p>
                <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                  ₹{hotel.price} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>/night</span>
                </p>
                {hotel.available && (
                  <button style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#8B5CF6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    Book Now
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Taxi Markers */}
        {taxis.map((taxi, index) => (
          <Marker 
            key={`taxi-${index}`} 
            position={[taxi.lat, taxi.lon]}
          >
            <Popup>
              <div style={{ padding: '8px', minWidth: '180px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                  🚗 {taxi.driver}
                </h3>
                <p style={{ fontSize: '14px', marginBottom: '12px' }}>{taxi.vehicle}</p>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                    <span>Seats</span>
                    <span style={{ fontWeight: 'bold' }}>{taxi.seats}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                    <span>Rating</span>
                    <span style={{ fontWeight: 'bold' }}>⭐ {taxi.rating}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span>Rate</span>
                    <span style={{ fontWeight: 'bold' }}>₹{taxi.rate}/km</span>
                  </div>
                </div>
                <button style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                  Book Ride
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Polylines */}
        {routes.map((route, index) => (
          <Polyline 
            key={`route-${index}`}
            positions={route.coordinates}
            pathOptions={{ 
              color: route.color, 
              weight: 4, 
              opacity: 0.7,
              dashArray: '10, 10'
            }}
          >
            <Popup>
              <div style={{ padding: '8px' }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '4px' }}>{route.name}</h4>
                <p style={{ fontSize: '14px' }}>Pilgrimage Route</p>
              </div>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
