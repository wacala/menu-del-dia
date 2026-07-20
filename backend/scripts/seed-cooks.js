/* eslint-disable */
/**
 * Seeds 10 cooks with simulated menus for testing.
 * Usage: NODE_ENV=production DATABASE_URL=... node scripts/seed-cooks.js
 */
const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

const PASSWORD = 'test123456';
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 10);

const cooks = [
  { firstName: 'María', lastName: 'García', username: 'maria_cocina', email: 'maria@test.com', cuisine: 'mexicana' },
  { firstName: 'José', lastName: 'López', username: 'jose_guiso', email: 'jose@test.com', cuisine: 'casera' },
  { firstName: 'Ana', lastName: 'Martínez', username: 'ana_sabor', email: 'ana@test.com', cuisine: 'italiana' },
  { firstName: 'Carlos', lastName: 'Ramírez', username: 'carlos_fuego', email: 'carlos@test.com', cuisine: 'parrilla' },
  { firstName: 'Sofía', lastName: 'Hernández', username: 'sofia_dulce', email: 'sofia@test.com', cuisine: 'repostería' },
  { firstName: 'Luis', lastName: 'Torres', username: 'luis_mar', email: 'luis@test.com', cuisine: 'mariscos' },
  { firstName: 'Elena', lastName: 'Díaz', username: 'elena_verde', email: 'elena@test.com', cuisine: 'vegana' },
  { firstName: 'Pedro', lastName: 'Sánchez', username: 'pedro_olla', email: 'pedro@test.com', cuisine: 'casera' },
  { firstName: 'Rosa', lastName: 'Flores', username: 'rosa_trad', email: 'rosa@test.com', cuisine: 'mexicana' },
  { firstName: 'Diego', lastName: 'Morales', username: 'diego_wok', email: 'diego@test.com', cuisine: 'asiática' },
];

const menuTemplates = [
  { title: 'Comida corrida', description: 'Menú completo con sopa, guisado y postre', items: [
    { name: 'Sopa de verduras', price: 45, qty: 15 },
    { name: 'Guisado de res', price: 65, qty: 10 },
    { name: 'Arroz con leche', price: 30, qty: 20 },
  ]},
  { title: 'Platillos de la casa', description: 'Especialidades de la cocina tradicional', items: [
    { name: 'Enchiladas verdes', price: 55, qty: 12 },
    { name: 'Chiles rellenos', price: 60, qty: 8 },
    { name: 'Frijoles charros', price: 35, qty: 20 },
  ]},
  { title: 'Comida saludable', description: 'Opciones ligeras y nutritivas', items: [
    { name: 'Ensalada de quinoa', price: 50, qty: 10 },
    { name: 'Pechuga asada', price: 70, qty: 8 },
    { name: 'Smoothie verde', price: 35, qty: 15 },
  ]},
];

const getDate = (daysFromNow) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

async function seed() {
  try {
    console.log('🌱 Seeding 10 cooks with menus...\n');

    for (const cook of cooks) {
      // Create user
      const userResult = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, username, role, email_verified)
         VALUES ($1, $2, $3, $4, $5, 'cook', TRUE)
         ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
         RETURNING id`,
        [cook.email, PASSWORD_HASH, cook.firstName, cook.lastName, cook.username],
      );
      const userId = userResult.rows[0].id;

      // Create cook profile
      const profileResult = await db.query(
        `INSERT INTO cook_profiles (user_id, cuisine_type, bio, rating, status)
         VALUES ($1, $2, $3, $4, 'approved')
         ON CONFLICT (user_id) DO UPDATE SET cuisine_type = EXCLUDED.cuisine_type
         RETURNING id`,
        [userId, cook.cuisine, `${cook.firstName} cocina desde hace 10 años. Especialista en cocina ${cook.cuisine}.`, (3 + Math.random() * 2).toFixed(1)],
      );
      const cookProfileId = profileResult.rows[0].id;

      // Create 3 menus across the week
      for (let menuIdx = 0; menuIdx < 3; menuIdx++) {
        const template = menuTemplates[menuIdx % menuTemplates.length];
        const menuDate = getDate(menuIdx);

        const menuResult = await db.query(
          `INSERT INTO menus
             (cook_id, title, description, menu_date, order_start_time, order_end_time,
              pickup_available, delivery_available, pickup_location, status)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8, 'published')
           RETURNING id`,
          [cookProfileId,
           `${template.title} - ${cook.firstName}`,
           template.description,
           menuDate,
           `${menuDate}T08:00:00.000Z`,
           `${menuDate}T20:00:00.000Z`,
           menuIdx % 2 === 0,
           `${cook.firstName}'s Cocina, Col. Centro #123`,
        ]);
        const menuId = menuResult.rows[0].id;

        // Add items
        for (const item of template.items) {
          await db.query(
            `INSERT INTO menu_items (menu_id, name, description, price, quantity_available, dietary_tags)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [menuId,
             `${item.name}`,
             `${item.name} preparado por ${cook.firstName}`,
             item.price,
             item.qty,
             ['vegana', 'saludable'].includes(cook.cuisine) ? 'vegano, sin gluten' : item.name.includes('Ensalada') ? 'vegano' : '',
            ],
          );
        }
        console.log(`  ✅ ${cook.firstName} - Menú #${menuIdx + 1}: "${template.title}" (${menuDate})`);
      }
      console.log(`  ✅ Cocinero creado: ${cook.firstName} ${cook.lastName} (@${cook.username}) — ${cook.cuisine}\n`);
    }

    console.log('🎉 Seed complete!');
    console.log(`   ${cooks.length} cooks created`);
    console.log(`   Password for all: ${PASSWORD}`);
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    await db.pool.end();
    process.exit(1);
  }
}

seed();
