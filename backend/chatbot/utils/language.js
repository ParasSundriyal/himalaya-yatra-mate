const HINDI_REGEX = /[\u0900-\u097F]/;

const HINGLISH_HINTS = [
  'kaise',
  'kya',
  'kab',
  'kahan',
  'rasta',
  'darshan',
  'yatra',
  'mandir',
  'jana',
  'jaye',
  'madad',
  'mausam',
];

export function detectLanguage(message = '') {
  if (HINDI_REGEX.test(message)) {
    return 'hi';
  }

  const lower = message.toLowerCase();
  if (HINGLISH_HINTS.some((hint) => lower.includes(hint))) {
    return 'hi';
  }

  return 'en';
}
