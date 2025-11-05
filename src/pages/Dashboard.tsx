import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Hotel, 
  Car, 
  MapPin, 
  Star,
  Navigation,
  Phone,
  IndianRupee,
  Cloud,
  Thermometer,
  Wind,
  Droplets,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";

interface WeatherData {
  location: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
}

const Dashboard = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [apiKey, setApiKey] = useState(localStorage.getItem('weatherApiKey') || '');
  const [loading, setLoading] = useState(false);

  const charDhams = [
    { name: 'Badrinath', lat: 30.7433, lon: 79.4938 },
    { name: 'Kedarnath', lat: 30.7346, lon: 79.0669 },
    { name: 'Gangotri', lat: 30.9996, lon: 78.9408 },
    { name: 'Yamunotri', lat: 31.0118, lon: 78.4270 }
  ];

  useEffect(() => {
    if (apiKey) {
      fetchWeatherData();
    }
  }, [apiKey]);

  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      const weatherPromises = charDhams.map(async (dham) => {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${dham.lat}&lon=${dham.lon}&appid=${apiKey}&units=metric`
        );
        const data = await response.json();
        return {
          location: dham.name,
          temp: Math.round(data.main?.temp || 0),
          condition: data.weather?.[0]?.description || 'N/A',
          humidity: data.main?.humidity || 0,
          windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // Convert m/s to km/h
          visibility: Math.round((data.visibility || 0) / 1000), // Convert to km
          icon: data.weather?.[0]?.icon || '01d'
        };
      });
      const results = await Promise.all(weatherPromises);
      setWeatherData(results);
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySubmit = () => {
    localStorage.setItem('weatherApiKey', apiKey);
    fetchWeatherData();
  };
  const hotels = [
    { 
      name: "Divine Heights Hotel", 
      location: "Badrinath", 
      rating: 4.5, 
      price: 2500, 
      available: true,
      amenities: ["WiFi", "Restaurant", "Parking"]
    },
    { 
      name: "Mountain View Resort", 
      location: "Kedarnath", 
      rating: 4.8, 
      price: 3200, 
      available: true,
      amenities: ["WiFi", "Spa", "Temple View"]
    },
    { 
      name: "Ganga Retreat", 
      location: "Gangotri", 
      rating: 4.3, 
      price: 2000, 
      available: true,
      amenities: ["River View", "Restaurant"]
    },
    { 
      name: "Yamuna Palace", 
      location: "Yamunotri", 
      rating: 4.6, 
      price: 2800, 
      available: false,
      amenities: ["WiFi", "Parking", "Hot Water"]
    },
  ];

  const taxis = [
    { 
      driver: "Rajesh Kumar", 
      vehicle: "Toyota Innova", 
      seats: 7, 
      rating: 4.7, 
      rate: 15,
      available: true
    },
    { 
      driver: "Amit Sharma", 
      vehicle: "Maruti Ertiga", 
      seats: 7, 
      rating: 4.5, 
      rate: 12,
      available: true
    },
    { 
      driver: "Vikram Singh", 
      vehicle: "Mahindra Scorpio", 
      seats: 8, 
      rating: 4.8, 
      rate: 18,
      available: true
    },
  ];

  const routes = [
    {
      name: "Badrinath Circuit",
      distance: "295 km from Rishikesh",
      duration: "10-12 hours",
      difficulty: "Moderate",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=30.7433,79.4938&travelmode=driving"
    },
    {
      name: "Kedarnath Trek",
      distance: "16 km trek from Gaurikund",
      duration: "6-8 hours",
      difficulty: "Challenging",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=30.7346,79.0669&travelmode=driving"
    },
    {
      name: "Gangotri Route",
      distance: "250 km from Rishikesh",
      duration: "8-10 hours",
      difficulty: "Moderate",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=30.9996,78.9408&travelmode=driving"
    },
    {
      name: "Yamunotri Path",
      distance: "6 km trek from Janki Chatti",
      duration: "4-5 hours",
      difficulty: "Moderate",
      mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=31.0118,78.4270&travelmode=driving"
    },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Tourist Dashboard</h1>
          <p className="text-muted-foreground">
            Everything you need for your sacred journey
          </p>
        </div>

        {/* Weather API Key Input */}
        {!apiKey && (
          <Card className="p-6 mb-6 bg-secondary/5 border-secondary/20">
            <h3 className="font-semibold mb-3">Weather API Setup</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your OpenWeatherMap API key to view live weather data for all Char Dhams.
              Get a free API key at <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-primary underline">openweathermap.org</a>
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter your OpenWeatherMap API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleApiKeySubmit}>Save</Button>
            </div>
          </Card>
        )}

        {/* Weather Widget - All 4 Char Dhams */}
        {weatherData.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Live Weather - Char Dham</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {weatherData.map((weather, index) => (
                <Card key={index} className="p-6 glass-effect hover:shadow-elevated transition-all">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <img 
                        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                        alt={weather.condition}
                        className="w-16 h-16"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{weather.location}</h3>
                      <p className="text-3xl font-bold text-primary">{weather.temp}°C</p>
                      <p className="text-sm text-muted-foreground capitalize">{weather.condition}</p>
                    </div>
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Droplets className="h-4 w-4" />
                          Humidity
                        </span>
                        <span className="font-semibold">{weather.humidity}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Wind className="h-4 w-4" />
                          Wind
                        </span>
                        <span className="font-semibold">{weather.windSpeed} km/h</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          Visibility
                        </span>
                        <span className="font-semibold">{weather.visibility} km</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="hotels" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hotels">
              <Hotel className="h-4 w-4 mr-2" />
              Hotels
            </TabsTrigger>
            <TabsTrigger value="taxis">
              <Car className="h-4 w-4 mr-2" />
              Taxis
            </TabsTrigger>
            <TabsTrigger value="routes">
              <Navigation className="h-4 w-4 mr-2" />
              Routes
            </TabsTrigger>
          </TabsList>

          {/* Hotels Tab */}
          <TabsContent value="hotels" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {hotels.map((hotel, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{hotel.name}</h3>
                      <div className="flex items-center text-muted-foreground text-sm mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {hotel.location}
                      </div>
                    </div>
                    <Badge variant={hotel.available ? "secondary" : "destructive"}>
                      {hotel.available ? "Available" : "Booked"}
                    </Badge>
                  </div>

                  <div className="flex items-center mb-3">
                    <Star className="h-4 w-4 fill-primary text-primary mr-1" />
                    <span className="font-semibold mr-2">{hotel.rating}</span>
                    <span className="text-muted-foreground text-sm">Rating</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotel.amenities.map((amenity, i) => (
                      <Badge key={i} variant="outline">{amenity}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-lg font-bold">
                      <IndianRupee className="h-5 w-5 mr-1" />
                      {hotel.price}
                      <span className="text-sm text-muted-foreground font-normal ml-1">/night</span>
                    </div>
                    <Button disabled={!hotel.available}>
                      {hotel.available ? "Book Now" : "Fully Booked"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Taxis Tab */}
          <TabsContent value="taxis" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {taxis.map((taxi, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Car className="h-8 w-8 text-primary" />
                    <Badge variant="secondary">Available</Badge>
                  </div>

                  <h3 className="text-xl font-semibold mb-1">{taxi.driver}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{taxi.vehicle}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Seats</span>
                      <span className="font-semibold">{taxi.seats} passengers</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rating</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-primary text-primary mr-1" />
                        <span className="font-semibold">{taxi.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-semibold">₹{taxi.rate}/km</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">Book Ride</Button>
                    <Button variant="outline" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {routes.map((route, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{route.name}</h3>
                      <Badge variant="outline">{route.difficulty}</Badge>
                    </div>
                    <Navigation className="h-6 w-6 text-primary" />
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm">Distance</div>
                        <div className="text-muted-foreground text-sm">{route.distance}</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Navigation className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm">Duration</div>
                        <div className="text-muted-foreground text-sm">{route.duration}</div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => window.open(route.mapsUrl, '_blank')}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Google Maps
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="p-6 mt-6 bg-secondary/10 border-secondary/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Hotel className="h-5 w-5 text-secondary" />
            Pro Tip
          </h3>
          <p className="text-sm text-muted-foreground">
            Book accommodations and transportation in advance during peak season (May-June, September-October). 
            Consider weather conditions and road accessibility before planning your journey.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
