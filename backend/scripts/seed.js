import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo ingredients and dishes...');

  const ingredientsData = [
    { name: 'Basmati Rice', unit: 'Kg', pricePerUnit: 120 },
    { name: 'Paneer', unit: 'Kg', pricePerUnit: 350 },
    { name: 'Cooking Oil', unit: 'Litre', pricePerUnit: 150 },
    { name: 'Tomato', unit: 'Kg', pricePerUnit: 50 },
    { name: 'Onion', unit: 'Kg', pricePerUnit: 40 },
    { name: 'Butter', unit: 'Kg', pricePerUnit: 520 },
    { name: 'Fresh Cream', unit: 'Litre', pricePerUnit: 240 },
    { name: 'Whole Wheat Flour', unit: 'Kg', pricePerUnit: 45 },
    { name: 'All-Purpose Flour', unit: 'Kg', pricePerUnit: 50 },
    { name: 'Black Lentils (Dal)', unit: 'Kg', pricePerUnit: 160 },
    { name: 'Mixed Vegetables', unit: 'Kg', pricePerUnit: 90 },
    { name: 'Chicken', unit: 'Kg', pricePerUnit: 260 },
    { name: 'Yogurt (Curd)', unit: 'Kg', pricePerUnit: 80 },
    { name: 'Milk', unit: 'Litre', pricePerUnit: 65 },
    { name: 'Sugar', unit: 'Kg', pricePerUnit: 48 },
    { name: 'Khoya (Mawa)', unit: 'Kg', pricePerUnit: 420 },
    { name: 'Mango Pulp', unit: 'Litre', pricePerUnit: 180 },
    { name: 'Spice Mix', unit: 'Kg', pricePerUnit: 600 },
  ];

  const ing = {};
  for (const item of ingredientsData) {
    ing[item.name] = await prisma.ingredient.upsert({
      where: { name: item.name },
      update: {},
      create: {
        name: item.name,
        unit: item.unit,
        price: { create: { pricePerUnit: item.pricePerUnit } },
      },
    });
  }

  
  const dishesData = [
    
    {
      name: 'Paneer Tikka',
      category: 'Starter',
      description: 'Char-grilled spiced paneer cubes marinated in yogurt',
      recipeServings: 10,
      ingredients: [
        { name: 'Paneer', quantity: 1.2 },
        { name: 'Yogurt (Curd)', quantity: 0.4 },
        { name: 'Cooking Oil', quantity: 0.15 },
        { name: 'Spice Mix', quantity: 0.08 },
      ],
    },
    {
      name: 'Veg Manchurian',
      category: 'Starter',
      description: 'Crispy vegetable dumplings tossed in savory sauce',
      recipeServings: 10,
      ingredients: [
        { name: 'Mixed Vegetables', quantity: 1.2 },
        { name: 'All-Purpose Flour', quantity: 0.3 },
        { name: 'Onion', quantity: 0.3 },
        { name: 'Cooking Oil', quantity: 0.4 },
      ],
    },
    {
      name: 'Chicken Tikka',
      category: 'Starter',
      description: 'Tandoori spiced boneless chicken skewers',
      recipeServings: 10,
      ingredients: [
        { name: 'Chicken', quantity: 1.4 },
        { name: 'Yogurt (Curd)', quantity: 0.4 },
        { name: 'Butter', quantity: 0.15 },
        { name: 'Spice Mix', quantity: 0.1 },
      ],
    },

    
    {
      name: 'Paneer Butter Masala',
      category: 'Main Course',
      description: 'Rich and creamy tomato-based paneer curry',
      recipeServings: 10,
      ingredients: [
        { name: 'Paneer', quantity: 1.0 },
        { name: 'Tomato', quantity: 0.6 },
        { name: 'Onion', quantity: 0.4 },
        { name: 'Butter', quantity: 0.2 },
        { name: 'Fresh Cream', quantity: 0.25 },
        { name: 'Spice Mix', quantity: 0.06 },
      ],
    },
    {
      name: 'Dal Makhani',
      category: 'Main Course',
      description: 'Slow-cooked black lentils finished with butter and cream',
      recipeServings: 10,
      ingredients: [
        { name: 'Black Lentils (Dal)', quantity: 0.8 },
        { name: 'Tomato', quantity: 0.4 },
        { name: 'Butter', quantity: 0.25 },
        { name: 'Fresh Cream', quantity: 0.2 },
        { name: 'Spice Mix', quantity: 0.05 },
      ],
    },
    {
      name: 'Butter Chicken',
      category: 'Main Course',
      description: 'Tender chicken simmered in spiced tomato-butter gravy',
      recipeServings: 10,
      ingredients: [
        { name: 'Chicken', quantity: 1.5 },
        { name: 'Tomato', quantity: 0.7 },
        { name: 'Butter', quantity: 0.25 },
        { name: 'Fresh Cream', quantity: 0.25 },
        { name: 'Spice Mix', quantity: 0.08 },
      ],
    },
    {
      name: 'Mix Veg Kadhai',
      category: 'Main Course',
      description: 'Seasonal vegetables cooked with freshly ground spices',
      recipeServings: 10,
      ingredients: [
        { name: 'Mixed Vegetables', quantity: 1.5 },
        { name: 'Onion', quantity: 0.4 },
        { name: 'Tomato', quantity: 0.4 },
        { name: 'Cooking Oil', quantity: 0.2 },
        { name: 'Spice Mix', quantity: 0.06 },
      ],
    },

    
    {
      name: 'Jeera Rice',
      category: 'Rice & Biryani',
      description: 'Cumin flavored fragrant basmati rice',
      recipeServings: 10,
      ingredients: [
        { name: 'Basmati Rice', quantity: 1.0 },
        { name: 'Cooking Oil', quantity: 0.1 },
        { name: 'Spice Mix', quantity: 0.03 },
      ],
    },
    {
      name: 'Veg Dum Biryani',
      category: 'Rice & Biryani',
      description: 'Layered aromatic basmati rice with spiced vegetables',
      recipeServings: 10,
      ingredients: [
        { name: 'Basmati Rice', quantity: 1.2 },
        { name: 'Mixed Vegetables', quantity: 1.0 },
        { name: 'Onion', quantity: 0.5 },
        { name: 'Yogurt (Curd)', quantity: 0.3 },
        { name: 'Cooking Oil', quantity: 0.2 },
        { name: 'Spice Mix', quantity: 0.08 },
      ],
    },

    
    {
      name: 'Butter Naan',
      category: 'Bread',
      description: 'Soft tandoori flatbread brushed with melted butter',
      recipeServings: 10,
      ingredients: [
        { name: 'All-Purpose Flour', quantity: 1.0 },
        { name: 'Yogurt (Curd)', quantity: 0.2 },
        { name: 'Milk', quantity: 0.2 },
        { name: 'Butter', quantity: 0.15 },
      ],
    },
    {
      name: 'Tandoori Roti',
      category: 'Bread',
      description: 'Crisp whole wheat flatbread baked in clay oven',
      recipeServings: 10,
      ingredients: [
        { name: 'Whole Wheat Flour', quantity: 1.0 },
        { name: 'Butter', quantity: 0.08 },
      ],
    },

    
    {
      name: 'Gulab Jamun',
      category: 'Dessert',
      description: 'Warm khoya dumplings soaked in rose-flavored sugar syrup',
      recipeServings: 10,
      ingredients: [
        { name: 'Khoya (Mawa)', quantity: 0.6 },
        { name: 'All-Purpose Flour', quantity: 0.15 },
        { name: 'Sugar', quantity: 0.6 },
        { name: 'Cooking Oil', quantity: 0.3 },
      ],
    },
    {
      name: 'Mango Lassi',
      category: 'Beverage',
      description: 'Chilled sweet yogurt smoothie blended with ripe mango pulp',
      recipeServings: 10,
      ingredients: [
        { name: 'Yogurt (Curd)', quantity: 1.2 },
        { name: 'Mango Pulp', quantity: 0.8 },
        { name: 'Milk', quantity: 0.4 },
        { name: 'Sugar', quantity: 0.25 },
      ],
    },
  ];

  for (const dish of dishesData) {
    await prisma.dish.upsert({
      where: { name: dish.name },
      update: {},
      create: {
        name: dish.name,
        category: dish.category,
        description: dish.description,
        recipeServings: dish.recipeServings,
        recipeIngredients: {
          create: dish.ingredients.map((item) => ({
            ingredientId: ing[item.name].id,
            quantity: item.quantity,
          })),
        },
      },
    });
  }

  console.log(`Seeding completed: ${ingredientsData.length} ingredients and ${dishesData.length} dishes ready!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });