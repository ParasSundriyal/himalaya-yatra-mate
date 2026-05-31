/** @typedef {{ month: number; day: number }} MonthDay */

export const DHAM_INFO = {
  yamunotri: {
    displayName: 'Yamunotri',
    altitude: 3293,
    openingDate: { month: 4, day: 22 },
    closingDate: { month: 10, day: 2 },
    openingDateNote: 'Akshaya Tritiya (date varies yearly)',
    closingDateNote: 'Diwali (date varies yearly)',
    baseLocation: 'Janki Chatti',
    trekDistance: 6,
    trekDuration: 3,
    ponyAvailable: true,
    helicopterAvailable: false,
    mandatoryStopover: null,
    darshaTiming: '06:00 - 20:00',
    bestVisitTime: 'morning',
    nearbyAttractions: [
      {
        name: 'Surya Kund',
        distance: 0.1,
        type: 'kund',
        description: 'Hot spring near temple, used to cook prasad',
      },
      {
        name: 'Divya Shila',
        distance: 0.05,
        type: 'religious',
        description: 'Sacred rock pillar worshipped before temple',
      },
      {
        name: 'Hanuman Chatti',
        distance: 13,
        type: 'confluence',
        description: 'Confluence of Hanuman Ganga and Yamuna',
      },
    ],
    crowdAlternatives: [
      {
        name: 'Kharsali Village',
        distance: 1,
        description: 'Winter home of Yamunotri deity, less crowded',
      },
      {
        name: 'Barkot',
        distance: 50,
        description: 'Scenic town, base for acclimatisation',
      },
    ],
  },
  gangotri: {
    displayName: 'Gangotri',
    altitude: 3048,
    openingDate: { month: 4, day: 22 },
    closingDate: { month: 10, day: 14 },
    openingDateNote: 'Akshaya Tritiya',
    closingDateNote: 'Diwali',
    baseLocation: 'Gangotri town',
    trekDistance: 0,
    trekDuration: 0,
    ponyAvailable: false,
    helicopterAvailable: false,
    mandatoryStopover: 'Uttarkashi',
    darshaTiming: '06:30 - 14:00, 15:00 - 21:00',
    bestVisitTime: 'morning',
    nearbyAttractions: [
      {
        name: 'Gaumukh Glacier',
        distance: 19,
        type: 'trek',
        description: 'Origin of Ganga. 19km trek, permit required',
      },
      {
        name: 'Bhagirathi Shila',
        distance: 0.1,
        type: 'religious',
        description: 'Rock where King Bhagirath meditated',
      },
      {
        name: 'Pandava Gufa',
        distance: 1,
        type: 'cave',
        description: 'Cave where Pandavas meditated',
      },
    ],
    crowdAlternatives: [
      {
        name: 'Harsil Village',
        distance: 24,
        description: 'Apple orchards, peaceful riverside village',
      },
      {
        name: 'Mukhba Village',
        distance: 32,
        description: 'Winter seat of Gangotri deity',
      },
    ],
  },
  kedarnath: {
    displayName: 'Kedarnath',
    altitude: 3583,
    openingDate: { month: 4, day: 25 },
    closingDate: { month: 10, day: 25 },
    openingDateNote: 'Auspicious date after Akshaya Tritiya',
    closingDateNote: 'Bhau Beej (2 days after Diwali)',
    baseLocation: 'Gaurikund (trek start) / Sonprayag (parking)',
    trekDistance: 16,
    trekDuration: 6,
    ponyAvailable: true,
    helicopterAvailable: true,
    helicopterBaseLocation: 'Phata / Sersi / Guptkashi',
    helicopterPrice: 6500,
    mandatoryStopover: 'Guptkashi or Rudraprayag',
    darshaTiming: '04:00 - 12:00, 15:00 - 21:00',
    bestVisitTime: 'pre-dawn for abhishek',
    nearbyAttractions: [
      {
        name: 'Gandhi Sarovar',
        distance: 3,
        type: 'lake',
        description: 'Lake above Kedarnath, scenic 3km trek',
      },
      {
        name: 'Bhairavnath Temple',
        distance: 0.5,
        type: 'temple',
        description: 'Guardian deity of Kedarnath, on hillock above',
      },
      {
        name: 'Vasuki Tal',
        distance: 8,
        type: 'lake',
        description: 'High altitude lake, only for fit trekkers',
      },
    ],
    crowdAlternatives: [
      {
        name: 'Triyuginarayan',
        distance: 12,
        description: 'Temple where Shiva-Parvati married, very peaceful',
      },
      {
        name: 'Chopta-Tungnath',
        distance: 80,
        description: 'Highest Shiva temple, Chandrashila summit trek',
      },
    ],
  },
  badrinath: {
    displayName: 'Badrinath',
    altitude: 3133,
    openingDate: { month: 4, day: 27 },
    closingDate: { month: 10, day: 20 },
    openingDateNote: 'Announced by head priest (varies by year)',
    closingDateNote: 'After Vijayadashami',
    baseLocation: 'Badrinath town',
    trekDistance: 0,
    trekDuration: 0,
    ponyAvailable: false,
    helicopterAvailable: false,
    mandatoryStopover: 'Joshimath',
    darshaTiming: '04:30 - 13:00, 15:00 - 21:00',
    bestVisitTime: 'Brahma Muhurta (04:30 abhishek)',
    nearbyAttractions: [
      {
        name: 'Mana Village',
        distance: 3,
        type: 'village',
        description:
          'Last Indian village before Tibet. Bhim Pul, Saraswati river origin',
      },
      {
        name: 'Tapt Kund',
        distance: 0.1,
        type: 'kund',
        description: 'Natural hot spring. Holy dip before temple darshan',
      },
      {
        name: 'Vyas Gufa',
        distance: 3,
        type: 'cave',
        description: 'Cave where Vyasa wrote Mahabharata',
      },
      {
        name: 'Neelkanth Peak',
        distance: 6,
        type: 'peak',
        description: 'Stunning view of 6596m peak from town',
      },
    ],
    crowdAlternatives: [
      {
        name: 'Hemkund Sahib',
        distance: 20,
        description: 'Sikh pilgrimage site at 4329m, snow lake trek',
      },
      {
        name: 'Valley of Flowers',
        distance: 18,
        description: 'UNESCO site, peak bloom July-August',
      },
    ],
  },
};

export const YEARLY_OPENING_DATES = {
  2025: {
    yamunotri: '2025-04-30',
    gangotri: '2025-05-02',
    kedarnath: '2025-05-02',
    badrinath: '2025-05-04',
  },
  2026: {
    yamunotri: '2026-04-19',
    gangotri: '2026-04-22',
    kedarnath: '2026-05-08',
    badrinath: '2026-05-10',
  },
};

export const DHAM_KEYS = ['yamunotri', 'gangotri', 'kedarnath', 'badrinath'];

export function displayNameForDham(key) {
  return DHAM_INFO[key]?.displayName || key;
}
