import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  CalendarRange,
  Car,
  Camera,
  Clock,
  Hotel,
  MapPin,
  Navigation,
  Shield,
  Smartphone,
  Users,
} from "lucide-react";
import heroImage from "@/assets/hero-mountains.png";

const Home = () => {
  const features = [
    {
      icon: Camera,
      title: "AI Vehicle Detection",
      description: "Advanced AI-powered number plate recognition for seamless entry tracking",
      path: "/ai-detection",
    },
    {
      icon: Car,
      title: "Smart Parking",
      description: "Reserve parking slots online with real-time availability",
      path: "/parking",
    },
    {
      icon: Hotel,
      title: "Tourist Services",
      description: "Browse hotels, book taxis, and plan your sacred journey",
      path: "/dashboard",
    },
    {
      icon: Users,
      title: "Group Management",
      description: "Instructors can manage group registrations efficiently",
      path: "/group-portal",
    },
  ];

  const quickHighlights = [
    {
      icon: CalendarRange,
      title: "Next darshan window",
      value: "Opens 6:00 AM",
      detail: "Verified slots & staggered entry",
    },
    {
      icon: Navigation,
      title: "Road status",
      value: "All routes open",
      detail: "Weather-safe routes, live updates",
    },
    {
      icon: Shield,
      title: "Concierge support",
      value: "24/7 helpline",
      detail: "Human agents + AI triage",
    },
  ];

  const journeySteps = [
    {
      icon: BadgeCheck,
      title: "Plan & verify",
      description: "Create your party, add IDs, and lock preferred dates.",
    },
    {
      icon: Smartphone,
      title: "Book essentials",
      description: "Reserve parking, hourly passes, hotels, and taxis in one place.",
    },
    {
      icon: Hotel,
      title: "Arrive & stay",
      description: "Smooth check-ins with QR codes and live slot visibility.",
    },
    {
      icon: Shield,
      title: "Travel with confidence",
      description: "AI checkpoints, SOS visibility, and proactive alerts.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Hero Section */}
      <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background image with subtle white overlay */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Himalayan Mountains"
            className="w-full h-full object-cover scale-100 animate-[scale_20s_ease-in-out_infinite]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85))",
            }}
          />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-6 inline-block">
            <div className="px-6 py-2 rounded-full text-sm font-medium bg-white/80 border border-[#E6E8EB] text-[#5F6C7B]">
              ✨ AI-Powered Smart Tourism Platform
            </div>
          </div>
          
          <h1 className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="block text-xl md:text-2xl font-semibold text-[#5F6C7B] mb-2">
              Welcome to
            </span>
            <span className="block text-4xl md:text-6xl lg:text-7xl font-bold text-[#1F3A5F]">
              Char Dham Yatra
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-[#5F6C7B] mb-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 leading-relaxed">
            Your intelligent companion for a blessed pilgrimage. Experience seamless travel management with cutting-edge AI technology.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Link to="/dashboard">
              <Button
                size="lg"
                className="px-8 py-6 text-lg shadow-2xl transition-all hover:scale-105 bg-[#F57C00] hover:bg-[#E06900] text-white border-none"
              >
                <MapPin className="mr-2 h-6 w-6" />
                Start Your Journey
              </Button>
            </Link>
            <Link to="/parking">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg border-[#1F3A5F] text-[#1F3A5F] bg-transparent hover:bg-[#1F3A5F]/5"
              >
                <Car className="mr-2 h-6 w-6" />
                Book Parking
              </Button>
            </Link>
          </div>

          {/* Live snapshot strip */}
          <div className="mt-14 grid gap-4 sm:grid-cols-3 max-w-5xl mx-auto">
            {quickHighlights.map((item, index) => (
              <Card
                key={index}
                className="p-5 bg-white border border-[#E6E8EB] shadow-sm text-left flex items-start gap-4 rounded-2xl"
              >
                <div className="p-3 rounded-2xl bg-[#FFF3E0]">
                  <item.icon className="h-6 w-6 text-[#F57C00]" />
                </div>
                <div>
                  <div className="text-sm text-[#8A8A8A] uppercase tracking-wide">
                    {item.title}
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      item.title === "Road status" ? "text-[#2E7D32]" : "text-[#1E1E1E]"
                    }`}
                  >
                    {item.value}
                  </div>
                  <div className="text-sm text-[#5F6C7B]">{item.detail}</div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: "50K+", label: "Happy Pilgrims" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Support" },
              { value: "AI", label: "Powered" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/80 border border-[#E6E8EB] p-4 rounded-2xl">
                <div className="text-3xl font-bold text-[#1F3A5F]">{stat.value}</div>
                <div className="text-sm text-[#5F6C7B] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Planner */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/40 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full inline-block mb-4">
              4 steps to a calmer yatra
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Plan, book, and travel with clarity
            </h2>
            <p className="text-lg text-muted-foreground">
              A guided flow that keeps pilgrims, organizers, and authorities perfectly in sync.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {journeySteps.map((step, index) => (
              <Card
                key={index}
                className="p-6 h-full border-2 border-transparent hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/12 to-secondary/12">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-sm font-semibold text-muted-foreground">
                    Step {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full">
                Powered by AI
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything You Need for Your <br />
              <span className="gradient-text">Sacred Journey</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive solutions designed for pilgrims, authorities, and tour organizers
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Link key={index} to={feature.path}>
                <Card className="p-8 h-full card-hover cursor-pointer group relative overflow-hidden border-2 border-transparent hover:border-primary/20">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Split */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-secondary/8 to-primary/8" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-10 bg-gradient-to-br from-white to-primary/5 border-primary/10 shadow-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                Pilgrim-first
              </div>
              <h3 className="text-3xl font-bold mb-4">Concierge-like journey</h3>
              <p className="text-muted-foreground mb-6">
                Reduce queue anxiety with transparent slots, offline-friendly QR passes, and live weather-aware guidance.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary mt-0.5" />
                  One-tap parking & darshan QR codes
                </li>
                <li className="flex items-start gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary mt-0.5" />
                  Gentle alerts for crowding, weather, and cut-off times
                </li>
                <li className="flex items-start gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary mt-0.5" />
                  Human help desk blended with AI guidance
                </li>
              </ul>
            </Card>

            <Card className="p-10 bg-gradient-to-br from-white to-secondary/5 border-secondary/10 shadow-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary-foreground text-sm font-semibold mb-4">
                Authority-ready
              </div>
              <h3 className="text-3xl font-bold mb-4">Operational visibility</h3>
              <p className="text-muted-foreground mb-6">
                Clear dashboards for authorities and organizers with AI validation on every checkpoint.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-secondary mt-0.5" />
                  Verified rosters synced with group portals
                </li>
                <li className="flex items-start gap-3">
                  <Camera className="h-5 w-5 text-secondary mt-0.5" />
                  AI-powered vehicle detection at gates
                </li>
                <li className="flex items-start gap-3">
                  <Navigation className="h-5 w-5 text-secondary mt-0.5" />
                  Congestion-aware routing for fleets
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Shield, value: "24/7", label: "Security Monitoring" },
              { icon: Car, value: "500+", label: "Parking Slots" },
              { icon: Hotel, value: "200+", label: "Partner Hotels" },
              { icon: Clock, value: "Instant", label: "Booking Confirmation" },
            ].map((stat, i) => (
              <div key={i} className="text-center text-primary-foreground group">
                <div className="mb-4 inline-flex p-4 bg-white/10 backdrop-blur-sm rounded-2xl group-hover:scale-110 transition-transform">
                  <stat.icon className="h-10 w-10" />
                </div>
                <div className="text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-primary/10 to-background" />
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto glass-effect p-12 rounded-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Begin Your <br />
              <span className="gradient-text">Sacred Journey?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of pilgrims who trust us for a smooth and blessed Char Dham Yatra experience. Let technology enhance your spiritual journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="px-8 py-6 text-lg shadow-2xl hover:shadow-primary/50 hover:scale-105 transition-all">
                  <Navigation className="mr-2 h-6 w-6" />
                  Explore Now
                </Button>
              </Link>
              <Link to="/ai-detection">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg glass-effect hover:bg-white/20">
                  <Camera className="mr-2 h-6 w-6" />
                  View AI Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
