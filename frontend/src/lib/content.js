// Static copy: education, FAQ and policy text

export const MATERIAL_GUIDE = {
  metal: { tips: ['Separate iron, aluminium and copper where you can; they are priced differently.', 'Remove non-metal parts such as rubber or wood.', 'Heavy items are weighed on our calibrated scale at your door.'], examples: 'Cans, pipes, cookware, window frames, wiring' },
  plastic: { tips: ['Rinse bottles and containers.', 'Keep PET bottles (clear) apart from hard plastics.', 'Remove caps and labels if you have time.'], examples: 'PET bottles, buckets, crates, pipes, packaging' },
  paper: { tips: ['Keep paper dry; wet paper loses value.', 'Flatten cardboard boxes.', 'Remove plastic wrap and tape.'], examples: 'Newspapers, books, cartons, office paper' },
  glass: { tips: ['Rinse bottles and jars.', 'Do not mix ceramics or mirrors with glass.', 'Pack broken glass in a sturdy box and tell the driver.'], examples: 'Bottles, jars, window panes' },
  ewaste: { tips: ['Keep devices whole; parts hold most of the value.', 'Remove personal data first.', 'Batteries are collected separately.'], examples: 'Phones, laptops, chargers, small appliances' },
  wood: { tips: ['Remove nails and metal fittings.', 'Keep treated wood separate.', 'Bundle long pieces together.'], examples: 'Pallets, furniture offcuts, planks, crates' },
};

export const FAQ = [
  { q: 'How does a pickup work?', a: 'Book a slot, a driver is assigned, and they arrive within your chosen window. They weigh the scrap in front of you and pay cash or swap it for a broom or basin, your choice.' },
  { q: 'How are prices decided?', a: 'We pay per kilogram. Rates follow the market and are updated by our team, so you will always see the current price on the Prices page before you book.' },
  { q: 'Can I cancel or reschedule?', a: 'Yes. You can reschedule or cancel from My pickups at any time before the driver is on the way.' },
  { q: 'What if I am not home?', a: 'Add a note with gate access or a contact person when booking. If nobody is available the driver may have to mark the pickup as missed, and you can simply book a new slot.' },
  { q: 'How does the marketplace work?', a: 'List a reusable item with a price. Our team reviews every listing before it goes live. Buyers can purchase instantly, make an offer or request an inspection. We take a 10% commission only when it sells.' },
  { q: 'What do you collect?', a: 'Metal, plastic, paper and cardboard, glass, e-waste and wood. Hazardous waste, medical waste and CRT televisions are not accepted.' },
  { q: 'How do I get my invoice?', a: 'Open a completed pickup in My pickups and choose Invoice. You can print it or save it as a PDF.' },
  { q: 'Is my data safe?', a: 'Your details are only used to run your pickups. Drivers see your name, address and phone for the pickup they are assigned, nothing more.' },
];

export const LEGAL = {
  privacy: {
    title: 'Privacy policy',
    updated: 'November 2026',
    sections: [
      ['What we collect', 'Your name, contact details, address, pickup and marketplace activity. We collect only what is needed to run collections, payments and the marketplace.'],
      ['How we use it', 'To schedule and complete pickups, process payments and invoices, show listings, send notifications about your activity, and improve the service.'],
      ['Who sees it', 'Assigned drivers see the details needed to reach you. Marketplace buyers see your first name and city. We never sell personal data.'],
      ['Your choices', 'You can update your details and notification preferences in your profile at any time, or ask us to delete your account.'],
    ],
  },
  terms: {
    title: 'Terms of service',
    updated: 'November 2026',
    sections: [
      ['Using Yakadabadu.lk', 'You agree to provide accurate information, be present or reachable at the pickup time, and treat our drivers respectfully.'],
      ['Pickups and payments', 'Payments are based on the weight recorded by the driver at the time of collection and the rate in force. Disputes can be raised through the Help page.'],
      ['Marketplace', 'Listings are reviewed before publication. Sellers must own what they list. A 10% commission applies to completed sales. We may remove listings that break our rules.'],
      ['Prohibited items', 'Hazardous, medical or stolen goods, and CRT televisions, may not be handed over or listed.'],
    ],
  },
};

export const ABOUT = {
  mission: 'Sri Lanka loses valuable materials every day to irregular, unorganised scrap collection. Yakadabadu.lk connects households, businesses, drivers and recyclers so that scrap gets collected on time, weighed fairly and paid for transparently.',
  pillars: [
    ['Fair and transparent', 'Weighed at your door, priced per kilogram, with a digital invoice every time.'],
    ['Convenient', 'Book in a minute, track the driver live and rate the service afterwards.'],
    ['Circular', 'Reusable items are resold through our marketplace instead of being scrapped.'],
    ['Trusted', 'Verified drivers, reviewed listings and a clear record of every transaction.'],
  ],
};
