import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, 
  UserPlus, 
  Download,
  Mail,
  Phone,
  IdCard,
  CheckCircle,
  Loader2,
  Trash2,
  Building2,
  Car,
  MapPin,
  Plus,
  Calendar,
  IndianRupee,
  Hotel,
  Navigation
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface GroupMember {
  _id: string;
  name: string;
  email: string;
  phone: string;
  aadhar?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

interface Group {
  _id: string;
  name: string;
  description?: string;
  instructor: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  members: GroupMember[];
  totalMembers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const GroupPortal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<{ type?: string; status?: string }>({});
  
  // Dialog states
  const [createGroupDialog, setCreateGroupDialog] = useState(false);
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  
  // Form states
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: ''
  });
  
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    aadhar: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  // Booking dialog states
  const [hotelBookingDialog, setHotelBookingDialog] = useState(false);
  const [taxiBookingDialog, setTaxiBookingDialog] = useState(false);
  const [parkingBookingDialog, setParkingBookingDialog] = useState(false);
  const [selectedMemberForBooking, setSelectedMemberForBooking] = useState<GroupMember | null>(null);

  // Booking data states
  const [hotels, setHotels] = useState<any[]>([]);
  const [taxis, setTaxis] = useState<any[]>([]);
  const [parkingAreas, setParkingAreas] = useState<any[]>([]);
  const [selectedParkingArea, setSelectedParkingArea] = useState<any>(null);
  const [parkingSlots, setParkingSlots] = useState<any[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [loadingTaxis, setLoadingTaxis] = useState(false);
  const [loadingParking, setLoadingParking] = useState(false);

  // Booking form states
  const [hotelBookingForm, setHotelBookingForm] = useState({
    hotelId: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1
  });

  const [taxiBookingForm, setTaxiBookingForm] = useState({
    taxiId: '',
    pickupLocation: '',
    dropoffLocation: '',
    pickupTime: '',
    distance: 0
  });

  const [parkingBookingForm, setParkingBookingForm] = useState({
    areaId: '',
    slotId: '',
    vehicleNumber: '',
    entryTime: '',
    exitTime: ''
  });

  // Fetch group data
  const fetchGroup = async () => {
    setLoading(true);
    try {
      const response = await api.groups.getMyGroup();
      if (response.success && response.group) {
        setGroup(response.group);
      } else if (response.message?.includes('not found')) {
        // Group doesn't exist, show create dialog
        setGroup(null);
        setCreateGroupDialog(true);
      }
    } catch (error: any) {
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        setGroup(null);
        setCreateGroupDialog(true);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch group data",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings
  const fetchBookings = async () => {
    if (!group) return;
    
    setLoadingBookings(true);
    try {
      const response = await api.groups.getMemberBookings(bookingFilter);
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

  useEffect(() => {
    fetchGroup();
  }, []);

  useEffect(() => {
    if (group) {
      fetchBookings();
    }
  }, [group, bookingFilter]);

  // Create group
  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    setLoadingAction(true);
    try {
      const response = await api.groups.create({
        name: groupForm.name,
        description: groupForm.description || undefined
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Group created successfully",
        });
        setCreateGroupDialog(false);
        setGroupForm({ name: '', description: '' });
        fetchGroup();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Add member
  const handleAddMember = async () => {
    // Validation
    if (!memberForm.name.trim() || !memberForm.email.trim() || !memberForm.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Name, email, and phone are required",
        variant: "destructive",
      });
      return;
    }

    // Validate phone (10 digits)
    if (!/^[0-9]{10}$/.test(memberForm.phone)) {
      toast({
        title: "Validation Error",
        description: "Phone number must be 10 digits",
        variant: "destructive",
      });
      return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberForm.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Validate Aadhar if provided (12 digits)
    if (memberForm.aadhar && !/^[0-9]{12}$/.test(memberForm.aadhar)) {
      toast({
        title: "Validation Error",
        description: "Aadhar number must be 12 digits",
        variant: "destructive",
      });
      return;
    }

    setLoadingAction(true);
    try {
      const response = await api.groups.addMember({
        name: memberForm.name,
        email: memberForm.email,
        phone: memberForm.phone,
        aadhar: memberForm.aadhar || undefined,
        dateOfBirth: memberForm.dateOfBirth || undefined,
        address: memberForm.address.street ? memberForm.address : undefined
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Member added successfully",
        });
        setAddMemberDialog(false);
        setMemberForm({
          name: '',
          email: '',
          phone: '',
          aadhar: '',
          dateOfBirth: '',
          address: { street: '', city: '', state: '', pincode: '' }
        });
        fetchGroup();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add member",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    setLoadingAction(true);
    try {
      const response = await api.groups.removeMember(memberId);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Member removed successfully",
        });
        setDeleteConfirmDialog(false);
        setMemberToDelete(null);
        fetchGroup();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

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

  // Fetch parking areas
  const fetchParkingAreas = async () => {
    setLoadingParking(true);
    try {
      const response = await api.parking.getAreas();
      if (response.success) {
        setParkingAreas(response.areas || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch parking areas",
        variant: "destructive",
      });
    } finally {
      setLoadingParking(false);
    }
  };

  // Fetch parking slots
  const fetchParkingSlots = async (areaId: string) => {
    try {
      const response = await api.parking.getSlots(areaId, { status: 'available' });
      if (response.success) {
        setParkingSlots(response.slots || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch parking slots",
        variant: "destructive",
      });
    }
  };

  // Handle hotel booking
  const handleHotelBooking = async () => {
    if (!selectedMemberForBooking || !hotelBookingForm.hotelId) {
      toast({
        title: "Validation Error",
        description: "Please select a member and hotel",
        variant: "destructive",
      });
      return;
    }

    setLoadingAction(true);
    try {
      const response = await api.hotels.book({
        ...hotelBookingForm,
        memberId: selectedMemberForBooking._id
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Hotel booked successfully for member",
        });
        setHotelBookingDialog(false);
        setHotelBookingForm({ hotelId: '', checkIn: '', checkOut: '', guests: 1, rooms: 1 });
        setSelectedMemberForBooking(null);
        fetchBookings();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to book hotel",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle taxi booking
  const handleTaxiBooking = async () => {
    if (!selectedMemberForBooking || !taxiBookingForm.taxiId) {
      toast({
        title: "Validation Error",
        description: "Please select a member and taxi",
        variant: "destructive",
      });
      return;
    }

    setLoadingAction(true);
    try {
      const response = await api.taxis.book({
        ...taxiBookingForm,
        memberId: selectedMemberForBooking._id
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Taxi booked successfully for member",
        });
        setTaxiBookingDialog(false);
        setTaxiBookingForm({ taxiId: '', pickupLocation: '', dropoffLocation: '', pickupTime: '', distance: 0 });
        setSelectedMemberForBooking(null);
        fetchBookings();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to book taxi",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle parking booking
  const handleParkingBooking = async () => {
    if (!selectedMemberForBooking || !parkingBookingForm.slotId || !parkingBookingForm.areaId || !parkingBookingForm.vehicleNumber) {
      toast({
        title: "Validation Error",
        description: "Please select a member, area, slot, and enter vehicle number",
        variant: "destructive",
      });
      return;
    }

    setLoadingAction(true);
    try {
      // Prepare booking data, only include entryTime/exitTime if they have values
      const bookingData: any = {
        areaId: parkingBookingForm.areaId,
        slotId: parkingBookingForm.slotId,
        vehicleNumber: parkingBookingForm.vehicleNumber,
        memberId: selectedMemberForBooking._id
      };

      // Only add entryTime if it's not empty
      if (parkingBookingForm.entryTime) {
        // Convert datetime-local to ISO string
        bookingData.entryTime = new Date(parkingBookingForm.entryTime).toISOString();
      }

      // Only add exitTime if it's not empty
      if (parkingBookingForm.exitTime) {
        // Convert datetime-local to ISO string
        bookingData.exitTime = new Date(parkingBookingForm.exitTime).toISOString();
      }

      const response = await api.parking.bookSlot(bookingData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Parking slot booked successfully for member",
        });
        setParkingBookingDialog(false);
        setParkingBookingForm({ areaId: '', slotId: '', vehicleNumber: '', entryTime: '', exitTime: '' });
        setSelectedMemberForBooking(null);
        setSelectedParkingArea(null);
        setParkingSlots([]);
        fetchBookings();
      }
    } catch (error: any) {
      console.error('Parking booking error:', error);
      const errorMessage = error.message || "Failed to book parking";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalMembers: group?.members?.length || 0,
    activeMembers: group?.members?.filter(m => m.isActive !== false).length || 0,
    verifiedMembers: group?.members?.filter(m => m.isVerified).length || 0,
    verificationRate: group?.members?.length 
      ? Math.round((group.members.filter(m => m.isVerified).length / group.members.length) * 100)
      : 0
  };

  // Open booking dialog helper
  const openBookingDialog = (type: 'hotel' | 'taxi' | 'parking', member: GroupMember) => {
    setSelectedMemberForBooking(member);
    if (type === 'hotel') {
      fetchHotels();
      setHotelBookingDialog(true);
    } else if (type === 'taxi') {
      fetchTaxis();
      setTaxiBookingDialog(true);
    } else if (type === 'parking') {
      fetchParkingAreas();
      setParkingBookingDialog(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading group data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Group Instructor Portal</h1>
          <p className="text-muted-foreground">
            Manage your group registrations and member passes efficiently
          </p>
          {group && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                Group: {group.name}
              </Badge>
              {group.description && (
                <span className="text-sm text-muted-foreground">{group.description}</span>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalMembers}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.activeMembers}</div>
                <div className="text-sm text-muted-foreground">Active Members</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <IdCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.verifiedMembers}</div>
                <div className="text-sm text-muted-foreground">Verified Members</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.verificationRate}%</div>
                <div className="text-sm text-muted-foreground">Verification Rate</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        {group ? (
          <Tabs defaultValue="members" className="space-y-6">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="bookings">Group Bookings</TabsTrigger>
            </TabsList>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-6">
              {/* Members List */}
              <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Group Members
                </h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setAddMemberDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>

              {group.members && group.members.length > 0 ? (
                <div className="space-y-4">
                  {group.members.map((member) => (
                    <Card key={member._id} className="p-5 hover:shadow-md transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{member.name}</h3>
                              <Badge variant="outline" className="mt-1">
                                ID: {member._id.slice(-8).toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Mail className="h-4 w-4 mr-2" />
                              {member.email}
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Phone className="h-4 w-4 mr-2" />
                              {member.phone}
                            </div>
                            {member.aadhar && (
                              <div className="flex items-center text-muted-foreground">
                                <IdCard className="h-4 w-4 mr-2" />
                                Aadhar: {member.aadhar}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            {member.isVerified && (
                              <Badge className="bg-green-500 text-white">
                                Verified
                              </Badge>
                            )}
                            {member.isActive !== false && (
                              <Badge className="bg-secondary text-secondary-foreground">
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openBookingDialog('hotel', member)}
                              className="text-xs"
                            >
                              <Hotel className="h-3 w-3 mr-1" />
                              Hotel
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openBookingDialog('taxi', member)}
                              className="text-xs"
                            >
                              <Car className="h-3 w-3 mr-1" />
                              Taxi
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openBookingDialog('parking', member)}
                              className="text-xs"
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              Parking
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setMemberToDelete(member._id);
                                setDeleteConfirmDialog(true);
                              }}
                              className="text-xs"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No members added yet</p>
                  <p className="text-sm mb-4">Start by adding your first group member</p>
                  <Button onClick={() => setAddMemberDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Member
                  </Button>
                </div>
              )}
            </Card>

              {/* Instructions */}
              <Card className="p-6 bg-primary/5 border-primary/20">
                <h3 className="font-semibold mb-3">Group Instructor Guide</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Add members with their details to automatically create user accounts</p>
                  <p>• Members will receive their login credentials via email (if email service is configured)</p>
                  <p>• Manage all group member bookings and activities from this dashboard</p>
                  <p>• Export group details and passes as PDF for offline access</p>
                  <p>• Track member verification status and activity</p>
                </div>
              </Card>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Group Member Bookings
                  </h2>
                  <div className="flex gap-2">
                    <select
                      className="px-3 py-2 border rounded-md text-sm"
                      value={bookingFilter.type || ''}
                      onChange={(e) => setBookingFilter({ ...bookingFilter, type: e.target.value || undefined })}
                    >
                      <option value="">All Types</option>
                      <option value="hotel">Hotels</option>
                      <option value="taxi">Taxis</option>
                      <option value="parking">Parking</option>
                    </select>
                    <select
                      className="px-3 py-2 border rounded-md text-sm"
                      value={bookingFilter.status || ''}
                      onChange={(e) => setBookingFilter({ ...bookingFilter, status: e.target.value || undefined })}
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {loadingBookings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking._id} className="p-5 hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {booking.bookingType === 'hotel' && <Hotel className="h-5 w-5 text-primary" />}
                              {booking.bookingType === 'taxi' && <Car className="h-5 w-5 text-primary" />}
                              {booking.bookingType === 'parking' && <MapPin className="h-5 w-5 text-primary" />}
                              <div>
                                <h3 className="font-semibold text-lg capitalize">
                                  {booking.bookingType} Booking
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Member: {booking.user?.name || 'Unknown'}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm">
                              {booking.bookingType === 'hotel' && booking.hotel?.hotelId && (
                                <>
                                  <div className="flex items-center text-muted-foreground">
                                    <Building2 className="h-4 w-4 mr-2" />
                                    {booking.hotel.hotelId.name} - {booking.hotel.hotelId.location}
                                  </div>
                                  <div className="flex items-center text-muted-foreground">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Check-in: {new Date(booking.hotel.checkIn).toLocaleDateString()} - 
                                    Check-out: {new Date(booking.hotel.checkOut).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center text-muted-foreground">
                                    <Users className="h-4 w-4 mr-2" />
                                    {booking.hotel.guests} guests, {booking.hotel.rooms} rooms
                                  </div>
                                </>
                              )}
                              {booking.bookingType === 'taxi' && booking.taxi?.taxiId && (
                                <>
                                  <div className="flex items-center text-muted-foreground">
                                    <Car className="h-4 w-4 mr-2" />
                                    {booking.taxi.taxiId.driverName} - {booking.taxi.taxiId.vehicleType}
                                  </div>
                                  <div className="flex items-center text-muted-foreground">
                                    <Navigation className="h-4 w-4 mr-2" />
                                    {booking.taxi.pickupLocation} → {booking.taxi.dropoffLocation}
                                  </div>
                                  <div className="flex items-center text-muted-foreground">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {new Date(booking.taxi.pickupTime).toLocaleString()}
                                  </div>
                                </>
                              )}
                              {booking.bookingType === 'parking' && booking.parking?.areaId && (
                                <>
                                  <div className="flex items-center text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {booking.parking.areaId.name} - Slot {booking.parking.slotNumber}
                                  </div>
                                  <div className="flex items-center text-muted-foreground">
                                    <Car className="h-4 w-4 mr-2" />
                                    Vehicle: {booking.parking.vehicleNumber}
                                  </div>
                                </>
                              )}
                              <div className="flex items-center text-muted-foreground">
                                <IndianRupee className="h-4 w-4 mr-2" />
                                Amount: ₹{booking.amount}
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2" />
                                Booked on: {new Date(booking.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Badge 
                              className={
                                booking.status === 'confirmed' ? 'bg-green-500' :
                                booking.status === 'cancelled' ? 'bg-red-500' :
                                booking.status === 'completed' ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }
                            >
                              {booking.status}
                            </Badge>
                            <Badge variant="outline">
                              {booking.paymentStatus || 'pending'}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No bookings found</p>
                    <p className="text-sm">Bookings made by group members will appear here</p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Group Found</h3>
            <p className="text-muted-foreground mb-6">
              Create a group to start managing your members
            </p>
            <Button onClick={() => setCreateGroupDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </Card>
        )}

        {/* Create Group Dialog */}
        <Dialog open={createGroupDialog} onOpenChange={setCreateGroupDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new group to start managing your members
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  placeholder="Enter group name"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="groupDescription">Description (Optional)</Label>
                <Input
                  id="groupDescription"
                  placeholder="Enter group description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateGroupDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={loadingAction}>
                {loadingAction && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={addMemberDialog} onOpenChange={setAddMemberDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>
                Add a new member to your group. A user account will be created automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="memberName">Full Name *</Label>
                  <Input
                    id="memberName"
                    placeholder="Enter full name"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="memberEmail">Email Address *</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="memberPhone">Phone Number *</Label>
                  <Input
                    id="memberPhone"
                    placeholder="10-digit phone number"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="memberAadhar">Aadhar Number (Optional)</Label>
                  <Input
                    id="memberAadhar"
                    placeholder="12-digit Aadhar"
                    value={memberForm.aadhar}
                    onChange={(e) => setMemberForm({ ...memberForm, aadhar: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="memberDOB">Date of Birth (Optional)</Label>
                <Input
                  id="memberDOB"
                  type="date"
                  value={memberForm.dateOfBirth}
                  onChange={(e) => setMemberForm({ ...memberForm, dateOfBirth: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Address (Optional)</Label>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="street">Street</Label>
                    <Input
                      id="street"
                      placeholder="Street address"
                      value={memberForm.address.street}
                      onChange={(e) => setMemberForm({ 
                        ...memberForm, 
                        address: { ...memberForm.address, street: e.target.value }
                      })}
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={memberForm.address.city}
                        onChange={(e) => setMemberForm({ 
                          ...memberForm, 
                          address: { ...memberForm.address, city: e.target.value }
                        })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="State"
                        value={memberForm.address.state}
                        onChange={(e) => setMemberForm({ 
                          ...memberForm, 
                          address: { ...memberForm.address, state: e.target.value }
                        })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      placeholder="Pincode"
                      value={memberForm.address.pincode}
                      onChange={(e) => setMemberForm({ 
                        ...memberForm, 
                        address: { ...memberForm.address, pincode: e.target.value }
                      })}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddMemberDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={loadingAction}>
                {loadingAction && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this member from the group? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDeleteConfirmDialog(false);
                setMemberToDelete(null);
              }}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => memberToDelete && handleRemoveMember(memberToDelete)}
                disabled={loadingAction}
              >
                {loadingAction && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Remove Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hotel Booking Dialog */}
        <Dialog open={hotelBookingDialog} onOpenChange={setHotelBookingDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book Hotel for {selectedMemberForBooking?.name}</DialogTitle>
              <DialogDescription>
                Book a hotel room for this group member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="hotelSelect">Select Hotel *</Label>
                {loadingHotels ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <select
                    id="hotelSelect"
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                    value={hotelBookingForm.hotelId}
                    onChange={(e) => setHotelBookingForm({ ...hotelBookingForm, hotelId: e.target.value })}
                  >
                    <option value="">Select a hotel</option>
                    {hotels.map((hotel) => (
                      <option key={hotel._id} value={hotel._id}>
                        {hotel.name} - {hotel.location} (₹{hotel.pricePerNight}/night)
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkIn">Check-in Date *</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={hotelBookingForm.checkIn}
                    onChange={(e) => setHotelBookingForm({ ...hotelBookingForm, checkIn: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="checkOut">Check-out Date *</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={hotelBookingForm.checkOut}
                    onChange={(e) => setHotelBookingForm({ ...hotelBookingForm, checkOut: e.target.value })}
                    className="mt-2"
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
                    value={hotelBookingForm.guests}
                    onChange={(e) => setHotelBookingForm({ ...hotelBookingForm, guests: parseInt(e.target.value) || 1 })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="rooms">Number of Rooms *</Label>
                  <Input
                    id="rooms"
                    type="number"
                    min="1"
                    value={hotelBookingForm.rooms}
                    onChange={(e) => setHotelBookingForm({ ...hotelBookingForm, rooms: parseInt(e.target.value) || 1 })}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHotelBookingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleHotelBooking} disabled={loadingAction}>
                {loadingAction && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Book Hotel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Taxi Booking Dialog */}
        <Dialog open={taxiBookingDialog} onOpenChange={setTaxiBookingDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book Taxi for {selectedMemberForBooking?.name}</DialogTitle>
              <DialogDescription>
                Book a taxi for this group member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="taxiSelect">Select Taxi *</Label>
                {loadingTaxis ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <select
                    id="taxiSelect"
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                    value={taxiBookingForm.taxiId}
                    onChange={(e) => setTaxiBookingForm({ ...taxiBookingForm, taxiId: e.target.value })}
                  >
                    <option value="">Select a taxi</option>
                    {taxis.filter(t => t.isAvailable).map((taxi) => (
                      <option key={taxi._id} value={taxi._id}>
                        {taxi.driverName} - {taxi.vehicleType} ({taxi.seats} seats) - ₹{taxi.ratePerKm}/km
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <Label htmlFor="pickupLocation">Pickup Location *</Label>
                <Input
                  id="pickupLocation"
                  placeholder="Enter pickup location"
                  value={taxiBookingForm.pickupLocation}
                  onChange={(e) => setTaxiBookingForm({ ...taxiBookingForm, pickupLocation: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="dropoffLocation">Drop-off Location *</Label>
                <Input
                  id="dropoffLocation"
                  placeholder="Enter drop-off location"
                  value={taxiBookingForm.dropoffLocation}
                  onChange={(e) => setTaxiBookingForm({ ...taxiBookingForm, dropoffLocation: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickupTime">Pickup Date & Time *</Label>
                  <Input
                    id="pickupTime"
                    type="datetime-local"
                    value={taxiBookingForm.pickupTime}
                    onChange={(e) => setTaxiBookingForm({ ...taxiBookingForm, pickupTime: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="distance">Distance (km) *</Label>
                  <Input
                    id="distance"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Distance in km"
                    value={taxiBookingForm.distance}
                    onChange={(e) => setTaxiBookingForm({ ...taxiBookingForm, distance: parseFloat(e.target.value) || 0 })}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTaxiBookingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleTaxiBooking} disabled={loadingAction}>
                {loadingAction && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Book Taxi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Parking Booking Dialog */}
        <Dialog open={parkingBookingDialog} onOpenChange={setParkingBookingDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book Parking for {selectedMemberForBooking?.name}</DialogTitle>
              <DialogDescription>
                Book a parking slot for this group member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="parkingArea">Select Parking Area *</Label>
                {loadingParking ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <select
                    id="parkingArea"
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                    value={parkingBookingForm.areaId}
                    onChange={(e) => {
                      setParkingBookingForm({ ...parkingBookingForm, areaId: e.target.value, slotId: '' });
                      const area = parkingAreas.find(a => a._id === e.target.value);
                      setSelectedParkingArea(area);
                      if (e.target.value) {
                        fetchParkingSlots(e.target.value);
                      }
                    }}
                  >
                    <option value="">Select a parking area</option>
                    {parkingAreas.map((area) => (
                      <option key={area._id} value={area._id}>
                        {area.name} - {area.location}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {parkingBookingForm.areaId && (
                <div>
                  <Label htmlFor="parkingSlot">Select Parking Slot *</Label>
                  <select
                    id="parkingSlot"
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                    value={parkingBookingForm.slotId}
                    onChange={(e) => setParkingBookingForm({ ...parkingBookingForm, slotId: e.target.value })}
                  >
                    <option value="">Select a slot</option>
                    {parkingSlots.map((slot) => (
                      <option key={slot.id || slot._id} value={slot.id || slot._id}>
                        Slot {slot.slotNumber} - {slot.size} - ₹{slot.pricePerDay}/day
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="Enter vehicle number"
                  value={parkingBookingForm.vehicleNumber}
                  onChange={(e) => setParkingBookingForm({ ...parkingBookingForm, vehicleNumber: e.target.value.toUpperCase() })}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entryTime">Entry Date & Time</Label>
                  <Input
                    id="entryTime"
                    type="datetime-local"
                    value={parkingBookingForm.entryTime}
                    onChange={(e) => setParkingBookingForm({ ...parkingBookingForm, entryTime: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="exitTime">Exit Date & Time</Label>
                  <Input
                    id="exitTime"
                    type="datetime-local"
                    value={parkingBookingForm.exitTime}
                    onChange={(e) => setParkingBookingForm({ ...parkingBookingForm, exitTime: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setParkingBookingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleParkingBooking} disabled={loadingAction}>
                {loadingAction && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Book Parking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GroupPortal;