import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Clock, 
  MapPin, 
  Calendar, 
  Car, 
  Users, 
  IndianRupee,
  Loader2,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Slot {
  hour: number;
  start: string;
  end: string;
  capacity: number;
  available: number;
  booked: number;
  price: number;
  isActive: boolean;
  isPast: boolean;
}

interface Checkpoint {
  id: string;
  name: string;
  location: string;
}

const HourlyPassBooking = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingCheckpoints, setLoadingCheckpoints] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookedPass, setBookedPass] = useState<any>(null);

  const [bookingForm, setBookingForm] = useState({
    vehicleOwnerName: "",
    vehicleOwnerPhone: "",
    vehicleNumber: "",
    numberOfPeople: 1
  });

  // Get today's date in YYYY-MM-DD format (IST)
  const getTodayDate = () => {
    const today = new Date();
    const istDate = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return istDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    setSelectedDate(getTodayDate());
    fetchCheckpoints();
  }, []);

  useEffect(() => {
    if (selectedCheckpoint && selectedDate) {
      fetchSlots();
    }
  }, [selectedCheckpoint, selectedDate]);

  const fetchCheckpoints = async () => {
    setLoadingCheckpoints(true);
    try {
      const response = await api.checkpoints.getAll();
      if (response.success) {
        setCheckpoints(response.checkpoints || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch checkpoints",
        variant: "destructive",
      });
    } finally {
      setLoadingCheckpoints(false);
    }
  };

  const fetchSlots = async () => {
    if (!selectedCheckpoint) return;
    
    setLoadingSlots(true);
    try {
      const response = await api.hourlyPasses.getSlots(selectedCheckpoint, selectedDate);
      if (response.success) {
        setSlots(response.slots || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch available slots",
        variant: "destructive",
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookSlot = (slot: Slot) => {
    if (!slot.isActive || slot.available === 0 || slot.isPast) {
      return;
    }
    setSelectedSlot(slot);
    setBookingDialog(true);
    // Pre-fill form if user is logged in
    if (isAuthenticated && user) {
      setBookingForm({
        vehicleOwnerName: user.name || "",
        vehicleOwnerPhone: user.phone || "",
        vehicleNumber: "",
        numberOfPeople: 1
      });
    } else {
      setBookingForm({
        vehicleOwnerName: "",
        vehicleOwnerPhone: "",
        vehicleNumber: "",
        numberOfPeople: 1
      });
    }
  };

  const handleBookingSubmit = async () => {
    if (!selectedCheckpoint || !selectedSlot || !selectedDate) return;

    // Validation
    if (!bookingForm.vehicleOwnerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Vehicle owner name is required",
        variant: "destructive",
      });
      return;
    }

    if (!bookingForm.vehicleOwnerPhone.trim()) {
      toast({
        title: "Validation Error",
        description: "Vehicle owner phone is required",
        variant: "destructive",
      });
      return;
    }

    if (!bookingForm.vehicleNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Vehicle number is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.hourlyPasses.book({
        checkpointId: selectedCheckpoint,
        date: selectedDate,
        hour: selectedSlot.hour,
        vehicleOwnerName: bookingForm.vehicleOwnerName,
        vehicleOwnerPhone: bookingForm.vehicleOwnerPhone,
        vehicleNumber: bookingForm.vehicleNumber,
        numberOfPeople: bookingForm.numberOfPeople
      });

      if (response.success) {
        setBookedPass(response.pass);
        setBookingSuccess(true);
        setBookingDialog(false);
        fetchSlots(); // Refresh slots
        toast({
          title: "Success",
          description: "Pass booked successfully!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book pass",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReceipt = () => {
    if (!bookedPass) return;

    const receiptContent = `
CHAR DHAM YATRA - HOURLY PASS RECEIPT
=====================================

Pass ID: ${bookedPass.passId}
Checkpoint: ${bookedPass.checkpoint.name}
Location: ${bookedPass.checkpoint.location}
Date: ${selectedDate}
Time Slot: ${selectedSlot?.start} - ${selectedSlot?.end}

Vehicle Owner: ${bookedPass.vehicleOwnerName}
Phone: ${bookedPass.vehicleOwnerPhone}
Vehicle Number: ${bookedPass.vehicleNumber}
Number of People: ${bookedPass.numberOfPeople}

Amount: ₹${bookedPass.amount}
Payment Status: ${bookedPass.paymentStatus}
Status: ${bookedPass.status}

Booked On: ${new Date(bookedPass.createdAt).toLocaleString()}

=====================================
Thank you for using Char Dham Yatra!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pass-receipt-${bookedPass.passId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Hourly Pass Booking</h1>
          <p className="text-muted-foreground">
            Book hourly passes for checkpoint access. Available to everyone.
          </p>
        </div>

        {/* Booking Form */}
        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkpoint">Select Checkpoint *</Label>
              {loadingCheckpoints ? (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading checkpoints...</span>
                </div>
              ) : (
                <select
                  id="checkpoint"
                  className="w-full mt-2 px-3 py-2 border rounded-md"
                  value={selectedCheckpoint}
                  onChange={(e) => setSelectedCheckpoint(e.target.value)}
                >
                  <option value="">Select a checkpoint</option>
                  {checkpoints.map((cp) => (
                    <option key={cp._id} value={cp._id}>
                      {cp.name} - {cp.location}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <Label htmlFor="date">Select Date *</Label>
              <Input
                id="date"
                type="date"
                className="mt-2"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getTodayDate()}
              />
            </div>
          </div>
        </Card>

        {/* Available Slots */}
        {selectedCheckpoint && selectedDate && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Time Slots
            </h2>
            {loadingSlots ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No slots available for this date</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot) => (
                  <Card
                    key={slot.hour}
                    className={`p-4 hover:shadow-md transition-all ${
                      !slot.isActive || slot.available === 0 || slot.isPast
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                    onClick={() => handleBookSlot(slot)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-semibold">
                          {slot.start} - {slot.end}
                        </span>
                      </div>
                      {slot.isPast && (
                        <Badge variant="outline">Past</Badge>
                      )}
                      {!slot.isActive && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Available</span>
                        <span className="font-semibold">{slot.available} / {slot.capacity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-semibold flex items-center">
                          <IndianRupee className="h-3 w-3 mr-1" />
                          {slot.price}
                        </span>
                      </div>
                    </div>
                    {slot.isActive && slot.available > 0 && !slot.isPast && (
                      <Button className="w-full mt-3" size="sm">
                        Book Now
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Booking Dialog */}
        <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book Hourly Pass</DialogTitle>
              <DialogDescription>
                Fill in the vehicle details to complete your booking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedSlot && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Time Slot</span>
                    <span>{selectedSlot.start} - {selectedSlot.end}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Price</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {selectedSlot.price * bookingForm.numberOfPeople}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="vehicleOwnerName">Vehicle Owner Name *</Label>
                <Input
                  id="vehicleOwnerName"
                  value={bookingForm.vehicleOwnerName}
                  onChange={(e) => setBookingForm({ ...bookingForm, vehicleOwnerName: e.target.value })}
                  className="mt-2"
                  placeholder="Enter owner name"
                />
              </div>
              <div>
                <Label htmlFor="vehicleOwnerPhone">Vehicle Owner Phone *</Label>
                <Input
                  id="vehicleOwnerPhone"
                  type="tel"
                  value={bookingForm.vehicleOwnerPhone}
                  onChange={(e) => setBookingForm({ ...bookingForm, vehicleOwnerPhone: e.target.value })}
                  className="mt-2"
                  placeholder="Enter phone number"
                />
              </div>
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
                <Label htmlFor="numberOfPeople">Number of People</Label>
                <Input
                  id="numberOfPeople"
                  type="number"
                  min="1"
                  value={bookingForm.numberOfPeople}
                  onChange={(e) => setBookingForm({ ...bookingForm, numberOfPeople: parseInt(e.target.value) || 1 })}
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
            {bookedPass && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Your Pass ID:</p>
                  <p className="font-mono font-bold text-lg">{bookedPass.passId}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Checkpoint</p>
                    <p className="font-semibold">{bookedPass.checkpoint.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-semibold">{selectedDate} {selectedSlot?.start} - {selectedSlot?.end}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle Number</p>
                    <p className="font-semibold">{bookedPass.vehicleNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {bookedPass.amount}
                    </p>
                  </div>
                </div>
                {bookedPass.qrCode && (
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-muted-foreground mb-2">QR Code</p>
                    <img src={bookedPass.qrCode} alt="QR Code" className="w-48 h-48 border rounded-lg" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleDownloadReceipt} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                  <Button onClick={() => {
                    setBookingSuccess(false);
                    setBookedPass(null);
                    setBookingForm({
                      vehicleOwnerName: "",
                      vehicleOwnerPhone: "",
                      vehicleNumber: "",
                      numberOfPeople: 1
                    });
                  }} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default HourlyPassBooking;

