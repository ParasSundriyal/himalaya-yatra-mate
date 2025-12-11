import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AIDetection from "./pages/AIDetection";
import Parking from "./pages/Parking";
import Dashboard from "./pages/Dashboard";
import GroupPortal from "./pages/GroupPortal";
import Admin from "./pages/Admin";
import HourlyPassBooking from "./pages/HourlyPassBooking";
import HourlyPassAdmin from "./pages/HourlyPassAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/ai-detection" element={<AIDetection />} />
            <Route path="/parking" element={<Parking />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredRole="user">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/group-portal" 
              element={
                <ProtectedRoute requiredRole="group">
                  <GroupPortal />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route path="/hourly-pass" element={<HourlyPassBooking />} />
            <Route 
              path="/admin/hourly-passes" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <HourlyPassAdmin />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
