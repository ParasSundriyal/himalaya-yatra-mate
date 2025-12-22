import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Lock, MapPin, Mountain, ShieldCheck, Users } from "lucide-react";
import heroImage from "@/assets/hero-mountains.png";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Role will be auto-detected from the account
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: "Login Successful",
          description: "Redirecting to your dashboard...",
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || "Please check your credentials";
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/40 to-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background image + overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImage}
          alt="Himalayan mountains"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/85 to-background/95" />
      </div>

      {/* Floating glows */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-primary/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl lg:grid-cols-[1.2fr_1fr] gap-8 items-stretch">
        {/* Left: Story panel */}
        <Card className="hidden lg:flex flex-col justify-between p-8 glass-effect border-primary/20 shadow-elevated">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Lock className="h-4 w-4" />
              Secured by AI & encrypted sessions
            </div>
            <div>
              <h2 className="text-3xl font-bold leading-tight mb-2">
                Continue your{" "}
                <span className="gradient-text">sacred journey</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Log in to access your parking, hotel, and darshan bookings, with live updates across
                the Char Dham route.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Role-aware access</p>
                  <p className="text-xs text-muted-foreground">
                    Tourists, group instructors, and admins automatically land on the right
                    dashboard.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Journey continuity</p>
                  <p className="text-xs text-muted-foreground">
                    Pick up exactly where you left off with saved passes and QR codes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Family & group friendly</p>
                  <p className="text-xs text-muted-foreground">
                    Manage multiple pilgrims under a single view for smoother coordination.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-6 border-t">
            <span>Char Dham Yatra · Smart Tourist Management</span>
            <span>24/7 support during the season</span>
          </div>
        </Card>

        {/* Right: Auth card */}
        <Card className="w-full glass-effect border-primary/20 shadow-elevated backdrop-blur-2xl">
          <CardHeader className="space-y-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
                <Mountain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Welcome back</CardTitle>
                <CardDescription className="text-xs">
                  Login to manage your Char Dham journey and bookings.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full shadow-elevated">
                Login
              </Button>
            </form>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>First time here?</span>
                <Link to="/signup" className="text-primary hover:underline font-semibold">
                  Create an account
                </Link>
              </div>

            
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
