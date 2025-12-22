// API configuration and service functions

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  const user = localStorage.getItem('char-dham-user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

// Helper function to make API requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    
    // Handle validation errors
    if (error.errors && Array.isArray(error.errors)) {
      const errorMessages = error.errors.map((err: any) => err.msg || err.message).join(', ');
      throw new Error(errorMessages || error.message || `HTTP error! status: ${response.status}`);
    }
    
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response;
};

// API service object
export const api = {
  // Auth endpoints
  auth: {
    register: async (data: {
      name: string;
      email: string;
      password: string;
      phone: string;
      role?: 'user' | 'group' | 'admin';
      aadhar?: string;
      dateOfBirth?: string;
      address?: any;
      photo?: string;
    }) => {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    login: async (email: string, password: string, role?: string) => {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      return response.json();
    },

    getProfile: async () => {
      const response = await apiRequest('/auth/me');
      return response.json();
    },

    updateProfile: async (data: any) => {
      const response = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },
  },

  // Parking endpoints
  parking: {
    getAreas: async () => {
      const response = await apiRequest('/parking/areas');
      return response.json();
    },

    getSlots: async (areaId: string, filters?: { status?: string; size?: string }) => {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.size) queryParams.append('size', filters.size);
      
      const query = queryParams.toString();
      const endpoint = `/parking/areas/${areaId}/slots${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },

    bookSlot: async (data: {
      areaId: string;
      slotId: string;
      vehicleNumber: string;
      entryTime?: string;
      exitTime?: string;
      memberId?: string; // Optional: for group instructors booking for members
    }) => {
      const response = await apiRequest('/parking/book', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    getMyBookings: async () => {
      const response = await apiRequest('/parking/my-bookings');
      return response.json();
    },

    cancelBooking: async (bookingId: string, reason?: string) => {
      const response = await apiRequest(`/parking/cancel/${bookingId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return response.json();
    },

    // Admin endpoints
    createArea: async (data: {
      name: string;
      location: string;
      coordinates: { lat: number; lng: number };
      totalSlots: number;
    }) => {
      const response = await apiRequest('/parking/admin/areas', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    updateArea: async (areaId: string, data: {
      name?: string;
      location?: string;
      coordinates?: { lat: number; lng: number };
    }) => {
      const response = await apiRequest(`/parking/admin/areas/${areaId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    deleteArea: async (areaId: string) => {
      const response = await apiRequest(`/parking/admin/areas/${areaId}`, {
        method: 'DELETE',
      });
      return response.json();
    },

    addSlots: async (areaId: string, slots: Array<{
      slotNumber: string;
      size: 'Standard' | 'Large';
      pricePerDay: number;
      location: string;
      status?: string;
    }>) => {
      const response = await apiRequest(`/parking/admin/areas/${areaId}/slots`, {
        method: 'POST',
        body: JSON.stringify({ slots }),
      });
      return response.json();
    },

    updateSlot: async (areaId: string, slotId: string, data: {
      slotNumber?: string;
      size?: 'Standard' | 'Large';
      pricePerDay?: number;
      location?: string;
      status?: string;
    }) => {
      const response = await apiRequest(`/parking/admin/areas/${areaId}/slots/${slotId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    deleteSlot: async (areaId: string, slotId: string) => {
      const response = await apiRequest(`/parking/admin/areas/${areaId}/slots/${slotId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },

  // Hotel endpoints
  hotels: {
    getAll: async (filters?: {
      location?: string;
      minPrice?: number;
      maxPrice?: number;
      rating?: number;
      available?: boolean;
    }) => {
      const queryParams = new URLSearchParams();
      if (filters?.location) queryParams.append('location', filters.location);
      if (filters?.minPrice) queryParams.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());
      if (filters?.rating) queryParams.append('rating', filters.rating.toString());
      if (filters?.available) queryParams.append('available', 'true');

      const query = queryParams.toString();
      const endpoint = `/hotels${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },

    getById: async (id: string) => {
      const response = await apiRequest(`/hotels/${id}`);
      return response.json();
    },

    book: async (data: {
      hotelId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      rooms: number;
      memberId?: string; // Optional: for group instructors booking for members
    }) => {
      const response = await apiRequest('/hotels/book', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    getMyBookings: async () => {
      const response = await apiRequest('/hotels/my-bookings');
      return response.json();
    },

    cancelBooking: async (bookingId: string, reason?: string) => {
      const response = await apiRequest(`/hotels/cancel/${bookingId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return response.json();
    },
  },

  // Taxi endpoints
  taxis: {
    getAll: async (filters?: {
      location?: string;
      vehicleType?: string;
      minSeats?: number;
      maxPrice?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (filters?.location) queryParams.append('location', filters.location);
      if (filters?.vehicleType) queryParams.append('vehicleType', filters.vehicleType);
      if (filters?.minSeats) queryParams.append('minSeats', filters.minSeats.toString());
      if (filters?.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());

      const query = queryParams.toString();
      const endpoint = `/taxis${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },

    getById: async (id: string) => {
      const response = await apiRequest(`/taxis/${id}`);
      return response.json();
    },

    book: async (data: {
      taxiId: string;
      pickupLocation: string;
      dropoffLocation: string;
      pickupTime: string;
      distance: number;
      memberId?: string; // Optional: for group instructors booking for members
    }) => {
      const response = await apiRequest('/taxis/book', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    getMyBookings: async () => {
      const response = await apiRequest('/taxis/my-bookings');
      return response.json();
    },

    cancelBooking: async (bookingId: string, reason?: string) => {
      const response = await apiRequest(`/taxis/cancel/${bookingId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return response.json();
    },
  },

  // Booking endpoints
  bookings: {
    getAll: async (filters?: { type?: string; status?: string }) => {
      const queryParams = new URLSearchParams();
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.status) queryParams.append('status', filters.status);

      const query = queryParams.toString();
      const endpoint = `/bookings${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },

    getById: async (id: string) => {
      const response = await apiRequest(`/bookings/${id}`);
      return response.json();
    },
  },

  // Group endpoints
  groups: {
    create: async (data: { name: string; description?: string }) => {
      const response = await apiRequest('/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    getMyGroup: async () => {
      const response = await apiRequest('/groups/my-group');
      return response.json();
    },

    addMember: async (data: {
      name: string;
      email: string;
      phone: string;
      aadhar?: string;
      dateOfBirth?: string;
      address?: any;
    }) => {
      const response = await apiRequest('/groups/add-member', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    removeMember: async (memberId: string) => {
      const response = await apiRequest(`/groups/remove-member/${memberId}`, {
        method: 'DELETE',
      });
      return response.json();
    },

    getMemberBookings: async (filters?: {
      type?: string;
      status?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.status) queryParams.append('status', filters.status);

      const query = queryParams.toString();
      const endpoint = `/groups/member-bookings${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },
  },

  // AI Detection endpoints
  aiDetection: {
    log: async (data: {
      vehicleNumber: string;
      detectionType: 'entry' | 'exit';
      location: string;
      gate: string;
      coordinates?: { lat: number; lng: number };
      imageUrl?: string;
      confidence?: number;
    }) => {
      const response = await apiRequest('/ai-detection/log', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    getAll: async (filters?: {
      vehicleNumber?: string;
      location?: string;
      detectionType?: string;
      gate?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (filters?.vehicleNumber) queryParams.append('vehicleNumber', filters.vehicleNumber);
      if (filters?.location) queryParams.append('location', filters.location);
      if (filters?.detectionType) queryParams.append('detectionType', filters.detectionType);
      if (filters?.gate) queryParams.append('gate', filters.gate);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const query = queryParams.toString();
      const endpoint = `/ai-detection${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },

    getStats: async (filters?: { startDate?: string; endDate?: string }) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);

      const query = queryParams.toString();
      const endpoint = `/ai-detection/stats${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },
  },

  // Checkpoint endpoints
  checkpoints: {
    getAll: async () => {
      const response = await apiRequest('/checkpoints');
      return response.json();
    },

    getAvailableSlots: async (checkpointId: string, date?: string) => {
      const query = date ? `?date=${date}` : '';
      const response = await apiRequest(`/checkpoints/${checkpointId}/available-slots${query}`);
      return response.json();
    },

    bookPass: async (data: {
      checkpointId: string;
      timeSlot: { start: string; end: string };
      vehicleNumber?: string;
      numberOfPeople?: number;
    }) => {
      const response = await apiRequest(`/checkpoints/${data.checkpointId}/book`, {
        method: 'POST',
        body: JSON.stringify({
          timeSlot: data.timeSlot,
          vehicleNumber: data.vehicleNumber,
          numberOfPeople: data.numberOfPeople,
        }),
      });
      return response.json();
    },

    issuePass: async (data: {
      checkpointId: string;
      userId?: string; // Optional for generic passes
      timeSlot: { start: string; end: string };
      vehicleNumber?: string;
      numberOfPeople?: number;
    }) => {
      const response = await apiRequest(`/checkpoints/${data.checkpointId}/issue`, {
        method: 'POST',
        body: JSON.stringify({
          userId: data.userId || undefined,
          timeSlot: data.timeSlot,
          vehicleNumber: data.vehicleNumber,
          numberOfPeople: data.numberOfPeople,
        }),
      });
      return response.json();
    },

    issueBatchPasses: async (data: {
      checkpointId: string;
      timeSlot: { start: string; end: string };
      count: number;
      vehicleNumber?: string;
      numberOfPeople?: number;
    }) => {
      const response = await apiRequest(`/checkpoints/${data.checkpointId}/issue-batch`, {
        method: 'POST',
        body: JSON.stringify({
          timeSlot: data.timeSlot,
          count: data.count,
          vehicleNumber: data.vehicleNumber,
          numberOfPeople: data.numberOfPeople,
        }),
      });
      return response.json();
    },

    createCheckpoint: async (data: {
      name: string;
      location: string;
      coordinates: { lat: number; lng: number };
      description?: string;
      slotDuration?: number;
      operatingHours?: { start: string; end: string };
      maxPassesPerSlot?: number;
      pricePerHour?: number;
      isActive?: boolean;
    }) => {
      const response = await apiRequest('/checkpoints', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    updateCheckpoint: async (checkpointId: string, data: {
      name?: string;
      location?: string;
      coordinates?: { lat: number; lng: number };
      description?: string;
      slotDuration?: number;
      operatingHours?: { start: string; end: string };
      maxPassesPerSlot?: number;
      pricePerHour?: number;
      isActive?: boolean;
    }) => {
      const response = await apiRequest(`/checkpoints/${checkpointId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    deleteCheckpoint: async (checkpointId: string) => {
      const response = await apiRequest(`/checkpoints/${checkpointId}`, {
        method: 'DELETE',
      });
      return response.json();
    },

    getMyPasses: async (filters?: { status?: string; checkpointId?: string }) => {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.checkpointId) queryParams.append('checkpointId', filters.checkpointId);

      const query = queryParams.toString();
      const endpoint = `/checkpoints/my-passes${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },

    getAllPasses: async (filters?: {
      status?: string;
      checkpointId?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.checkpointId) queryParams.append('checkpointId', filters.checkpointId);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);

      const query = queryParams.toString();
      const endpoint = `/checkpoints/admin/all-passes${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },

    cancelPass: async (passId: string, reason?: string) => {
      const response = await apiRequest(`/checkpoints/cancel/${passId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return response.json();
    },
  },

  // Hourly Pass endpoints
  hourlyPasses: {
    // Get available slots for a checkpoint on a date
    getSlots: async (checkpointId: string, date?: string) => {
      const query = date ? `?date=${date}` : '';
      const response = await apiRequest(`/hourly-passes/checkpoints/${checkpointId}/slots${query}`);
      return response.json();
    },

    // Book a pass (public - no auth required, but optional, or for group member if instructor)
    book: async (data: {
      checkpointId: string;
      date: string;
      hour: number;
      vehicleOwnerName: string;
      vehicleOwnerPhone: string;
      vehicleNumber: string;
      numberOfPeople?: number;
      memberId?: string; // Optional: for group instructors booking for members
    }) => {
      const response = await apiRequest('/hourly-passes/book', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    // Get user's passes (if logged in)
    getMyPasses: async (filters?: {
      status?: string;
      checkpointId?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.checkpointId) queryParams.append('checkpointId', filters.checkpointId);

      const query = queryParams.toString();
      const endpoint = `/hourly-passes/my-passes${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },

    // Admin: Scan QR code and mark as used
    scanPass: async (passId: string) => {
      const response = await apiRequest(`/hourly-passes/scan/${passId}`, {
        method: 'POST',
      });
      return response.json();
    },

    // Admin: Get all passes (with pagination)
    getAllPasses: async (filters?: {
      status?: string;
      checkpointId?: string;
      startDate?: string;
      endDate?: string;
      vehicleNumber?: string;
      page?: number;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.checkpointId) queryParams.append('checkpointId', filters.checkpointId);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.vehicleNumber) queryParams.append('vehicleNumber', filters.vehicleNumber);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const query = queryParams.toString();
      const endpoint = `/hourly-passes/admin/all-passes${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },

    // Admin: Set slot capacity
    setSlotCapacity: async (data: {
      checkpointId: string;
      date: string;
      hour: number;
      capacity: number;
      price?: number;
      isActive?: boolean;
    }) => {
      const response = await apiRequest('/hourly-passes/admin/slots', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },

    // Admin: Get slot configurations
    getSlotConfigs: async (checkpointId: string, date: string) => {
      const response = await apiRequest(`/hourly-passes/admin/slots?checkpointId=${checkpointId}&date=${date}`);
      return response.json();
    },
  },

  // Admin endpoints
  admin: {
    getStats: async () => {
      const response = await apiRequest('/admin/stats');
      return response.json();
    },

    getUsers: async (filters?: {
      role?: string;
      isActive?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (filters?.role) queryParams.append('role', filters.role);
      if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const query = queryParams.toString();
      const endpoint = `/admin/users${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },

    updateUserStatus: async (userId: string, isActive: boolean) => {
      const response = await apiRequest(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });
      return response.json();
    },

    getBookings: async (filters?: {
      type?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const query = queryParams.toString();
      const endpoint = `/admin/bookings${query ? `?${query}` : ''}`;
      const response = await apiRequest(endpoint);
      return response.json();
    },

    getActivities: async (limit?: number) => {
      const query = limit ? `?limit=${limit}` : '';
      const response = await apiRequest(`/admin/activities${query}`);
      return response.json();
    },
  },
};

export default api;
