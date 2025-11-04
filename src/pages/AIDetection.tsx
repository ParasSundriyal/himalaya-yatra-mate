import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Upload, 
  Activity,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import aiDetectionImage from "@/assets/ai-detection.jpg";

const AIDetection = () => {
  const recentDetections = [
    { plate: "UK 05 AB 1234", time: "2 mins ago", status: "Entry", location: "Gate 1" },
    { plate: "UK 07 CD 5678", time: "5 mins ago", status: "Exit", location: "Gate 2" },
    { plate: "HR 26 EF 9012", time: "8 mins ago", status: "Entry", location: "Gate 1" },
    { plate: "DL 01 GH 3456", time: "12 mins ago", status: "Entry", location: "Gate 3" },
    { plate: "UP 14 IJ 7890", time: "15 mins ago", status: "Exit", location: "Gate 2" },
  ];

  const stats = [
    { label: "Total Detections Today", value: "1,247", icon: Activity, color: "text-primary" },
    { label: "Active Vehicles", value: "342", icon: CheckCircle, color: "text-secondary" },
    { label: "Pending Reviews", value: "8", icon: AlertCircle, color: "text-destructive" },
    { label: "Average Processing", value: "0.3s", icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">AI Vehicle Detection</h1>
          <p className="text-muted-foreground">
            Real-time number plate recognition and vehicle tracking system
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Live Feed */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Live CCTV Feed
              </h2>
              <Badge variant="outline" className="bg-secondary/10">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Live
              </Badge>
            </div>
            
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-4">
              <img 
                src={aiDetectionImage} 
                alt="AI Detection Dashboard"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-md text-sm">
                Gate 1 - Main Entry
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              <Button variant="outline" className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Connect Camera
              </Button>
            </div>
          </Card>

          {/* Recent Detections */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Detections</h2>
            
            <div className="space-y-3">
              {recentDetections.map((detection, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-1">
                      {detection.plate}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {detection.location} • {detection.time}
                    </div>
                  </div>
                  <Badge 
                    variant={detection.status === "Entry" ? "default" : "secondary"}
                  >
                    {detection.status}
                  </Badge>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4">
              View All Detections
            </Button>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-6 mt-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            How to Use
          </h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Upload vehicle images or connect live CCTV feeds for automatic detection</p>
            <p>• AI processes and extracts number plates in real-time (avg. 0.3 seconds)</p>
            <p>• All detections are logged with timestamps and location data</p>
            <p>• Review and manage detected vehicles from the dashboard</p>
            <p className="text-primary font-medium mt-4">Note: Backend integration with Lovable Cloud will enable full AI processing capabilities</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIDetection;
