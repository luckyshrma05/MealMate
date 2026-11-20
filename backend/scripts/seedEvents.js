import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Optional: pass your existing login email as an argument, e.g.:
  // node scripts/seedEvents.js lucky@example.com
  const targetEmail = (process.argv[2] || 'demo@mealmate.com').trim().toLowerCase();

  let user = await prisma.user.findUnique({ where: { email: targetEmail } });

  if (!user) {
    const hashedPassword = await bcrypt.hash('DemoPass123', 12);
    user = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: targetEmail,
        password: hashedPassword,
        role: 'USER',
      },
    });
    console.log(`Created demo user: ${targetEmail} / DemoPass123`);
  } else {
    console.log(`Attaching dummy events to existing user: ${user.email}`);
  }

  // Fetch active seeded dishes so we can pre-fill menus
  const dishes = await prisma.dish.findMany({ where: { isActive: true } });
  const dishByName = Object.fromEntries(dishes.map((d) => [d.name, d.id]));

  const dummyEvents = [
    {
      name: 'Sharma Wedding Reception',
      eventDate: new Date('2026-12-18'),
      guestCount: 250,
      eventType: 'Wedding',
      bufferPercent: 15,
      menu: [
        { name: 'Paneer Tikka', plannedServings: 250 },
        { name: 'Paneer Butter Masala', plannedServings: 250 },
        { name: 'Dal Makhani', plannedServings: 250 },
        { name: 'Butter Naan', plannedServings: 300 },
        { name: 'Veg Dum Biryani', plannedServings: 200 },
        { name: 'Gulab Jamun', plannedServings: 250 },
      ],
    },
    {
      name: 'TechCorp Annual Summit',
      eventDate: new Date('2026-12-05'),
      guestCount: 120,
      eventType: 'Corporate',
      bufferPercent: 10,
      menu: [
        { name: 'Veg Manchurian', plannedServings: 120 },
        { name: 'Mix Veg Kadhai', plannedServings: 120 },
        { name: 'Jeera Rice', plannedServings: 120 },
        { name: 'Tandoori Roti', plannedServings: 150 },
        { name: 'Mango Lassi', plannedServings: 120 },
      ],
    },
    {
      name: 'Aarav 25th Birthday Bash',
      eventDate: new Date('2026-12-28'),
      guestCount: 60,
      eventType: 'Party',
      bufferPercent: 10,
      menu: [
        { name: 'Chicken Tikka', plannedServings: 60 },
        { name: 'Butter Chicken', plannedServings: 60 },
        { name: 'Butter Naan', plannedServings: 80 },
        { name: 'Gulab Jamun', plannedServings: 60 },
      ],
    },
    {
      name: 'Silver Jubilee Anniversary',
      eventDate: new Date('2027-01-14'),
      guestCount: 90,
      eventType: 'Anniversary',
      bufferPercent: 12,
      menu: [
        { name: 'Paneer Tikka', plannedServings: 90 },
        { name: 'Dal Makhani', plannedServings: 90 },
        { name: 'Veg Dum Biryani', plannedServings: 90 },
        { name: 'Mango Lassi', plannedServings: 90 },
      ],
    },
  ];

  for (const ev of dummyEvents) {
    // Skip if already seeded for this user
    const existing = await prisma.event.findFirst({
      where: { name: ev.name, userId: user.id },
    });
    if (existing) {
      console.log(`Skipping existing event: ${ev.name}`);
      continue;
    }

    const menuItems = ev.menu
      .filter((item) => dishByName[item.name])
      .map((item) => ({
        dishId: dishByName[item.name],
        plannedServings: item.plannedServings,
      }));

    await prisma.event.create({
      data: {
        name: ev.name,
        eventDate: ev.eventDate,
        guestCount: ev.guestCount,
        eventType: ev.eventType,
        bufferPercent: ev.bufferPercent,
        userId: user.id,
        ...(menuItems.length > 0 && {
          eventDishes: { create: menuItems },
        }),
      },
    });
    console.log(`Created event: ${ev.name} (${menuItems.length} dishes linked)`);
  }

  console.log('Event seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });