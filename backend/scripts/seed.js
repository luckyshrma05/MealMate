import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo ingredients and dishes...');

  // 1. Ingredients with Prices
  const rice = await prisma.ingredient.upsert({
    where: { name: 'Basmati Rice' },
    update: {},
    create: { name: 'Basmati Rice', unit: 'Kg', price: { create: { pricePerUnit: 120 } } }
  });
  
  const paneer = await prisma.ingredient.upsert({
    where: { name: 'Paneer' },
    update: {},
    create: { name: 'Paneer', unit: 'Kg', price: { create: { pricePerUnit: 350 } } }
  });

  const oil = await prisma.ingredient.upsert({
    where: { name: 'Cooking Oil' },
    update: {},
    create: { name: 'Cooking Oil', unit: 'Litre', price: { create: { pricePerUnit: 150 } } }
  });

  const tomato = await prisma.ingredient.upsert({
    where: { name: 'Tomato' },
    update: {},
    create: { name: 'Tomato', unit: 'Kg', price: { create: { pricePerUnit: 50 } } }
  });

  const onion = await prisma.ingredient.upsert({
    where: { name: 'Onion' },
    update: {},
    create: { name: 'Onion', unit: 'Kg', price: { create: { pricePerUnit: 40 } } }
  });

  // 2. Dishes with Linked Recipe Ingredients
  await prisma.dish.upsert({
    where: { name: 'Paneer Butter Masala' },
    update: {},
    create: {
      name: 'Paneer Butter Masala',
      category: 'Main Course',
      description: 'Rich and creamy paneer curry',
      recipeServings: 10,
      recipeIngredients: {
        create: [
          { ingredientId: paneer.id, quantity: 1 }, 
          { ingredientId: tomato.id, quantity: 0.5 }, 
          { ingredientId: oil.id, quantity: 0.2 },
          { ingredientId: onion.id, quantity: 0.4 },
        ]
      }
    }
  });

  await prisma.dish.upsert({
    where: { name: 'Jeera Rice' },
    update: {},
    create: {
      name: 'Jeera Rice',
      category: 'Main Course',
      description: 'Cumin flavored basmati rice',
      recipeServings: 10,
      recipeIngredients: {
        create: [
          { ingredientId: rice.id, quantity: 1 },
          { ingredientId: oil.id, quantity: 0.1 },
        ]
      }
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });