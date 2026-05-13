import crypto from 'crypto';

const STATE_CODES = {
  'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR', 'Assam': 'AS',
  'Bihar': 'BR', 'Chhattisgarh': 'CG', 'Goa': 'GA', 'Gujarat': 'GJ',
  'Haryana': 'HR', 'Himachal Pradesh': 'HP', 'Jharkhand': 'JH',
  'Karnataka': 'KA', 'Kerala': 'KL', 'Madhya Pradesh': 'MP',
  'Maharashtra': 'MH', 'Manipur': 'MN', 'Meghalaya': 'ML',
  'Mizoram': 'MZ', 'Nagaland': 'NL', 'Odisha': 'OD', 'Punjab': 'PB',
  'Rajasthan': 'RJ', 'Sikkim': 'SK', 'Tamil Nadu': 'TN',
  'Telangana': 'TS', 'Tripura': 'TR', 'Uttar Pradesh': 'UP',
  'Uttarakhand': 'UK', 'West Bengal': 'WB', 'Delhi': 'DL',
  'Jammu and Kashmir': 'JK', 'Ladakh': 'LA',
};

export function generatePilgrimId(homeState) {
  const stateCode = STATE_CODES[homeState] || 'XX';
  const year = new Date().getFullYear();
  const random = crypto.randomInt(100000, 999999);
  return `CY-${stateCode}-${year}-${random}`;
}

export function hashAadhaar(aadhaarNumber) {
  return crypto.createHash('sha256').update(aadhaarNumber).digest('hex');
}
