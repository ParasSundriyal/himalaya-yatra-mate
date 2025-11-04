import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Car, 
  MapPin, 
  Clock,
  IndianRupee,
  Search,
  Filter
} from "lucide-react";
import parkingImage from "@/assets/parking-aerial.jpg";

const Parking = () => {
  const parkingSlots = [
    { id: "A-101", status: "available", location: "Badrinath - Main Parking", price: 50, size: "Standard" },
    { id: "A-102", status: "occupied", location: "Badrinath - Main Parking", price: 50, size: "Standard" },
    { id: "A-103", status: "available", location: "Badrinath - Main Parking", price: 50, size: "Standard" },
    { id: "B-201", status: "available", location: "Kedarnath - North Zone", price: 75, size: "Large" },
    { id: "B-202", status: "reserved", location: "Kedarnath - North Zone", price: 75, size: "Large" },
    { id: "B-203", status: "available", location: "Kedarnath - North Zone", price: 75, size: "Large" },
    { id: "C-301", status: "available", location: "Gangotri - East Parking", price: 60, size: "Standard" },
    { id: "C-302", status: "available", location: "Gangotri - East Parking", price: 60, size: "Standard" },
    { id: "D-401", status: "available", location: "Yamunotri - West Zone", price: 65, size: "Large" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-secondary text-secondary-foreground";
      case "occupied":
        return "bg-destructive text-destructive-foreground";
      case "reserved":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Parking Slot Booking</h1>
          <p className="text-muted-foreground">
            Reserve your parking spot in advance for a hassle-free pilgrimage
          </p>
        </div>

        {/* Hero Image */}
        <Card className="mb-8 overflow-hidden">
          <div className="relative h-64">
            <img 
              src={parkingImage} 
              alt="Parking Area"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
              <div className="p-6 w-full">
                <h2 className="text-2xl font-bold mb-2">Smart Parking Solutions</h2>
                <p className="text-muted-foreground">Real-time availability • Instant booking • QR-based entry</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Search & Filter */}
        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search by Location</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="search"
                  placeholder="e.g., Badrinath, Kedarnath..." 
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date"
                type="date" 
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="size">Vehicle Size</Label>
              <select 
                id="size"
                className="w-full mt-2 h-10 px-3 rounded-md border border-input bg-background"
              >
                <option>All Sizes</option>
                <option>Standard</option>
                <option>Large</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-secondary mb-1">342</div>
            <div className="text-sm text-muted-foreground">Available Slots</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-destructive mb-1">158</div>
            <div className="text-sm text-muted-foreground">Occupied Slots</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-1">₹50-75</div>
            <div className="text-sm text-muted-foreground">Price Range/Day</div>
          </Card>
        </div>

        {/* Parking Slots Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Available Parking Slots</h2>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {parkingSlots.map((slot) => (
              <Card 
                key={slot.id} 
                className={`p-6 transition-all hover:shadow-md ${
                  slot.status !== "available" ? "opacity-60" : "hover:-translate-y-1"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Slot {slot.id}</h3>
                    <Badge className={getStatusColor(slot.status)} variant="secondary">
                      {slot.status.toUpperCase()}
                    </Badge>
                  </div>
                  <Car className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {slot.location}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {slot.size} Size
                  </div>
                  <div className="flex items-center font-semibold text-lg">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {slot.price}/day
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  disabled={slot.status !== "available"}
                >
                  {slot.status === "available" ? "Book Now" : "Not Available"}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-3">Booking Information</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Advance booking recommended during peak pilgrimage seasons</p>
            <p>• Receive QR code via email/SMS for contactless entry</p>
            <p>• 24/7 security surveillance in all parking zones</p>
            <p>• Cancellation allowed up to 6 hours before booking time</p>
            <p className="text-primary font-medium mt-4">Connect Lovable Cloud to enable online payments and real-time booking</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Parking;
