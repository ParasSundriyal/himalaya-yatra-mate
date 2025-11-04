import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mountain, User, Users, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"user" | "group" | "admin">("user");
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const success = login(email, password, selectedRole);
    
    if (success) {
      toast({
        title: "Login Successful",
        description: `Welcome back! Redirecting to your ${selectedRole} dashboard...`,
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Please check your credentials",
        variant: "destructive",
      });
    }
  };

  const roles = [
    {
      id: "user" as const,
      name: "Tourist",
      description: "Access hotel & taxi bookings",
      icon: User,
    },
    {
      id: "group" as const,
      name: "Group Instructor",
      description: "Manage group members",
      icon: Users,
    },
    {
      id: "admin" as const,
      name: "Admin",
      description: "System management",
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary-rgb),0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(var(--secondary-rgb),0.1),transparent_50%)]" />
      
      <Card className="w-full max-w-md glass-effect border-primary/20 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-glow">
            <Mountain className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl gradient-text">Welcome Back</CardTitle>
            <CardDescription>Login to Char Dham Yatra Portal</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
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

            <div className="space-y-3">
              <Label>Login As</Label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center space-y-2 ${
                      selectedRole === role.id
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <role.icon className={`w-6 h-6 mx-auto ${selectedRole === role.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-xs font-medium">{role.name}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {roles.find(r => r.id === selectedRole)?.description}
              </p>
            </div>

            <Button type="submit" className="w-full shadow-elevated">
              Login
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Demo credentials: Any email/password combination works</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
