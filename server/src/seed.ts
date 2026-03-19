import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import prisma from './lib/prisma';

async function main(): Promise<void> {
  console.log('Starting database seed...\n');

  // ─── Clean existing data ──────────────────────────────────────────────────
  await prisma.telegramLog.deleteMany();
  await prisma.documentFile.deleteMany();
  await prisma.affiliateContact.deleteMany();
  await prisma.brandingConfig.deleteMany();
  await prisma.reviewConfig.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.review.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleared existing data');

  // ─── System Accounts ──────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 12);
  const staffHash = await bcrypt.hash('staff123', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hotel.com',
      passwordHash: adminHash,
      role: 'admin',
      phone: '+1-555-0100',
      permissions: [
        'manage_staff',
        'manage_tickets',
        'manage_reviews',
        'manage_settings',
        'view_analytics',
        'manage_accounts',
      ],
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'frontdesk@hotel.com',
      passwordHash: staffHash,
      role: 'staff',
      phone: '+1-555-0101',
      permissions: ['manage_tickets', 'manage_reviews', 'view_analytics'],
    },
  });

  console.log(`Created ${2} system accounts`);
  console.log(`  - admin@hotel.com (password: admin123) [admin]`);
  console.log(`  - frontdesk@hotel.com (password: staff123) [staff]`);

  // ─── Staff Members ────────────────────────────────────────────────────────
  const staffMembers = await prisma.staffMember.createMany({
    data: [
      {
        name: 'Maria Santos',
        role: 'Front Desk Manager',
        email: 'maria.santos@hotel.com',
        phone: '+1-555-0201',
        currentShift: 'Morning',
        isOnDuty: true,
        avatarBg: 'bg-purple-500',
      },
      {
        name: 'James Wilson',
        role: 'Housekeeping Supervisor',
        email: 'james.wilson@hotel.com',
        phone: '+1-555-0202',
        currentShift: 'Morning',
        isOnDuty: true,
        avatarBg: 'bg-blue-500',
      },
      {
        name: 'Priya Sharma',
        role: 'Concierge',
        email: 'priya.sharma@hotel.com',
        phone: '+1-555-0203',
        currentShift: 'Evening',
        isOnDuty: true,
        avatarBg: 'bg-green-500',
      },
      {
        name: 'Carlos Rivera',
        role: 'Maintenance Technician',
        email: 'carlos.rivera@hotel.com',
        phone: '+1-555-0204',
        currentShift: 'Morning',
        isOnDuty: false,
        avatarBg: 'bg-orange-500',
      },
      {
        name: 'Aisha Okonkwo',
        role: 'F&B Supervisor',
        email: 'aisha.okonkwo@hotel.com',
        phone: '+1-555-0205',
        currentShift: 'Evening',
        isOnDuty: true,
        avatarBg: 'bg-pink-500',
      },
      {
        name: 'David Chen',
        role: 'Night Auditor',
        email: 'david.chen@hotel.com',
        phone: '+1-555-0206',
        currentShift: 'Night',
        isOnDuty: false,
        avatarBg: 'bg-indigo-500',
      },
      {
        name: 'Sophie Leclerc',
        role: 'Guest Relations',
        email: 'sophie.leclerc@hotel.com',
        phone: '+1-555-0207',
        currentShift: 'Morning',
        isOnDuty: true,
        avatarBg: 'bg-rose-500',
      },
      {
        name: 'Omar Farouk',
        role: 'Bellhop',
        email: 'omar.farouk@hotel.com',
        phone: '+1-555-0208',
        currentShift: 'Evening',
        isOnDuty: false,
        avatarBg: 'bg-teal-500',
      },
    ],
  });
  console.log(`\nCreated ${staffMembers.count} staff members`);

  // ─── Service Tickets ──────────────────────────────────────────────────────
  const now = new Date();
  const tickets = await prisma.ticket.createMany({
    data: [
      {
        roomId: '101',
        guestName: 'Emily Johnson',
        category: 'Housekeeping',
        description: 'Extra towels and toiletries needed. Guest requesting immediate service.',
        status: 'New',
        priority: 'High',
        createdAt: new Date(now.getTime() - 1000 * 60 * 30), // 30 min ago
        assignedTo: 'James Wilson',
      },
      {
        roomId: '215',
        guestName: 'Robert Kim',
        category: 'Maintenance',
        description: 'Air conditioning unit making loud noise. Cannot sleep. Urgent repair needed.',
        status: 'In Progress',
        priority: 'Critical',
        createdAt: new Date(now.getTime() - 1000 * 60 * 45), // 45 min ago
        assignedTo: 'Carlos Rivera',
      },
      {
        roomId: '304',
        guestName: 'Sophia Martinez',
        category: 'F&B',
        description: 'Room service order placed 45 minutes ago, still not delivered. Guest is upset.',
        status: 'New',
        priority: 'High',
        createdAt: new Date(now.getTime() - 1000 * 60 * 50),
        assignedTo: 'Aisha Okonkwo',
      },
      {
        roomId: '118',
        guestName: 'William Chen',
        category: 'Front Desk',
        description: 'Guest requesting early check-out and bill review. Disputes minibar charges.',
        status: 'In Progress',
        priority: 'Medium',
        createdAt: new Date(now.getTime() - 1000 * 60 * 90),
        assignedTo: 'Maria Santos',
      },
      {
        roomId: '422',
        guestName: 'Isabella Thompson',
        category: 'Concierge',
        description: 'Guest needs restaurant reservations for party of 8 tonight at 7 PM downtown.',
        status: 'New',
        priority: 'Medium',
        createdAt: new Date(now.getTime() - 1000 * 60 * 120),
        assignedTo: 'Priya Sharma',
      },
      {
        roomId: '209',
        guestName: 'Michael Brown',
        category: 'Housekeeping',
        description: 'Room not cleaned since check-in two days ago. Guest very dissatisfied.',
        status: 'Resolved',
        priority: 'Critical',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 day ago
        assignedTo: 'James Wilson',
      },
      {
        roomId: '317',
        guestName: 'Olivia Davis',
        category: 'Maintenance',
        description: 'Shower drain blocked. Water pooling on floor. Minor maintenance required.',
        status: 'In Progress',
        priority: 'Medium',
        createdAt: new Date(now.getTime() - 1000 * 60 * 180),
        assignedTo: 'Carlos Rivera',
      },
      {
        roomId: '501',
        guestName: 'James Anderson',
        category: 'Front Desk',
        description: 'VIP guest requesting suite upgrade. Platinum loyalty member.',
        status: 'Resolved',
        priority: 'High',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5), // 5 hours ago
        assignedTo: 'Maria Santos',
      },
    ],
  });
  console.log(`Created ${tickets.count} service tickets`);

  // ─── Guest Reviews ────────────────────────────────────────────────────────
  const reviews = await prisma.review.createMany({
    data: [
      {
        guestName: 'Sarah M.',
        rating: 5,
        date: '2026-03-15',
        platform: 'google',
        comment:
          'Absolutely wonderful stay! The staff were incredibly attentive and the room was spotless. Priya at concierge went above and beyond to make our anniversary special. Will definitely return!',
        response:
          "Thank you so much for your wonderful review, Sarah! We're thrilled your anniversary celebration was special. Priya and our entire team look forward to welcoming you back soon!",
        status: 'Replied',
      },
      {
        guestName: 'John D.',
        rating: 2,
        date: '2026-03-14',
        platform: 'tripadvisor',
        comment:
          'Disappointed with our stay. The room was not ready at check-in time, waited 2 hours. AC was noisy and we barely slept. Breakfast was cold. Not worth the price.',
        status: 'Pending',
      },
      {
        guestName: 'Emily R.',
        rating: 4,
        date: '2026-03-13',
        platform: 'google',
        comment:
          'Great location and comfortable rooms. Service was friendly and helpful. The pool area was clean and relaxing. Only minor issue was slow wifi in the room. Overall a very pleasant stay.',
        response:
          "Thank you, Emily! We're glad you enjoyed the location and pool. We're actively upgrading our wifi infrastructure and look forward to exceeding your expectations on your next visit!",
        status: 'Replied',
      },
      {
        guestName: 'Marcus T.',
        rating: 5,
        date: '2026-03-12',
        platform: 'tripadvisor',
        comment:
          'Perfect business travel experience! Room was quiet, bed was comfortable, and the business center was well-equipped. Checkout was fast and effortless. My go-to hotel for work trips.',
        status: 'Pending',
      },
      {
        guestName: 'Linda K.',
        rating: 3,
        date: '2026-03-11',
        platform: 'google',
        comment:
          'Average stay. Room was clean but a bit dated. Staff were nice but seemed understaffed - had to wait a long time at check-in. Restaurant food was decent. Expected more for the price.',
        status: 'Pending',
      },
      {
        guestName: 'Carlos V.',
        rating: 5,
        date: '2026-03-10',
        platform: 'google',
        comment:
          'Exceptional hospitality! From arrival to departure everything was perfect. Maria at the front desk made us feel like VIPs. Room was luxurious and the restaurant had amazing food. 10/10!',
        response:
          "Carlos, your kind words mean the world to us! Maria and the team are so happy they made your stay memorable. We can't wait to welcome you back for another exceptional experience!",
        status: 'Replied',
      },
      {
        guestName: 'Amelia W.',
        rating: 1,
        date: '2026-03-09',
        platform: 'tripadvisor',
        comment:
          'Terrible experience. Found cockroaches in the bathroom. Reported to front desk who seemed unbothered. Had to switch rooms but the second room had a broken lock. Never coming back.',
        status: 'Pending',
      },
      {
        guestName: 'Tom H.',
        rating: 4,
        date: '2026-03-08',
        platform: 'google',
        comment:
          "Solid hotel with great amenities. Gym was well-equipped, pool was lovely. Staff were friendly and responsive. Room service was prompt. Would have given 5 stars if the walls weren't so thin.",
        status: 'Pending',
      },
    ],
  });
  console.log(`Created ${reviews.count} guest reviews`);

  // ─── Alerts ───────────────────────────────────────────────────────────────
  const alerts = await prisma.alert.createMany({
    data: [
      {
        userId: 1,
        type: 'critical',
        msg: 'Room 215 AC unit failure - guest complaint escalated. Maintenance dispatched.',
        time: '10 min ago',
        createdAt: new Date(now.getTime() - 1000 * 60 * 10),
      },
      {
        userId: 1,
        type: 'warning',
        msg: 'New 1-star review posted on TripAdvisor. Immediate response recommended.',
        time: '25 min ago',
        createdAt: new Date(now.getTime() - 1000 * 60 * 25),
      },
      {
        userId: 1,
        type: 'info',
        msg: 'Occupancy rate reached 94% for today. 6 rooms remaining.',
        time: '1 hr ago',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60),
      },
      {
        userId: 1,
        type: 'warning',
        msg: 'Room 304 F&B order delayed 45+ minutes. Guest satisfaction at risk.',
        time: '52 min ago',
        createdAt: new Date(now.getTime() - 1000 * 60 * 52),
      },
      {
        userId: 1,
        type: 'info',
        msg: 'Staff meeting scheduled for 3 PM today in Conference Room A.',
        time: '2 hr ago',
        createdAt: new Date(now.getTime() - 1000 * 60 * 120),
      },
    ],
  });
  console.log(`Created ${alerts.count} alerts`);

  // ─── Review Config ────────────────────────────────────────────────────────
  await prisma.reviewConfig.createMany({
    data: [
      {
        platform: 'google',
        minRating: 4,
        prefilledText:
          'We hope you enjoyed your stay at Country Inn & Suites by Radisson!',
        autoReplyEnabled: false,
        signature: 'The Management Team, Country Inn & Suites by Radisson',
      },
      {
        platform: 'tripadvisor',
        minRating: 4,
        prefilledText:
          'Thank you for choosing Country Inn & Suites by Radisson!',
        autoReplyEnabled: false,
        signature: 'The Management Team, Country Inn & Suites by Radisson',
      },
    ],
  });
  console.log('Created review configurations');

  // ─── Branding Config ──────────────────────────────────────────────────────
  await prisma.brandingConfig.create({
    data: {
      hotelName: 'Country Inn & Suites by Radisson',
      appName: 'GuaqAI',
      primaryColor: '#6366f1',
    },
  });
  console.log('Created branding configuration');

  // ─── Affiliate Contacts ───────────────────────────────────────────────────
  await prisma.affiliateContact.createMany({
    data: [
      {
        label: 'City Airport Taxi',
        number: '+1-555-0301',
        category: 'Transport',
      },
      {
        label: 'Uber Business Account',
        number: '+1-555-0302',
        category: 'Transport',
      },
      {
        label: 'Downtown Limousine Service',
        number: '+1-555-0303',
        category: 'Transport',
      },
      {
        label: 'City General Hospital',
        number: '+1-555-0401',
        category: 'Medical',
      },
      {
        label: 'CareNow Urgent Care',
        number: '+1-555-0402',
        category: 'Medical',
      },
      {
        label: 'Hotel Pharmacy',
        number: '+1-555-0403',
        category: 'Medical',
      },
      {
        label: 'Summit Dry Cleaning',
        number: '+1-555-0501',
        category: 'Services',
      },
      {
        label: 'FlowerBouquet Florist',
        number: '+1-555-0502',
        category: 'Services',
      },
      {
        label: 'TechFix Device Repair',
        number: '+1-555-0503',
        category: 'Services',
      },
      {
        label: 'City Tour Guide Co.',
        number: '+1-555-0601',
        category: 'Other',
      },
      {
        label: 'Local Police Non-Emergency',
        number: '+1-555-0911',
        category: 'Other',
      },
    ],
  });
  console.log('Created affiliate contacts');

  // ─── Document Files ───────────────────────────────────────────────────────
  await prisma.documentFile.createMany({
    data: [
      {
        name: 'Hotel Services Guide 2026',
        type: 'PDF',
        size: '2.4 MB',
        description:
          'Comprehensive guide to all hotel services including room service menu, spa treatments, gym hours, and pool policies.',
        uploadDate: new Date('2026-01-15'),
      },
      {
        name: 'Local Attractions & Dining',
        type: 'PDF',
        size: '1.8 MB',
        description:
          'Curated guide to local restaurants, tourist attractions, shopping centers, and entertainment venues within 5 miles.',
        uploadDate: new Date('2026-02-01'),
      },
      {
        name: 'Hotel Policies & Procedures',
        type: 'DOCX',
        size: '890 KB',
        description:
          'Guest policies covering check-in/out times, pet policy, smoking policy, cancellation terms, and liability waivers.',
        uploadDate: new Date('2026-01-01'),
      },
      {
        name: 'Emergency Procedures',
        type: 'PDF',
        size: '450 KB',
        description:
          'Emergency evacuation routes, fire safety procedures, medical emergency protocols, and emergency contact numbers.',
        uploadDate: new Date('2026-01-01'),
      },
      {
        name: 'Conference & Events Packages',
        type: 'PDF',
        size: '3.1 MB',
        description:
          'Meeting room capacities, AV equipment availability, catering menus, and event planning packages for corporate clients.',
        uploadDate: new Date('2026-02-15'),
      },
    ],
  });
  console.log('Created document files');

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n✓ Database seeded successfully!\n');
  console.log('Default login credentials:');
  console.log('  Admin:     admin@hotel.com     / admin123');
  console.log('  Staff:     frontdesk@hotel.com / staff123');
  console.log('\nVoid reference (not used but declared to avoid unused warnings):');
  console.log(`  adminUser.id: ${adminUser.id}`);
  console.log(`  staffUser.id: ${staffUser.id}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
