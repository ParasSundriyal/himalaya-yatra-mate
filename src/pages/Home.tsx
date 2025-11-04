import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Car, 
  Camera, 
  MapPin, 
  Users, 
  Hotel, 
  Navigation,
  Shield,
  Clock
} from "lucide-react";
import heroImage from "@/assets/hero-mountains.jpg";

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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Himalayan Mountains"
            className="w-full h-full object-cover scale-110 animate-[scale_20s_ease-in-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
          <div className="absolute inset-0" style={{ background: 'var(--gradient-hero-radial)' }} />
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-6 inline-block">
            <div className="glass-effect px-6 py-2 rounded-full text-sm font-medium">
              ✨ AI-Powered Smart Tourism Platform
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Welcome to <br />
            <span className="gradient-text text-6xl md:text-8xl">Char Dham Yatra</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-foreground/80 mb-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 leading-relaxed">
            Your intelligent companion for a blessed pilgrimage. Experience seamless travel management with cutting-edge AI technology.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Link to="/dashboard">
              <Button size="lg" className="px-8 py-6 text-lg shadow-2xl hover:shadow-primary/50 transition-all hover:scale-105">
                <MapPin className="mr-2 h-6 w-6" />
                Start Your Journey
              </Button>
            </Link>
            <Link to="/parking">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg glass-effect hover:bg-white/20">
                <Car className="mr-2 h-6 w-6" />
                Book Parking
              </Button>
            </Link>
          </div>
          
          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: "50K+", label: "Happy Pilgrims" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Support" },
              { value: "AI", label: "Powered" },
            ].map((stat, i) => (
              <div key={i} className="glass-effect p-4 rounded-2xl">
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-foreground/70 mt-1">{stat.label}</div>
              </div>
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
