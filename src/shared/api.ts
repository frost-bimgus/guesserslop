export type ScaleRound = {
  type: 'scale';
  title: string;
  prompt: string;
  anchorName: string;
  anchorEmoji: string;
  anchorCm: number;
  targetName: string;
  targetEmoji: string;
  actualCm: number;
  minCm: number;
  maxCm: number;
};

export type HexRound = {
  type: 'hex';
  title: string;
  prompt: string;
  hint: string;
  targetHex: string;
};

export type OrderItem = {
  label: string;
  detail: string;
  rank: number; // 1 = first/lowest/oldest, 4 = last/highest/newest
};

export type OrderRound = {
  type: 'order';
  title: string;
  prompt: string;
  items: OrderItem[];
};

export type StatRound = {
  type: 'stat';
  title: string;
  prompt: string;
  unit: string;
  prefix?: string | undefined;
  min: number;
  max: number;
  step: number;
  actual: number;
  fact: string;
};

export type EraRound = {
  type: 'era';
  title: string;
  prompt: string;
  minYear: number;
  maxYear: number;
  actualYear: number;
  fact: string;
};

export type GameRound = ScaleRound | HexRound | OrderRound | StatRound | EraRound;

export type DailyChallenge = {
  dayNumber: number;
  dayId: string;
  rounds: GameRound[];
};

export type PlayerStats = {
  sr: number;
  tierName: string;
  tierEmoji: string;
  nextTierSr: number | null;
  streak: number;
};

export type InitGameResponse = {
  username: string;
  challenge: DailyChallenge;
  isRankedAvailable: boolean;
  previousScore: number | null;
  playerStats: PlayerStats;
  leaderboard: { member: string; score: number }[];
  allTimeLeaderboard: { member: string; score: number }[];
};

export type RoundSubmitResponse = {
  score: number;
  totalPlays: number;
  note: string;
};

export type FinishGameResponse = {
  rank: number;
  totalPlayers: number;
  leaderboard: { member: string; score: number }[];
  allTimeLeaderboard: { member: string; score: number }[];
  playerStats: PlayerStats;
  srEarned: number;
  wasRankedRun: boolean;
  commentPosted: boolean;
};

export function getTierForSr(sr: number): {
  tierName: string;
  tierEmoji: string;
  nextTierSr: number | null;
} {
  if (sr >= 15000) return { tierName: 'Slop Grandmaster', tierEmoji: '💎', nextTierSr: null };
  if (sr >= 8000) return { tierName: 'Gold Slopper', tierEmoji: '🥇', nextTierSr: 15000 };
  if (sr >= 4000) return { tierName: 'Silver Slopper', tierEmoji: '🥈', nextTierSr: 8000 };
  if (sr >= 1500) return { tierName: 'Bronze Slopper', tierEmoji: '🥉', nextTierSr: 4000 };
  return { tierName: 'Certified Trash', tierEmoji: '🗑️', nextTierSr: 1500 };
}

// --- 1. SCALE OBJECT POOL (552 unique pairs) ---
type ScaleItem = { name: string; emoji: string; cm: number };

const SCALE_ITEMS: ScaleItem[] = [
  { name: 'AA Battery', emoji: '🔋', cm: 5 },
  { name: 'Rubik’s Cube', emoji: '🧊', cm: 6 },
  { name: 'Soda Can', emoji: '🥫', cm: 12 },
  { name: 'Cavendish Banana', emoji: '🍌', cm: 18 },
  { name: 'Regulation Bowling Pin', emoji: '🎳', cm: 38 },
  { name: 'Standard Microwave', emoji: '📟', cm: 50 },
  { name: 'Raccoon (Body)', emoji: '🦝', cm: 60 },
  { name: 'Acoustic Guitar', emoji: '🎸', cm: 100 },
  { name: 'Emperor Penguin', emoji: '🐧', cm: 115 },
  { name: 'Adult Capybara', emoji: '🦫', cm: 120 },
  { name: '55-Inch TV (Width)', emoji: '📺', cm: 122 },
  { name: 'Danny DeVito', emoji: '🕶️', cm: 147 },
  { name: 'Washing Machine (Height)', emoji: '🧺', cm: 85 },
  { name: 'Vending Machine (Height)', emoji: '🥤', cm: 183 },
  { name: 'Shaquille O’Neal', emoji: '🏀', cm: 216 },
  { name: 'King Size Bed (Length)', emoji: '🛏️', cm: 203 },
  { name: 'Concert Grand Piano', emoji: '🎹', cm: 274 },
  { name: 'Great White Shark', emoji: '🦈', cm: 460 },
  { name: 'Adult Giraffe', emoji: '🦒', cm: 520 },
  { name: 'Cybertruck (Length)', emoji: '🛻', cm: 568 },
  { name: 'London Double-Decker Bus', emoji: '🚌', cm: 440 },
  { name: 'T-Rex Skull', emoji: '🦖', cm: 150 },
  { name: 'Standard Doorframe', emoji: '🚪', cm: 203 },
  { name: 'Inflatable Flamingo Float', emoji: '🦩', cm: 140 },
];

