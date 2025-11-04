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
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Himalayan Mountains"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Welcome to <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Char Dham Yatra</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Your intelligent companion for a blessed pilgrimage. Experience seamless travel management with AI-powered services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Link to="/dashboard">
              <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
                <MapPin className="mr-2 h-5 w-5" />
                Start Your Journey
              </Button>
            </Link>
            <Link to="/parking">
              <Button size="lg" variant="outline" className="bg-card/50 backdrop-blur-sm">
                <Car className="mr-2 h-5 w-5" />
                Book Parking
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive solutions for pilgrims, authorities, and tour organizers
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Link key={index} to={feature.path}>
                <Card className="p-6 h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-bold mb-1">24/7</div>
              <div className="text-sm opacity-90">Security Monitoring</div>
            </div>
            <div>
              <Car className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-sm opacity-90">Parking Slots</div>
            </div>
            <div>
              <Hotel className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-bold mb-1">200+</div>
              <div className="text-sm opacity-90">Partner Hotels</div>
            </div>
            <div>
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-bold mb-1">Instant</div>
              <div className="text-sm opacity-90">Booking Confirmation</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Begin Your Sacred Journey?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of pilgrims who trust us for a smooth and blessed Char Dham Yatra experience
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="shadow-lg">
              <Navigation className="mr-2 h-5 w-5" />
              Explore Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
