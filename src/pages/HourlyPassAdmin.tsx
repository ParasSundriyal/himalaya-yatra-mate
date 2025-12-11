import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings,
  Search,
  Eye,
  CheckSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

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

interface SlotConfig {
  _id: string;
  checkpoint: any;
  date: string;
  hour: number;
  capacity: number;
  price: number | null;
  isActive: boolean;
}

const HourlyPassAdmin = () => {
  const { toast } = useToast();

  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotConfigs, setSlotConfigs] = useState<SlotConfig[]>([]);
  const [loadingCheckpoints, setLoadingCheckpoints] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [passes, setPasses] = useState<any[]>([]);
  const [loadingPasses, setLoadingPasses] = useState(false);
  const [passPagination, setPassPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0
  });
  
  // Dialogs
  const [slotConfigDialog, setSlotConfigDialog] = useState(false);
  const [selectedSlotForConfig, setSelectedSlotForConfig] = useState<Slot | null>(null);
  const [scanDialog, setScanDialog] = useState(false);
  const [scanPassId, setScanPassId] = useState("");
  const [scannedPass, setScannedPass] = useState<any>(null);

  // Filters
  const [passFilters, setPassFilters] = useState({
    status: "",
    checkpointId: "",
    startDate: "",
    endDate: "",
    vehicleNumber: ""
  });

  const [slotConfigForm, setSlotConfigForm] = useState({
    capacity: 50,
    price: "",
    isActive: true
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
      fetchSlotConfigs();
    }
  }, [selectedCheckpoint, selectedDate]);

  useEffect(() => {
    fetchPasses(1); // Reset to page 1 when filters change
  }, [passFilters]);

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
        description: error.message || "Failed to fetch slots",
        variant: "destructive",
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchSlotConfigs = async () => {
    if (!selectedCheckpoint || !selectedDate) return;

    try {
      const response = await api.hourlyPasses.getSlotConfigs(selectedCheckpoint, selectedDate);
      if (response.success) {
        setSlotConfigs(response.slots || []);
      }
    } catch (error: any) {
      // It's okay if no configs exist yet
      setSlotConfigs([]);
    }
  };

  const fetchPasses = async (page = passPagination.page) => {
    setLoadingPasses(true);
    try {
      const response = await api.hourlyPasses.getAllPasses({
        status: passFilters.status || undefined,
        checkpointId: passFilters.checkpointId || undefined,
        startDate: passFilters.startDate || undefined,
        endDate: passFilters.endDate || undefined,
        vehicleNumber: passFilters.vehicleNumber || undefined,
        page: page,
        limit: passPagination.limit
      });
      if (response.success) {
        setPasses(response.passes || []);
        setPassPagination({
          ...passPagination,
          page: response.page || page,
          totalCount: response.totalCount || 0,
          totalPages: response.totalPages || 0
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch passes",
        variant: "destructive",
      });
    } finally {
      setLoadingPasses(false);
    }
  };

  const handleConfigureSlot = (slot: Slot) => {
    setSelectedSlotForConfig(slot);
    // Find existing config if any
    const existingConfig = slotConfigs.find(s => s.hour === slot.hour);
    if (existingConfig) {
      setSlotConfigForm({
        capacity: existingConfig.capacity,
        price: existingConfig.price?.toString() || "",
        isActive: existingConfig.isActive
      });
    } else {
      setSlotConfigForm({
        capacity: slot.capacity,
        price: slot.price.toString(),
        isActive: true
      });
    }
    setSlotConfigDialog(true);
  };

  const handleSaveSlotConfig = async () => {
    if (!selectedCheckpoint || !selectedDate || !selectedSlotForConfig) return;

    try {
      const response = await api.hourlyPasses.setSlotCapacity({
        checkpointId: selectedCheckpoint,
        date: selectedDate,
        hour: selectedSlotForConfig.hour,
        capacity: slotConfigForm.capacity,
        price: slotConfigForm.price ? parseFloat(slotConfigForm.price) : undefined,
        isActive: slotConfigForm.isActive
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Slot configuration updated successfully",
        });
        setSlotConfigDialog(false);
        fetchSlots();
        fetchSlotConfigs();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update slot configuration",
        variant: "destructive",
      });
    }
  };

  const handleScanPass = async () => {
    if (!scanPassId.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a pass ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.hourlyPasses.scanPass(scanPassId.trim());
      if (response.success) {
        setScannedPass(response.pass);
        toast({
          title: "Success",
          description: "Pass verified and marked as used",
        });
        fetchPasses(); // Refresh passes list
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to scan pass",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'used':
        return 'bg-blue-500';
      case 'expired':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Hourly Pass Administration</h1>
          <p className="text-muted-foreground">
            Manage slot capacities and scan QR codes for pass verification
          </p>
        </div>

        <Tabs defaultValue="slots" className="space-y-6">
          <TabsList>
            <TabsTrigger value="slots">
              <Settings className="h-4 w-4 mr-2" />
              Manage Slots
            </TabsTrigger>
            <TabsTrigger value="scan">
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR Code
            </TabsTrigger>
            <TabsTrigger value="passes">
              <Eye className="h-4 w-4 mr-2" />
              View All Passes
            </TabsTrigger>
          </TabsList>

          {/* Manage Slots Tab */}
          <TabsContent value="slots" className="space-y-6">
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="admin-checkpoint">Select Checkpoint *</Label>
                  {loadingCheckpoints ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <select
                      id="admin-checkpoint"
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
                  <Label htmlFor="admin-date">Select Date *</Label>
                  <Input
                    id="admin-date"
                    type="date"
                    className="mt-2"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedCheckpoint && selectedDate && (
                <>
                  <h3 className="text-lg font-semibold mb-4">Hourly Slots Configuration</h3>
                  {loadingSlots ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {slots.map((slot) => {
                        const config = slotConfigs.find(s => s.hour === slot.hour);
                        return (
                          <Card key={slot.hour} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="font-semibold">
                                  {slot.start} - {slot.end}
                                </span>
                              </div>
                              {config && (
                                <Badge variant="outline">Configured</Badge>
                              )}
                            </div>
                            <div className="space-y-2 text-sm mb-3">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Capacity</span>
                                <span className="font-semibold">{slot.capacity}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Available</span>
                                <span className="font-semibold">{slot.available}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Booked</span>
                                <span className="font-semibold">{slot.booked}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-semibold flex items-center">
                                  <IndianRupee className="h-3 w-3 mr-1" />
                                  {slot.price}
                                </span>
                              </div>
                            </div>
                            <Button
                              className="w-full"
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfigureSlot(slot)}
                            >
                              <Settings className="h-3 w-3 mr-2" />
                              Configure
                            </Button>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </Card>
          </TabsContent>

          {/* Scan QR Tab */}
          <TabsContent value="scan" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Scan Pass QR Code</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scan-pass-id">Enter Pass ID</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="scan-pass-id"
                      value={scanPassId}
                      onChange={(e) => setScanPassId(e.target.value)}
                      placeholder="Enter pass ID from QR code"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleScanPass();
                        }
                      }}
                    />
                    <Button onClick={handleScanPass}>
                      <Search className="h-4 w-4 mr-2" />
                      Scan
                    </Button>
                  </div>
                </div>
                {scannedPass && (
                  <Card className="p-4 bg-muted">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pass ID</span>
                        <span className="font-mono font-semibold">{scannedPass.passId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge className={getStatusColor(scannedPass.status)}>
                          {scannedPass.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Checkpoint</span>
                        <span className="font-semibold">{scannedPass.checkpoint.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Vehicle Owner</span>
                        <span className="font-semibold">{scannedPass.vehicleOwnerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Vehicle Number</span>
                        <span className="font-semibold">{scannedPass.vehicleNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Phone</span>
                        <span className="font-semibold">{scannedPass.vehicleOwnerPhone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Time Slot</span>
                        <span className="font-semibold">
                          {new Date(scannedPass.timeSlot.start).toLocaleString()} - {new Date(scannedPass.timeSlot.end).toLocaleString()}
                        </span>
                      </div>
                      {scannedPass.verifiedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Verified At</span>
                          <span className="font-semibold">
                            {new Date(scannedPass.verifiedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* View All Passes Tab */}
          <TabsContent value="passes" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">All Passes</h3>
              
              {/* Filters */}
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div>
                  <Label htmlFor="filter-status">Status</Label>
                  <select
                    id="filter-status"
                    className="w-full mt-2 px-3 py-2 border rounded-md text-sm"
                    value={passFilters.status}
                    onChange={(e) => setPassFilters({ ...passFilters, status: e.target.value })}
                  >
                    <option value="">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="used">Used</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="filter-checkpoint">Checkpoint</Label>
                  <select
                    id="filter-checkpoint"
                    className="w-full mt-2 px-3 py-2 border rounded-md text-sm"
                    value={passFilters.checkpointId}
                    onChange={(e) => setPassFilters({ ...passFilters, checkpointId: e.target.value })}
                  >
                    <option value="">All Checkpoints</option>
                    {checkpoints.map((cp) => (
                      <option key={cp._id} value={cp._id}>
                        {cp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="filter-start-date">Start Date</Label>
                  <Input
                    id="filter-start-date"
                    type="date"
                    className="mt-2"
                    value={passFilters.startDate}
                    onChange={(e) => setPassFilters({ ...passFilters, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="filter-end-date">End Date</Label>
                  <Input
                    id="filter-end-date"
                    type="date"
                    className="mt-2"
                    value={passFilters.endDate}
                    onChange={(e) => setPassFilters({ ...passFilters, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="filter-vehicle">Vehicle Number</Label>
                  <Input
                    id="filter-vehicle"
                    className="mt-2"
                    value={passFilters.vehicleNumber}
                    onChange={(e) => setPassFilters({ ...passFilters, vehicleNumber: e.target.value.toUpperCase() })}
                    placeholder="Vehicle number"
                  />
                </div>
              </div>

              {/* Results Summary */}
              {passPagination.totalCount > 0 && (
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {((passPagination.page - 1) * passPagination.limit) + 1} - {Math.min(passPagination.page * passPagination.limit, passPagination.totalCount)} of {passPagination.totalCount} passes
                </div>
              )}

              {loadingPasses ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : passes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No passes found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {passes.map((pass) => (
                      <Card key={pass.id} className="p-4">
                        <div className="grid md:grid-cols-5 gap-4 items-center">
                          <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-xs">{pass.passId}</span>
                              <Badge className={getStatusColor(pass.status)}>
                                {pass.status}
                              </Badge>
                            </div>
                            <div className="text-sm">
                              <div><strong>{pass.checkpoint?.name || 'N/A'}</strong></div>
                              <div className="text-muted-foreground">{pass.checkpoint?.location || ''}</div>
                            </div>
                          </div>
                          <div className="text-sm">
                            <div className="text-muted-foreground">Vehicle</div>
                            <div className="font-semibold">{pass.vehicleNumber}</div>
                            <div className="text-xs text-muted-foreground">{pass.vehicleOwnerName}</div>
                          </div>
                          <div className="text-sm">
                            <div className="text-muted-foreground">Time Slot</div>
                            <div className="font-semibold">
                              {new Date(pass.timeSlot.start).toLocaleDateString()}
                            </div>
                            <div className="text-xs">
                              {new Date(pass.timeSlot.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {new Date(pass.timeSlot.end).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="text-sm text-right">
                            <div className="text-muted-foreground">Amount</div>
                            <div className="font-semibold flex items-center justify-end">
                              <IndianRupee className="h-3 w-3 mr-1" />
                              {pass.amount}
                            </div>
                            <div className="text-xs text-muted-foreground">{pass.paymentStatus}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {passPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Page {passPagination.page} of {passPagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchPasses(passPagination.page - 1)}
                          disabled={passPagination.page === 1 || loadingPasses}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchPasses(passPagination.page + 1)}
                          disabled={passPagination.page >= passPagination.totalPages || loadingPasses}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Slot Configuration Dialog */}
        <Dialog open={slotConfigDialog} onOpenChange={setSlotConfigDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Slot</DialogTitle>
              <DialogDescription>
                Set capacity and price for {selectedSlotForConfig?.start} - {selectedSlotForConfig?.end}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="config-capacity">Capacity *</Label>
                <Input
                  id="config-capacity"
                  type="number"
                  min="0"
                  value={slotConfigForm.capacity}
                  onChange={(e) => setSlotConfigForm({ ...slotConfigForm, capacity: parseInt(e.target.value) || 0 })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="config-price">Price (leave empty to use checkpoint default)</Label>
                <Input
                  id="config-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={slotConfigForm.price}
                  onChange={(e) => setSlotConfigForm({ ...slotConfigForm, price: e.target.value })}
                  className="mt-2"
                  placeholder="Checkpoint default"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="config-active"
                  checked={slotConfigForm.isActive}
                  onChange={(e) => setSlotConfigForm({ ...slotConfigForm, isActive: e.target.checked })}
                />
                <Label htmlFor="config-active">Active (available for booking)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSlotConfigDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSlotConfig}>
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default HourlyPassAdmin;

