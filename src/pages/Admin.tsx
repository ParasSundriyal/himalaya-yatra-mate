import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Users,
  Car,
  Hotel,
  Camera,
  TrendingUp,
  Activity,
  CheckCircle,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  Ban,
  CheckCircle2,
  IndianRupee,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ParkingAdmin from "./ParkingAdmin";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  users: {
    total: number;
    tourists: number;
    groups: number;
  };
  bookings: {
    total: number;
    active: number;
  };
  services: {
    hotels: number;
    taxis: number;
    parkingSlots: number;
    parkingOccupancy: string;
    occupiedParkingSlots: number;
  };
  aiDetection: {
    todayDetections: number;
    activeVehicles: number;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "group" | "admin";
  isActive: boolean;
  createdAt: string;
}

interface Booking {
  _id: string;
  bookingType: "hotel" | "taxi" | "parking";
  status: string;
  amount: number;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
  hotel?: {
    hotelId: {
      name: string;
      location: string;
    };
  };
  taxi?: {
    taxiId: {
      driverName: string;
      vehicleType: string;
    };
  };
  parking?: {
    areaId: {
      name: string;
      location: string;
    };
  };
}

interface Activity {
  type: string;
  action: string;
  user?: string;
  vehicle?: string;
  location?: string;
  status?: string;
  role?: string;
  timestamp: string;
}

