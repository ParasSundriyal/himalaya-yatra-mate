import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mountain, User, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [selectedRole, setSelectedRole] = useState<"user" | "group">("user");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // User-specific fields
  const [aadhar, setAadhar] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Group Instructor specific fields
  const [organizationName, setOrganizationName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!name || !email || !password || !confirmPassword || !phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Role-specific validation
    if (selectedRole === "user") {
      if (aadhar && !/^[0-9]{12}$/.test(aadhar)) {
        toast({
          title: "Error",
          description: "Aadhar must be 12 digits",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    if (selectedRole === "group") {
      if (!organizationName) {
        toast({
          title: "Error",
          description: "Organization name is required for Group Instructors",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    try {
      const signupData: any = {
        name,
        email,
        password,
        phone,
        role: selectedRole,
      };

      if (photo) {
        signupData.photo = photo;
      }

      // Add role-specific fields
      if (selectedRole === "user") {
        if (aadhar) signupData.aadhar = aadhar;
        if (dateOfBirth) signupData.dateOfBirth = dateOfBirth;
      }

      if (selectedRole === "group") {
        signupData.organizationName = organizationName;
        if (licenseNumber) signupData.licenseNumber = licenseNumber;
      }

      const success = await register(signupData);

      if (success) {
        toast({
          title: "Registration Successful",
          description: `Welcome! Your ${selectedRole === "user" ? "tourist" : "group instructor"} account has been created.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (file?: File) => {
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (jpg, png, webp)",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 2MB",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhoto(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const roles = [
    {
      id: "user" as const,
      name: "Tourist",
      description: "Individual traveler booking services",
      icon: User,
    },
    {
      id: "group" as const,
      name: "Group Instructor",
      description: "Manage group tours and members",
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary-rgb),0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(var(--secondary-rgb),0.1),transparent_50%)]" />
      
      <Card className="w-full max-w-2xl glass-effect border-primary/20 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-glow">
            <Mountain className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl gradient-text">Create Account</CardTitle>
            <CardDescription>Join Char Dham Yatra Portal</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <Label>Register As *</Label>
            <div className="grid grid-cols-2 gap-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-6 rounded-xl border-2 transition-all text-center space-y-3 ${
                    selectedRole === role.id
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <role.icon className={`w-8 h-8 mx-auto ${selectedRole === role.id ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <div className="font-semibold">{role.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{role.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Profile Photo (optional)</Label>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="flex-1">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG/PNG/WebP, up to 2MB
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full overflow-hidden bg-muted border flex items-center justify-center text-sm text-muted-foreground">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    "No photo"
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {/* Role-specific Fields */}
            {selectedRole === "user" ? (
              <div className="space-y-2">
                <Label htmlFor="aadhar">Aadhar Number (Optional)</Label>
                <Input
                  id="aadhar"
                  type="text"
                  placeholder="12-digit Aadhar number"
                  value={aadhar}
                  onChange={(e) => setAadhar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  maxLength={12}
                />
                <p className="text-xs text-muted-foreground">
                  Aadhar number helps with faster verification and booking
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization/Tour Company Name *</Label>
                  <Input
                    id="organizationName"
                    type="text"
                    placeholder="Enter your organization name"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required={selectedRole === "group"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Tour Operator License Number (Optional)</Label>
                  <Input
                    id="licenseNumber"
                    type="text"
                    placeholder="Enter license number if available"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    License number helps verify your credentials as a tour operator
                  </p>
                </div>
              </>
            )}

            {/* Password Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full shadow-elevated" 
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Login here
              </Link>
            </p>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p className="font-semibold">Registration Requirements:</p>
            <p>• All fields marked with * are required</p>
            <p>• Password must be at least 6 characters long</p>
            <p>• Phone number must be 10 digits</p>
            {selectedRole === "user" && (
              <p>• Aadhar number is optional but recommended for faster verification</p>
            )}
            {selectedRole === "group" && (
              <p>• Group Instructors can manage multiple tourist registrations</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
