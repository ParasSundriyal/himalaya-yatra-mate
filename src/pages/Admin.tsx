import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Car, 
  Hotel,
  Camera,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle
} from "lucide-react";

const Admin = () => {
  const stats = [
    { 
      label: "Total Tourists", 
      value: "1,247", 
      change: "+12%", 
      icon: Users, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      label: "Active Bookings", 
      value: "342", 
      change: "+8%", 
      icon: CheckCircle, 
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    { 
      label: "Parking Occupancy", 
      value: "68%", 
      change: "-5%", 
      icon: Car, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      label: "Hotel Bookings", 
      value: "156", 
      change: "+15%", 
      icon: Hotel, 
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
  ];

  const recentActivities = [
    { type: "New Registration", user: "Ramesh Kumar", time: "5 mins ago", status: "success" },
    { type: "Parking Booked", user: "Priya Sharma", time: "12 mins ago", status: "success" },
    { type: "Vehicle Detected", plate: "UK 05 AB 1234", time: "18 mins ago", status: "info" },
    { type: "Hotel Booking", user: "Amit Patel", time: "25 mins ago", status: "success" },
    { type: "Alert", message: "High traffic at Gate 2", time: "32 mins ago", status: "warning" },
  ];

  const aiDetectionStats = [
    { label: "Today's Detections", value: "1,247" },
    { label: "Active Vehicles", value: "342" },
    { label: "Pending Reviews", value: "8" },
    { label: "Average Time", value: "0.3s" },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage all system operations
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <Badge variant={stat.change.startsWith('+') ? "secondary" : "destructive"}>
                  {stat.change}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* AI Detection Overview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              AI Detection Stats
            </h2>

            <div className="space-y-4">
              {aiDetectionStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="font-semibold">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Activity className="h-4 w-4" />
                <span className="font-semibold text-sm">System Status</span>
              </div>
              <p className="text-sm text-muted-foreground">
                All AI detection systems operational
              </p>
            </div>
          </Card>

          {/* Recent Activities */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activities
            </h2>

            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className={`p-2 rounded-lg ${
                    activity.status === 'success' ? 'bg-secondary/10' :
                    activity.status === 'warning' ? 'bg-destructive/10' :
                    'bg-primary/10'
                  }`}>
                    {activity.status === 'success' && <CheckCircle className="h-4 w-4 text-secondary" />}
                    {activity.status === 'warning' && <AlertCircle className="h-4 w-4 text-destructive" />}
                    {activity.status === 'info' && <Camera className="h-4 w-4 text-primary" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1">{activity.type}</div>
                    <div className="text-sm text-muted-foreground">
                      {activity.user || activity.plate || activity.message}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">User Management</h3>
              <p className="text-sm text-muted-foreground">Manage tourists & instructors</p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
            <div className="text-center">
              <div className="p-4 bg-secondary/10 rounded-full w-fit mx-auto mb-4 group-hover:bg-secondary/20 transition-colors">
                <Hotel className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Hotel Management</h3>
              <p className="text-sm text-muted-foreground">Manage partner hotels</p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Parking Management</h3>
              <p className="text-sm text-muted-foreground">Monitor parking slots</p>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
            <div className="text-center">
              <div className="p-4 bg-secondary/10 rounded-full w-fit mx-auto mb-4 group-hover:bg-secondary/20 transition-colors">
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">View detailed reports</p>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="p-6 mt-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Backend Integration Required
          </h3>
          <p className="text-sm text-muted-foreground">
            Connect Lovable Cloud to enable full admin capabilities including user management, 
            booking management, real-time analytics, and automated report generation. 
            Authentication and role-based access control will also be activated.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
