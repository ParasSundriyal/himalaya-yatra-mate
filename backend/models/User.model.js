import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  role: {
    type: String,
    enum: ['user', 'group', 'admin'],
    default: 'user'
  },
  /** Legacy plain Aadhaar — prefer `aadhaarHash` only for new registrations */
  aadhar: {
    type: String,
    sparse: true,
    match: [/^[0-9]{12}$/, 'Aadhar must be 12 digits']
  },
  /** SHA-256 hex of 12-digit Aadhaar (never store plain Aadhaar) */
  aadhaarHash: {
    type: String,
    sparse: true,
    select: false,
  },
  pilgrimId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  firebaseUid: {
    type: String,
    sparse: true,
    index: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_say'],
  },
  homeState: {
    type: String,
    trim: true,
  },
  emergencyContact: {
    name: { type: String, trim: true },
    phone: { type: String, match: [/^[0-9]{10}$/, 'Emergency phone must be 10 digits'] },
  },
  healthConditions: [{
    type: String,
    enum: ['heart', 'bp', 'knee', 'asthma', 'diabetes', 'pregnancy', 'none'],
  }],
  fitnessLevel: {
    type: String,
    enum: ['low', 'moderate', 'active'],
  },
  vehicle: {
    vehicleType: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    passengers: { type: Number, min: 0, max: 20 },
  },
  groupInfo: {
    name: { type: String, trim: true },
    size: { type: Number, min: 1 },
    pinHash: { type: String }, // store bcrypt hash if you generate PIN
  },
  registrationCompleted: {
    type: Boolean,
    default: false,
  },
  photo: {
    type: String, // store base64 or URL
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // For group instructors
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  // For tourists in a group
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
