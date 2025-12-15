import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SimpleMap from "@/components/SimpleMap";
import { 
  Hotel, 
  Car, 
  MapPin, 
  Star,
  Navigation,
  Phone,
  IndianRupee,
  Wind,
  Droplets,
  Eye,
  Map,
  Calendar,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  QrCode
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface WeatherData {
  location: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
}

interface Hotel {
  _id: string;
  name: string;
  location: string;
  rating: number;
  pricePerNight: number;
  availableRooms: number;
  amenities: string[];
  contact?: {
    phone?: string;
    email?: string;
  };
}

interface Taxi {
  _id: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  vehicleNumber: string;
  seats: number;
  rating: number;
  ratePerKm: number;
  location: string;
  isAvailable: boolean;
}

interface Booking {
  _id: string;
  bookingType: string;
  status: string;
  amount: number;
  createdAt: string;
  hotel?: any;
  taxi?: any;
  parking?: any;
}

const Dashboard = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hourlyPasses, setHourlyPasses] = useState<any[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [loadingTaxis, setLoadingTaxis] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingPasses, setLoadingPasses] = useState(false);
  
  // Booking dialogs
  const [hotelBookingDialog, setHotelBookingDialog] = useState(false);
  const [taxiBookingDialog, setTaxiBookingDialog] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedTaxi, setSelectedTaxi] = useState<Taxi | null>(null);
  
  // Booking form data
  const [hotelBookingData, setHotelBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1
  });
  
  const [taxiBookingData, setTaxiBookingData] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    pickupTime: '',
    distance: 0
  });

  const { toast } = useToast();
  const { user } = useAuth();

  const charDhams = [
    { name: 'Badrinath', lat: 30.7433, lon: 79.4938 },
    { name: 'Kedarnath', lat: 30.7346, lon: 79.0669 },
    { name: 'Gangotri', lat: 30.9996, lon: 78.9408 },
    { name: 'Yamunotri', lat: 31.0118, lon: 78.4270 }
  ];

  // Fetch hotels
  const fetchHotels = async () => {
    setLoadingHotels(true);
    try {
      const response = await api.hotels.getAll({ available: true });
      if (response.success) {
        setHotels(response.hotels || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch hotels",
        variant: "destructive",
      });
    } finally {
      setLoadingHotels(false);
    }
  };

  // Fetch taxis
  const fetchTaxis = async () => {
    setLoadingTaxis(true);
    try {
      const response = await api.taxis.getAll({});
      if (response.success) {
        setTaxis(response.taxis || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch taxis",
        variant: "destructive",
      });
    } finally {
      setLoadingTaxis(false);
    }
  };

  // Fetch bookings
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await api.bookings.getAll({});
      if (response.success) {
        setBookings(response.bookings || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch hourly passes
  const fetchHourlyPasses = async () => {
    setLoadingPasses(true);
    try {
      const response = await api.hourlyPasses.getMyPasses({});
      if (response.success) {
        setHourlyPasses(response.passes || []);
      }
    } catch (error: any) {
      // It's okay if user is not logged in or has no passes
      setHourlyPasses([]);
    } finally {
      setLoadingPasses(false);
    }
  };

  useEffect(() => {
    fetchHotels();
    fetchTaxis();
    fetchBookings();
    fetchHourlyPasses();
  }, []);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    
    if (!apiKey) {
      console.error('Weather API key is not configured. Please add VITE_WEATHER_API_KEY to your .env file');
      toast({
        title: "Weather Unavailable",
        description: "Weather API key is not configured. Please contact the administrator.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const weatherPromises = charDhams.map(async (dham) => {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${dham.lat}&lon=${dham.lon}&appid=${apiKey}&units=metric`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch weather for ${dham.name}`);
        }
        
        const data = await response.json();
        return {
          location: dham.name,
          temp: Math.round(data.main?.temp || 0),
          condition: data.weather?.[0]?.description || 'N/A',
          humidity: data.main?.humidity || 0,
          windSpeed: Math.round((data.wind?.speed || 0) * 3.6),
          visibility: Math.round((data.visibility || 0) / 1000),
          icon: data.weather?.[0]?.icon || '01d'
        };
      });
      const results = await Promise.all(weatherPromises);
      setWeatherData(results);
    } catch (error: any) {
      console.error('Error fetching weather:', error);
      toast({
        title: "Weather Update Failed",
        description: error.message || "Failed to fetch weather data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Hotel booking
  const handleHotelBook = async () => {
    if (!selectedHotel) return;
    
    try {
      const response = await api.hotels.book({
        hotelId: selectedHotel._id,
        checkIn: hotelBookingData.checkIn,
        checkOut: hotelBookingData.checkOut,
        guests: hotelBookingData.guests,
        rooms: hotelBookingData.rooms
      });

      if (response.success) {
        toast({
          title: "Booking Successful",
          description: `Hotel ${selectedHotel.name} booked successfully!`,
        });
        setHotelBookingDialog(false);
        setSelectedHotel(null);
        fetchHotels();
        fetchBookings();
      }
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book hotel",
        variant: "destructive",
      });
    }
  };

  // Taxi booking
  const handleTaxiBook = async () => {
    if (!selectedTaxi) return;
    
    try {
      const response = await api.taxis.book({
        taxiId: selectedTaxi._id,
        pickupLocation: taxiBookingData.pickupLocation,
        dropoffLocation: taxiBookingData.dropoffLocation,
        pickupTime: taxiBookingData.pickupTime,
        distance: taxiBookingData.distance
      });

      if (response.success) {
        toast({
          title: "Booking Successful",
          description: `Taxi booked successfully! Driver: ${selectedTaxi.driverName}`,
        });
        setTaxiBookingDialog(false);
        setSelectedTaxi(null);
        fetchTaxis();
        fetchBookings();
      }
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book taxi",
        variant: "destructive",
      });
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingId: string, type: string) => {
    try {
      if (type === 'hotel') {
        await api.hotels.cancelBooking(bookingId);
      } else if (type === 'taxi') {
        await api.taxis.cancelBooking(bookingId);
      } else if (type === 'parking') {
        await api.parking.cancelBooking(bookingId);
      }
      
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully",
      });
      fetchBookings();
      if (type === 'hotel') fetchHotels();
      if (type === 'taxi') fetchTaxis();
    } catch (error: any) {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const totalAvailableHotels = hotels.filter((h) => h.availableRooms > 0).length;
  const availableTaxis = taxis.filter((t) => t.isAvailable).length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const totalPasses = hourlyPasses.length;
  const profileQrData = user
    ? JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        aadhar: user.aadhar,
      })
    : "Guest";
  const profileQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileQrData)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50 py-10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <Card className="relative overflow-hidden mb-8 border-0 bg-gradient-to-r from-blue-500/90 via-sky-500/85 to-emerald-400/80 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_40%_80%,rgba(255,255,255,0.18),transparent_30%)]" />
          <div className="relative p-6 md:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-sm font-medium mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Journey Hub
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Tourist Dashboard</h1>
              <p className="text-white/80 max-w-2xl">
                Everything you need for your sacred journey, now in a refreshed modern look.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              {[
                { label: 'Hotels', value: totalAvailableHotels, accent: 'from-emerald-400 to-emerald-200' },
                { label: 'Taxis', value: availableTaxis, accent: 'from-cyan-400 to-cyan-200' },
                { label: 'Bookings', value: confirmedBookings, accent: 'from-amber-300 to-amber-100' },
                { label: 'Passes', value: totalPasses, accent: 'from-pink-300 to-pink-100' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/30 backdrop-blur border border-white/40 p-3 text-center shadow-lg"
                >
                  <div className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br ${item.accent}`}>
                    {item.value}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-white/80">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Profile Card */}
        <Card className="mb-6 border-slate-200 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-white flex items-center justify-center text-xl font-bold shadow-md overflow-hidden">
                {user?.photo ? (
                  <img src={user.photo} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  (user?.name?.[0] || '?').toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{user?.name || "Guest User"}</h2>
                  {user?.role && (
                    <Badge variant="secondary" className="uppercase tracking-wide text-xs">
                      {user.role}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{user?.email || "Not signed in"}</p>
                {user?.phone && <p className="text-sm text-muted-foreground">📞 {user.phone}</p>}
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                  {user?.id && (
                    <span className="px-2 py-1 rounded-full bg-slate-100 border text-slate-700">
                      Registration ID: {user.id}
                    </span>
                  )}
                  {user?.aadhar && (
                    <span className="px-2 py-1 rounded-full bg-slate-100 border text-slate-700">
                      Aadhar: {user.aadhar}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <p className="text-sm text-muted-foreground">Scan to view profile details</p>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <img
                  src={profileQrUrl}
                  alt="Profile QR Code"
                  className="w-40 h-40 object-contain"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Weather Widget */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Live Weather - Char Dham</h2>
            <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
              Real-time updates
            </span>
          </div>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-6">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    </div>
                    <div>
                      <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : weatherData.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {weatherData.map((weather, index) => (
                <Card
                  key={index}
                  className="p-6 glass-effect border-primary/10 hover:shadow-2xl hover:-translate-y-1 transition-all bg-gradient-to-br from-white via-sky-50 to-blue-50"
                >
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
          ) : (
            <Card className="p-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Weather data is currently unavailable</p>
              </div>
            </Card>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="hotels" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 p-1 shadow-inner">
            <TabsTrigger value="map">
              <Map className="h-4 w-4 mr-2" />
              Map
            </TabsTrigger>
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
            <TabsTrigger value="bookings">
              <Calendar className="h-4 w-4 mr-2" />
              My Bookings
            </TabsTrigger>
          </TabsList>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-4">
            <Card className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">Interactive Char Dham Map</h2>
                <p className="text-muted-foreground">
                  Explore hotels, taxis, and pilgrimage routes across the Char Dham region.
                </p>
              </div>
              <SimpleMap />
            </Card>
          </TabsContent>

          {/* Hotels Tab */}
          <TabsContent value="hotels" className="space-y-4">
            {loadingHotels ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : hotels.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hotels available at the moment</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {hotels.map((hotel) => (
                  <Card key={hotel._id} className="p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{hotel.name}</h3>
                        <div className="flex items-center text-muted-foreground text-sm mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {hotel.location}
                        </div>
                      </div>
                      <Badge variant={hotel.availableRooms > 0 ? "secondary" : "destructive"}>
                        {hotel.availableRooms > 0 ? `${hotel.availableRooms} Available` : "Fully Booked"}
                      </Badge>
                    </div>

                    <div className="flex items-center mb-3">
                      <Star className="h-4 w-4 fill-primary text-primary mr-1" />
                      <span className="font-semibold mr-2">{hotel.rating}</span>
                      <span className="text-muted-foreground text-sm">Rating</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {hotel.amenities?.map((amenity, i) => (
                        <Badge key={i} variant="outline">{amenity}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-lg font-bold">
                        <IndianRupee className="h-5 w-5 mr-1" />
                        {hotel.pricePerNight}
                        <span className="text-sm text-muted-foreground font-normal ml-1">/night</span>
                      </div>
                      <Dialog open={hotelBookingDialog && selectedHotel?._id === hotel._id} onOpenChange={(open) => {
                        setHotelBookingDialog(open);
                        if (open) setSelectedHotel(hotel);
                        else setSelectedHotel(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button disabled={hotel.availableRooms === 0}>
                            {hotel.availableRooms > 0 ? "Book Now" : "Fully Booked"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Book {hotel.name}</DialogTitle>
                            <DialogDescription>
                              Fill in the details to complete your hotel booking
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="checkIn">Check-in Date *</Label>
                                <Input
                                  id="checkIn"
                                  type="date"
                                  value={hotelBookingData.checkIn}
                                  onChange={(e) => setHotelBookingData({...hotelBookingData, checkIn: e.target.value})}
                                  min={new Date().toISOString().split('T')[0]}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="checkOut">Check-out Date *</Label>
                                <Input
                                  id="checkOut"
                                  type="date"
                                  value={hotelBookingData.checkOut}
                                  onChange={(e) => setHotelBookingData({...hotelBookingData, checkOut: e.target.value})}
                                  min={hotelBookingData.checkIn || new Date().toISOString().split('T')[0]}
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="guests">Number of Guests *</Label>
                                <Input
                                  id="guests"
                                  type="number"
                                  min="1"
                                  value={hotelBookingData.guests}
                                  onChange={(e) => setHotelBookingData({...hotelBookingData, guests: parseInt(e.target.value)})}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="rooms">Number of Rooms *</Label>
                                <Input
                                  id="rooms"
                                  type="number"
                                  min="1"
                                  max={hotel.availableRooms}
                                  value={hotelBookingData.rooms}
                                  onChange={(e) => setHotelBookingData({...hotelBookingData, rooms: parseInt(e.target.value)})}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setHotelBookingDialog(false)}>Cancel</Button>
                            <Button onClick={handleHotelBook}>Confirm Booking</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Taxis Tab */}
          <TabsContent value="taxis" className="space-y-4">
            {loadingTaxis ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : taxis.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No taxis available at the moment</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {taxis.map((taxi) => (
                  <Card key={taxi._id} className="p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <Car className="h-8 w-8 text-primary" />
                      <Badge variant={taxi.isAvailable ? "secondary" : "destructive"}>
                        {taxi.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-semibold mb-1">{taxi.driverName}</h3>
                    <p className="text-muted-foreground text-sm mb-3">{taxi.vehicleType} - {taxi.vehicleNumber}</p>

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
                        <span className="font-semibold">₹{taxi.ratePerKm}/km</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-semibold">{taxi.location}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Dialog open={taxiBookingDialog && selectedTaxi?._id === taxi._id} onOpenChange={(open) => {
                        setTaxiBookingDialog(open);
                        if (open) setSelectedTaxi(taxi);
                        else setSelectedTaxi(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button className="flex-1" disabled={!taxi.isAvailable}>
                            Book Ride
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Book Taxi - {taxi.driverName}</DialogTitle>
                            <DialogDescription>
                              {taxi.vehicleType} - {taxi.vehicleNumber}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="pickupLocation">Pickup Location *</Label>
                              <Input
                                id="pickupLocation"
                                value={taxiBookingData.pickupLocation}
                                onChange={(e) => setTaxiBookingData({...taxiBookingData, pickupLocation: e.target.value})}
                                placeholder="Enter pickup location"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="dropoffLocation">Drop-off Location *</Label>
                              <Input
                                id="dropoffLocation"
                                value={taxiBookingData.dropoffLocation}
                                onChange={(e) => setTaxiBookingData({...taxiBookingData, dropoffLocation: e.target.value})}
                                placeholder="Enter drop-off location"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="pickupTime">Pickup Date & Time *</Label>
                              <Input
                                id="pickupTime"
                                type="datetime-local"
                                value={taxiBookingData.pickupTime}
                                onChange={(e) => setTaxiBookingData({...taxiBookingData, pickupTime: e.target.value})}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="distance">Distance (km) *</Label>
                              <Input
                                id="distance"
                                type="number"
                                min="0"
                                step="0.1"
                                value={taxiBookingData.distance}
                                onChange={(e) => setTaxiBookingData({...taxiBookingData, distance: parseFloat(e.target.value)})}
                                placeholder="Enter distance"
                                required
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Estimated fare: ₹{taxiBookingData.distance * taxi.ratePerKm}
                              </p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setTaxiBookingDialog(false)}>Cancel</Button>
                            <Button onClick={handleTaxiBook}>Confirm Booking</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="icon" onClick={() => window.open(`tel:${taxi.driverPhone}`)}>
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
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

          {/* My Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            {loadingBookings ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">You don't have any bookings yet</p>
                <p className="text-sm text-muted-foreground mt-2">Start by booking a hotel or taxi</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking._id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {booking.bookingType === 'hotel' && <Hotel className="h-8 w-8 text-primary" />}
                        {booking.bookingType === 'taxi' && <Car className="h-8 w-8 text-primary" />}
                        {booking.bookingType === 'parking' && <Car className="h-8 w-8 text-primary" />}
                        <div>
                          <h3 className="text-lg font-semibold capitalize">{booking.bookingType} Booking</h3>
                          <p className="text-sm text-muted-foreground">
                            Booked on {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <div className="text-right">
                          <div className="font-semibold">₹{booking.amount}</div>
                          <div className="text-xs text-muted-foreground">Total Amount</div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    {booking.bookingType === 'hotel' && booking.hotel && (
                      <div className="space-y-2 mb-4">
                        <p><strong>Hotel:</strong> {booking.hotel.hotelId?.name || 'N/A'}</p>
                        <p><strong>Location:</strong> {booking.hotel.hotelId?.location || 'N/A'}</p>
                        <p><strong>Check-in:</strong> {new Date(booking.hotel.checkIn).toLocaleDateString()}</p>
                        <p><strong>Check-out:</strong> {new Date(booking.hotel.checkOut).toLocaleDateString()}</p>
                        <p><strong>Guests:</strong> {booking.hotel.guests}</p>
                        <p><strong>Rooms:</strong> {booking.hotel.rooms}</p>
                      </div>
                    )}

                    {booking.bookingType === 'taxi' && booking.taxi && (
                      <div className="space-y-2 mb-4">
                        <p><strong>Driver:</strong> {booking.taxi.taxiId?.driverName || 'N/A'}</p>
                        <p><strong>Vehicle:</strong> {booking.taxi.taxiId?.vehicleType || 'N/A'}</p>
                        <p><strong>Pickup:</strong> {booking.taxi.pickupLocation}</p>
                        <p><strong>Drop-off:</strong> {booking.taxi.dropoffLocation}</p>
                        <p><strong>Distance:</strong> {booking.taxi.distance} km</p>
                        <p><strong>Pickup Time:</strong> {new Date(booking.taxi.pickupTime).toLocaleString()}</p>
                      </div>
                    )}

                    {booking.status === 'confirmed' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelBooking(booking._id, booking.bookingType)}
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </Card>
                ))}

                {/* Hourly Passes Section */}
                {loadingPasses ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : hourlyPasses.length > 0 && (
                  <>
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        My Hourly Passes
                      </h3>
                    </div>
                    {hourlyPasses.map((pass) => (
                      <Card key={pass.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <Clock className="h-8 w-8 text-primary" />
                            <div>
                              <h3 className="text-lg font-semibold">Hourly Pass</h3>
                              <p className="text-sm text-muted-foreground">
                                Pass ID: <span className="font-mono">{pass.passId}</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Booked on {new Date(pass.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(pass.status)}>
                              {pass.status}
                            </Badge>
                            <div className="text-right">
                              <div className="font-semibold flex items-center">
                                <IndianRupee className="h-4 w-4 mr-1" />
                                {pass.amount}
                              </div>
                              <div className="text-xs text-muted-foreground">Amount</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p><strong>Checkpoint:</strong> {pass.checkpoint?.name || 'N/A'}</p>
                          <p><strong>Location:</strong> {pass.checkpoint?.location || 'N/A'}</p>
                          <p><strong>Vehicle Owner:</strong> {pass.vehicleOwnerName}</p>
                          <p><strong>Vehicle Number:</strong> {pass.vehicleNumber}</p>
                          <p><strong>Phone:</strong> {pass.vehicleOwnerPhone}</p>
                          <p><strong>Time Slot:</strong> {new Date(pass.timeSlot.start).toLocaleString()} - {new Date(pass.timeSlot.end).toLocaleString()}</p>
                          <p><strong>Number of People:</strong> {pass.numberOfPeople}</p>
                          <p><strong>Payment Status:</strong> {pass.paymentStatus}</p>
                        </div>

                        {pass.qrCode && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold mb-2">QR Code:</p>
                            <img src={pass.qrCode} alt="QR Code" className="w-32 h-32 border rounded-lg" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </>
                )}
              </div>
            )}
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