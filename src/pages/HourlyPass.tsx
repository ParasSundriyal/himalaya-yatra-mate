import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  MapPin,
  Clock,
  Users,
  Car,
  QrCode,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Checkpoint {
  _id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  description?: string;
  slotDuration: number;
  operatingHours: { start: string; end: string };
  maxPassesPerSlot: number;
  pricePerHour: number;
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: number;
  total: number;
  isAvailable: boolean;
}

interface Pass {
  id: string;
  passId: string;
  checkpoint: Checkpoint;
  timeSlot: { start: Date; end: Date };
  vehicleNumber?: string;
  numberOfPeople: number;
  qrCode: string;
  status: string;
  amount: number;
  isValid: boolean;
  isExpired: boolean;
  createdAt: Date;
}

const HourlyPass = () => {
  const { toast } = useToast();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [myPasses, setMyPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingPasses, setLoadingPasses] = useState(false);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState(false);
  const [selectedPass, setSelectedPass] = useState<Pass | null>(null);
  
  const [bookingData, setBookingData] = useState({
    vehicleNumber: "",
    numberOfPeople: 1,
  });

  // Fetch checkpoints
  useEffect(() => {
    fetchCheckpoints();
    fetchMyPasses();
  }, []);

  // Fetch available slots when checkpoint or date changes
  useEffect(() => {
    if (selectedCheckpoint) {
      fetchAvailableSlots();
    }
  }, [selectedCheckpoint, selectedDate]);

  const fetchCheckpoints = async () => {
    try {
      setLoading(true);
      const response = await api.checkpoints.getAll();
      if (response.success) {
        setCheckpoints(response.checkpoints);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch checkpoints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedCheckpoint) return;

    try {
      setLoadingSlots(true);
      const response = await api.checkpoints.getAvailableSlots(
        selectedCheckpoint._id,
        selectedDate
      );
      if (response.success) {
        setAvailableSlots(
          response.slots.map((slot: any) => ({
            ...slot,
            start: new Date(slot.start),
            end: new Date(slot.end),
          }))
        );
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

  const fetchMyPasses = async () => {
    try {
      setLoadingPasses(true);
      const response = await api.checkpoints.getMyPasses();
      if (response.success) {
        setMyPasses(
          response.passes.map((pass: any) => ({
            ...pass,
            timeSlot: {
              start: new Date(pass.timeSlot.start),
              end: new Date(pass.timeSlot.end),
            },
            checkpoint: pass.checkpoint,
          }))
        );
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch your passes",
        variant: "destructive",
      });
    } finally {
      setLoadingPasses(false);
    }
  };

  const handleBookPass = async () => {
    if (!selectedCheckpoint || !selectedSlot) return;

    try {
      const response = await api.checkpoints.bookPass({
        checkpointId: selectedCheckpoint._id,
        timeSlot: {
          start: selectedSlot.start.toISOString(),
          end: selectedSlot.end.toISOString(),
        },
        vehicleNumber: bookingData.vehicleNumber || undefined,
        numberOfPeople: bookingData.numberOfPeople,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Pass booked successfully!",
        });
        setBookingDialog(false);
        setSelectedSlot(null);
        setBookingData({ vehicleNumber: "", numberOfPeople: 1 });
        fetchAvailableSlots();
        fetchMyPasses();
      }
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book pass",
        variant: "destructive",
      });
    }
  };

  const handleCancelPass = async (passId: string) => {
    try {
      const response = await api.checkpoints.cancelPass(passId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Pass cancelled successfully",
        });
        fetchMyPasses();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel pass",
        variant: "destructive",
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (pass: Pass) => {
    if (pass.isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (pass.isValid) {
      return <Badge variant="default">Valid</Badge>;
    }
    switch (pass.status) {
      case "confirmed":
        return <Badge variant="secondary">Confirmed</Badge>;
      case "used":
        return <Badge variant="outline">Used</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{pass.status}</Badge>;
    }
  };

  const calculateAmount = (checkpoint: Checkpoint, numberOfPeople: number) => {
    const hours = checkpoint.slotDuration / 60;
    return checkpoint.pricePerHour * hours * numberOfPeople;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Hourly Pass Booking</h1>
          <p className="text-muted-foreground">
            Book hourly passes for checkpoints to regulate traffic
          </p>
        </div>

        <Tabs defaultValue="book" className="space-y-6">
          <TabsList>
            <TabsTrigger value="book">
              <Calendar className="h-4 w-4 mr-2" />
              Book Pass
            </TabsTrigger>
            <TabsTrigger value="my-passes">
              <QrCode className="h-4 w-4 mr-2" />
              My Passes
            </TabsTrigger>
          </TabsList>

          {/* Book Pass Tab */}
          <TabsContent value="book" className="space-y-6">
            {/* Select Checkpoint */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Select Checkpoint</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="checkpoint">Checkpoint *</Label>
                  <Select
                    value={selectedCheckpoint?._id || ""}
                    onValueChange={(value) => {
                      const checkpoint = checkpoints.find((c) => c._id === value);
                      setSelectedCheckpoint(checkpoint || null);
                      setSelectedSlot(null);
                    }}
                  >
                    <SelectTrigger id="checkpoint">
                      <SelectValue placeholder="Select a checkpoint" />
                    </SelectTrigger>
                    <SelectContent>
                      {checkpoints.map((checkpoint) => (
                        <SelectItem key={checkpoint._id} value={checkpoint._id}>
                          {checkpoint.name} - {checkpoint.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCheckpoint && (
                  <>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h3 className="font-semibold">{selectedCheckpoint.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedCheckpoint.location}
                          </p>
                          {selectedCheckpoint.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedCheckpoint.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {selectedCheckpoint.slotDuration} min slots
                            </span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-4 w-4" />
                              {selectedCheckpoint.pricePerHour}/hour
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Select Date */}
                    <div>
                      <Label htmlFor="date">Select Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedSlot(null);
                        }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    {/* Available Slots */}
                    {loadingSlots ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div>
                        <Label>Available Time Slots</Label>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                          {availableSlots.map((slot, index) => (
                            <Card
                              key={index}
                              className={`p-4 cursor-pointer transition-all ${
                                slot.isAvailable && slot === selectedSlot
                                  ? "ring-2 ring-primary"
                                  : slot.isAvailable
                                  ? "hover:shadow-md"
                                  : "opacity-50 cursor-not-allowed"
                              }`}
                              onClick={() => {
                                if (slot.isAvailable) {
                                  setSelectedSlot(slot);
                                  setBookingDialog(true);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold">
                                    {formatTime(slot.start)} - {formatTime(slot.end)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {slot.available} of {slot.total} available
                                  </div>
                                </div>
                                {slot.isAvailable ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No available slots for this date
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* My Passes Tab */}
          <TabsContent value="my-passes" className="space-y-6">
            {loadingPasses ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myPasses.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">You don't have any passes yet</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {myPasses.map((pass) => (
                  <Card key={pass.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{pass.checkpoint.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pass.checkpoint.location}
                        </p>
                      </div>
                      {getStatusBadge(pass)}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatTime(pass.timeSlot.start)} - {formatTime(pass.timeSlot.end)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDateTime(pass.timeSlot.start)}</span>
                      </div>
                      {pass.vehicleNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span>{pass.vehicleNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{pass.numberOfPeople} person(s)</span>
                      </div>
                      {pass.amount > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">₹{pass.amount}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setSelectedPass(pass);
                          setQrDialog(true);
                        }}
                        disabled={pass.status === "cancelled" || pass.isExpired}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        View QR Code
                      </Button>
                      {pass.status === "confirmed" && !pass.isExpired && (
                        <Button
                          variant="destructive"
                          onClick={() => handleCancelPass(pass.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Booking Dialog */}
        <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book Hourly Pass</DialogTitle>
              <DialogDescription>
                {selectedCheckpoint?.name} - {formatTime(selectedSlot?.start || new Date())} to{" "}
                {formatTime(selectedSlot?.end || new Date())}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="vehicleNumber">Vehicle Number (Optional)</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="Enter vehicle number"
                  value={bookingData.vehicleNumber}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, vehicleNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="numberOfPeople">Number of People *</Label>
                <Input
                  id="numberOfPeople"
                  type="number"
                  min="1"
                  value={bookingData.numberOfPeople}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      numberOfPeople: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              {selectedCheckpoint && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold text-lg">
                      ₹{calculateAmount(selectedCheckpoint, bookingData.numberOfPeople)}
                    </span>
                  </div>
                  {selectedCheckpoint.pricePerHour === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">Free pass</p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBookingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBookPass}>Confirm Booking</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={qrDialog} onOpenChange={setQrDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pass QR Code</DialogTitle>
              <DialogDescription>
                Show this QR code at the checkpoint for verification
              </DialogDescription>
            </DialogHeader>
            {selectedPass && (
              <div className="space-y-4 py-4">
                <div className="flex justify-center">
                  <img
                    src={selectedPass.qrCode}
                    alt="Pass QR Code"
                    className="w-64 h-64 border rounded-lg"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Pass ID:</span> {selectedPass.passId}
                  </div>
                  <div>
                    <span className="font-semibold">Checkpoint:</span> {selectedPass.checkpoint.name}
                  </div>
                  <div>
                    <span className="font-semibold">Time Slot:</span>{" "}
                    {formatTime(selectedPass.timeSlot.start)} -{" "}
                    {formatTime(selectedPass.timeSlot.end)}
                  </div>
                  {selectedPass.vehicleNumber && (
                    <div>
                      <span className="font-semibold">Vehicle:</span> {selectedPass.vehicleNumber}
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setQrDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default HourlyPass;

