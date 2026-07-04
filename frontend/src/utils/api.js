import axios from 'axios';

// Ensure VITE_API_URL properly appends /api if it doesn't already, and fallback to production backend.
const envUrl = import.meta.env.VITE_API_URL;
const API_URL = envUrl 
  ? (envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`) 
  : 'https://navta-9.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// INITIAL MOCK DATABASE SEED FOR OFFLINE / MOCK MODE
const defaultMockDB = {
  users: [
    { id: 'u1', name: 'John Doe', email: 'student@navta.com', password: 'password123', role: 'student', isVerified: true },
    { id: 'u2', name: 'Dr. Sarah Smith', email: 'teacher@navta.com', password: 'password123', role: 'teacher', isVerified: true },
    { id: 'u3', name: 'System Admin', email: 'admin@navta.com', password: 'password123', role: 'admin', isVerified: true }
  ],
  students: {
    'u1': { user: 'u1', coins: 120, xp: 220, level: 1, stream: 'Science', badges: [{ name: 'Welcome Aboard', icon: 'award', earnedAt: new Date().toISOString() }], rewardsRedeemed: [] }
  },
  teachers: {
    'u2': { user: 'u2', qualification: 'PhD in Astrophysics, Stanford', bio: 'Science educator with 10+ years of teaching experience.', subjects: ['Physics', 'Mathematics'] }
  },
  streaks: {
    'u1': { user: 'u1', currentStreak: 3, longestStreak: 5, lastActiveDate: new Date().toISOString() }
  },
  subjects: [
    { _id: 's1', name: 'Physics', code: 'PHY101', description: 'Study of matter, energy, space, and time.', category: 'Science' },
    { _id: 's2', name: 'Chemistry', code: 'CHE101', description: 'Study of atoms, elements, molecules, and chemical bonds.', category: 'Science' },
    { _id: 's3', name: 'Mathematics', code: 'MAT101', description: 'Study of numbers, shapes, logic, and algebra.', category: 'General' }
  ],
  chapters: [
    { _id: 'c1', subject: 's1', chapterNumber: 1, title: 'Laws of Motion', description: "Force, momentum, friction, and Newton's three fundamental laws." },
    { _id: 'c2', subject: 's1', chapterNumber: 2, title: 'Work, Energy & Power', description: 'Kinetic and potential energy, work-energy theorem, and power.' },
    { _id: 'c3', subject: 's2', chapterNumber: 1, title: 'Structure of Atom', description: 'Bohr model of atom, quantum mechanical model, and configuration.' },
    { _id: 'c4', subject: 's3', chapterNumber: 1, title: 'Calculus & Derivatives', description: 'Introduction to limits, rates of change, and basic differentiation.' }
  ],
  notes: [
    { _id: 'n1', chapter: 'c1', title: "Newton's Laws Reference Guide", content: "### Newton's Laws of Motion\n\n1. **First Law**: An object remains at rest or in motion unless acted upon by an external net force.\n2. **Second Law (F = ma)**: Force equals mass times acceleration.\n3. **Third Law**: For every action, there is an equal and opposite reaction.", pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', uploadedBy: { name: 'Dr. Sarah Smith' } },
    { _id: 'n2', chapter: 'c3', title: "Bohr Model Summary sheet", content: "### Bohr's Quantum Model of Atoms\n\n* Electrons revolve in stable circular orbits around the nucleus.\n* Energies of these orbits are quantized.\n* Radiation is emitted or absorbed only when electrons jump between energy levels.", pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', uploadedBy: { name: 'Dr. Sarah Smith' } }
  ],
  pyqs: [
    { _id: 'p1', subject: 's1', chapter: { _id: 'c1', title: 'Laws of Motion' }, year: 2024, examName: 'CBSE Boards', title: 'CBSE Physics Class XII 2024 Question Paper', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { _id: 'p2', subject: 's3', chapter: { _id: 'c4', title: 'Calculus & Derivatives' }, year: 2023, examName: 'JEE Mains', title: 'JEE Mathematics Calculus 2023 Paper', pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
  ],
  questions: [
    { _id: 'q1', subject: 's1', chapter: 'c1', text: 'Which of the following laws explains why a passenger moves forward when a bus stops suddenly?', options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Gravitation"], correctOption: 0, explanation: 'Inertia keeps the passenger moving forward when the bus stops.', difficulty: 'easy' },
    { _id: 'q2', subject: 's1', chapter: 'c1', text: 'What is the SI unit of momentum?', options: ['kg m/s', 'kg m/s²', 'Newton', 'Joule'], correctOption: 0, explanation: 'Momentum is mass times velocity (kg * m/s).', difficulty: 'easy' },
    { _id: 'q3', subject: 's1', chapter: 'c1', text: 'A bullet is fired from a rifle. If the rifle recoils, its kinetic energy will be:', options: ['Equal to bullet', 'Greater than bullet', 'Less than bullet', 'Zero'], correctOption: 2, explanation: 'The rifle has a much larger mass, so its velocity is smaller, leading to less kinetic energy.', difficulty: 'medium' },
    { _id: 'q4', subject: 's3', chapter: 'c4', text: 'What is the derivative of x² + 3x with respect to x?', options: ['x + 3', '2x + 3', '2x', 'x² + 3'], correctOption: 1, explanation: 'Using the power rule, d/dx(x²) = 2x and d/dx(3x) = 3.', difficulty: 'easy' },
    { _id: 'q5', subject: 's3', chapter: 'c4', text: 'What is the derivative of sin(x)?', options: ['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'], correctOption: 0, explanation: 'The derivative of sine is cosine.', difficulty: 'easy' }
  ],
  tests: [
    { _id: 't1', title: 'Laws of Motion Quiz', description: 'Test your understanding of Newton\'s Laws, momentum, and recoil actions.', subject: 's1', chapter: { _id: 'c1', title: 'Laws of Motion' }, duration: 10, type: 'Quiz', questions: ['q1', 'q2', 'q3'], totalMarks: 30, passingScore: 40 },
    { _id: 't2', title: 'Basic Differentiation Quiz', description: 'Test limits, derivatives, power rules, and trigonometric derivatives.', subject: 's3', chapter: { _id: 'c4', title: 'Calculus & Derivatives' }, duration: 5, type: 'Quiz', questions: ['q4', 'q5'], totalMarks: 20, passingScore: 50 }
  ],
  results: [
    { _id: 'r1', user: 'u1', test: { _id: 't1', title: 'Laws of Motion Quiz', type: 'Quiz', duration: 10, subject: { name: 'Physics' } }, score: 2, percentage: 67, timeTaken: 120, correctAnswers: 2, totalQuestions: 3, isPassed: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
  ],
  rewards: [
    { _id: 'rew1', title: 'Navta Premium T-Shirt', description: 'Exclusive Navta branded cotton t-shirt delivered to your home.', costCoins: 800, badgeImage: 'shirt', type: 'coupon' },
    { _id: 'rew2', title: 'Venture Badge Upgrade', description: 'Unlock a golden profile badge visible on the global leaderboard.', costCoins: 200, badgeImage: 'crown', type: 'badge' },
    { _id: 'rew3', title: 'Free 1-on-1 Mentorship Session', description: '30-minute personal consultation with an expert teacher.', costCoins: 500, badgeImage: 'phone-call', type: 'resource' },
    { _id: 'rew4', title: 'Quiz Champion Badge', description: 'A special badge indicating your expertise in assessment modules.', costCoins: 150, badgeImage: 'star', type: 'badge' }
  ],
  achievements: [
    { _id: 'ach1', name: 'First Blood', description: 'Complete your first chapter assessment quiz.', requirementType: 'test_count', requirementValue: 1, icon: 'check-circle' },
    { _id: 'ach2', name: 'Knowledge Seeker', description: 'Amass a total of 500 XP across subject quizzes.', requirementType: 'xp', requirementValue: 500, icon: 'sparkles' },
    { _id: 'ach3', name: 'Unstoppable', description: 'Maintain an active study streak of 3 consecutive days.', requirementType: 'streak', requirementValue: 3, icon: 'flame' }
  ]
};

// Ensure localStorage is seeded
if (!localStorage.getItem('navta_db')) {
  localStorage.setItem('navta_db', JSON.stringify(defaultMockDB));
}

// Read mock database helper
const getMockDB = () => JSON.parse(localStorage.getItem('navta_db'));
const saveMockDB = (db) => localStorage.setItem('navta_db', JSON.stringify(db));

// SIMULATED MOCK API ROUTER
const mockAPI = {
  // Authentication Routes
  auth: {
    register: async (data) => {
      const db = getMockDB();
      const userExists = db.users.find(u => u.email === data.email);
      if (userExists) throw new Error('User already exists');

      const newUser = {
        id: 'u_' + Date.now(),
        name: data.name,
        email: data.email,
        password: data.password || 'password123',
        role: data.role || 'student',
        isVerified: false
      };

      db.users.push(newUser);

      if (newUser.role === 'student') {
        db.students[newUser.id] = {
          user: newUser.id,
          coins: 100,
          xp: 150,
          level: 1,
          stream: data.stream || 'General',
          badges: [{ name: 'Welcome Aboard', icon: 'award', earnedAt: new Date().toISOString() }],
          rewardsRedeemed: []
        };
        db.streaks[newUser.id] = {
          user: newUser.id,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date().toISOString()
        };
      } else if (newUser.role === 'teacher') {
        db.teachers[newUser.id] = {
          user: newUser.id,
          qualification: data.qualification || 'Qualified Educator',
          bio: data.bio || '',
          subjects: []
        };
      }

      saveMockDB(db);
      return {
        success: true,
        token: 'mock_jwt_token_' + newUser.id,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, isVerified: newUser.isVerified }
      };
    },

    login: async (data) => {
      const db = getMockDB();
      const user = db.users.find(u => u.email === data.email && u.password === data.password);
      if (!user) throw new Error('Invalid credentials');

      // Update streaks
      if (user.role === 'student' && db.streaks[user.id]) {
        const streak = db.streaks[user.id];
        const today = new Date();
        const lastActive = new Date(streak.lastActiveDate);
        const diffTime = Math.abs(today - lastActive);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          streak.currentStreak += 1;
          if (streak.currentStreak > streak.longestStreak) {
            streak.longestStreak = streak.currentStreak;
          }
          streak.lastActiveDate = today.toISOString();
        } else if (diffDays > 1) {
          streak.currentStreak = 1;
          streak.lastActiveDate = today.toISOString();
        }
        db.streaks[user.id] = streak;
        saveMockDB(db);
      }

      return {
        success: true,
        token: 'mock_jwt_token_' + user.id,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified }
      };
    },

    me: async () => {
      const token = localStorage.getItem('token');
      if (!token || !token.startsWith('mock_jwt_token_')) throw new Error('Not authorized');
      const userId = token.replace('mock_jwt_token_', '');
      
      const db = getMockDB();
      const user = db.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      let profile = null;
      let streak = null;

      if (user.role === 'student') {
        profile = db.students[userId] || null;
        streak = db.streaks[userId] || null;
      } else if (user.role === 'teacher') {
        profile = db.teachers[userId] || null;
      }

      return {
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
        profile,
        streak
      };
    },

    verifyEmail: async () => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();
      const user = db.users.find(u => u.id === userId);
      if (user) {
        user.isVerified = true;
        saveMockDB(db);
      }
      return { success: true, message: 'Email verified' };
    },

    forgotPassword: async () => {
      return { success: true, message: 'Reset link sent' };
    },

    googleLogin: async (credential) => {
      // In mock mode, simulate a Google user
      const db = getMockDB();
      const mockGoogleEmail = 'google.user@gmail.com';
      const mockGoogleName = 'Google User';

      let user = db.users.find(u => u.email === mockGoogleEmail);

      if (!user) {
        user = {
          id: 'u_google_' + Date.now(),
          name: mockGoogleName,
          email: mockGoogleEmail,
          password: null,
          role: 'student',
          isVerified: true,
          googleId: 'mock_google_id'
        };
        db.users.push(user);
        db.students[user.id] = {
          user: user.id,
          coins: 100,
          xp: 150,
          level: 1,
          stream: 'General',
          badges: [{ name: 'Welcome Aboard', icon: 'award', earnedAt: new Date().toISOString() }],
          rewardsRedeemed: []
        };
        db.streaks[user.id] = {
          user: user.id,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date().toISOString()
        };
        saveMockDB(db);
      }

      return {
        success: true,
        token: 'mock_jwt_token_' + user.id,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified }
      };
    }
  },

  // Content Browse Routes
  content: {
    getSubjects: async () => {
      const db = getMockDB();
      return { success: true, data: db.subjects };
    },
    getChapters: async (subjectId) => {
      const db = getMockDB();
      const chapters = db.chapters.filter(c => c.subject === subjectId);
      return { success: true, data: chapters };
    },
    getNotes: async (chapterId) => {
      const db = getMockDB();
      const notes = db.notes.filter(n => n.chapter === chapterId);
      return { success: true, data: notes };
    },
    getPYQs: async (subjectId) => {
      const db = getMockDB();
      const pyqs = db.pyqs.filter(p => p.subject === subjectId);
      return { success: true, data: pyqs };
    },
    getTests: async (subjectId, chapterId = null) => {
      const db = getMockDB();
      let tests = db.tests.filter(t => t.subject === subjectId);
      if (chapterId) {
        tests = tests.filter(t => t.chapter && t.chapter._id === chapterId);
      }
      return { success: true, data: tests };
    },
    getTestDetail: async (testId) => {
      const db = getMockDB();
      const test = db.tests.find(t => t._id === testId);
      if (!test) throw new Error('Test not found');
      // Populate full questions
      const questionsList = test.questions.map(qid => db.questions.find(q => q._id === qid));
      return {
        success: true,
        data: { ...test, questions: questionsList }
      };
    }
  },

  // Student Routes
  student: {
    submitTest: async (testId, data) => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();

      const test = db.tests.find(t => t._id === testId);
      if (!test) throw new Error('Test not found');

      let correctCount = 0;
      const gradedAnswers = test.questions.map((qid) => {
        const q = db.questions.find(ques => ques._id === qid);
        const submitted = data.answers.find(a => a.questionId === qid);
        const selectedOption = submitted ? submitted.selectedOption : null;
        const isCorrect = selectedOption !== null && selectedOption === q.correctOption;

        if (isCorrect) correctCount++;

        return {
          question: qid,
          selectedOption,
          isCorrect
        };
      });

      const totalQuestions = test.questions.length;
      const percentage = Math.round((correctCount / totalQuestions) * 100);
      const isPassed = percentage >= test.passingScore;

      const newResult = {
        _id: 'res_' + Date.now(),
        user: userId,
        test: {
          _id: test._id,
          title: test.title,
          type: test.type,
          duration: test.duration,
          subject: db.subjects.find(s => s._id === test.subject)
        },
        answers: gradedAnswers,
        score: correctCount,
        percentage,
        timeTaken: data.timeTaken || 30,
        correctAnswers: correctCount,
        totalQuestions,
        isPassed,
        createdAt: new Date().toISOString()
      };

      db.results.push(newResult);

      // Reward calculations
      const student = db.students[userId];
      let xpEarned = correctCount * 15;
      let coinsEarned = correctCount * 5;

      if (isPassed) {
        xpEarned += 50;
        coinsEarned += 20;
      }

      if (student) {
        student.xp += xpEarned;
        student.coins += coinsEarned;
        student.level = Math.floor(student.xp / 500) + 1;

        // Check for achievements
        const resultsCount = db.results.filter(r => r.user === userId).length;
        const currentStreak = db.streaks[userId] ? db.streaks[userId].currentStreak : 0;
        const currentBadges = student.badges.map(b => b.name);

        db.achievements.forEach(ach => {
          if (!currentBadges.includes(ach.name)) {
            let meets = false;
            if (ach.requirementType === 'xp' && student.xp >= ach.requirementValue) meets = true;
            if (ach.requirementType === 'streak' && currentStreak >= ach.requirementValue) meets = true;
            if (ach.requirementType === 'test_count' && resultsCount >= ach.requirementValue) meets = true;

            if (meets) {
              student.badges.push({ name: ach.name, icon: ach.icon, earnedAt: new Date().toISOString() });
              student.xp += 100;
              student.coins += 50;
            }
          }
        });

        db.students[userId] = student;
      }

      saveMockDB(db);

      return {
        success: true,
        data: {
          result: newResult,
          xpEarned,
          coinsEarned,
          newCoins: student ? student.coins : 0,
          newXp: student ? student.xp : 0,
          newLevel: student ? student.level : 1
        }
      };
    },

    getResults: async () => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();
      const results = db.results.filter(r => r.user === userId);
      return { success: true, data: results };
    },

    getResultDetail: async (resultId) => {
      const db = getMockDB();
      const res = db.results.find(r => r._id === resultId);
      if (!res) throw new Error('Result not found');
      // Hydrate test detail
      const test = db.tests.find(t => t._id === res.test._id);
      const questionsList = test.questions.map(qid => db.questions.find(q => q._id === qid));
      
      return {
        success: true,
        data: {
          ...res,
          test: {
            ...test,
            subject: db.subjects.find(s => s._id === test.subject),
            questions: questionsList
          }
        }
      };
    },

    getAnalytics: async () => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();

      const userResults = db.results.filter(r => r.user === userId);

      const subjectStats = {};
      userResults.forEach(r => {
        if (!r.test || !r.test.subject) return;
        const subName = r.test.subject.name;

        if (!subjectStats[subName]) {
          subjectStats[subName] = { totalQuestions: 0, correctAnswers: 0, testCount: 0, passedCount: 0 };
        }

        subjectStats[subName].testCount += 1;
        subjectStats[subName].totalQuestions += r.totalQuestions;
        subjectStats[subName].correctAnswers += r.correctAnswers;
        if (r.isPassed) subjectStats[subName].passedCount += 1;
      });

      const parsedStats = Object.keys(subjectStats).map(name => {
        const stats = subjectStats[name];
        const avgPercentage = stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0;
        return {
          subject: name,
          avgPercentage,
          testCount: stats.testCount,
          passedCount: stats.passedCount,
          failedCount: stats.testCount - stats.passedCount,
          strength: avgPercentage >= 75 ? 'Strong' : avgPercentage >= 45 ? 'Average' : 'Needs Focus'
        };
      });

      const progression = userResults.map(r => ({
        date: new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: r.percentage
      })).reverse();

      const weakAreas = parsedStats.filter(s => s.strength === 'Needs Focus').map(s => s.subject);
      const strongAreas = parsedStats.filter(s => s.strength === 'Strong').map(s => s.subject);
      const suggestions = [];

      if (weakAreas.length > 0) {
        weakAreas.forEach(a => {
          suggestions.push(`Spend an extra 30 minutes reading chapter notes for ${a}.`);
          suggestions.push(`Attempt 5 more practice quizzes in ${a} to lift score levels.`);
        });
      } else if (parsedStats.length === 0) {
        suggestions.push("Complete your first chapter quiz to generate study suggestions.");
      } else {
        suggestions.push("Excellent work! Try taking Mock Tests under time constraints to improve speed.");
      }

      return {
        success: true,
        subjectStats: parsedStats,
        progression,
        summary: { strong: strongAreas, weak: weakAreas, suggestions }
      };
    },

    getRewards: async () => {
      const db = getMockDB();
      return { success: true, data: db.rewards };
    },

    redeemReward: async (rewardId) => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();

      const reward = db.rewards.find(r => r._id === rewardId);
      if (!reward) throw new Error('Reward not found');

      const student = db.students[userId];
      if (!student) throw new Error('Student profile not found');

      if (student.coins < reward.costCoins) {
        throw new Error(`Insufficient coins. Costs ${reward.costCoins} but you have ${student.coins}.`);
      }

      student.coins -= reward.costCoins;
      student.rewardsRedeemed.push({
        reward: reward._id,
        redeemedAt: new Date().toISOString()
      });

      if (reward.type === 'badge') {
        student.badges.push({
          name: reward.title,
          icon: reward.badgeImage,
          earnedAt: new Date().toISOString()
        });
      }

      db.students[userId] = student;
      saveMockDB(db);

      return {
        success: true,
        message: `Successfully redeemed '${reward.title}'!`,
        coinsRemaining: student.coins,
        badges: student.badges
      };
    },

    getLeaderboard: async () => {
      const db = getMockDB();
      const students = Object.values(db.students);
      students.sort((a, b) => b.xp - a.xp);

      const data = students.map((s, idx) => {
        const u = db.users.find(user => user.id === s.user);
        return {
          rank: idx + 1,
          name: u ? u.name : 'Unknown Student',
          xp: s.xp,
          level: s.level,
          badgesCount: s.badges.length
        };
      });

      return { success: true, data };
    }
  },

  // Teacher Routes
  teacher: {
    createChapter: async (data) => {
      const db = getMockDB();
      const newChapter = {
        _id: 'c_' + Date.now(),
        subject: data.subjectId,
        chapterNumber: Number(data.chapterNumber),
        title: data.title,
        description: data.description
      };
      db.chapters.push(newChapter);
      saveMockDB(db);
      return { success: true, data: newChapter };
    },
    createNote: async (data) => {
      const db = getMockDB();
      const newNote = {
        _id: 'n_' + Date.now(),
        chapter: data.chapterId,
        title: data.title,
        content: data.content,
        pdfUrl: data.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploadedBy: { name: 'You (Instructor)' }
      };
      db.notes.push(newNote);
      saveMockDB(db);
      return { success: true, data: newNote };
    },
    createPYQ: async (data) => {
      const db = getMockDB();
      const newPYQ = {
        _id: 'pyq_' + Date.now(),
        subject: data.subjectId,
        chapter: data.chapterId ? { _id: data.chapterId, title: 'Laws of Motion' } : null,
        year: Number(data.year),
        examName: data.examName,
        title: data.title,
        pdfUrl: data.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      };
      db.pyqs.push(newPYQ);
      saveMockDB(db);
      return { success: true, data: newPYQ };
    },
    createTest: async (data) => {
      const db = getMockDB();
      
      // Create individual questions
      const questionIds = [];
      data.questions.forEach((q) => {
        const newQ = {
          _id: 'q_' + Math.random().toString(36).substr(2, 9),
          subject: data.subjectId,
          chapter: data.chapterId || null,
          text: q.text,
          options: q.options,
          correctOption: Number(q.correctOption),
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium'
        };
        db.questions.push(newQ);
        questionIds.push(newQ._id);
      });

      // Create test
      const newTest = {
        _id: 't_' + Date.now(),
        title: data.title,
        description: data.description,
        subject: data.subjectId,
        chapter: data.chapterId ? { _id: data.chapterId, title: 'Chapter Material' } : null,
        duration: Number(data.duration),
        type: data.type || 'Quiz',
        questions: questionIds,
        totalMarks: data.totalMarks || (questionIds.length * 10),
        passingScore: Number(data.passingScore) || 40
      };

      db.tests.push(newTest);
      saveMockDB(db);

      return { success: true, data: newTest };
    },
    getStudentMetrics: async () => {
      const db = getMockDB();
      const studentProfiles = Object.values(db.students);
      const totalSubmissions = db.results.length;
      const passedCount = db.results.filter(r => r.isPassed).length;
      const passPercentage = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;

      const studentsData = studentProfiles.map(s => {
        const u = db.users.find(user => user.id === s.user);
        return {
          id: s.user,
          name: u ? u.name : 'Unknown',
          email: u ? u.email : 'N/A',
          xp: s.xp,
          level: s.level,
          badgesCount: s.badges.length
        };
      });

      const recentSubmissions = db.results.slice(-10).map(r => {
        const u = db.users.find(user => user.id === r.user);
        return {
          id: r._id,
          studentName: u ? u.name : 'Unknown',
          testTitle: r.test ? r.test.title : 'Deleted Test',
          testType: r.test ? r.test.type : 'N/A',
          percentage: r.percentage,
          isPassed: r.isPassed,
          date: new Date(r.createdAt).toLocaleDateString()
        };
      });

      return {
        success: true,
        data: {
          studentsCount: studentsData.length,
          totalSubmissions,
          passPercentage,
          students: studentsData,
          recentSubmissions
        }
      };
    }
  },

  // Admin Routes
  admin: {
    createUser: async (data) => {
      const db = getMockDB();
      const userExists = db.users.find(u => u.email === data.email);
      if (userExists) throw new Error('User already exists');

      const newUser = {
        id: 'u_' + Date.now(),
        name: data.name,
        email: data.email,
        password: data.password || 'password123',
        role: data.role || 'student',
        isVerified: true
      };
      db.users.push(newUser);

      if (newUser.role === 'student') {
        db.students[newUser.id] = { user: newUser.id, coins: 0, xp: 0, level: 1, badges: [], rewardsRedeemed: [] };
      } else if (newUser.role === 'teacher') {
        db.teachers[newUser.id] = { user: newUser.id, qualification: 'Qualified Educator', bio: '', subjects: [] };
      }
      saveMockDB(db);
      return { success: true, data: newUser };
    },
    getUsers: async () => {
      const db = getMockDB();
      return { success: true, data: db.users };
    },
    updateUser: async (userId, data) => {
      const db = getMockDB();
      const idx = db.users.findIndex(u => u.id === userId);
      if (idx === -1) throw new Error('User not found');
      
      const user = db.users[idx];
      if (data.name) user.name = data.name;
      if (data.isVerified !== undefined) user.isVerified = data.isVerified;

      if (data.role && data.role !== user.role) {
        user.role = data.role;
        if (data.role === 'student' && !db.students[userId]) {
          db.students[userId] = { user: userId, coins: 0, xp: 0, level: 1, badges: [], rewardsRedeemed: [] };
        } else if (data.role === 'teacher' && !db.teachers[userId]) {
          db.teachers[userId] = { user: userId, qualification: 'Qualified Educator', bio: '', subjects: [] };
        }
      }
      db.users[idx] = user;
      saveMockDB(db);
      return { success: true, data: user };
    },
    updateStudentProfile: async (userId, data) => {
      const db = getMockDB();
      if (!db.students[userId]) throw new Error('Student profile not found');
      
      const student = db.students[userId];
      if (data.coins !== undefined) student.coins = data.coins;
      if (data.xp !== undefined) student.xp = data.xp;
      if (data.level !== undefined) student.level = data.level;
      if (data.stream !== undefined) student.stream = data.stream;
      
      db.students[userId] = student;
      saveMockDB(db);
      return { success: true, data: student };
    },
    deleteUser: async (userId) => {
      const db = getMockDB();
      db.users = db.users.filter(u => u.id !== userId);
      delete db.students[userId];
      delete db.teachers[userId];
      saveMockDB(db);
      return { success: true, message: 'User deleted' };
    },
    createSubject: async (data) => {
      const db = getMockDB();
      const newSubject = {
        _id: 's_' + Date.now(),
        name: data.name,
        code: data.code,
        description: data.description,
        category: data.category || 'General'
      };
      db.subjects.push(newSubject);
      saveMockDB(db);
      return { success: true, data: newSubject };
    },
    deleteSubject: async (id) => {
      const db = getMockDB();
      db.subjects = db.subjects.filter(s => s._id !== id);
      saveMockDB(db);
      return { success: true };
    },
    deleteChapter: async (id) => {
      const db = getMockDB();
      db.chapters = db.chapters.filter(c => c._id !== id);
      saveMockDB(db);
      return { success: true };
    },
    deleteNote: async (id) => {
      const db = getMockDB();
      db.notes = db.notes.filter(n => n._id !== id);
      saveMockDB(db);
      return { success: true };
    },
    deletePYQ: async (id) => {
      const db = getMockDB();
      db.pyqs = db.pyqs.filter(p => p._id !== id);
      saveMockDB(db);
      return { success: true };
    },
    createReward: async (data) => {
      const db = getMockDB();
      const newReward = {
        _id: 'rew_' + Date.now(),
        title: data.title,
        description: data.description,
        costCoins: Number(data.costCoins),
        badgeImage: data.badgeImage || 'star',
        type: data.type || 'badge'
      };
      db.rewards.push(newReward);
      saveMockDB(db);
      return { success: true, data: newReward };
    },
    getDashboardStats: async () => {
      const db = getMockDB();
      const studentsCount = Object.keys(db.students).length;
      const teachersCount = Object.keys(db.teachers).length;
      const subjectsCount = db.subjects.length;
      const resultsCount = db.results.length;
      const rewardsCount = db.rewards.length;

      const totalScorePercent = db.results.reduce((acc, curr) => acc + curr.percentage, 0);
      const averageScore = resultsCount > 0 ? Math.round(totalScorePercent / resultsCount) : 0;

      return {
        success: true,
        stats: { studentsCount, teachersCount, subjectsCount, resultsCount, rewardsCount, averageScore }
      };
    }
  }
};

// HELPER WRAPPER TO DO REAL CALL OR FALLBACK ON ERROR
const executeRequest = async (requestPromise, mockFallbackFn) => {
  try {
    const response = await requestPromise;
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || '';
    // If it's a network/connection error, OR a database buffering timeout from the backend, run mock fallback
    if (!error.response || error.code === 'ERR_NETWORK' || message.includes('buffering timed out') || message.includes('MongoDB')) {
      console.warn('Backend server or database not detected. Navta is running in Client-Side Stateful Mockup Mode!');
      try {
        const mockResult = await mockFallbackFn();
        return mockResult;
      } catch (mockError) {
        return Promise.reject(mockError);
      }
    }
    // Otherwise return standard Axios structured error message
    throw new Error(message || 'Something went wrong');
  }
};

// API EXPORTS
export const authAPI = {
  register: (data) => executeRequest(api.post('/auth/register', data), () => mockAPI.auth.register(data)),
  login: (data) => executeRequest(api.post('/auth/login', data), () => mockAPI.auth.login(data)),
  googleLogin: (credential) => executeRequest(api.post('/auth/google', { credential }), () => mockAPI.auth.googleLogin(credential)),
  getMe: () => executeRequest(api.get('/auth/me'), () => mockAPI.auth.me()),
  verifyEmail: () => executeRequest(api.post('/auth/verify-email'), () => mockAPI.auth.verifyEmail()),
  forgotPassword: (email) => executeRequest(api.post('/auth/forgot-password', { email }), () => mockAPI.auth.forgotPassword())
};

export const contentAPI = {
  getSubjects: () => executeRequest(api.get('/content/subjects'), () => mockAPI.content.getSubjects()),
  getChapters: (subjectId) => executeRequest(api.get(`/content/subjects/${subjectId}/chapters`), () => mockAPI.content.getChapters(subjectId)),
  getNotes: (chapterId) => executeRequest(api.get(`/content/chapters/${chapterId}/notes`), () => mockAPI.content.getNotes(chapterId)),
  getPYQs: (subjectId) => executeRequest(api.get(`/content/subjects/${subjectId}/pyqs`), () => mockAPI.content.getPYQs(subjectId)),
  getTests: (subjectId, chapterId = null) => {
    const url = `/content/subjects/${subjectId}/tests${chapterId ? `?chapterId=${chapterId}` : ''}`;
    return executeRequest(api.get(url), () => mockAPI.content.getTests(subjectId, chapterId));
  },
  getTestDetail: (testId) => executeRequest(api.get(`/content/tests/${testId}`), () => mockAPI.content.getTestDetail(testId))
};

export const studentAPI = {
  submitTest: (testId, answers, timeTaken) => executeRequest(api.post(`/student/tests/${testId}/submit`, { answers, timeTaken }), () => mockAPI.student.submitTest(testId, { answers, timeTaken })),
  getResults: () => executeRequest(api.get('/student/results'), () => mockAPI.student.getResults()),
  getResultDetail: (resultId) => executeRequest(api.get(`/student/results/${resultId}`), () => mockAPI.student.getResultDetail(resultId)),
  getAnalytics: () => executeRequest(api.get('/student/analytics'), () => mockAPI.student.getAnalytics()),
  getRewards: () => executeRequest(api.get('/student/rewards'), () => mockAPI.student.getRewards()),
  redeemReward: (rewardId) => executeRequest(api.post(`/student/rewards/${rewardId}/redeem`), () => mockAPI.student.redeemReward(rewardId)),
  getLeaderboard: () => executeRequest(api.get('/student/leaderboard'), () => mockAPI.student.getLeaderboard())
};

export const teacherAPI = {
  createChapter: (data) => executeRequest(api.post('/teacher/chapters', data), () => mockAPI.teacher.createChapter(data)),
  createNote: (data) => executeRequest(api.post('/teacher/notes', data), () => mockAPI.teacher.createNote(data)),
  createPYQ: (data) => executeRequest(api.post('/teacher/pyqs', data), () => mockAPI.teacher.createPYQ(data)),
  createTest: (data) => executeRequest(api.post('/teacher/tests', data), () => mockAPI.teacher.createTest(data)),
  getStudentMetrics: () => executeRequest(api.get('/teacher/student-metrics'), () => mockAPI.teacher.getStudentMetrics())
};

export const adminAPI = {
  createUser: (data) => executeRequest(api.post('/admin/users', data), () => mockAPI.admin.createUser(data)),
  getUsers: () => executeRequest(api.get('/admin/users'), () => mockAPI.admin.getUsers()),
  updateUser: (userId, data) => executeRequest(api.put(`/admin/users/${userId}`, data), () => mockAPI.admin.updateUser(userId, data)),
  updateStudentProfile: (userId, data) => executeRequest(api.put(`/admin/students/${userId}`, data), () => mockAPI.admin.updateStudentProfile(userId, data)),
  deleteUser: (userId) => executeRequest(api.delete(`/admin/users/${userId}`), () => mockAPI.admin.deleteUser(userId)),
  createSubject: (data) => executeRequest(api.post('/admin/subjects', data), () => mockAPI.admin.createSubject(data)),
  deleteSubject: (id) => executeRequest(api.delete(`/admin/subjects/${id}`), () => mockAPI.admin.deleteSubject(id)),
  deleteChapter: (id) => executeRequest(api.delete(`/admin/chapters/${id}`), () => mockAPI.admin.deleteChapter(id)),
  deleteNote: (id) => executeRequest(api.delete(`/admin/notes/${id}`), () => mockAPI.admin.deleteNote(id)),
  deletePYQ: (id) => executeRequest(api.delete(`/admin/pyqs/${id}`), () => mockAPI.admin.deletePYQ(id)),
  createReward: (data) => executeRequest(api.post('/admin/rewards', data), () => mockAPI.admin.createReward(data)),
  getDashboardStats: () => executeRequest(api.get('/admin/dashboard-stats'), () => mockAPI.admin.getDashboardStats())
};

export default api;
