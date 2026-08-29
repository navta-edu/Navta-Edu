import axios from 'axios';

// Ensure VITE_API_URL properly appends /api if it doesn't already, and fallback to production backend.
const envUrl = import.meta.env.VITE_API_URL;
const API_URL = envUrl 
  ? (envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`) 
  : '/api';

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

      return {
        success: true,
        token: 'mock_jwt_token_' + user.id,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, isProfileComplete: user.isProfileComplete }
      };
    },

    getMe: async () => {
      const token = localStorage.getItem('token');
      if (!token || !token.startsWith('mock_jwt_token_')) throw new Error('Not authorized');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();
      const user = db.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, isProfileComplete: user.isProfileComplete } };
    },

    googleLogin: async (credential) => {
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
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, isProfileComplete: user.isProfileComplete }
      };
    },

    completeProfile: async (data) => {
      const token = localStorage.getItem('token');
      if (!token || !token.startsWith('mock_jwt_token_')) throw new Error('Not authorized');

      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();
      const user = db.users.find(u => u.id === userId);

      if (!user) throw new Error('User not found');

      if (data.role) user.role = data.role;
      if (data.stream) user.stream = data.stream;
      if (data.department) user.department = data.department;
      if (data.schoolName) user.schoolName = data.schoolName;
      if (data.address) user.address = data.address;

      user.isProfileComplete = true;

      if (user.role === 'student' && !db.students[userId]) {
        db.students[userId] = {
          user: userId,
          coins: 0,
          xp: 0,
          level: 1,
          stream: data.stream || 'General',
          badges: [],
          rewardsRedeemed: []
        };
      } else if (user.role === 'teacher' && !db.teachers[userId]) {
        db.teachers[userId] = {
          user: userId,
          qualification: 'Qualified Educator',
          bio: '',
          subjects: []
        };
      }

      saveMockDB(db);

      return {
        success: true,
        user: { ...user }
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

      const questionsList = test.questions.map(qid =>
        db.questions.find(q => q._id === qid)
      );

      return {
        success: true,
        data: {
          ...test,
          questions: questionsList
        }
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
              student.badges.push({
                name: ach.name,
                icon: ach.icon,
                earnedAt: new Date().toISOString()
              });

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

      return {
        success: true,
        data: results
      };
    },

    getResultDetail: async (resultId) => {
      const db = getMockDB();
      const res = db.results.find(r => r._id === resultId);

      if (!res) throw new Error('Result not found');

      const test = db.tests.find(t => t._id === res.test._id);

      const questionsList = test.questions.map(qid =>
        db.questions.find(q => q._id === qid)
      );

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
          subjectStats[subName] = {
            totalQuestions: 0,
            correctAnswers: 0,
            testCount: 0,
            passedCount: 0
          };
        }

        subjectStats[subName].testCount += 1;
        subjectStats[subName].totalQuestions += r.totalQuestions;
        subjectStats[subName].correctAnswers += r.correctAnswers;

        if (r.isPassed) {
          subjectStats[subName].passedCount += 1;
        }
      });

      const parsedStats = Object.keys(subjectStats).map(name => {
        const stats = subjectStats[name];

        const avgPercentage =
          stats.totalQuestions > 0
            ? Math.round(
                (stats.correctAnswers / stats.totalQuestions) * 100
              )
            : 0;

        return {
          subject: name,
          avgPercentage,
          testCount: stats.testCount,
          passedCount: stats.passedCount,
          failedCount: stats.testCount - stats.passedCount,
          strength:
            avgPercentage >= 75
              ? 'Strong'
              : avgPercentage >= 45
                ? 'Average'
                : 'Needs Focus'
        };
      });

      const progression = userResults
        .map(r => ({
          date: new Date(r.createdAt).toLocaleDateString(
            undefined,
            {
              month: 'short',
              day: 'numeric'
            }
          ),
          score: r.percentage
        }))
        .reverse();

      const weakAreas = parsedStats
        .filter(s => s.strength === 'Needs Focus')
        .map(s => s.subject);

      const strongAreas = parsedStats
        .filter(s => s.strength === 'Strong')
        .map(s => s.subject);

      const suggestions = [];

      if (weakAreas.length > 0) {
        weakAreas.forEach(a => {
          suggestions.push(
            `Spend an extra 30 minutes reading chapter notes for ${a}.`
          );
        });
      }

          if (strongAreas.length > 0) {
        suggestions.push(
          `Great work in ${strongAreas.join(', ')}! Keep revising to maintain your performance.`
        );
      }

      if (suggestions.length === 0) {
        suggestions.push(
          'Take more quizzes to unlock personalized suggestions.'
        );
      }

      return {
        success: true,
        data: {
          subjectStats: parsedStats,
          progression,
          weakAreas,
          strongAreas,
          suggestions
        }
      };
    },

    getProfile: async () => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();

      const user = db.users.find(u => u.id === userId);
      const student = db.students[userId];
      const streak = db.streaks[userId];

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          student,
          streak
        }
      };
    },

    updateProfile: async (data) => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();

      const userIndex = db.users.findIndex(u => u.id === userId);

      if (userIndex !== -1) {
        db.users[userIndex] = {
          ...db.users[userIndex],
          ...data
        };
      }

      if (db.students[userId]) {
        db.students[userId] = {
          ...db.students[userId],
          ...data
        };
      }

      saveMockDB(db);

      return {
        success: true,
        data: {
          user: db.users[userIndex],
          student: db.students[userId]
        }
      };
    },

    getRewards: async () => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();

      const student = db.students[userId];

      return {
        success: true,
        data: {
          rewards: db.rewards,
          coins: student ? student.coins : 0,
          redeemed: student
            ? student.rewardsRedeemed
            : []
        }
      };
    },

    redeemReward: async (rewardId) => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();

      const student = db.students[userId];
      const reward = db.rewards.find(
        r => r._id === rewardId
      );

      if (!student) {
        throw new Error(
          'Student profile not found'
        );
      }

      if (!reward) {
        throw new Error(
          'Reward not found'
        );
      }

      if (student.coins < reward.costCoins) {
        throw new Error(
          'Not enough coins'
        );
      }

      student.coins -= reward.costCoins;

      student.rewardsRedeemed.push({
        reward: rewardId,
        redeemedAt: new Date().toISOString()
      });

      saveMockDB(db);

      return {
        success: true,
        data: {
          reward,
          coins: student.coins
        }
      };
    },

    getAchievements: async () => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();

      const student = db.students[userId];

      return {
        success: true,
        data: {
          achievements: db.achievements,
          earned: student
            ? student.badges
            : []
        }
      };
    },

    getLeaderboard: async () => {
      const db = getMockDB();

      const leaderboard = Object.values(
        db.students
      )
        .map(student => {
          const user = db.users.find(
            u => u.id === student.user
          );

          return {
            user: {
              id: user?.id,
              name: user?.name || 'Student'
            },
            coins: student.coins || 0,
            xp: student.xp || 0,
            level: student.level || 1
          };
        })
        .sort((a, b) => b.xp - a.xp);

      return {
        success: true,
        data: leaderboard
      };
    }
  },

  // Teacher Routes
  teacher: {
    getProfile: async () => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();

      const user = db.users.find(
        u => u.id === userId
      );

      const teacher = db.teachers[userId];

      return {
        success: true,
        data: {
          user,
          teacher
        }
      };
    },

    updateProfile: async (data) => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();

      if (!db.teachers[userId]) {
        db.teachers[userId] = {
          user: userId
        };
      }

      db.teachers[userId] = {
        ...db.teachers[userId],
        ...data
      };

      saveMockDB(db);

      return {
        success: true,
        data: db.teachers[userId]
      };
    },

    createNote: async (data) => {
      const token = localStorage.getItem('token');
      const userId = token.replace('mock_jwt_token_', '');
      const db = getMockDB();

      const user = db.users.find(
        u => u.id === userId
      );

      const note = {
        _id: 'note_' + Date.now(),
        ...data,
        uploadedBy: {
          name: user?.name || 'Teacher'
        },
        createdAt: new Date().toISOString()
      };

      db.notes.push(note);

      saveMockDB(db);

      return {
        success: true,
        data: note
      };
    },

    createQuestion: async (data) => {
      const db = getMockDB();

      const question = {
        _id: 'question_' + Date.now(),
        ...data
      };

      db.questions.push(question);

      saveMockDB(db);

      return {
        success: true,
        data: question
      };
    },

    createTest: async (data) => {
      const db = getMockDB();

      const test = {
        _id: 'test_' + Date.now(),
        ...data
      };

      db.tests.push(test);

      saveMockDB(db);

      return {
        success: true,
        data: test
      };
    },

    getTests: async () => {
      const db = getMockDB();

      return {
        success: true,
        data: db.tests
      };
    },

    getResults: async () => {
      const db = getMockDB();

      return {
        success: true,
        data: db.results
      };
    }
  },

  // Admin Routes
  admin: {
    getDashboard: async () => {
      const db = getMockDB();

      return {
        success: true,
        data: {
          totalUsers: db.users.length,
          totalStudents: Object.keys(
            db.students
          ).length,
          totalTeachers: Object.keys(
            db.teachers
          ).length,
          totalSubjects: db.subjects.length,
          totalTests: db.tests.length,
          totalResults: db.results.length
        }
      };
    },

    getUsers: async () => {
      const db = getMockDB();

      return {
        success: true,
        data: db.users
      };
    },

    updateUser: async (userId, data) => {
      const db = getMockDB();

      const index = db.users.findIndex(
        u => u.id === userId
      );

      if (index === -1) {
        throw new Error(
          'User not found'
        );
      }

      db.users[index] = {
        ...db.users[index],
        ...data
      };

      saveMockDB(db);

      return {
        success: true,
        data: db.users[index]
      };
    },

    deleteUser: async (userId) => {
      const db = getMockDB();

      db.users = db.users.filter(
        u => u.id !== userId
      );

      delete db.students[userId];
      delete db.teachers[userId];
      delete db.streaks[userId];

      saveMockDB(db);

      return {
        success: true,
        message: 'User deleted'
      };
    },

    createSubject: async (data) => {
      const db = getMockDB();

      const subject = {
        _id: 'subject_' + Date.now(),
        ...data
      };

      db.subjects.push(subject);

      saveMockDB(db);

      return {
        success: true,
        data: subject
      };
    },

    createChapter: async (data) => {
      const db = getMockDB();

      const chapter = {
        _id: 'chapter_' + Date.now(),
        ...data
      };

      db.chapters.push(chapter);

      saveMockDB(db);

      return {
        success: true,
        data: chapter
      };
    },

    createReward: async (data) => {
      const db = getMockDB();

      const reward = {
        _id: 'reward_' + Date.now(),
        ...data
      };

      db.rewards.push(reward);

      saveMockDB(db);

      return {
        success: true,
        data: reward
      };
    },

    getAllResults: async () => {
      const db = getMockDB();

      return {
        success: true,
        data: db.results
      };
    }
  }
};

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  register: async (data) => {
    try {
      const response = await api.post(
        '/auth/register',
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.auth.register(data);
      }

      throw error;
    }
  },

  login: async (data) => {
    try {
      const response = await api.post(
        '/auth/login',
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.auth.login(data);
      }

      throw error;
    }
  },

  googleLogin: async (credential) => {
    try {
      const response = await api.post(
        '/auth/google',
        {
          credential
        }
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.auth.googleLogin(
          credential
        );
      }

      throw error;
    }
  },

  getMe: async () => {
    try {
      const response = await api.get(
        '/auth/me'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.auth.getMe();
      }

      throw error;
    }
  },

  completeProfile: async (data) => {
    try {
      const response = await api.put(
        '/auth/complete-profile',
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.auth.completeProfile(
          data
        );
      }

      throw error;
    }
  }
};

// ============================================
// CONTENT API
// ============================================

export const contentAPI = {
  getSubjects: async () => {
    try {
      const response = await api.get(
        '/content/subjects'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.content.getSubjects();
      }

      throw error;
    }
  },

  getChapters: async (subjectId) => {
    try {
      const response = await api.get(
        `/content/subjects/${subjectId}/chapters`
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.content.getChapters(
          subjectId
        );
      }

      throw error;
    }
  },

  getNotes: async (chapterId) => {
    try {
      const response = await api.get(
        `/content/chapters/${chapterId}/notes`
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.content.getNotes(
          chapterId
        );
      }

      throw error;
    }
  },

  getPYQs: async (subjectId) => {
    try {
      const response = await api.get(
        `/content/subjects/${subjectId}/pyqs`
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.content.getPYQs(
          subjectId
        );
      }

      throw error;
    }
  },

  getTests: async (
    subjectId,
    chapterId = null
  ) => {
    try {
      const params = {};

      if (chapterId) {
        params.chapterId =
          chapterId;
      }

      const response = await api.get(
        `/content/subjects/${subjectId}/tests`,
        {
          params
        }
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.content.getTests(
          subjectId,
          chapterId
        );
      }

      throw error;
    }
  },

  getTestDetail: async (testId) => {
    try {
      const response = await api.get(
        `/content/tests/${testId}`
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.content.getTestDetail(
          testId
        );
      }

      throw error;
    }
  }
};

// ============================================
// STUDENT API
// ============================================

export const studentAPI = {
  submitTest: async (
    testId,
    data
  ) => {
    try {
      const response = await api.post(
        `/student/tests/${testId}/submit`,
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.submitTest(
          testId,
          data
        );
      }

      throw error;
    }
  },

  getResults: async () => {
    try {
      const response = await api.get(
        '/student/results'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.getResults();
      }

      throw error;
    }
  },

  getResultDetail: async (resultId) => {
    try {
      const response = await api.get(
        `/student/results/${resultId}`
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.getResultDetail(
          resultId
        );
      }

      throw error;
    }
  },

  getAnalytics: async () => {
    try {
      const response = await api.get(
        '/student/analytics'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.getAnalytics();
      }

      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get(
        '/student/profile'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.getProfile();
      }

      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put(
        '/student/profile',
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.updateProfile(
          data
        );
      }

      throw error;
    }
  },

  getRewards: async () => {
    try {
      const response = await api.get(
        '/student/rewards'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.getRewards();
      }

      throw error;
    }
  },

  redeemReward: async (rewardId) => {
    try {
      const response = await api.post(
        `/student/rewards/${rewardId}/redeem`
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.redeemReward(
          rewardId
        );
      }

      throw error;
    }
  },

  getAchievements: async () => {
    try {
      const response = await api.get(
        '/student/achievements'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.getAchievements();
      }

      throw error;
    }
  },

  getLeaderboard: async () => {
    try {
      const response = await api.get(
        '/student/leaderboard'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.getLeaderboard();
      }

      throw error;
    }
  }
};

// ============================================
// TEACHER API
// ============================================

export const teacherAPI = {
  getProfile: async () => {
    try {
      const response = await api.get(
        '/teacher/profile'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.teacher.getProfile();
      }

      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put(
        '/teacher/profile',
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.teacher.updateProfile(
          data
        );
      }

      throw error;
    }
  },

  createNote: async (data) => {
    try {
      const response = await api.post(
        '/teacher/notes',
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.teacher.createNote(
          data
        );
      }

      throw error;
    }
  },

  createQuestion: async (data) => {
    try {
      const response = await api.post(
        '/teacher/questions',
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.teacher.createQuestion(
          data
        );
      }

      throw error;
    }
  },

  createTest: async (data) => {
    try {
      const response = await api.post(
        '/teacher/tests',
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.teacher.createTest(
          data
        );
      }

      throw error;
    }
  },

  getTests: async () => {
    try {
      const response = await api.get(
        '/teacher/tests'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.teacher.getTests();
      }

      throw error;
    }
  },

  getResults: async () => {
    try {
      const response = await api.get(
        '/teacher/results'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.teacher.getResults();
      }

      throw error;
    }
  }
};

// ============================================
// ADMIN API
// ============================================

export const adminAPI = {
  getDashboard: async () => {
    try {
      const response = await api.get(
        '/admin/dashboard'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.admin.getDashboard();
      }

      throw error;
    }
  },

  getUsers: async () => {
    try {
      const response = await api.get(
        '/admin/users'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.admin.getUsers();
      }

      throw error;
    }
  },

  updateUser: async (
    userId,
    data
  ) => {
    try {
      const response = await api.put(
        `/admin/users/${userId}`,
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.admin.updateUser(
          userId,
          data
        );
      }

      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(
        `/admin/users/${userId}`
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.admin.deleteUser(
          userId
        );
      }

      throw error;
    }
  },

  createSubject: async (data) => {
    try {
      const response = await api.post(
        '/admin/subjects',
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.admin.createSubject(
          data
        );
      }

      throw error;
    }
  },

  createChapter: async (data) => {
    try {
      const response = await api.post(
        '/admin/chapters',
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.admin.createChapter(
          data
        );
      }

      throw error;
    }
  },

  createReward: async (data) => {
    try {
      const response = await api.post(
        '/admin/rewards',
        data
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.admin.createReward(
          data
        );
      }

      throw error;
    }
  },

  getAllResults: async () => {
    try {
      const response = await api.get(
        '/admin/results'
      );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.admin.getAllResults();
      }

      throw error;
    }
  }
};

// ============================================
// NAVTA TEST API
// ============================================

export const navtaTestAPI = {
  getConfig: async () => {
    const response = await api.get(
      '/navta-test/config'
    );

    return response.data;
  },

  getChapters: async ({
    subject,
    exam,
    classLevel
  }) => {
    const response = await api.get(
      '/navta-test/chapters',
      {
        params: {
          subject,
          exam,
          classLevel
        }
      }
    );

    return response.data;
  },

  getQuestionCount: async ({
    subject,
    exam,
    classLevel,
    chapter,
    difficulty,
    questionType
  }) => {
    const response = await api.get(
      '/navta-test/question-count',
      {
        params: {
          subject,
          exam,
          classLevel,
          chapter,
          difficulty,
          questionType
        }
      }
    );

    return response.data;
  },

  getQuestions: async ({
    subject,
    exam,
    classLevel,
    chapter,
    difficulty,
    questionType,
    limit
  }) => {
    const response = await api.get(
      '/navta-test/questions',
      {
        params: {
          subject,
          exam,
          classLevel,
          chapter,
          difficulty,
          questionType,
          limit
        }
      }
    );

    return response.data;
  },

  completeTest: async (data) => {
    const response = await api.post(
      '/navta-test/complete',
      data
    );

    return response.data;
  }
};

// ============================================
// MISTAKE NOTEBOOK API
// ============================================

export const mistakeNotebookAPI = {
  getMistakes: async (
    params = {}
  ) => {
    const response = await api.get(
      '/mistake-notebook',
      {
        params
      }
    );

    return response.data;
  },

  getMistakeDetail: async (
    mistakeId
  ) => {
    const response = await api.get(
      `/mistake-notebook/${mistakeId}`
    );

    return response.data;
  },

  updateMistake: async (
    mistakeId,
    data
  ) => {
    const response = await api.patch(
      `/mistake-notebook/${mistakeId}`,
      data
    );

    return response.data;
  },

  deleteMistake: async (
    mistakeId
  ) => {
    const response = await api.delete(
      `/mistake-notebook/${mistakeId}`
    );

    return response.data;
  }
};

// ============================================
// PANIC MODE API
// ============================================

export const panicModeAPI = {
  // ------------------------------------------
  // GET CURRENT PANIC PLAN
  // ------------------------------------------

  getPlan: async () => {
    const response = await api.get(
      '/panic-mode/plan'
    );

    return response.data;
  },

  // ------------------------------------------
  // CREATE PANIC PLAN
  // ------------------------------------------

  createPlan: async (data) => {
    const response = await api.post(
      '/panic-mode/plan',
      data
    );

    return response.data;
  },

  // ------------------------------------------
  // UPDATE CHAPTER PROGRESS
  // ------------------------------------------

  updateChapterProgress: async (
    chapterId,
    data
  ) => {
    const response = await api.patch(
      `/panic-mode/chapters/${chapterId}`,
      data
    );

    return response.data;
  },

  // ------------------------------------------
  // GENERATE TARGETED PRACTICE
  // ------------------------------------------

  generatePractice: async (
    chapterId,
    data = {}
  ) => {
    const response = await api.post(
      `/panic-mode/chapters/${chapterId}/practice`,
      data
    );

    return response.data;
  },

  // ------------------------------------------
  // CHECK TARGETED PRACTICE ANSWER
  // ------------------------------------------

  checkPracticeAnswer: async (
    chapterId,
    data
  ) => {
    const response = await api.post(
      `/panic-mode/chapters/${chapterId}/practice/check`,
      data
    );

    return response.data;
  },

  // ------------------------------------------
  // COMPLETE TARGETED PRACTICE
  // ------------------------------------------

  completePractice: async (
    chapterId,
    questionIds
  ) => {
    const response = await api.post(
      `/panic-mode/chapters/${chapterId}/practice/complete`,
      {
        questionIds
      }
    );

    return response.data;
  },

  // ------------------------------------------
  // SAVE FIX TEST RESULT
  // ------------------------------------------

  saveFixTestResult: async (
    chapterId,
    percentage
  ) => {
    const response = await api.post(
      `/panic-mode/chapters/${chapterId}/fix-test`,
      {
        percentage
      }
    );

    return response.data;
  },

  // ------------------------------------------
  // RESET PANIC PLAN
  // ------------------------------------------

  resetPlan: async () => {
    const response = await api.delete(
      '/panic-mode/plan'
    );

    return response.data;
  }
};

// ============================================
// DEFAULT AXIOS INSTANCE
// ============================================

export default api;
