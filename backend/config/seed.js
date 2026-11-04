import bcrypt from 'bcryptjs';
import Driver from '../models/Driver.js';
import User from '../models/User.js';
import Pickup from '../models/Pickup.js';

export const DEMO_PASSWORD = 'Demo@1234';

// Runs only against an empty database so real data is never touched
export const seedDemoData = async () => {
  if ((await Driver.countDocuments()) || (await User.countDocuments())) return;

  const driver = await Driver.create({
    firstName: 'Nimal',
    lastName: 'Perera',
    email: 'driver@demo.lk',
    password: await bcrypt.hash(DEMO_PASSWORD, 10),
    birthday: new Date('1992-04-12'),
    nationality: 'Sri Lankan',
    employeeId: 'EMP-001',
    employeeType: 'Permanent',
    nic: '199210200123',
    joinedDate: new Date('2023-01-15'),
  });

  // User passwords are hashed by the model's pre-save hook
  const customer = await User.create({
    name: 'Kamani Silva',
    email: 'customer@demo.lk',
    password: DEMO_PASSWORD,
    address: '12 Galle Road, Colombo 03',
    phone: '0771234567',
  });

  const day = 24 * 60 * 60 * 1000;
  const base = { user: customer._id, customerName: customer.name, contactNumber: customer.phone, returnOption: 'cash' };
  await Pickup.create([
    { ...base, address: '12 Galle Road, Colombo 03', pickupType: 'metal', itemType: 'metal', scale: 'medium', scheduledTime: new Date(Date.now() + day / 4), status: 'assigned', driver: driver._id },
    { ...base, address: '45 Temple Road, Nugegoda', pickupType: 'plastic', itemType: 'plastic', scale: 'small', scheduledTime: new Date(Date.now() + day), status: 'assigned', driver: driver._id },
    { ...base, address: '8 Lake Drive, Rajagiriya', pickupType: 'wood', itemType: 'wood', scale: 'large', scheduledTime: new Date(Date.now() + 2 * day), status: 'pending' },
  ]);

  console.log(`Seeded demo data. Driver: driver@demo.lk / Customer: customer@demo.lk (password ${DEMO_PASSWORD})`);
};
