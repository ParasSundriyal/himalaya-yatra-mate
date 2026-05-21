/**
 * Creates a service account for n8n with admin role.
 * Run once: node scripts/createN8nServiceAccount.js
 *
 * Outputs the JWT token to use in n8n's Header Auth credential.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import after dotenv so env vars are available
const User = (await import('../models/User.model.js')).default;
const { generateToken } = await import('../utils/generateToken.js');

const BOT_EMAIL = 'n8n-bot@system.local';
const BOT_NAME = 'N8N Service Bot';
const BOT_PHONE = '0000000000';
const BOT_PASSWORD = 'N8nS3rv1c3!Bot2026';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Check if bot already exists
  let user = await User.findOne({ email: BOT_EMAIL });

  if (user) {
    console.log('⚡ Bot account already exists, generating fresh token...');
  } else {
    // Create with 'user' role first (registration blocks 'admin')
    user = new User({
      name: BOT_NAME,
      email: BOT_EMAIL,
      phone: BOT_PHONE,
      password: BOT_PASSWORD,
      role: 'user',
      isActive: true,
    });
    await user.save();
    console.log('✅ Bot account created');
  }

  // Promote to admin directly in DB
  if (user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
    console.log('✅ Promoted to admin role');
  }

  // Generate a token
  const token = generateToken(user._id);

  console.log('\n' + '='.repeat(60));
  console.log('🔑 N8N SERVICE TOKEN (copy this entire string):');
  console.log('='.repeat(60));
  console.log(token);
  console.log('='.repeat(60));
  console.log('\n📋 Use in n8n → Credentials → Header Auth:');
  console.log('   Header Name:  Authorization');
  console.log(`   Header Value: Bearer ${token}`);
  console.log('\n⚠️  Store this securely. To regenerate, run this script again.\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
