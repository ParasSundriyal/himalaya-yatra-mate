import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, CheckCircle2, Mountain, User, Users } from "lucide-react";
import heroImage from "@/assets/hero-mountains.png";
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
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/40 to-background flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background image + overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImage}
          alt="Himalayan mountains"
          className="w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/96" />
      </div>

      {/* Floating glows */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute top-10 left-0 w-80 h-80 bg-primary/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-4 w-[26rem] h-[26rem] bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 grid w-full max-w-6xl lg:grid-cols-[1.2fr_1.6fr] gap-8 items-stretch">
        {/* Left: Story / checklist */}
        <Card className="hidden lg:flex flex-col justify-between p-8 glass-effect border-primary/20 shadow-elevated">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <CalendarClock className="h-4 w-4" />
              Set up once, reuse every season
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
                <Mountain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold leading-tight">Create your Yatra profile</h2>
                <p className="text-xs text-muted-foreground max-w-sm">
                  One account for parking, hourly passes, group management, and accommodation
                  across the Char Dham circuit.
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What you can do after signup
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Book parking, hourly passes, and hotels with live availability.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Manage individual or group pilgrims from a single dashboard.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>Carry QR-based passes instead of paper slips at checkpoints.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-6 border-t">
            <span>Char Dham Yatra · Smart Tourist Management</span>
            <span>Optimized for both pilgrims & authorities</span>
          </div>
        </Card>

        {/* Right: Form */}
        <Card className="w-full glass-effect border-primary/20 shadow-elevated backdrop-blur-2xl">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
                  <Mountain className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">Create your account</CardTitle>
                  <CardDescription className="text-xs">
                    Choose your role and complete a few quick details to get started.
                  </CardDescription>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Already registered?{" "}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Login
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Register as *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                      selectedRole === role.id
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border hover:border-primary/50 bg-background/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <role.icon
                          className={`w-5 h-5 ${
                            selectedRole === role.id ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span className="font-semibold text-sm">{role.name}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {role.description}
                    </span>
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
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-muted border flex items-center justify-center text-xs text-muted-foreground">
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
                    Helps with faster verification and smoother check-ins at checkpoints.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">
                      Organization/Tour Company Name *
                    </Label>
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
                    <Label htmlFor="licenseNumber">
                      Tour Operator License Number (Optional)
                    </Label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      placeholder="Enter license number if available"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Helps authorities quickly validate your credentials.
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

            <div className="text-[11px] text-muted-foreground space-y-1 pt-2 border-t">
              <p className="font-semibold">Registration checklist</p>
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
    </div>
  );
};

export default Signup;
