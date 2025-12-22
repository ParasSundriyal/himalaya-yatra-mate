import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  const publicNavItems = [
    { name: "Home", path: "/" },
    { name: "Parking Booking", path: "/parking" },
    { name: "Hourly Pass", path: "/hourly-pass" },
  ];

  const userNavItems = [
    { name: "My Dashboard", path: "/dashboard" },
  ];

  const groupNavItems = [
    { name: "Group Portal", path: "/group-portal" },
  ];

  const adminNavItems = [
    { name: "Admin Dashboard", path: "/admin" },
    { name: "AI Vehicle Detection", path: "/ai-detection" },
    { name: "Hourly Pass Admin", path: "/admin/hourly-passes" },
  ];

  const getNavItems = () => {
    let items = [...publicNavItems];
    if (isAuthenticated && user) {
      if (user.role === "user") {
        items = [...items, ...userNavItems];
      } else if (user.role === "group") {
        items = [...items, ...groupNavItems];
      } else if (user.role === "admin") {
        items = [...items, ...adminNavItems];
      }
    }
    return items;
  };

  const navItems = getNavItems();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#FAFAF8] backdrop-blur-md border-b border-[#E6E8EB] shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg border border-[#E6E8EB] bg-white group-hover:shadow-md transition-all">
              <Mountain className="h-6 w-6 text-[#1F3A5F]" />
            </div>
            <span className="font-semibold text-xl text-[#1F3A5F]">Char Dham Yatra</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`font-medium px-4 border-b-2 border-transparent rounded-none bg-transparent
                    ${
                      isActive(item.path)
                        ? "text-[#F57C00] border-[#F57C00]"
                        : "text-[#5F6C7B] hover:text-[#1F3A5F]"
                    }`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
            
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{user?.name}</span>
                  <span className="text-xs text-muted-foreground">({user?.role})</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#1F3A5F] text-[#1F3A5F] bg-transparent hover:bg-[#1F3A5F]/5"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="bg-[#F57C00] hover:bg-[#E06900] text-white border-none shadow-sm"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 animate-in slide-in-from-top-4">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg mt-2">
                    <User className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{user?.name}</div>
                      <div className="text-xs text-muted-foreground">{user?.role}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full border-[#1F3A5F] text-[#1F3A5F] bg-transparent hover:bg-[#1F3A5F]/5"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#F57C00] hover:bg-[#E06900] text-white border-none shadow-sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