// --- 2. HEX COLOR POOL (32 iconic colors) ---
type HexTarget = { name: string; hint: string; hex: string };

const HEX_TARGETS: HexTarget[] = [
  { name: 'classic Discord "Blurple"', hint: 'Between royal blue and violet', hex: '#5865F2' },
  { name: 'Shrek Ogre Green', hint: 'Warm earthy swamp yellow-green', hex: '#8CB83E' },
  { name: 'Reddit "Orangered" Upvote', hint: 'Punchy orange-red', hex: '#FF4500' },
  { name: 'Spotify Neon Green', hint: 'Vibrant electric lime-green', hex: '#1DB954' },
  { name: 'IKEA Swedish Blue', hint: 'Deep primary cobalt blue', hex: '#0058A3' },
  { name: 'Barbie Dreamhouse Pink', hint: 'Hot magenta-pink', hex: '#E0218A' },
  { name: 'Minecraft Creeper Green', hint: 'Grass-block leaf green', hex: '#41AE36' },
  { name: 'Starbucks Siren Green', hint: 'Dark forest emerald', hex: '#00704A' },
  { name: 'Twitch Brand Purple', hint: 'Bright neon violet', hex: '#9146FF' },
  { name: 'YouTube Play-Button Red', hint: 'Pure high-saturation red', hex: '#FF0000' },
  { name: 'Duolingo Owl Green', hint: 'Bright cheerful lime', hex: '#58CC02' },
  { name: 'Tiffany Robin-Egg Blue', hint: 'Soft pastel cyan-teal', hex: '#0ABAB5' },
  { name: 'SpongeBob SquarePants Yellow', hint: 'Bright lemon-sponge yellow', hex: '#F7E859' },
  { name: 'McDonald’s Golden Arches', hint: 'Warm cheddar-gold yellow', hex: '#FFC72C' },
  { name: 'Kermit the Frog Green', hint: 'Fresh spring leaf green', hex: '#68B030' },
  { name: 'Nickelodeon Slime Orange', hint: 'Bright tangerine orange', hex: '#FF6700' },
  { name: 'Homer Simpson Yellow', hint: 'Warm cartoon gold-yellow', hex: '#FED90F' },
  { name: 'WhatsApp Chat Green', hint: 'Fresh mint-emerald green', hex: '#25D366' },
  { name: 'Classic Twitter Bird Blue', hint: 'Bright sky cyan-blue', hex: '#1DA1F2' },
  { name: 'PlayStation Classic Blue', hint: 'Deep royal console blue', hex: '#003791' },
  { name: 'Xbox Neon Green', hint: 'Deep-to-bright console green', hex: '#107C10' },
  { name: 'Cadbury Dairy Milk Purple', hint: 'Rich royal plum purple', hex: '#482683' },
  { name: 'Ferrari Corsa Red', hint: 'Deep racing crimson-red', hex: '#D40000' },
  { name: 'UPS Delivery Truck Brown', hint: 'Dark espresso chocolate brown', hex: '#351C15' },
  { name: 'Monster Energy Claw Green', hint: 'Acid neon lime', hex: '#95D600' },
  { name: 'Nintendo Switch Neon Red', hint: 'Coral-pinkish neon red', hex: '#FF3C28' },
  { name: 'Windows XP Bliss Sky Blue', hint: 'Crisp daytime azure blue', hex: '#245EDC' },
  { name: 'Snapchat Ghost Yellow', hint: 'Pure eye-searing neon yellow', hex: '#FFFC00' },
  { name: 'Subway Eat-Fresh Green', hint: 'Deep kelly green', hex: '#008C15' },
  { name: 'Hulu Streaming Green', hint: 'Bright minty neon green', hex: '#1CE783' },
  { name: 'Tinder Flame Coral', hint: 'Warm pink-orange gradient midtone', hex: '#FD5068' },
  { name: 'Pepsi Globe Blue', hint: 'Bold American royal blue', hex: '#004B93' },
];