const Admin = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPages, setUsersPages] = useState(0);
  const [userFilters, setUserFilters] = useState({
    role: "all",
    isActive: "all",
    search: "",
  });
  const [userStatusDialog, setUserStatusDialog] = useState<{
    open: boolean;
    user: User | null;
    newStatus: boolean;
  }>({ open: false, user: null, newStatus: true });

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsPages, setBookingsPages] = useState(0);
  const [bookingFilters, setBookingFilters] = useState({
    type: "all",
    status: "all",
    startDate: "",
    endDate: "",
  });

  // Activities
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await api.admin.getStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load statistics",
        variant: "destructive",
      });
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.admin.getUsers({
        role: userFilters.role === "all" ? undefined : userFilters.role || undefined,
        isActive: userFilters.isActive === "all" ? undefined : userFilters.isActive === "true",
        search: userFilters.search || undefined,
        page: usersPage,
        limit: 20,
      });
      if (response.success) {
        setUsers(response.users);
        setUsersTotal(response.total);
        setUsersPages(response.pages);
      }
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await api.admin.getBookings({
        type: bookingFilters.type === "all" ? undefined : bookingFilters.type || undefined,
        status: bookingFilters.status === "all" ? undefined : bookingFilters.status || undefined,
        startDate: bookingFilters.startDate || undefined,
        endDate: bookingFilters.endDate || undefined,
        page: bookingsPage,
        limit: 20,
      });
      if (response.success) {
        setBookings(response.bookings);
        setBookingsTotal(response.total);
        setBookingsPages(response.pages);
      }
    } catch (error: any) {
      console.error("Failed to fetch bookings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setBookingsLoading(false);
    }
  };

  // Fetch activities
  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await api.admin.getActivities(20);
      if (response.success) {
        setActivities(response.activities);
      }
    } catch (error: any) {
      console.error("Failed to fetch activities:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load activities",
        variant: "destructive",
      });
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Update user status
  const updateUserStatus = async () => {
    if (!userStatusDialog.user) return;

    try {
      const response = await api.admin.updateUserStatus(
        userStatusDialog.user._id,
        userStatusDialog.newStatus
      );
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "User status updated successfully",
        });
        setUserStatusDialog({ open: false, user: null, newStatus: true });
        fetchUsers();
        fetchStats();
      }
    } catch (error: any) {
      console.error("Failed to update user status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  // Refresh all data
  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchBookings(), fetchActivities()]);
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "All data has been refreshed",
    });
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers(), fetchBookings(), fetchActivities()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Fetch users when filters or page changes
  useEffect(() => {
    fetchUsers();
  }, [userFilters, usersPage]);

  // Fetch bookings when filters or page changes
  useEffect(() => {
    fetchBookings();
  }, [bookingFilters, bookingsPage]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmed: "default",
      pending: "secondary",
      cancelled: "destructive",
      completed: "default",
    };
    return variants[status] || "outline";
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor and manage all system operations
            </p>
          </div>
          <Button
            onClick={refreshAll}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary">Total</Badge>
              </div>
              <div className="text-2xl font-bold mb-1">{stats.users.total}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
              <div className="text-xs text-muted-foreground mt-2">
                {stats.users.tourists} tourists • {stats.users.groups} groups
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-secondary" />
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="text-2xl font-bold mb-1">{stats.bookings.active}</div>
              <div className="text-sm text-muted-foreground">Active Bookings</div>
              <div className="text-xs text-muted-foreground mt-2">
                {stats.bookings.total} total bookings
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <Badge variant={parseInt(stats.services.parkingOccupancy) > 80 ? "destructive" : "secondary"}>
                  {stats.services.parkingOccupancy}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">
                {stats.services.occupiedParkingSlots}/{stats.services.parkingSlots}
              </div>
              <div className="text-sm text-muted-foreground">Parking Occupancy</div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Camera className="h-6 w-6 text-secondary" />
                </div>
                <Badge variant="secondary">Today</Badge>
              </div>
              <div className="text-2xl font-bold mb-1">{stats.aiDetection.todayDetections}</div>
              <div className="text-sm text-muted-foreground">AI Detections</div>
              <div className="text-xs text-muted-foreground mt-2">
                {stats.aiDetection.activeVehicles} active vehicles
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="parking">Parking</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Services Overview */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Services Overview
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Hotel className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Hotels</span>
                    </div>
                    <span className="font-semibold">{stats?.services.hotels || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-secondary" />
                      <span className="text-sm font-medium">Taxis</span>
                    </div>
                    <span className="font-semibold">{stats?.services.taxis || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Parking Slots</span>
                    </div>
                    <span className="font-semibold">{stats?.services.parkingSlots || 0}</span>
                  </div>
                </div>
              </Card>

              {/* Recent Activities */}
              <Card className="lg:col-span-2 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activities
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activitiesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : activities.length > 0 ? (
                    activities.slice(0, 10).map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            activity.type === "booking"
                              ? "bg-secondary/10"
                              : activity.type === "detection"
                              ? "bg-primary/10"
                              : "bg-muted"
                          }`}
                        >
                          {activity.type === "booking" && (
                            <CheckCircle className="h-4 w-4 text-secondary" />
                          )}
                          {activity.type === "detection" && (
                            <Camera className="h-4 w-4 text-primary" />
                          )}
                          {activity.type === "user" && (
                            <Users className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-sm mb-1">{activity.action}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.user && `User: ${activity.user}`}
                            {activity.vehicle && `Vehicle: ${activity.vehicle}`}
                            {activity.location && `Location: ${activity.location}`}
                            {activity.role && `Role: ${activity.role}`}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(activity.timestamp)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No activities found
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userFilters.search}
                      onChange={(e) =>
                        setUserFilters({ ...userFilters, search: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={userFilters.role}
                  onValueChange={(value) => setUserFilters({ ...userFilters, role: value })}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={userFilters.isActive}
                  onValueChange={(value) =>
                    setUserFilters({ ...userFilters, isActive: value })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {usersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length > 0 ? (
                          users.map((user) => (
                            <TableRow key={user._id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.phone || "N/A"}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{user.role}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={user.isActive ? "default" : "destructive"}
                                >
                                  {user.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(user.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setUserStatusDialog({
                                      open: true,
                                      user,
                                      newStatus: !user.isActive,
                                    })
                                  }
                                >
                                  {user.isActive ? (
                                    <>
                                      <Ban className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              No users found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {usersPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {users.length} of {usersTotal} users
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                          disabled={usersPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUsersPage((p) => Math.min(usersPages, p + 1))}
                          disabled={usersPage === usersPages}
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

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Select
                  value={bookingFilters.type}
                  onValueChange={(value) =>
                    setBookingFilters({ ...bookingFilters, type: value })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="taxi">Taxi</SelectItem>
                    <SelectItem value="parking">Parking</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={bookingFilters.status}
                  onValueChange={(value) =>
                    setBookingFilters({ ...bookingFilters, status: value })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={bookingFilters.startDate}
                  onChange={(e) =>
                    setBookingFilters({ ...bookingFilters, startDate: e.target.value })
                  }
                  className="w-full sm:w-[180px]"
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={bookingFilters.endDate}
                  onChange={(e) =>
                    setBookingFilters({ ...bookingFilters, endDate: e.target.value })
                  }
                  className="w-full sm:w-[180px]"
                />
              </div>

              {bookingsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.length > 0 ? (
                          bookings.map((booking) => (
                            <TableRow key={booking._id}>
                              <TableCell>
                                <Badge variant="outline">{booking.bookingType}</Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{booking.user?.name || "N/A"}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {booking.user?.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {booking.hotel && (
                                  <div>
                                    <div className="font-medium">
                                      {booking.hotel.hotelId.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {booking.hotel.hotelId.location}
                                    </div>
                                  </div>
                                )}
                                {booking.taxi && (
                                  <div>
                                    <div className="font-medium">
                                      {booking.taxi.taxiId.driverName}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {booking.taxi.taxiId.vehicleType}
                                    </div>
                                  </div>
                                )}
                                {booking.parking && (
                                  <div>
                                    <div className="font-medium">
                                      {booking.parking.areaId.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {booking.parking.areaId.location}
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadge(booking.status)}>
                                  {booking.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <IndianRupee className="h-3 w-3" />
                                  {booking.amount}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(booking.createdAt)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              No bookings found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {bookingsPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {bookings.length} of {bookingsTotal} bookings
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBookingsPage((p) => Math.max(1, p - 1))}
                          disabled={bookingsPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBookingsPage((p) => Math.min(bookingsPages, p + 1))}
                          disabled={bookingsPage === bookingsPages}
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

          {/* Activities Tab */}
          {/* Parking Tab */}
          <TabsContent value="parking" className="space-y-4">
            <ParkingAdmin />
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activities
              </h2>
              {activitiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 hover:bg-muted/50 rounded-lg transition-colors border"
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          activity.type === "booking"
                            ? "bg-secondary/10"
                            : activity.type === "detection"
                            ? "bg-primary/10"
                            : "bg-muted"
                        }`}
                      >
                        {activity.type === "booking" && (
                          <CheckCircle className="h-5 w-5 text-secondary" />
                        )}
                        {activity.type === "detection" && (
                          <Camera className="h-5 w-5 text-primary" />
                        )}
                        {activity.type === "user" && (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{activity.action}</div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {activity.user && <div>User: {activity.user}</div>}
                          {activity.vehicle && <div>Vehicle: {activity.vehicle}</div>}
                          {activity.location && <div>Location: {activity.location}</div>}
                          {activity.role && <div>Role: {activity.role}</div>}
                          {activity.status && (
                            <div>
                              Status:{" "}
                              <Badge variant={getStatusBadge(activity.status)} className="ml-1">
                                {activity.status}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatDate(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No activities found
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Status Dialog */}
        <Dialog
          open={userStatusDialog.open}
          onOpenChange={(open) =>
            setUserStatusDialog({ ...userStatusDialog, open })
          }
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {userStatusDialog.newStatus ? "Activate User" : "Deactivate User"}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {userStatusDialog.newStatus ? "activate" : "deactivate"}{" "}
                {userStatusDialog.user?.name}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setUserStatusDialog({ open: false, user: null, newStatus: true })
                }
              >
                Cancel
              </Button>
              <Button onClick={updateUserStatus}>
                {userStatusDialog.newStatus ? "Activate" : "Deactivate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default Admin;
