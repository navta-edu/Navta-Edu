const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load Models
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Reward = require('../models/Reward');
const Achievement = require('../models/Achievement');
const Streak = require('../models/Streak');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/navta');
    console.log('Connected to database for seeding...');

    // Clear existing collections
    await User.deleteMany();
    await Student.deleteMany();
    await Teacher.deleteMany();
    await Subject.deleteMany();
    await Chapter.deleteMany();
    await Note.deleteMany();
    await PYQ.deleteMany();
    await Question.deleteMany();
    await Test.deleteMany();
    await Reward.deleteMany();
    await Achievement.deleteMany();
    await Streak.deleteMany();

    console.log('Database cleared.');

    // 1. Create Default Users
    console.log('Creating users...');
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@navta.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });

    const teacherUser = await User.create({
      name: 'Dr. Sarah Smith',
      email: 'teacher@navta.com',
      password: 'password123',
      role: 'teacher',
      isVerified: true
    });

    const studentUser = await User.create({
      name: 'John Doe',
      email: 'student@navta.com',
      password: 'password123',
      role: 'student',
      isVerified: true
    });

    // Create profiles
    const teacherProfile = await Teacher.create({
      user: teacherUser._id,
      qualification: 'PhD in Astrophysics, Stanford University',
      bio: 'Enthusiastic science educator with over 10 years of teaching experience.',
      subjects: ['Physics', 'Mathematics']
    });

    const studentProfile = await Student.create({
      user: studentUser._id,
      coins: 100,
      xp: 150,
      level: 1,
      stream: 'Science',
      badges: [
        { name: 'Welcome Aboard', icon: 'award' }
      ]
    });

    await Streak.create({
      user: studentUser._id,
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDate: new Date()
    });

    console.log('Users created (Passwords: password123).');

    // 2. Create Subjects
    console.log('Creating subjects...');
    const physics = await Subject.create({
      name: 'Physics',
      code: 'PHY101',
      description: 'Study of matter, energy, space, and time.',
      category: 'Science'
    });

    const chemistry = await Subject.create({
      name: 'Chemistry',
      code: 'CHE101',
      description: 'Study of atoms, elements, molecules, and chemical bonds.',
      category: 'Science'
    });

    const mathematics = await Subject.create({
      name: 'Mathematics',
      code: 'MAT101',
      description: 'Study of numbers, shapes, logic, and algebra.',
      category: 'General'
    });

    // 3. Create Chapters
    console.log('Creating chapters...');
    const physCh1 = await Chapter.create({
      subject: physics._id,
      chapterNumber: 1,
      title: 'Laws of Motion',
      description: "Force, momentum, friction, and Newton's three fundamental laws of motion."
    });

    const physCh2 = await Chapter.create({
      subject: physics._id,
      chapterNumber: 2,
      title: 'Work, Energy and Power',
      description: 'Kinetic and potential energy, work-energy theorem, and conservative forces.'
    });

    const chemCh1 = await Chapter.create({
      subject: chemistry._id,
      chapterNumber: 1,
      title: 'Structure of Atom',
      description: 'Bohr model of atom, quantum mechanical model, and electron configurations.'
    });

    const mathCh1 = await Chapter.create({
      subject: mathematics._id,
      chapterNumber: 1,
      title: 'Calculus & Derivatives',
      description: 'Introduction to limits, continuity, rate of change, and basic differentiation.'
    });

    // 4. Create Notes
    console.log('Creating notes...');
    await Note.create({
      chapter: physCh1._id,
      title: "Newton's Laws Reference Guide",
      content: `### Newton's Laws of Motion\n\n1. **First Law (Law of Inertia)**: An object remains at rest or in motion unless acted upon by an external net force.\n2. **Second Law (F = ma)**: Acceleration is directly proportional to net force and inversely proportional to mass.\n3. **Third Law (Action-Reaction)**: For every action, there is an equal and opposite reaction.`,
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploadedBy: teacherUser._id
    });

    await Note.create({
      chapter: chemCh1._id,
      title: "Bohr Model Summary sheet",
      content: `### Bohr's Quantum Model of Atoms\n\n* Electrons revolve in stable circular orbits around the nucleus.\n* Energies of these orbits are quantized.\n* Radiation is emitted or absorbed only when electrons jump between energy levels.`,
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploadedBy: teacherUser._id
    });

    // 5. Create PYQs
    console.log('Creating past papers (PYQs)...');
    await PYQ.create({
      subject: physics._id,
      chapter: physCh1._id,
      year: 2024,
      examName: 'CBSE Boards',
      title: 'CBSE Physics Class XII 2024 Question Paper',
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploadedBy: teacherUser._id
    });

    await PYQ.create({
      subject: mathematics._id,
      chapter: mathCh1._id,
      year: 2023,
      examName: 'JEE Mains',
      title: 'JEE Mathematics Calculus 2023 Paper',
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploadedBy: teacherUser._id
    });

    // 6. Create Questions & Tests
    console.log('Creating quiz questions...');
    
    // Physics Questions
    const pq1 = await Question.create({
      subject: physics._id,
      chapter: physCh1._id,
      text: 'Which of the following laws explains why a passenger moves forward when a bus stops suddenly?',
      options: [
        "Newton's First Law of Motion",
        "Newton's Second Law of Motion",
        "Newton's Third Law of Motion",
        "Law of Universal Gravitation"
      ],
      correctOption: 0,
      explanation: 'Inertia keeps the passenger moving forward in their original state of motion when the bus stops.',
      difficulty: 'easy'
    });

    const pq2 = await Question.create({
      subject: physics._id,
      chapter: physCh1._id,
      text: 'What is the SI unit of momentum?',
      options: [
        'kg m/s',
        'kg m/s²',
        'Newton',
        'Joule'
      ],
      correctOption: 0,
      explanation: 'Momentum is mass times velocity, so the unit is kg * m/s.',
      difficulty: 'easy'
    });

    const pq3 = await Question.create({
      subject: physics._id,
      chapter: physCh1._id,
      text: 'A bullet is fired from a rifle. If the rifle recoils, its kinetic energy will be:',
      options: [
        'Equal to that of the bullet',
        'Greater than that of the bullet',
        'Less than that of the bullet',
        'Zero'
      ],
      correctOption: 2,
      explanation: 'Since the rifle has a much larger mass, its velocity is small, hence its kinetic energy (1/2 mv²) is less than that of the bullet.',
      difficulty: 'medium'
    });

    // Create Quiz
    await Test.create({
      title: 'Laws of Motion Quiz',
      description: 'Test your understanding of Newton\'s Laws, momentum, and recoil actions.',
      subject: physics._id,
      chapter: physCh1._id,
      duration: 10,
      type: 'Quiz',
      questions: [pq1._id, pq2._id, pq3._id],
      totalMarks: 30,
      passingScore: 40
    });

    // Maths Questions
    const mq1 = await Question.create({
      subject: mathematics._id,
      chapter: mathCh1._id,
      text: 'What is the derivative of x² + 3x with respect to x?',
      options: [
        'x + 3',
        '2x + 3',
        '2x',
        'x² + 3'
      ],
      correctOption: 1,
      explanation: 'Using power rule, derivative of x² is 2x and 3x is 3. Summing them gives 2x + 3.',
      difficulty: 'easy'
    });

    const mq2 = await Question.create({
      subject: mathematics._id,
      chapter: mathCh1._id,
      text: 'What is the derivative of sin(x)?',
      options: [
        'cos(x)',
        '-cos(x)',
        'sin(x)',
        '-sin(x)'
      ],
      correctOption: 0,
      explanation: 'The standard derivative of sine is cosine.',
      difficulty: 'easy'
    });

    await Test.create({
      title: 'Basic Differentiation Quiz',
      description: 'Test limits, derivatives, power rules, and trigonometric derivatives.',
      subject: mathematics._id,
      chapter: mathCh1._id,
      duration: 5,
      type: 'Quiz',
      questions: [mq1._id, mq2._id],
      totalMarks: 20,
      passingScore: 50
    });

    // 7. Create Rewards Store Items
    console.log('Creating reward store entries...');
    await Reward.create({
      title: 'Navta Premium T-Shirt',
      description: 'Exclusive Navta branded cotton t-shirt delivered to your home.',
      costCoins: 800,
      badgeImage: 'shirt',
      type: 'coupon'
    });

    await Reward.create({
      title: 'Venture Badge Upgrade',
      description: 'Unlock a golden profile badge visible on the global leaderboard.',
      costCoins: 200,
      badgeImage: 'crown',
      type: 'badge'
    });

    await Reward.create({
      title: 'Free 1-on-1 Mentorship Session',
      description: '30-minute personal coding or science consultation with an expert teacher.',
      costCoins: 500,
      badgeImage: 'phone-call',
      type: 'resource'
    });

    await Reward.create({
      title: 'Quiz Champion Badge',
      description: 'A special badge indicating your expertise in assessment modules.',
      costCoins: 150,
      badgeImage: 'star',
      type: 'badge'
    });

    // 8. Create Achievements list
    console.log('Creating milestones (Achievements)...');
    await Achievement.create({
      name: 'First Blood',
      description: 'Complete your first chapter assessment quiz.',
      requirementType: 'test_count',
      requirementValue: 1,
      icon: 'check-circle'
    });

    await Achievement.create({
      name: 'Knowledge Seeker',
      description: 'Amass a total of 500 XP across subject quizzes.',
      requirementType: 'xp',
      requirementValue: 500,
      icon: 'sparkles'
    });

    await Achievement.create({
      name: 'Unstoppable',
      description: 'Maintain an active study streak of 3 consecutive days.',
      requirementType: 'streak',
      requirementValue: 3,
      icon: 'flame'
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