// --- 3. INDEPENDENT FACT POOLS (15 x 15 x 15 = 3,375 combinations) ---
const ORDER_PACKS: Omit<OrderRound, 'type' | 'title'>[] = [
  {
    prompt: 'Tap in order from OLDEST to NEWEST launch year',
    items: [
      { label: 'YouTube', detail: 'Feb 2005', rank: 1 },
      { label: 'Reddit', detail: 'June 2005', rank: 2 },
      { label: 'Twitter', detail: 'March 2006', rank: 3 },
      { label: 'Instagram', detail: 'Oct 2010', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from LIGHTEST to HEAVIEST adult animal',
    items: [
      { label: 'Emperor Penguin', detail: '~30 kg', rank: 1 },
      { label: 'Adult Capybara', detail: '~55 kg', rank: 2 },
      { label: 'Giant Panda', detail: '~110 kg', rank: 3 },
      { label: 'Grizzly Bear', detail: '~270 kg', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from OLDEST to NEWEST console release',
    items: [
      { label: 'PlayStation 2', detail: '2000', rank: 1 },
      { label: 'Xbox 360', detail: '2005', rank: 2 },
      { label: 'Nintendo Wii', detail: '2006', rank: 3 },
      { label: 'Nintendo Switch', detail: '2017', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from SMALLEST to LARGEST planet diameter',
    items: [
      { label: 'Mercury', detail: '4,879 km', rank: 1 },
      { label: 'Mars', detail: '6,779 km', rank: 2 },
      { label: 'Earth', detail: '12,742 km', rank: 3 },
      { label: 'Neptune', detail: '49,244 km', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from LOWEST to HIGHEST worldwide box office',
    items: [
      { label: 'The Dark Knight', detail: '$1.00B', rank: 1 },
      { label: 'Barbie (2023)', detail: '$1.44B', rank: 2 },
      { label: 'Titanic', detail: '$2.26B', rank: 3 },
      { label: 'Avatar (2009)', detail: '$2.92B', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from SLOWEST to FASTEST top speed',
    items: [
      { label: 'Usain Bolt Sprint', detail: '44.7 km/h', rank: 1 },
      { label: 'Cheetah Sprint', detail: '112 km/h', rank: 2 },
      { label: 'Peregrine Falcon Dive', detail: '389 km/h', rank: 3 },
      { label: 'Speed of Sound', detail: '1,235 km/h', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from OLDEST to NEWEST invention',
    items: [
      { label: 'Telephone', detail: '1876', rank: 1 },
      { label: 'Ballpoint Pen', detail: '1938', rank: 2 },
      { label: 'Microwave Oven', detail: '1946', rank: 3 },
      { label: 'World Wide Web', detail: '1989', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from SMALLEST to LARGEST country land area',
    items: [
      { label: 'South Korea', detail: '100k km²', rank: 1 },
      { label: 'Japan', detail: '378k km²', rank: 2 },
      { label: 'India', detail: '3.29M km²', rank: 3 },
      { label: 'Australia', detail: '7.69M km²', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from LOWEST to HIGHEST calories per 100g',
    items: [
      { label: 'Watermelon', detail: '30 kcal', rank: 1 },
      { label: 'Boiled Egg', detail: '155 kcal', rank: 2 },
      { label: 'White Bread', detail: '265 kcal', rank: 3 },
      { label: 'Peanut Butter', detail: '588 kcal', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from OLDEST to NEWEST gaming franchise debut',
    items: [
      { label: 'Pac-Man', detail: '1980', rank: 1 },
      { label: 'Super Mario Bros.', detail: '1985', rank: 2 },
      { label: 'Pokémon', detail: '1996', rank: 3 },
      { label: 'Minecraft', detail: '2009', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from SHORTEST to TALLEST landmark',
    items: [
      { label: 'Statue of Liberty', detail: '93 m', rank: 1 },
      { label: 'Great Pyramid of Giza', detail: '138 m', rank: 2 },
      { label: 'Eiffel Tower', detail: '330 m', rank: 3 },
      { label: 'Empire State Building', detail: '443 m (tip)', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from COLDEST to HOTTEST temperature',
    items: [
      { label: 'Liquid Nitrogen', detail: '-196°C', rank: 1 },
      { label: 'Dry Ice', detail: '-78.5°C', rank: 2 },
      { label: 'Boiling Water', detail: '100°C', rank: 3 },
      { label: 'Surface of the Sun', detail: '5,500°C', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from OLDEST to NEWEST historical moment',
    items: [
      { label: 'Apollo 11 Moon Landing', detail: '1969', rank: 1 },
      { label: 'Fall of the Berlin Wall', detail: '1989', rank: 2 },
      { label: 'First iPhone Launch', detail: '2007', rank: 3 },
      { label: 'James Webb Telescope Launch', detail: '2021', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from SHORTEST to LONGEST average lifespan',
    items: [
      { label: 'House Mouse', detail: '~2 years', rank: 1 },
      { label: 'Golden Retriever', detail: '~11 years', rank: 2 },
      { label: 'Asian Elephant', detail: '~48 years', rank: 3 },
      { label: 'Galápagos Tortoise', detail: '100+ years', rank: 4 },
    ],
  },
  {
    prompt: 'Tap in order from FEWEST to MOST bones in the body',
    items: [
      { label: 'Great White Shark (Cartilage)', detail: '0 true bones', rank: 1 },
      { label: 'Adult Human', detail: '206 bones', rank: 2 },
      { label: 'Newborn Human Baby', detail: '~270 bones', rank: 3 },
      { label: 'Burmese Python', detail: '600+ bones', rank: 4 },
    ],
  },
];

const STAT_PACKS: Omit<StatRound, 'type' | 'title'>[] = [
  {
    prompt: 'How much did a single Flamin’ Hot Cheeto shaped like Harambe sell for on eBay?',
    unit: 'USD',
    prefix: '$',
    min: 500,
    max: 150000,
    step: 500,
    actual: 99900,
    fact: 'It sold for $99,900 in February 2017 after a viral bidding war.',
  },
  {
    prompt: 'How many times was "Baby Shark Dance" viewed on YouTube by 2026 (in Billions)?',
    unit: 'B views',
    min: 2,
    max: 25,
    step: 0.5,
    actual: 16.5,
    fact: 'It crossed 10B in 2022 and kept climbing past 16 billion views.',
  },
  {
    prompt: 'How much did the original "Charlie Bit My Finger" NFT sell for in 2021?',
    unit: 'USD',
    prefix: '$',
    min: 10000,
    max: 1000000,
    step: 10000,
    actual: 760999,
    fact: 'It auctioned for $760,999 in May 2021.',
  },
  {
    prompt: 'How much did the original "Nyan Cat" GIF sell for as a 1-of-1 NFT in 2021?',
    unit: 'USD',
    prefix: '$',
    min: 10000,
    max: 900000,
    step: 10000,
    actual: 590000,
    fact: 'Creator Chris Torres sold it for 300 ETH (~$590,000) in Feb 2021.',
  },
  {
    prompt: 'How many upvotes (in Thousands) did Rick Astley’s viral bike photo get on r/pics?',
    unit: 'k upvotes',
    min: 50,
    max: 700,
    step: 10,
    actual: 490,
    fact: 'Rick Astley’s 2020 post hit ~490k upvotes, making it Reddit’s most upvoted post.',
  },
  {
    prompt: 'How tall was the tallest LEGO tower ever built (in meters)?',
    unit: 'meters',
    min: 10,
    max: 60,
    step: 1,
    actual: 35,
    fact: 'Built in Milan in 2015 using over 550,000 LEGO bricks (35.05m tall).',
  },
  {
    prompt: 'How much did Logan Paul pay for the PSA 10 Pikachu Illustrator Pokémon card?',
    unit: 'USD',
    prefix: '$',
    min: 500000,
    max: 8000000,
    step: 125000,
    actual: 5275000,
    fact: 'Set the Guinness World Record at $5,275,000.',
  },
  {
    prompt: 'How many square meters was the world’s largest pizza (built in LA in 2023)?',
    unit: 'sq meters',
    min: 200,
    max: 2500,
    step: 50,
    actual: 1300,
    fact: 'Pizza Hut & Airrack made a 1,299 sq meter (~14,000 sq ft) pizza in Jan 2023.',
  },
  {
    prompt: 'How much did Twitter founder Jack Dorsey’s first-ever tweet sell for as an NFT?',
    unit: 'USD',
    prefix: '$',
    min: 100000,
    max: 5000000,
    step: 100000,
    actual: 2900000,
    fact: '"just setting up my twttr" sold for $2.91 million in March 2021.',
  },
  {
    prompt: 'How many dominoes were toppled in the official Guinness World Record chain (in Millions)?',
    unit: 'M dominoes',
    min: 1,
    max: 10,
    step: 0.5,
    actual: 4.5,
    fact: '4,491,863 dominoes fell during Domino Day 2009 in the Netherlands.',
  },
  {
    prompt: 'How fast was the fastest tennis serve ever recorded (Sam Groth, in km/h)?',
    unit: 'km/h',
    min: 180,
    max: 310,
    step: 3,
    actual: 263,
    fact: 'Australian player Sam Groth hit 263 km/h (163.4 mph) in May 2012.',
  },
  {
    prompt: 'How many Bitcoins were spent on two Papa John’s pizzas in May 2010?',
    unit: 'BTC',
    min: 500,
    max: 25000,
    step: 500,
    actual: 10000,
    fact: 'Laszlo Hanyecz paid 10,000 BTC for two pizzas on May 22, 2010.',
  },
  {
    prompt: 'How much did the heaviest pumpkin ever grown weigh (in kg)?',
    unit: 'kg',
    min: 400,
    max: 2000,
    step: 25,
    actual: 1250,
    fact: 'Travis Gienger grew a 1,247 kg (2,749 lb) pumpkin in October 2023.',
  },
  {
    prompt: 'How tall is the Burj Khalifa in Dubai (in meters)?',
    unit: 'meters',
    min: 450,
    max: 1100,
    step: 6,
    actual: 828,
    fact: 'The Burj Khalifa stands at 828 meters (2,717 feet) tall.',
  },
  {
    prompt: 'How much did Apple charge for the Mac Pro Wheels Kit (4 wheels, no Mac)?',
    unit: 'USD',
    prefix: '$',
    min: 99,
    max: 1299,
    step: 50,
    actual: 699,
    fact: 'Apple sold the four stainless-steel wheels separately for $699.',
  },
];

const ERA_PACKS: Omit<EraRound, 'type' | 'title' | 'minYear' | 'maxYear'>[] = [
  {
    prompt: 'What year was the "Rickroll" bait-and-switch born on 4chan?',
    actualYear: 2007,
    fact: 'Started in May 2007 as "duckroll" before switching to Rick Astley.',
  },
  {
    prompt: 'What year did "Gangnam Style" become the first video to hit 1 Billion YouTube views?',
    actualYear: 2012,
    fact: 'PSY hit 1 billion views on December 21, 2012.',
  },
  {
    prompt: 'What year did "The Dress" (Blue/Black vs White/Gold) break the internet?',
    actualYear: 2015,
    fact: 'The viral Tumblr photo exploded in February 2015.',
  },
  {
    prompt: 'What year was the legendary "LEEROY JENKINS!" World of Warcraft clip uploaded?',
    actualYear: 2005,
    fact: 'Uploaded in May 2005, becoming one of gaming’s first mega-memes.',
  },
  {
    prompt: 'What year did the "Storm Area 51, They Can’t Stop All of Us" event go viral?',
    actualYear: 2019,
    fact: 'Over 2 million people RSVP’d on Facebook in July 2019.',
  },
  {
    prompt: 'What year was Dogecoin created as a joke cryptocurrency?',
    actualYear: 2013,
    fact: 'Billy Markus and Jackson Palmer launched Dogecoin in December 2013.',
  },
  {
    prompt: 'What year did "Pokémon GO" take over every park on Earth for one summer?',
    actualYear: 2016,
    fact: 'Released in July 2016, briefly bringing humanity together.',
  },
  {
    prompt: 'What year did the "Harlem Shake" 30-second dance meme flood YouTube?',
    actualYear: 2013,
    fact: 'Exploded in February 2013 with thousands of office and sports team videos.',
  },
  {
    prompt: 'What year did "Among Us" blow up into a global lockdown phenomenon?',
    actualYear: 2020,
    fact: 'Originally released in 2018, it went mega-viral in summer/fall 2020.',
  },
  {
    prompt: 'What year did creator Dong Nguyen delete "Flappy Bird" from app stores at peak fame?',
    actualYear: 2014,
    fact: 'Pulled in February 2014 while reportedly earning $50,000/day in ads.',
  },
  {
    prompt: 'What year did the "ALS Ice Bucket Challenge" take over every timeline?',
    actualYear: 2014,
    fact: 'Raised over $115 million for ALS research in summer 2014.',
  },
  {
    prompt: 'What year did "Minecraft" have its official Version 1.0 full release?',
    actualYear: 2011,
    fact: 'Version 1.0 officially launched at MineCon in November 2011.',
  },
  {
    prompt: 'What year did The New York Times buy "Wordle" for a seven-figure sum?',
    actualYear: 2022,
    fact: 'NYT acquired Wordle from Josh Wardle in January 2022.',
  },
  {
    prompt: 'What year did Twitter officially shut down the 6-second video app "Vine"?',
    actualYear: 2017,
    fact: 'Vine’s app was discontinued in January 2017.',
  },
  {
    prompt: 'What year did "Twitch Plays Pokémon" let 100,000+ viewers control Red at once?',
    actualYear: 2014,
    fact: 'Started in February 2014, giving birth to Lord Helix.',
  },
];

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildRoundsFromSeed(seed: number): GameRound[] {
  const rng = seededRng(seed);

  const anchorIdx = Math.floor(rng() * SCALE_ITEMS.length);
  let targetIdx = Math.floor(rng() * (SCALE_ITEMS.length - 1));
  if (targetIdx >= anchorIdx) targetIdx += 1;

  const anchor = SCALE_ITEMS[anchorIdx]!;
  const target = SCALE_ITEMS[targetIdx]!;
  const minCm = Math.max(2, Math.round(target.cm * (0.15 + rng() * 0.2)));
  const maxCm = Math.max(target.cm + 20, Math.round(target.cm * (1.8 + rng() * 0.9)));

  const hexTarget = HEX_TARGETS[Math.floor(rng() * HEX_TARGETS.length)]!;
  const orderPack = ORDER_PACKS[Math.floor(rng() * ORDER_PACKS.length)]!;
  const statPack = STAT_PACKS[Math.floor(rng() * STAT_PACKS.length)]!;
  const eraPack = ERA_PACKS[Math.floor(rng() * ERA_PACKS.length)]!;

  const shuffledOrderItems = [...orderPack.items];
  while (shuffledOrderItems.every((item, idx) => item.rank === idx + 1)) {
    for (let i = shuffledOrderItems.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = shuffledOrderItems[i]!;
      shuffledOrderItems[i] = shuffledOrderItems[j]!;
      shuffledOrderItems[j] = temp;
    }
  }

  return [
    {
      type: 'scale',
      title: 'ROUND 1 · SCALE SLOP',
      prompt: `Resize ${target.name} next to ${anchor.name}`,
      anchorName: anchor.name,
      anchorEmoji: anchor.emoji,
      anchorCm: anchor.cm,
      targetName: target.name,
      targetEmoji: target.emoji,
      actualCm: target.cm,
      minCm,
      maxCm,
    },
    {
      type: 'hex',
      title: 'ROUND 2 · HEX SLOP',
      prompt: `Mix ${hexTarget.name} from pure memory`,
      hint: hexTarget.hint,
      targetHex: hexTarget.hex,
    },
    {
      type: 'order',
      title: 'ROUND 3 · ORDER SLOP',
      prompt: orderPack.prompt,
      items: shuffledOrderItems,
    },
    {
      type: 'stat',
      title: 'ROUND 4 · STAT SLOP',
      ...statPack,
    },
    {
      type: 'era',
      title: 'ROUND 5 · ERA SLOP',
      ...eraPack,
      minYear: 1995,
      maxYear: 2026,
    },
  ];
}

export function getChallengeForDate(date = new Date()): DailyChallenge {
  const dayId = date.toISOString().slice(0, 10);
  const epochDays = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  const dayNumber = Math.max(1, epochDays - 20410);
  const rounds = buildRoundsFromSeed(epochDays * 2654435761);
  return { dayNumber, dayId, rounds };
}

export function getRandomPracticeChallenge(randomSeed = Date.now()): DailyChallenge {
  const dayId = new Date().toISOString().slice(0, 10);
  return {
    dayNumber: 0,
    dayId,
    rounds: buildRoundsFromSeed(randomSeed),
  };
}