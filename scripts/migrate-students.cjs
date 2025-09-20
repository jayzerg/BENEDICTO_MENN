// Migration script to move students from User collection to Student collection
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/benedicto-exam-portal';

// Student schema (copy of the model)
const studentSchema = new mongoose.Schema({
  studentId: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^2025-\d{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid student ID format! Expected format: 2025-XXXXXX`
    }
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9._%+-]+@student\.edu$/.test(v);
      },
      message: props => `${props.value} is not a valid student email!`
    }
  },
  password: { type: String, required: true },
  enrolledSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  profilePicture: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// User schema (copy of the model)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  facultyId: { type: String, required: function() { return this.role === 'teacher'; } },
  firstName: { type: String, required: function() { return this.role === 'teacher'; } },
  lastName: { type: String, required: function() { return this.role === 'teacher'; } },
  profilePicture: { type: String }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

async function migrateStudents() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to database');

    // Find all users with role 'student'
    const users = await User.find({ role: 'student' });
    console.log(`Found ${users.length} students to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      try {
        // Check if student already exists in Student collection
        const existingStudent = await Student.findOne({ 
          $or: [
            { studentId: user.facultyId },
            { email: user.email }
          ]
        });

        if (existingStudent) {
          console.log(`Student ${user.email} already exists in Student collection, skipping...`);
          skippedCount++;
          continue;
        }

        // Extract first and last name from the user's name
        let firstName = user.firstName || '';
        let lastName = user.lastName || '';
        
        if (!firstName && !lastName) {
          const nameParts = user.name.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }

        // Create new student record
        const student = new Student({
          studentId: user.facultyId,
          firstName: firstName,
          lastName: lastName,
          email: user.email,
          password: user.password,
          profilePicture: user.profilePicture,
          enrolledSubjects: [] // Initialize with empty array
        });

        // Save the student
        await student.save();
        console.log(`Migrated student: ${user.email} -> ${student.email}`);
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating student ${user.email}:`, error.message);
      }
    }

    console.log(`Migration complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateStudents().then(() => {
  console.log('Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});