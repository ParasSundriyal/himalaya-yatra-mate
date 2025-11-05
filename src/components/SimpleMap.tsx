import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SimpleMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([30.5, 78.8], 9);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Char Dham locations
    const charDhams = [
      { name: 'Badrinath', lat: 30.7433, lon: 79.4938, color: '#EF4444' },
      { name: 'Kedarnath', lat: 30.7346, lon: 79.0669, color: '#F59E0B' },
      { name: 'Gangotri', lat: 30.9996, lon: 78.9408, color: '#3B82F6' },
      { name: 'Yamunotri', lat: 31.0118, lon: 78.4270, color: '#10B981' }
    ];

    // Add Char Dham markers and circles
    charDhams.forEach((dham) => {
      const marker = L.marker([dham.lat, dham.lon]).addTo(map);
      marker.bindPopup(`
        <div style="padding: 8px;">
          <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 8px;">${dham.name}</h3>
          <p style="font-size: 14px; margin-bottom: 8px;">Sacred Char Dham Site</p>
          <a 
            href="https://www.google.com/maps/dir/?api=1&destination=${dham.lat},${dham.lon}"
            target="_blank"
            rel="noopener noreferrer"
            style="display: inline-block; padding: 8px 16px; background-color: #8B5CF6; color: white; border-radius: 6px; text-decoration: none; font-size: 14px; text-align: center; width: 100%;"
          >
            Get Directions
          </a>
        </div>
      `);

      L.circle([dham.lat, dham.lon], {
        color: dham.color,
        fillColor: dham.color,
        fillOpacity: 0.1,
        radius: 5000
      }).addTo(map);
    });

    // Hotels
    const hotels = [
      { name: "Divine Heights Hotel", location: "Badrinath", lat: 30.7420, lon: 79.4920, rating: 4.5, price: 2500, available: true },
      { name: "Mountain View Resort", location: "Kedarnath", lat: 30.7330, lon: 79.0650, rating: 4.8, price: 3200, available: true },
      { name: "Ganga Retreat", location: "Gangotri", lat: 30.9980, lon: 78.9390, rating: 4.3, price: 2000, available: true },
      { name: "Yamuna Palace", location: "Yamunotri", lat: 31.0100, lon: 78.4250, rating: 4.6, price: 2800, available: false },
    ];

    hotels.forEach((hotel) => {
      const hotelIcon = L.divIcon({
        html: `<div style="background-color: #8B5CF6; padding: 8px; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏨</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([hotel.lat, hotel.lon], { icon: hotelIcon }).addTo(map);
      marker.bindPopup(`
        <div style="padding: 8px; min-width: 200px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <h3 style="font-weight: bold; font-size: 16px;">🏨 ${hotel.name}</h3>
            <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; background-color: ${hotel.available ? '#10B981' : '#EF4444'}; color: white;">
              ${hotel.available ? 'Available' : 'Booked'}
            </span>
          </div>
          <p style="font-size: 14px; margin-bottom: 4px;">📍 ${hotel.location}</p>
          <p style="font-size: 14px; margin-bottom: 8px;">⭐ ${hotel.rating}</p>
          <p style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">₹${hotel.price} <span style="font-size: 12px; font-weight: normal;">/night</span></p>
        </div>
      `);
    });

    // Taxis
    const taxis = [
      { driver: "Rajesh Kumar", vehicle: "Toyota Innova", lat: 30.0668, lon: 79.0193, rating: 4.7, rate: 15 },
      { driver: "Amit Sharma", vehicle: "Maruti Ertiga", lat: 30.3165, lon: 78.0322, rating: 4.5, rate: 12 },
      { driver: "Vikram Singh", vehicle: "Mahindra Scorpio", lat: 30.7000, lon: 79.0800, rating: 4.8, rate: 18 },
    ];

    taxis.forEach((taxi) => {
      const taxiIcon = L.divIcon({
        html: `<div style="background-color: #10B981; padding: 8px; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🚗</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([taxi.lat, taxi.lon], { icon: taxiIcon }).addTo(map);
      marker.bindPopup(`
        <div style="padding: 8px; min-width: 180px;">
          <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">🚗 ${taxi.driver}</h3>
          <p style="font-size: 14px; margin-bottom: 12px;">${taxi.vehicle}</p>
          <p style="font-size: 14px; margin-bottom: 4px;">⭐ Rating: ${taxi.rating}</p>
          <p style="font-size: 14px; font-weight: bold;">₹${taxi.rate}/km</p>
        </div>
      `);
    });

    // Routes
    const routes = [
      { name: "Rishikesh to Badrinath", coords: [[30.0668, 79.0193], [30.1460, 78.9330], [30.3850, 79.0630], [30.5290, 79.2040], [30.7433, 79.4938]], color: "#8B5CF6" },
      { name: "Gaurikund to Kedarnath", coords: [[30.5275, 79.0580], [30.6200, 79.0600], [30.7346, 79.0669]], color: "#10B981" },
      { name: "Rishikesh to Gangotri", coords: [[30.0668, 79.0193], [30.1200, 78.7500], [30.4800, 78.8900], [30.9996, 78.9408]], color: "#3B82F6" },
      { name: "Janki Chatti to Yamunotri", coords: [[30.9850, 78.4480], [31.0000, 78.4370], [31.0118, 78.4270]], color: "#F59E0B" }
    ];

    routes.forEach((route) => {
      const polyline = L.polyline(route.coords as [number, number][], {
        color: route.color,
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(map);

      polyline.bindPopup(`
        <div style="padding: 8px;">
          <h4 style="font-weight: bold; margin-bottom: 4px;">${route.name}</h4>
          <p style="font-size: 14px;">Pilgrimage Route</p>
        </div>
      `);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return <div ref={mapRef} style={{ height: '600px', width: '100%', borderRadius: '8px' }} />;
};

export default SimpleMap;
