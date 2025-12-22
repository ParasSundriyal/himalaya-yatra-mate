import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { firebaseDb } from "@/lib/firebase";
import { onValue, ref } from "firebase/database";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type RawDetection = {
  [key: string]: any;
};

type Detection = {
  id: string;
  plate: string;
  meta: string;
};

const parseRawDetection = (id: string, value: RawDetection): Detection => {
  // Your Realtime DB sample looked like:
  // 0: some id, 1: plate, 2: "2025-12-15 21:59:04Frame: 2", 3: "NumberPlate02/NumberC/....png"
  const plate = value["1"] ?? value[1] ?? "";
  const meta = value["2"] ?? value[2] ?? "";

  return {
    id,
    plate: String(plate),
    meta: String(meta),
  };
};

const AIDetection = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Adjust this path if your detections are under a child like "detections/"
    const detectionsRef = ref(firebaseDb, "/");

    const unsubscribe = onValue(
      detectionsRef,
      (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          setDetections([]);
          setLoading(false);
          return;
        }

        let list: Detection[] = [];

        // Case 1: multiple detections stored as child objects
        if (typeof val === "object") {
          Object.entries(val).forEach(([key, value]) => {
            if (value && typeof value === "object") {
              list.push(parseRawDetection(key, value as RawDetection));
            }
          });

          // Case 2: single flat detection at the root (keys 0,1,2,3,...)
          if (list.length === 0) {
            list = [parseRawDetection("root", val as RawDetection)];
          }
        }

        // Newest last key at bottom; reverse for "recent first"
        setDetections(list.reverse());
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      // onValue returns an unsubscribe in modular SDK
      unsubscribe();
    };
  }, []);

  const todayKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // matches prefix in meta (YYYY-MM-DD ...)
  }, []);

  const { totalDetections, todayDetections, activeVehiclesToday } = useMemo(() => {
    let total = detections.length;
    let todayCount = 0;
    const todayPlates = new Set<string>();

    detections.forEach((d) => {
      const match = d.meta.match(/^(\d{4}-\d{2}-\d{2})/);
      const dateKey = match ? match[1] : "";
      if (dateKey === todayKey) {
        todayCount += 1;
        if (d.plate) {
          todayPlates.add(d.plate);
        }
      }
    });

    return {
      totalDetections: total,
      todayDetections: todayCount,
      activeVehiclesToday: todayPlates.size,
    };
  }, [detections, todayKey]);

  const timelineData = useMemo(() => {
    const counts: Record<string, number> = {};

    detections.forEach((d) => {
      const match = d.meta.match(/^(\d{4}-\d{2}-\d{2})/);
      const key = match ? match[1] : "Unknown";
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        detections: value,
      }));
  }, [detections]);

  const stats = [
    { label: "AI Detections", value: todayDetections.toString(), icon: Activity, color: "text-primary" },
    { label: "Active vehicles (today)", value: activeVehiclesToday.toString(), icon: CheckCircle, color: "text-secondary" },
    { label: "Total detections (all time)", value: totalDetections.toString(), icon: AlertCircle, color: "text-muted-foreground" },
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
          {/* Traffic-style timeline chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Detection Timeline</h2>
                <p className="text-xs text-muted-foreground">
                  Daily count of plates detected from Firebase Realtime Database
                </p>
              </div>
              <Badge variant="outline" className="bg-secondary/10">
                Live
              </Badge>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading chart data…
              </p>
            ) : timelineData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No detections to visualize yet.
              </p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timelineData} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="detections"
                      name="Detections"
                      barSize={24}
                      radius={[4, 4, 0, 0]}
                      fill="#1F3A5F"
                    />
                    <Line
                      type="monotone"
                      dataKey="detections"
                      name="Trend"
                      stroke="#F57C00"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Recent Detections */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Detections (Firebase)</h2>
            
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading detections from Firebase…</p>
            ) : detections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No detections available yet.</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {detections.map((detection) => (
                  <div
                    key={detection.id}
                    className="flex items-start justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 mr-3">
                      <div className="font-semibold text-lg mb-1">
                        {detection.plate || "Unknown plate"}
                      </div>
                      <div className="text-xs text-muted-foreground break-words">
                        {detection.meta}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      ID: {detection.id}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
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
