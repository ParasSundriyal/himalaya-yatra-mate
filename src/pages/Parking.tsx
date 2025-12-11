import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Car, 
  MapPin, 
  Clock,
  IndianRupee,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import parkingImage from "@/assets/parking-aerial.jpg";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ParkingArea {
  _id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  totalSlots: number;
  availableSlots: number;
}

interface ParkingSlot {
  id: string;
  slotNumber: string;
  status: string;
  size: string;
  pricePerDay: number;
  location: string;
}

const Parking = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<ParkingSlot[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Filters
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  
  // Booking dialog
  const [bookingDialog, setBookingDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [bookingForm, setBookingForm] = useState({
    vehicleNumber: "",
    entryTime: "",
    exitTime: ""
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookedData, setBookedData] = useState<any>(null);

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      fetchSlots();
    } else {
      setSlots([]);
      setFilteredSlots([]);
    }
  }, [selectedArea]);

  useEffect(() => {
    applyFilters();
  }, [slots, searchLocation, selectedSize]);

  const fetchAreas = async () => {
    setLoadingAreas(true);
    try {
      const response = await api.parking.getAreas();
      if (response.success) {
        setAreas(response.areas || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch parking areas",
        variant: "destructive",
      });
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchSlots = async () => {
    if (!selectedArea) return;
    
    setLoadingSlots(true);
    try {
      const response = await api.parking.getSlots(selectedArea, {});
      if (response.success) {
        setSlots(response.slots || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch parking slots",
        variant: "destructive",
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...slots];

    if (searchLocation) {
      const area = areas.find(a => a._id === selectedArea);
      if (area) {
        const searchLower = searchLocation.toLowerCase();
        if (!area.name.toLowerCase().includes(searchLower) && 
            !area.location.toLowerCase().includes(searchLower)) {
          filtered = [];
        }
      }
    }

    if (selectedSize) {
      filtered = filtered.filter(slot => slot.size === selectedSize);
    }

    setFilteredSlots(filtered);
  };

  const handleBookSlot = (slot: ParkingSlot) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to book a parking slot",
        variant: "destructive",
      });
      return;
    }

    if (slot.status !== "available") {
      return;
    }

    setSelectedSlot(slot);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setBookingForm({
      vehicleNumber: "",
      entryTime: now.toISOString().slice(0, 16),
      exitTime: tomorrow.toISOString().slice(0, 16)
    });
    setBookingDialog(true);
  };

  const handleBookingSubmit = async () => {
    if (!selectedArea || !selectedSlot) return;

    if (!bookingForm.vehicleNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Vehicle number is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.parking.bookSlot({
        areaId: selectedArea,
        slotId: selectedSlot.id,
        vehicleNumber: bookingForm.vehicleNumber,
        entryTime: bookingForm.entryTime ? new Date(bookingForm.entryTime).toISOString() : undefined,
        exitTime: bookingForm.exitTime ? new Date(bookingForm.exitTime).toISOString() : undefined
      });

      if (response.success) {
        setBookedData(response.booking);
        setBookingSuccess(true);
        setBookingDialog(false);
        fetchSlots();
        toast({
          title: "Success",
          description: "Parking slot booked successfully!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book parking slot",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReceipt = () => {
    if (!bookedData) return;

    const area = areas.find(a => a._id === selectedArea);
    const receiptContent = `
CHAR DHAM YATRA - PARKING RECEIPT
==================================

Booking ID: ${bookedData.id}
Parking Area: ${area?.name || 'N/A'}
Location: ${area?.location || 'N/A'}
Slot Number: ${bookedData.slotNumber}
Vehicle Number: ${bookedData.vehicleNumber}

Entry Time: ${new Date(bookedData.entryTime).toLocaleString()}
Exit Time: ${new Date(bookedData.exitTime).toLocaleString()}

Amount: ₹${bookedData.amount}

==================================
Thank you for using Char Dham Yatra!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parking-receipt-${bookedData.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "occupied":
        return "bg-red-500";
      case "reserved":
        return "bg-yellow-500";
      case "maintenance":
        return "bg-gray-500";
      default:
        return "bg-muted";
    }
  };

  // Calculate stats
  const totalSlots = filteredSlots.length;
  const availableSlots = filteredSlots.filter(s => s.status === "available").length;
  const occupiedSlots = filteredSlots.filter(s => s.status === "occupied" || s.status === "reserved").length;
  const priceRange = filteredSlots.length > 0 
    ? `${Math.min(...filteredSlots.map(s => s.pricePerDay))}-${Math.max(...filteredSlots.map(s => s.pricePerDay))}`
    : "0-0";

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
              <Label htmlFor="area">Select Parking Area</Label>
              {loadingAreas ? (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading areas...</span>
                </div>
              ) : (
                <select
                  id="area"
                  className="w-full mt-2 px-3 py-2 border rounded-md"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                >
                  <option value="">All Areas</option>
                  {areas.map((area) => (
                    <option key={area._id} value={area._id}>
                      {area.name} - {area.location}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <Label htmlFor="size">Vehicle Size</Label>
              <select 
                id="size"
                className="w-full mt-2 h-10 px-3 rounded-md border border-input bg-background"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="">All Sizes</option>
                <option value="Standard">Standard</option>
                <option value="Large">Large</option>
              </select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date"
                type="date" 
                className="mt-2"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Stats */}
        {selectedArea && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">{availableSlots}</div>
              <div className="text-sm text-muted-foreground">Available Slots</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-red-500 mb-1">{occupiedSlots}</div>
              <div className="text-sm text-muted-foreground">Occupied Slots</div>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">₹{priceRange}</div>
              <div className="text-sm text-muted-foreground">Price Range/Day</div>
            </Card>
          </div>
        )}

        {/* Parking Slots Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Available Parking Slots</h2>
          </div>

          {loadingSlots ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !selectedArea ? (
            <Card className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Please select a parking area to view slots</p>
            </Card>
          ) : filteredSlots.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No slots found matching your criteria</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSlots.map((slot) => (
                <Card 
                  key={slot.id} 
                  className={`p-6 transition-all hover:shadow-md ${
                    slot.status !== "available" ? "opacity-60" : "hover:-translate-y-1 cursor-pointer"
                  }`}
                  onClick={() => handleBookSlot(slot)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Slot {slot.slotNumber}</h3>
                      <Badge className={getStatusColor(slot.status)}>
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
                      {slot.pricePerDay}/day
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
          )}
        </div>

        {/* Booking Dialog */}
        <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book Parking Slot</DialogTitle>
              <DialogDescription>
                Fill in the details to complete your booking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedSlot && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Slot Number</span>
                    <span>{selectedSlot.slotNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Price/Day</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {selectedSlot.pricePerDay}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  value={bookingForm.vehicleNumber}
                  onChange={(e) => setBookingForm({ ...bookingForm, vehicleNumber: e.target.value.toUpperCase() })}
                  className="mt-2"
                  placeholder="Enter vehicle number"
                />
              </div>
              <div>
                <Label htmlFor="entryTime">Entry Date & Time</Label>
                <Input
                  id="entryTime"
                  type="datetime-local"
                  value={bookingForm.entryTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, entryTime: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="exitTime">Exit Date & Time</Label>
                <Input
                  id="exitTime"
                  type="datetime-local"
                  value={bookingForm.exitTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, exitTime: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBookingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBookingSubmit}>
                Confirm Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={bookingSuccess} onOpenChange={setBookingSuccess}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Booking Successful!
              </DialogTitle>
            </DialogHeader>
            {bookedData && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Booking ID:</p>
                  <p className="font-mono font-bold text-lg">{bookedData.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Slot Number</p>
                    <p className="font-semibold">{bookedData.slotNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle Number</p>
                    <p className="font-semibold">{bookedData.vehicleNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entry Time</p>
                    <p className="font-semibold">{new Date(bookedData.entryTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Exit Time</p>
                    <p className="font-semibold">{new Date(bookedData.exitTime).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold flex items-center text-lg">
                      <IndianRupee className="h-5 w-5 mr-1" />
                      {bookedData.amount}
                    </p>
                  </div>
                </div>
                {bookedData.qrCode && (
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-muted-foreground mb-2">QR Code</p>
                    <img src={bookedData.qrCode} alt="QR Code" className="w-48 h-48 border rounded-lg" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleDownloadReceipt} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                  <Button onClick={() => {
                    setBookingSuccess(false);
                    setBookedData(null);
                    setBookingForm({
                      vehicleNumber: "",
                      entryTime: "",
                      exitTime: ""
                    });
                  }} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Info Card */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-3">Booking Information</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Advance booking recommended during peak pilgrimage seasons</p>
            <p>• Receive QR code for contactless entry</p>
            <p>• 24/7 security surveillance in all parking zones</p>
            <p>• Cancellation allowed up to 6 hours before booking time</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Parking;
