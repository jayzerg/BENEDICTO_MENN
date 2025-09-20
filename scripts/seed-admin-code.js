const dbConnect = require('../lib/mongodb.js').default;
const AdminCode = require('../models/AdminCode.js').default;

async function seedAdminCode() {
  await dbConnect();
  
  try {
    // Check if admin code already exists
    const existingCode = await AdminCode.findOne({ code: '262366' });
    
    if (!existingCode) {
      await AdminCode.create({
        code: '262366',
        isActive: true
      });
      console.log('Admin code 262366 seeded successfully');
    } else {
      console.log('Admin code already exists');
    }
  } catch (error) {
    console.error('Error seeding admin code:', error);
  }
  
  process.exit(0);
}

seedAdminCode();