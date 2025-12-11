import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import Parking from '../models/Parking.model.js';
import Hotel from '../models/Hotel.model.js';
import Taxi from '../models/Taxi.model.js';
import Group from '../models/Group.model.js';
import Checkpoint from '../models/Checkpoint.model.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/himalaya-yatra');
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Parking.deleteMany({});
    // await Hotel.deleteMany({});
    // await Taxi.deleteMany({});
    // await Group.deleteMany({});
    // console.log('🗑️  Cleared existing data');

    // Create Admin User
    const adminExists = await User.findOne({ email: 'admin@chardham.com' });
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'Admin User',
        email: 'admin@chardham.com',
        password: adminPassword,
        phone: '9876543210',
        role: 'admin',
        isVerified: true,
        isActive: true
      });
      await admin.save();
      console.log('✅ Created admin user: admin@chardham.com / admin123');
    }

    // Create Group Instructor
    const instructorExists = await User.findOne({ email: 'instructor@chardham.com' });
    if (!instructorExists) {
      const instructorPassword = await bcrypt.hash('instructor123', 10);
      const instructor = new User({
        name: 'Group Instructor',
        email: 'instructor@chardham.com',
        password: instructorPassword,
        phone: '9876543211',
        role: 'group',
        isVerified: true,
        isActive: true
      });
      await instructor.save();
      console.log('✅ Created group instructor: instructor@chardham.com / instructor123');
    }

    // Create Test User
    const userExists = await User.findOne({ email: 'user@chardham.com' });
    if (!userExists) {
      const userPassword = await bcrypt.hash('user123', 10);
      const user = new User({
        name: 'Test User',
        email: 'user@chardham.com',
        password: userPassword,
        phone: '9876543212',
        role: 'user',
        isVerified: true,
        isActive: true
      });
      await user.save();
      console.log('✅ Created test user: user@chardham.com / user123');
    }

    // Create Parking Areas
    const parkingAreas = [
      {
        name: 'Badrinath Main Parking',
        location: 'Badrinath',
        coordinates: { lat: 30.7433, lng: 79.4938 },
        totalSlots: 100,
        slots: []
      },
      {
        name: 'Kedarnath North Zone',
        location: 'Kedarnath',
        coordinates: { lat: 30.7346, lng: 79.0669 },
        totalSlots: 80,
        slots: []
      },
      {
        name: 'Gangotri East Parking',
        location: 'Gangotri',
        coordinates: { lat: 30.9996, lng: 78.9408 },
        totalSlots: 60,
        slots: []
      },
      {
        name: 'Yamunotri West Zone',
        location: 'Yamunotri',
        coordinates: { lat: 31.0118, lng: 78.4270 },
        totalSlots: 50,
        slots: []
      }
    ];

    for (const area of parkingAreas) {
      const existingArea = await Parking.findOne({ name: area.name });
      if (!existingArea) {
        // Generate slots
        for (let i = 1; i <= area.totalSlots; i++) {
          const slotNumber = `${area.location.charAt(0)}-${String(i).padStart(3, '0')}`;
          const size = i % 3 === 0 ? 'Large' : 'Standard';
          const pricePerDay = size === 'Large' ? 75 : 50;
          
          area.slots.push({
            slotNumber,
            status: 'available',
            size,
            pricePerDay,
            location: area.location
          });
        }
        
        area.availableSlots = area.totalSlots;
        const parking = new Parking(area);
        await parking.save();
        console.log(`✅ Created parking area: ${area.name} with ${area.totalSlots} slots`);
      }
    }

    // Create Hotels
    const hotels = [
      {
        name: 'Divine Heights Hotel',
        location: 'Badrinath',
        address: { street: 'Main Road', city: 'Badrinath', state: 'Uttarakhand', pincode: '246422' },
        coordinates: { lat: 30.7450, lng: 79.4950 },
        description: 'Comfortable stay near Badrinath Temple',
        rating: 4.5,
        pricePerNight: 2500,
        amenities: ['WiFi', 'Restaurant', 'Parking', 'Hot Water'],
        totalRooms: 30,
        availableRooms: 25,
        contact: { phone: '9876543210', email: 'divineheights@example.com' }
      },
      {
        name: 'Mountain View Resort',
        location: 'Kedarnath',
        address: { street: 'Temple Road', city: 'Kedarnath', state: 'Uttarakhand', pincode: '246445' },
        coordinates: { lat: 30.7350, lng: 79.0670 },
        description: 'Scenic views of Kedarnath Valley',
        rating: 4.8,
        pricePerNight: 3200,
        amenities: ['WiFi', 'Spa', 'Temple View', 'Restaurant'],
        totalRooms: 20,
        availableRooms: 15,
        contact: { phone: '9876543211', email: 'mountainview@example.com' }
      },
      {
        name: 'Ganga Retreat',
        location: 'Gangotri',
        address: { street: 'River Side', city: 'Gangotri', state: 'Uttarakhand', pincode: '249135' },
        coordinates: { lat: 31.0000, lng: 78.9410 },
        description: 'Peaceful stay by the Ganges',
        rating: 4.3,
        pricePerNight: 2000,
        amenities: ['River View', 'Restaurant', 'Parking'],
        totalRooms: 25,
        availableRooms: 20,
        contact: { phone: '9876543212', email: 'gangaretreat@example.com' }
      },
      {
        name: 'Yamuna Palace',
        location: 'Yamunotri',
        address: { street: 'Temple Road', city: 'Yamunotri', state: 'Uttarakhand', pincode: '249141' },
        coordinates: { lat: 31.0120, lng: 78.4280 },
        description: 'Luxury accommodation near Yamunotri Temple',
        rating: 4.6,
        pricePerNight: 2800,
        amenities: ['WiFi', 'Parking', 'Hot Water', 'Restaurant'],
        totalRooms: 15,
        availableRooms: 10,
        contact: { phone: '9876543213', email: 'yamunapalace@example.com' }
      }
    ];

    for (const hotelData of hotels) {
      const existingHotel = await Hotel.findOne({ name: hotelData.name });
      if (!existingHotel) {
        const hotel = new Hotel(hotelData);
        await hotel.save();
        console.log(`✅ Created hotel: ${hotelData.name}`);
      }
    }

    // Create Taxis
    const taxis = [
      {
        driverName: 'Rajesh Kumar',
        driverPhone: '9876543220',
        vehicleType: 'Toyota Innova',
        vehicleNumber: 'UK-05-AB-1234',
        seats: 7,
        ratePerKm: 15,
        rating: 4.7,
        totalRides: 150,
        location: 'Badrinath',
        coordinates: { lat: 30.7433, lng: 79.4938 },
        licenseNumber: 'DL1234567890'
      },
      {
        driverName: 'Amit Sharma',
        driverPhone: '9876543221',
        vehicleType: 'Maruti Ertiga',
        vehicleNumber: 'UK-07-CD-5678',
        seats: 7,
        ratePerKm: 12,
        rating: 4.5,
        totalRides: 120,
        location: 'Kedarnath',
        coordinates: { lat: 30.7346, lng: 79.0669 },
        licenseNumber: 'DL1234567891'
      },
      {
        driverName: 'Vikram Singh',
        driverPhone: '9876543222',
        vehicleType: 'Mahindra Scorpio',
        vehicleNumber: 'UK-06-EF-9012',
        seats: 8,
        ratePerKm: 18,
        rating: 4.8,
        totalRides: 200,
        location: 'Gangotri',
        coordinates: { lat: 30.9996, lng: 78.9408 },
        licenseNumber: 'DL1234567892'
      },
      {
        driverName: 'Ramesh Patel',
        driverPhone: '9876543223',
        vehicleType: 'Toyota Innova',
        vehicleNumber: 'UK-05-GH-3456',
        seats: 7,
        ratePerKm: 16,
        rating: 4.6,
        totalRides: 180,
        location: 'Yamunotri',
        coordinates: { lat: 31.0118, lng: 78.4270 },
        licenseNumber: 'DL1234567893'
      }
    ];

    for (const taxiData of taxis) {
      const existingTaxi = await Taxi.findOne({ vehicleNumber: taxiData.vehicleNumber });
      if (!existingTaxi) {
        const taxi = new Taxi(taxiData);
        await taxi.save();
        console.log(`✅ Created taxi: ${taxiData.vehicleNumber} - ${taxiData.driverName}`);
      }
    }

    // Create Checkpoints
    console.log('\n📍 Creating checkpoints...');
    const checkpoints = [
      {
        name: 'Badrinath Checkpoint',
        location: 'Badrinath, Chamoli District',
        coordinates: { lat: 30.7433, lng: 79.4938 },
        description: 'Main entry checkpoint for Badrinath Dham',
        slotDuration: 60, // 1 hour
        operatingHours: { start: '06:00', end: '20:00' },
        maxPassesPerSlot: 50,
        pricePerHour: 0, // Free
        isActive: true
      },
      {
        name: 'Kedarnath Checkpoint',
        location: 'Kedarnath, Rudraprayag District',
        coordinates: { lat: 30.7346, lng: 79.0669 },
        description: 'Main entry checkpoint for Kedarnath Dham',
        slotDuration: 60,
        operatingHours: { start: '06:00', end: '20:00' },
        maxPassesPerSlot: 50,
        pricePerHour: 0,
        isActive: true
      },
      {
        name: 'Gangotri Checkpoint',
        location: 'Gangotri, Uttarkashi District',
        coordinates: { lat: 30.9996, lng: 78.9408 },
        description: 'Main entry checkpoint for Gangotri Dham',
        slotDuration: 60,
        operatingHours: { start: '06:00', end: '20:00' },
        maxPassesPerSlot: 50,
        pricePerHour: 0,
        isActive: true
      },
      {
        name: 'Yamunotri Checkpoint',
        location: 'Yamunotri, Uttarkashi District',
        coordinates: { lat: 31.0118, lng: 78.4270 },
        description: 'Main entry checkpoint for Yamunotri Dham',
        slotDuration: 60,
        operatingHours: { start: '06:00', end: '20:00' },
        maxPassesPerSlot: 50,
        pricePerHour: 0,
        isActive: true
      },
      {
        name: 'Rishikesh Entry Checkpoint',
        location: 'Rishikesh, Dehradun District',
        coordinates: { lat: 30.0869, lng: 78.2676 },
        description: 'Entry checkpoint for Char Dham route from Rishikesh',
        slotDuration: 60,
        operatingHours: { start: '05:00', end: '22:00' },
        maxPassesPerSlot: 100,
        pricePerHour: 0,
        isActive: true
      }
    ];

    for (const checkpointData of checkpoints) {
      const existingCheckpoint = await Checkpoint.findOne({ name: checkpointData.name });
      if (!existingCheckpoint) {
        const checkpoint = new Checkpoint(checkpointData);
        await checkpoint.save();
        console.log(`✅ Created checkpoint: ${checkpointData.name}`);
      }
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin: admin@chardham.com / admin123');
    console.log('Instructor: instructor@chardham.com / instructor123');
    console.log('User: user@chardham.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
