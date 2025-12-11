import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Car, 
  MapPin, 
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  IndianRupee
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface ParkingArea {
  _id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  totalSlots: number;
  availableSlots: number;
  slots: Array<{
    _id: string;
    slotNumber: string;
    status: string;
    size: string;
    pricePerDay: number;
    location: string;
  }>;
}

const ParkingAdmin = () => {
  const { toast } = useToast();

  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState<ParkingArea | null>(null);
  
  // Dialogs
  const [areaDialog, setAreaDialog] = useState(false);
  const [slotDialog, setSlotDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [deleteSlotConfirmDialog, setDeleteSlotConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'area' | 'slot'; areaId?: string; slotId?: string } | null>(null);

  // Forms
  const [areaForm, setAreaForm] = useState({
    name: "",
    location: "",
    lat: "",
    lng: "",
    totalSlots: 0
  });

  const [slotForm, setSlotForm] = useState({
    slotNumber: "",
    size: "Standard" as "Standard" | "Large",
    pricePerDay: "",
    location: "",
    status: "available" as "available" | "occupied" | "reserved" | "maintenance"
  });

  const [editSlotForm, setEditSlotForm] = useState<{
    slotId: string;
    slotNumber: string;
    size: "Standard" | "Large";
    pricePerDay: number;
    location: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const response = await api.parking.getAreas();
      if (response.success) {
        // Fetch detailed slots for each area
        const areasWithSlots = await Promise.all(
          (response.areas || []).map(async (area: any) => {
            try {
              const slotsResponse = await api.parking.getSlots(area._id, {});
              return {
                ...area,
                slots: slotsResponse.success ? slotsResponse.slots : []
              };
            } catch {
              return { ...area, slots: [] };
            }
          })
        );
        setAreas(areasWithSlots);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch parking areas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArea = async () => {
    if (!areaForm.name || !areaForm.location || !areaForm.lat || !areaForm.lng) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.parking.createArea({
        name: areaForm.name,
        location: areaForm.location,
        coordinates: {
          lat: parseFloat(areaForm.lat),
          lng: parseFloat(areaForm.lng)
        },
        totalSlots: areaForm.totalSlots
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Parking area created successfully",
        });
        setAreaDialog(false);
        setAreaForm({ name: "", location: "", lat: "", lng: "", totalSlots: 0 });
        fetchAreas();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create parking area",
        variant: "destructive",
      });
    }
  };

  const handleUpdateArea = async (areaId: string) => {
    if (!areaForm.name || !areaForm.location) {
      toast({
        title: "Validation Error",
        description: "Name and location are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData: any = {
        name: areaForm.name,
        location: areaForm.location
      };

      if (areaForm.lat && areaForm.lng) {
        updateData.coordinates = {
          lat: parseFloat(areaForm.lat),
          lng: parseFloat(areaForm.lng)
        };
      }

      const response = await api.parking.updateArea(areaId, updateData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Parking area updated successfully",
        });
        setAreaDialog(false);
        setSelectedArea(null);
        setAreaForm({ name: "", location: "", lat: "", lng: "", totalSlots: 0 });
        fetchAreas();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update parking area",
        variant: "destructive",
      });
    }
  };

  const handleDeleteArea = async () => {
    if (!itemToDelete?.areaId) return;

    try {
      const response = await api.parking.deleteArea(itemToDelete.areaId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Parking area deleted successfully",
        });
        setDeleteConfirmDialog(false);
        setItemToDelete(null);
        fetchAreas();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete parking area",
        variant: "destructive",
      });
    }
  };

  const handleAddSlot = async () => {
    if (!selectedArea) return;

    if (!slotForm.slotNumber || !slotForm.location || !slotForm.pricePerDay) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.parking.addSlots(selectedArea._id, [{
        slotNumber: slotForm.slotNumber,
        size: slotForm.size,
        pricePerDay: parseFloat(slotForm.pricePerDay),
        location: slotForm.location,
        status: slotForm.status
      }]);

      if (response.success) {
        toast({
          title: "Success",
          description: "Slot added successfully",
        });
        setSlotDialog(false);
        setSlotForm({
          slotNumber: "",
          size: "Standard",
          pricePerDay: "",
          location: "",
          status: "available"
        });
        fetchAreas();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add slot",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSlot = async () => {
    if (!selectedArea || !editSlotForm) return;

    try {
      const response = await api.parking.updateSlot(selectedArea._id, editSlotForm.slotId, {
        slotNumber: editSlotForm.slotNumber,
        size: editSlotForm.size,
        pricePerDay: editSlotForm.pricePerDay,
        location: editSlotForm.location,
        status: editSlotForm.status
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Slot updated successfully",
        });
        setEditSlotForm(null);
        fetchAreas();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update slot",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSlot = async () => {
    if (!selectedArea || !itemToDelete?.slotId) return;

    try {
      const response = await api.parking.deleteSlot(selectedArea._id, itemToDelete.slotId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Slot deleted successfully",
        });
        setDeleteSlotConfirmDialog(false);
        setItemToDelete(null);
        fetchAreas();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete slot",
        variant: "destructive",
      });
    }
  };

  const openEditArea = (area: ParkingArea) => {
    setSelectedArea(area);
    setAreaForm({
      name: area.name,
      location: area.location,
      lat: area.coordinates.lat.toString(),
      lng: area.coordinates.lng.toString(),
      totalSlots: area.totalSlots
    });
    setAreaDialog(true);
  };

  const openEditSlot = (slot: any) => {
    setEditSlotForm({
      slotId: slot.id,
      slotNumber: slot.slotNumber,
      size: slot.size as "Standard" | "Large",
      pricePerDay: slot.pricePerDay,
      location: slot.location,
      status: slot.status
    });
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

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Parking Management</h1>
          <p className="text-muted-foreground">
            Manage parking areas and slots
          </p>
        </div>

        <div className="flex justify-end mb-6">
          <Button onClick={() => {
            setSelectedArea(null);
            setAreaForm({ name: "", location: "", lat: "", lng: "", totalSlots: 0 });
            setAreaDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Parking Area
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : areas.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No parking areas found</p>
            <Button className="mt-4" onClick={() => setAreaDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Area
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {areas.map((area) => (
              <Card key={area._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{area.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{area.location}</span>
                    </div>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span>Total Slots: <strong>{area.totalSlots}</strong></span>
                      <span>Available: <strong className="text-green-500">{area.availableSlots}</strong></span>
                      <span>Occupied: <strong className="text-red-500">{area.totalSlots - area.availableSlots}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditArea(area)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Area
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedArea(area);
                        setSlotDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Slot
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setItemToDelete({ type: 'area', areaId: area._id });
                        setDeleteConfirmDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Slots List */}
                {area.slots && area.slots.length > 0 ? (
                  <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {area.slots.map((slot) => (
                      <Card key={slot._id || slot.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold">Slot {slot.slotNumber}</div>
                            <Badge className={getStatusColor(slot.status)}>
                              {slot.status}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedArea(area);
                                openEditSlot(slot);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedArea(area);
                                setItemToDelete({ type: 'slot', areaId: area._id, slotId: slot._id || slot.id });
                                setDeleteSlotConfirmDialog(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="text-muted-foreground">Size: {slot.size}</div>
                          <div className="text-muted-foreground">Location: {slot.location}</div>
                          <div className="font-semibold flex items-center">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {slot.pricePerDay}/day
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-center py-4 text-muted-foreground">
                    <p>No slots added yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setSelectedArea(area);
                        setSlotDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Slot
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Area Dialog */}
        <Dialog open={areaDialog} onOpenChange={setAreaDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedArea ? "Edit Parking Area" : "Create Parking Area"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="area-name">Area Name *</Label>
                <Input
                  id="area-name"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  className="mt-2"
                  placeholder="e.g., Badrinath Main Parking"
                />
              </div>
              <div>
                <Label htmlFor="area-location">Location *</Label>
                <Input
                  id="area-location"
                  value={areaForm.location}
                  onChange={(e) => setAreaForm({ ...areaForm, location: e.target.value })}
                  className="mt-2"
                  placeholder="e.g., Badrinath, Uttarakhand"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="area-lat">Latitude *</Label>
                  <Input
                    id="area-lat"
                    type="number"
                    step="any"
                    value={areaForm.lat}
                    onChange={(e) => setAreaForm({ ...areaForm, lat: e.target.value })}
                    className="mt-2"
                    placeholder="30.7433"
                  />
                </div>
                <div>
                  <Label htmlFor="area-lng">Longitude *</Label>
                  <Input
                    id="area-lng"
                    type="number"
                    step="any"
                    value={areaForm.lng}
                    onChange={(e) => setAreaForm({ ...areaForm, lng: e.target.value })}
                    className="mt-2"
                    placeholder="79.4938"
                  />
                </div>
              </div>
              {!selectedArea && (
                <div>
                  <Label htmlFor="area-total-slots">Initial Total Slots</Label>
                  <Input
                    id="area-total-slots"
                    type="number"
                    min="0"
                    value={areaForm.totalSlots}
                    onChange={(e) => setAreaForm({ ...areaForm, totalSlots: parseInt(e.target.value) || 0 })}
                    className="mt-2"
                    placeholder="0 (slots can be added later)"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setAreaDialog(false);
                setSelectedArea(null);
                setAreaForm({ name: "", location: "", lat: "", lng: "", totalSlots: 0 });
              }}>
                Cancel
              </Button>
              <Button onClick={() => selectedArea ? handleUpdateArea(selectedArea._id) : handleCreateArea()}>
                {selectedArea ? "Update" : "Create"} Area
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Slot Dialog */}
        <Dialog open={slotDialog} onOpenChange={setSlotDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Parking Slot</DialogTitle>
              <DialogDescription>
                Add a new slot to {selectedArea?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="slot-number">Slot Number *</Label>
                <Input
                  id="slot-number"
                  value={slotForm.slotNumber}
                  onChange={(e) => setSlotForm({ ...slotForm, slotNumber: e.target.value })}
                  className="mt-2"
                  placeholder="e.g., A-101"
                />
              </div>
              <div>
                <Label htmlFor="slot-size">Size *</Label>
                <select
                  id="slot-size"
                  className="w-full mt-2 px-3 py-2 border rounded-md"
                  value={slotForm.size}
                  onChange={(e) => setSlotForm({ ...slotForm, size: e.target.value as "Standard" | "Large" })}
                >
                  <option value="Standard">Standard</option>
                  <option value="Large">Large</option>
                </select>
              </div>
              <div>
                <Label htmlFor="slot-price">Price Per Day (₹) *</Label>
                <Input
                  id="slot-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={slotForm.pricePerDay}
                  onChange={(e) => setSlotForm({ ...slotForm, pricePerDay: e.target.value })}
                  className="mt-2"
                  placeholder="50"
                />
              </div>
              <div>
                <Label htmlFor="slot-location">Location *</Label>
                <Input
                  id="slot-location"
                  value={slotForm.location}
                  onChange={(e) => setSlotForm({ ...slotForm, location: e.target.value })}
                  className="mt-2"
                  placeholder="e.g., Zone A, Row 1"
                />
              </div>
              <div>
                <Label htmlFor="slot-status">Status</Label>
                <select
                  id="slot-status"
                  className="w-full mt-2 px-3 py-2 border rounded-md"
                  value={slotForm.status}
                  onChange={(e) => setSlotForm({ ...slotForm, status: e.target.value as any })}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSlotDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSlot}>
                Add Slot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Slot Dialog */}
        {editSlotForm && (
          <Dialog open={!!editSlotForm} onOpenChange={() => setEditSlotForm(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Parking Slot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-slot-number">Slot Number *</Label>
                  <Input
                    id="edit-slot-number"
                    value={editSlotForm.slotNumber}
                    onChange={(e) => setEditSlotForm({ ...editSlotForm, slotNumber: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-slot-size">Size *</Label>
                  <select
                    id="edit-slot-size"
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                    value={editSlotForm.size}
                    onChange={(e) => setEditSlotForm({ ...editSlotForm, size: e.target.value as "Standard" | "Large" })}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Large">Large</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-slot-price">Price Per Day (₹) *</Label>
                  <Input
                    id="edit-slot-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editSlotForm.pricePerDay}
                    onChange={(e) => setEditSlotForm({ ...editSlotForm, pricePerDay: parseFloat(e.target.value) || 0 })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-slot-location">Location *</Label>
                  <Input
                    id="edit-slot-location"
                    value={editSlotForm.location}
                    onChange={(e) => setEditSlotForm({ ...editSlotForm, location: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-slot-status">Status</Label>
                  <select
                    id="edit-slot-status"
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                    value={editSlotForm.status}
                    onChange={(e) => setEditSlotForm({ ...editSlotForm, status: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditSlotForm(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSlot}>
                  Update Slot
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Area Confirmation */}
        <Dialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Parking Area</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this parking area? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDeleteConfirmDialog(false);
                setItemToDelete(null);
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteArea}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Slot Confirmation */}
        <Dialog open={deleteSlotConfirmDialog} onOpenChange={setDeleteSlotConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Parking Slot</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this slot? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDeleteSlotConfirmDialog(false);
                setItemToDelete(null);
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteSlot}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ParkingAdmin;

