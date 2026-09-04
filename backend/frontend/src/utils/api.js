import axios from 'axios';

// ============================================
// API BASE URL
// ============================================
//
// Accepts:
// https://example.com
// https://example.com/
// https://example.com/api
// https://example.com/api/
//
// Guarantees exactly one /api suffix.
// ============================================

const rawEnvUrl = String(
  import.meta.env.VITE_API_URL || ''
).trim();

const normalizedEnvUrl =
  rawEnvUrl.replace(/\/+$/, '');

const API_URL = normalizedEnvUrl
  ? normalizedEnvUrl.endsWith('/api')
    ? normalizedEnvUrl
    : `${normalizedEnvUrl}/api`
  : '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token');

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 401
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);

// ============================================
// ERROR MESSAGE HELPER
// ============================================

const getApiErrorMessage = (
  error,
  fallback = 'Something went wrong.'
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

// ============================================
// MOCK DATABASE
// ============================================

const getMockDB = () => {
  const saved =
    localStorage.getItem(
      'navta_mock_db'
    );

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error(
        'Failed to parse mock database:',
        error
      );
    }
  }

  const initialDB = {
    users: [],
    students: {},
    teachers: {},
    streaks: {},
    subjects: [],
    chapters: [],
    notes: [],
    pyqs: [],
    questions: [],
    tests: [],
    results: [],
    rewards: []
  };

  localStorage.setItem(
    'navta_mock_db',
    JSON.stringify(initialDB)
  );

  return initialDB;
};

const saveMockDB = (db) => {
  localStorage.setItem(
    'navta_mock_db',
    JSON.stringify(db)
  );
};

// ============================================
// MOCK API
// ============================================

const mockAPI = {
  // ==========================================
  // AUTH
  // ==========================================

  auth: {
    register: async (data) => {
      const db = getMockDB();

      const existingUser =
        db.users.find(
          (user) =>
            user.email === data.email
        );

      if (existingUser) {
        throw new Error(
          'User already exists'
        );
      }

      const user = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || 'student',
        isVerified: true,
        isProfileComplete: false,
        createdAt:
          new Date().toISOString()
      };

      db.users.push(user);

      saveMockDB(db);

      return {
        success: true,

        token:
          `mock_jwt_token_${user.id}`,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified:
            user.isVerified,
          isProfileComplete:
            user.isProfileComplete
        }
      };
    },

    login: async (data) => {
      const db = getMockDB();

      const user =
        db.users.find(
          (item) =>
            item.email ===
              data.email &&
            item.password ===
              data.password
        );

      if (!user) {
        throw new Error(
          'Invalid email or password'
        );
      }

      return {
        success: true,

        token:
          `mock_jwt_token_${user.id}`,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified:
            user.isVerified,
          isProfileComplete:
            user.isProfileComplete
        }
      };
    },

    getMe: async () => {
      const token =
        localStorage.getItem('token');

      if (
        !token ||
        !token.startsWith(
          'mock_jwt_token_'
        )
      ) {
        throw new Error(
          'Not authorized'
        );
      }

      const userId =
        token.replace(
          'mock_jwt_token_',
          ''
        );

      const db = getMockDB();

      const user =
        db.users.find(
          (item) =>
            item.id === userId
        );

      if (!user) {
        throw new Error(
          'User not found'
        );
      }

      return {
        success: true,
        user: {
          ...user
        }
      };
    },

    googleLogin: async (
      credential
    ) => {
      const db = getMockDB();

      const user = {
        id:
          `google_${Date.now()}`,

        name:
          'Google User',

        email:
          `google${Date.now()}@example.com`,

        role:
          'student',

        isVerified:
          true,

        isProfileComplete:
          false,

        googleCredential:
          credential,

        createdAt:
          new Date().toISOString()
      };

      db.users.push(user);

      db.students[user.id] = {
        user: user.id,
        coins: 0,
        xp: 0,
        level: 1,
        stream: 'General',
        badges: [],
        rewardsRedeemed: []
      };

      db.streaks[user.id] = {
        user: user.id,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate:
          new Date().toISOString()
      };

      saveMockDB(db);

      return {
        success: true,

        token:
          `mock_jwt_token_${user.id}`,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: true,
          isProfileComplete: false
        }
      };
    },

    completeProfile:
      async (data) => {
        const token =
          localStorage.getItem(
            'token'
          );

        if (
          !token ||
          !token.startsWith(
            'mock_jwt_token_'
          )
        ) {
          throw new Error(
            'Not authorized'
          );
        }

        const userId =
          token.replace(
            'mock_jwt_token_',
            ''
          );

        const db = getMockDB();

        const user =
          db.users.find(
            (item) =>
              item.id === userId
          );

        if (!user) {
          throw new Error(
            'User not found'
          );
        }

        Object.assign(
          user,
          data,
          {
            isProfileComplete:
              true
          }
        );

        if (
          user.role ===
            'student' &&
          !db.students[userId]
        ) {
          db.students[userId] = {
            user: userId,
            coins: 0,
            xp: 0,
            level: 1,
            stream:
              data.stream ||
              'General',
            badges: [],
            rewardsRedeemed: []
          };
        }

        if (
          user.role ===
            'teacher' &&
          !db.teachers[userId]
        ) {
          db.teachers[userId] = {
            user: userId,
            qualification:
              'Qualified Educator',
            bio: '',
            subjects: []
          };
        }

        saveMockDB(db);

        return {
          success: true,
          user: {
            ...user
          }
        };
      }
  },

  // ==========================================
  // CONTENT
  // ==========================================

  content: {
    getSubjects: async () => {
      const db = getMockDB();

      return {
        success: true,
        data: db.subjects
      };
    },

    getChapters:
      async (subjectId) => {
        const db = getMockDB();

        return {
          success: true,

          data:
            db.chapters.filter(
              (chapter) =>
                chapter.subject ===
                subjectId
            )
        };
      },

    getNotes:
      async (chapterId) => {
        const db = getMockDB();

        return {
          success: true,

          data:
            db.notes.filter(
              (note) =>
                note.chapter ===
                chapterId
            )
        };
      },

    getPYQs:
      async (subjectId) => {
        const db = getMockDB();

        return {
          success: true,

          data:
            db.pyqs.filter(
              (pyq) =>
                pyq.subject ===
                subjectId
            )
        };
      },

    getTests:
      async (
        subjectId,
        chapterId = null
      ) => {
        const db = getMockDB();

        let tests =
          db.tests.filter(
            (test) =>
              test.subject ===
              subjectId
          );

        if (chapterId) {
          tests =
            tests.filter(
              (test) =>
                test.chapter?._id ===
                chapterId
            );
        }

        return {
          success: true,
          data: tests
        };
      },

    getTestDetail:
      async (testId) => {
        const db = getMockDB();

        const test =
          db.tests.find(
            (item) =>
              item._id === testId
          );

        if (!test) {
          throw new Error(
            'Test not found'
          );
        }

        return {
          success: true,
          data: test
        };
      }
  },

  // ==========================================
  // STUDENT
  // ==========================================

  student: {
    getDashboard: async () => {
      const token =
        localStorage.getItem(
          'token'
        );

      const userId =
        token?.replace(
          'mock_jwt_token_',
          ''
        );

      const db = getMockDB();

      const student =
        db.students[userId] || {
          coins: 0,
          xp: 0,
          level: 1,
          badges: []
        };

      const streak =
        db.streaks[userId] || {
          currentStreak: 0,
          longestStreak: 0
        };

      return {
        success: true,
        data: {
          student,
          streak
        }
      };
    },

    getProfile: async () => {
      const token =
        localStorage.getItem(
          'token'
        );

      const userId =
        token?.replace(
          'mock_jwt_token_',
          ''
        );

      const db = getMockDB();

      const user =
        db.users.find(
          (item) =>
            item.id === userId
        );

      return {
        success: true,

        data: {
          ...user,
          ...db.students[userId]
        }
      };
    },

    updateProfile:
      async (data) => {
        const token =
          localStorage.getItem(
            'token'
          );

        const userId =
          token?.replace(
            'mock_jwt_token_',
            ''
          );

        const db = getMockDB();

        const index =
          db.users.findIndex(
            (item) =>
              item.id === userId
          );

        if (index !== -1) {
          db.users[index] = {
            ...db.users[index],
            ...data
          };
        }

        if (db.students[userId]) {
          db.students[userId] = {
            ...db.students[
              userId
            ],
            ...data
          };
        }

        saveMockDB(db);

        return {
          success: true,
          data: {
            ...(db.users[index] ||
              {}),
            ...(db.students[
              userId
            ] || {})
          }
        };
      },

    getStreak: async () => {
      const token =
        localStorage.getItem(
          'token'
        );

      const userId =
        token?.replace(
          'mock_jwt_token_',
          ''
        );

      const db = getMockDB();

      return {
        success: true,

        data:
          db.streaks[userId] || {
            currentStreak: 0,
            longestStreak: 0
          }
      };
    },

    updateStreak: async () => {
      const token =
        localStorage.getItem(
          'token'
        );

      const userId =
        token?.replace(
          'mock_jwt_token_',
          ''
        );

      const db = getMockDB();

      if (!db.streaks[userId]) {
        db.streaks[userId] = {
          user: userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate:
            new Date().toISOString()
        };
      } else {
        const streak =
          db.streaks[userId];

        streak.currentStreak += 1;

        streak.longestStreak =
          Math.max(
            streak.longestStreak,
            streak.currentStreak
          );

        streak.lastActiveDate =
          new Date().toISOString();
      }

      saveMockDB(db);

      return {
        success: true,
        data:
          db.streaks[userId]
      };
    },

    getRewards: async () => {
      const db = getMockDB();

      return {
        success: true,
        data: db.rewards
      };
    },

    redeemReward:
      async (rewardId) => {
        const token =
          localStorage.getItem(
            'token'
          );

        const userId =
          token?.replace(
            'mock_jwt_token_',
            ''
          );

        const db = getMockDB();

        const reward =
          db.rewards.find(
            (item) =>
              item._id === rewardId
          );

        const student =
          db.students[userId];

        if (
          !reward ||
          !student
        ) {
          throw new Error(
            'Reward or student not found'
          );
        }

        if (
          student.coins <
          reward.cost
        ) {
          throw new Error(
            'Not enough coins'
          );
        }

        student.coins -=
          reward.cost;

        student.rewardsRedeemed =
          student.rewardsRedeemed ||
          [];

        student.rewardsRedeemed.push(
          rewardId
        );

        saveMockDB(db);

        return {
          success: true,
          data: {
            reward,
            coins:
              student.coins
          }
        };
      },

    submitTest:
      async (
        testId,
        answers
      ) => {
        const token =
          localStorage.getItem(
            'token'
          );

        const userId =
          token?.replace(
            'mock_jwt_token_',
            ''
          );

        const db = getMockDB();

        const test =
          db.tests.find(
            (item) =>
              item._id === testId
          );

        if (!test) {
          throw new Error(
            'Test not found'
          );
        }

        let correct = 0;

        test.questions.forEach(
          (questionId) => {
            const question =
              db.questions.find(
                (item) =>
                  item._id ===
                  questionId
              );

            if (
              question &&
              answers[
                questionId
              ] ===
                question.correctAnswer
            ) {
              correct += 1;
            }
          }
        );

        const total =
          test.questions.length;

        const score =
          total > 0
            ? Math.round(
                (correct /
                  total) *
                  100
              )
            : 0;

        const result = {
          _id:
            `result_${Date.now()}`,
          user: userId,
          test: testId,
          answers,
          correct,
          total,
          score,
          createdAt:
            new Date().toISOString()
        };

        db.results.push(result);

        saveMockDB(db);

        return {
          success: true,
          data: result
        };
      },

    getResults: async () => {
      const token =
        localStorage.getItem(
          'token'
        );

      const userId =
        token?.replace(
          'mock_jwt_token_',
          ''
        );

      const db = getMockDB();

      return {
        success: true,

        data:
          db.results.filter(
            (result) =>
              result.user ===
              userId
          )
      };
    },

    getLeaderboard:
      async () => {
        const db = getMockDB();

        const leaderboard =
          Object.entries(
            db.students
          )
            .map(
              ([
                userId,
                student
              ]) => {
                const user =
                  db.users.find(
                    (item) =>
                      item.id ===
                      userId
                  );

                return {
                  userId,
                  name:
                    user?.name ||
                    'Student',
                  xp:
                    student.xp ||
                    0,
                  level:
                    student.level ||
                    1,
                  coins:
                    student.coins ||
                    0
                };
              }
            )
            .sort(
              (a, b) =>
                b.xp - a.xp
            );

        return {
          success: true,
          data: leaderboard
        };
      }
  },

  // ==========================================
  // TEACHER
  // ==========================================

  teacher: {
    getProfile: async () => {
      const token =
        localStorage.getItem(
          'token'
        );

      const userId =
        token?.replace(
          'mock_jwt_token_',
          ''
        );

      const db = getMockDB();

      const user =
        db.users.find(
          (item) =>
            item.id === userId
        );

      return {
        success: true,

        data: {
          ...user,
          ...db.teachers[userId]
        }
      };
    },

    updateProfile:
      async (data) => {
        const token =
          localStorage.getItem(
            'token'
          );

        const userId =
          token?.replace(
            'mock_jwt_token_',
            ''
        );

        const db = getMockDB();

        if (!db.teachers[userId]) {
          db.teachers[userId] = {
            user: userId
          };
        }

        db.teachers[userId] = {
          ...db.teachers[
            userId
          ],
          ...data
        };

        saveMockDB(db);

        return {
          success: true,
          data:
            db.teachers[userId]
        };
      },

    createNote:
      async (data) => {
        const db = getMockDB();

        const note = {
          _id:
            `note_${Date.now()}`,
          ...data
        };

        db.notes.push(note);

        saveMockDB(db);

        return {
          success: true,
          data: note
        };
      },

    createQuestion:
      async (data) => {
        const db = getMockDB();

        const question = {
          _id:
            `question_${Date.now()}`,
          ...data
        };

        db.questions.push(
          question
        );

        saveMockDB(db);

        return {
          success: true,
          data: question
        };
      },

    createTest:
      async (data) => {
        const db = getMockDB();

        const test = {
          _id:
            `test_${Date.now()}`,
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

  // ==========================================
  // ADMIN MOCK
  // ==========================================

  admin: {
    getDashboard: async () => {
      const db = getMockDB();

      return {
        success: true,

        data: {
          totalUsers:
            db.users.length,

          totalStudents:
            Object.keys(
              db.students
            ).length,

          totalTeachers:
            Object.keys(
              db.teachers
            ).length,

          totalSubjects:
            db.subjects.length,

          totalTests:
            db.tests.length,

          totalResults:
            db.results.length
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

    createUser:
      async (data) => {
        const db = getMockDB();

        const user = {
          id:
            `user_${Date.now()}`,
          ...data,
          createdAt:
            new Date().toISOString()
        };

        db.users.push(user);

        saveMockDB(db);

        return {
          success: true,
          data: user
        };
      },

    updateUser:
      async (
        userId,
        data
      ) => {
        const db = getMockDB();

        const index =
          db.users.findIndex(
            (user) =>
              user.id === userId
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
          data:
            db.users[index]
        };
      },

    deleteUser:
      async (userId) => {
        const db = getMockDB();

        db.users =
          db.users.filter(
            (user) =>
              user.id !== userId
          );

        delete db.students[
          userId
        ];

        delete db.teachers[
          userId
        ];

        delete db.streaks[
          userId
        ];

        saveMockDB(db);

        return {
          success: true
        };
      },

    createSubject:
      async (data) => {
        const db = getMockDB();

        const subject = {
          _id:
            `subject_${Date.now()}`,
          ...data
        };

        db.subjects.push(
          subject
        );

        saveMockDB(db);

        return {
          success: true,
          data: subject
        };
      },

    createChapter:
      async (data) => {
        const db = getMockDB();

        const chapter = {
          _id:
            `chapter_${Date.now()}`,
          ...data
        };

        db.chapters.push(
          chapter
        );

        saveMockDB(db);

        return {
          success: true,
          data: chapter
        };
      },

    createReward:
      async (data) => {
        const db = getMockDB();

        const reward = {
          _id:
            `reward_${Date.now()}`,
          ...data
        };

        db.rewards.push(
          reward
        );

        saveMockDB(db);

        return {
          success: true,
          data: reward
        };
      },

    // ========================================
    // IMPORTANT FIX:
    // ADMIN CREATE STUDY NOTE
    // ========================================

    createNote:
      async (data) => {
        const db = getMockDB();

        const note = {
          _id:
            `note_${Date.now()}`,
          ...data,
          createdAt:
            new Date().toISOString()
        };

        db.notes.push(note);

        saveMockDB(db);

        return {
          success: true,
          data: note
        };
      },

    getAllResults:
      async () => {
        const db = getMockDB();

        return {
          success: true,
          data: db.results
        };
      }
  }
};

// ============================================
// REAL API REQUEST HELPER
// ============================================

const executeRequest = async (
  requestFn,
  fallbackFn
) => {
  try {
    return await requestFn();
  } catch (error) {
    if (
      import.meta.env.DEV &&
      !error.response &&
      fallbackFn
    ) {
      return await fallbackFn();
    }

    throw error;
  }
};

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  register: async (data) => {
    try {
      const response =
        await api.post(
          '/auth/register',
          data
        );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.auth.register(
          data
        );
      }

      throw error;
    }
  },

  login: async (data) => {
    try {
      const response =
        await api.post(
          '/auth/login',
          data
        );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.auth.login(
          data
        );
      }

      throw error;
    }
  },

  getMe: async () => {
    try {
      const response =
        await api.get(
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

  googleLogin:
    async (credential) => {
      try {
        const response =
          await api.post(
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

  completeProfile:
    async (data) => {
      try {
        const response =
          await api.put(
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
//
// NAVTA MASTER SUBJECT / CHAPTER SOURCE
//
// Study Notes and NAVTA Test now use the same backend
// chapter configuration exposed by:
//
//   GET /api/content/navta-subjects
//   GET /api/content/navta-chapters
//
// Existing MongoDB content routes are preserved for
// notes, PYQs, tests and compatibility.
// ============================================

const navtaSubjectIdToName =
  new Map();

const normalizeNavtaSubjectName = (
  value = ''
) => {
  const raw =
    String(value || '').trim();

  const lower =
    raw.toLowerCase();

  if (lower === 'physics') {
    return 'Physics';
  }

  if (lower === 'chemistry') {
    return 'Chemistry';
  }

  if (
    lower === 'maths' ||
    lower === 'math' ||
    lower === 'mathematics'
  ) {
    return 'Maths';
  }

  if (
    lower === 'biology' ||
    lower === 'bio'
  ) {
    return 'Biology';
  }

  return raw;
};

const extractApiArray = (
  payload,
  preferredKey = ''
) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    preferredKey &&
    Array.isArray(
      payload?.[preferredKey]
    )
  ) {
    return payload[preferredKey];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

export const contentAPI = {
  // ==========================================
  // MASTER NAVTA SUBJECTS
  // ==========================================
  //
  // This intentionally uses navta-subjects rather than
  // the old MongoDB /content/subjects list so the
  // Study Notes subject list always matches NAVTA Test.
  // ==========================================

  getSubjects: async () => {
    try {
      const response =
        await api.get(
          '/content/navta-subjects'
        );

      const payload =
        response.data || {};

      const rawSubjects =
        extractApiArray(
          payload,
          'subjects'
        );

      const subjects =
        rawSubjects.map(
          (subject, index) => {
            const name =
              normalizeNavtaSubjectName(
                subject?.name ||
                subject?.displayName ||
                subject
              );

            const id =
              String(
                subject?._id ||
                subject?.id ||
                name ||
                `navta-subject-${index + 1}`
              );

            if (name) {
              navtaSubjectIdToName.set(
                id,
                name
              );

              navtaSubjectIdToName.set(
                name,
                name
              );
            }

            return {
              ...(typeof subject === 'object'
                ? subject
                : {}),

              _id:
                id,

              id,

              name,

              displayName:
                name === 'Maths'
                  ? 'Mathematics'
                  : name,

              source:
                'navta-test'
            };
          }
        )
        .filter(
          (subject) =>
            Boolean(subject.name)
        );

      console.log(
        'NAVTA master subjects loaded:',
        subjects
      );

      return {
        success: true,
        count: subjects.length,
        data: subjects,
        subjects
      };
    } catch (error) {
      console.error(
        'NAVTA getSubjects failed:',
        getApiErrorMessage(error)
      );

      // Keep the original endpoint as a compatibility
      // fallback if an older backend is temporarily live.
      try {
        const fallbackResponse =
          await api.get(
            '/content/subjects'
          );

        return fallbackResponse.data;
      } catch {
        if (
          import.meta.env.DEV &&
          !error.response
        ) {
          return mockAPI.content.getSubjects();
        }

        throw error;
      }
    }
  },

  // Explicit alias for pages that want to clearly state
  // that they are loading the NAVTA Test subject source.
  getNavtaSubjects: async () => {
    return contentAPI.getSubjects();
  },

  // ==========================================
  // MASTER NAVTA CHAPTERS
  // ==========================================
  //
  // Accepts either:
  //
  //   getChapters('Maths', 'Class 12')
  //
  // or the selected subject ID returned by getSubjects:
  //
  //   getChapters('navta-subject-3', 'Class 12')
  //
  // The ID is translated back to the real subject name.
  // ==========================================

  getChapters: async (
    subjectOrId,
    classLevel = ''
  ) => {
    const rawSubject =
      String(subjectOrId || '').trim();

    let subject =
      navtaSubjectIdToName.get(
        rawSubject
      ) ||
      normalizeNavtaSubjectName(
        rawSubject
      );

    // Support backend IDs such as navta-subject-1 even
    // when the in-memory map has not been populated yet.
    // This is only a fallback; normally getSubjects()
    // populates the exact mapping first.
    const fallbackIdMap = {
      'navta-subject-1': 'Physics',
      'navta-subject-2': 'Chemistry',
      'navta-subject-3': 'Maths',
      'navta-subject-4': 'Biology'
    };

    subject =
      fallbackIdMap[rawSubject] ||
      subject;

    try {
      const params = {};

      if (subject) {
        params.subject =
          subject;
      }

      if (classLevel) {
        params.classLevel =
          classLevel;
      }

      const response =
        await api.get(
          '/content/navta-chapters',
          {
            params
          }
        );

      const payload =
        response.data || {};

      const rawChapters =
        extractApiArray(
          payload,
          'chapters'
        );

      const chapters =
        rawChapters.map(
          (chapter, index) => {
            const title =
              String(
                chapter?.title ||
                chapter?.name ||
                chapter?.chapter ||
                ''
              ).trim();

            const chapterClass =
              String(
                chapter?.classLevel ||
                chapter?.className ||
                chapter?.class ||
                classLevel ||
                ''
              ).trim();

            const id =
              String(
                chapter?._id ||
                chapter?.id ||
                `${subject}-${chapterClass}-${index + 1}`
              );

            return {
              ...chapter,

              _id: id,
              id,

              title,
              name: title,
              chapter: title,

              subject:
                chapter?.subject ||
                subject,

              classLevel:
                chapterClass,

              className:
                chapterClass,

              chapterNumber:
                Number(
                  chapter?.chapterNumber
                ) ||
                index + 1,

              source:
                'navta-test'
            };
          }
        )
        .filter(
          (chapter) =>
            Boolean(chapter.title)
        );

      console.log(
        `NAVTA master chapters loaded for ${subject || 'all subjects'}${
          classLevel
            ? ` / ${classLevel}`
            : ''
        }:`,
        chapters
      );

      return {
        success: true,
        count: chapters.length,
        subject,
        classLevel,
        data: chapters,
        chapters
      };
    } catch (error) {
      console.error(
        'NAVTA getChapters failed:',
        getApiErrorMessage(error)
      );

      // Compatibility fallback for older MongoDB chapter
      // endpoints when a real MongoDB subject ObjectId is
      // supplied.
      if (
        rawSubject &&
        !rawSubject.startsWith(
          'navta-subject-'
        )
      ) {
        try {
          const fallbackResponse =
            await api.get(
              `/content/subjects/${rawSubject}/chapters`
            );

          return fallbackResponse.data;
        } catch {
          // continue to final error handling
        }
      }

      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.content.getChapters(
          rawSubject
        );
      }

      throw error;
    }
  },

  // Explicit alias used by the Study Notes/Admin flow.
  getNavtaChapters: async (
    subject,
    classLevel = ''
  ) => {
    return contentAPI.getChapters(
      subject,
      classLevel
    );
  },

  // ==========================================
  // NOTES
  // ==========================================

  getNotes:
    async (chapterId) => {
      try {
        const response =
          await api.get(
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

  // ==========================================
  // PYQS
  // ==========================================

  getPYQs:
    async (subjectId) => {
      try {
        const response =
          await api.get(
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

  // ==========================================
  // TESTS
  // ==========================================

  getTests:
    async (
      subjectId,
      chapterId = null
    ) => {
      try {
        const params = {};

        if (chapterId) {
          params.chapterId =
            chapterId;
        }

        const response =
          await api.get(
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

  getTestDetail:
    async (testId) => {
      try {
        const response =
          await api.get(
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
  getDashboard: async () => {
    try {
      const response =
        await api.get(
          '/student/dashboard'
        );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.getDashboard();
      }

      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response =
        await api.get(
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

  updateProfile:
    async (data) => {
      try {
        const response =
          await api.put(
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

  getStreak: async () => {
    try {
      const response =
        await api.get(
          '/student/streak'
        );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.getStreak();
      }

      throw error;
    }
  },

  updateStreak: async () => {
    try {
      const response =
        await api.post(
          '/student/streak'
        );

      return response.data;
    } catch (error) {
      if (
        import.meta.env.DEV &&
        !error.response
      ) {
        return mockAPI.student.updateStreak();
      }

      throw error;
    }
  },

  getRewards: async () => {
    try {
      const response =
        await api.get(
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

  redeemReward:
    async (rewardId) => {
      try {
        const response =
          await api.post(
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

  submitTest:
    async (
      testId,
      answers,
      timeTaken = null
    ) => {
      try {
        const response =
          await api.post(
            `/student/tests/${testId}/submit`,
            {
              answers,
              timeTaken
            }
          );

        return response.data;
      } catch (error) {
        if (
          import.meta.env.DEV &&
          !error.response
        ) {
          return mockAPI.student.submitTest(
            testId,
            answers
          );
        }

        throw error;
      }
    },

  getResults: async () => {
    try {
      const response =
        await api.get(
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

  getResultDetail:
    async (resultId) => {
      const response =
        await api.get(
          `/student/results/${resultId}`
        );

      return response.data;
    },

  getAnalytics: async () => {
    const response =
      await api.get(
        '/student/analytics'
      );

    return response.data;
  },

  getLeaderboard:
    async () => {
      try {
        const response =
          await api.get(
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
      const response =
        await api.get(
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

  updateProfile:
    async (data) => {
      try {
        const response =
          await api.put(
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

  createChapter:
    async (data) => {
      const response =
        await api.post(
          '/teacher/chapters',
          data
        );

      return response.data;
    },

  // ==========================================
  // TEACHER STUDY NOTE
  // Supports JSON and FormData
  // ==========================================

  createNote:
    async (data) => {
      const isFormData =
        typeof FormData !==
          'undefined' &&
        data instanceof FormData;

      const response =
        await api.post(
          '/teacher/notes',
          data,
          isFormData
            ? {
                headers: {
                  'Content-Type':
                    undefined
                }
              }
            : undefined
        );

      return response.data;
    },

  createPYQ:
    async (data) => {
      const response =
        await api.post(
          '/teacher/pyqs',
          data
        );

      return response.data;
    },

  createTest:
    async (data) => {
      const response =
        await api.post(
          '/teacher/tests',
          data
        );

      return response.data;
    },

  getTests: async () => {
    try {
      const response =
        await api.get(
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
      const response =
        await api.get(
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
  },

  getStudentMetrics:
    async () => {
      const response =
        await api.get(
          '/teacher/student-metrics'
        );

      return response.data;
    },

  getQuestions: async () => {
    const response =
      await api.get(
        '/teacher/questions'
      );

    return response.data;
  },

  createQuestion:
    async (data) => {
      const response =
        await api.post(
          '/teacher/questions',
          data
        );

      return response.data;
    },

  deleteQuestion:
    async (id) => {
      const response =
        await api.delete(
          `/teacher/questions/${id}`
        );

      return response.data;
    }
};

// ============================================
// ADMIN API
// ============================================

export const adminAPI = {
  getDashboard: async () => {
    try {
      const response =
        await api.get(
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

  getDashboardStats:
    async () => {
      try {
        const response =
          await api.get(
            '/admin/dashboard-stats'
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
      const response =
        await api.get(
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

  createUser:
    async (data) => {
      try {
        const response =
          await api.post(
            '/admin/users',
            data
          );

        return response.data;
      } catch (error) {
        if (
          import.meta.env.DEV &&
          !error.response
        ) {
          return mockAPI.admin.createUser(
            data
          );
        }

        throw error;
      }
    },

  updateUser:
    async (
      userId,
      data
    ) => {
      try {
        const response =
          await api.put(
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

  updateStudentProfile:
    async (
      userId,
      data
    ) => {
      const response =
        await api.put(
          `/admin/students/${userId}`,
          data
        );

      return response.data;
    },

  deleteUser:
    async (userId) => {
      try {
        const response =
          await api.delete(
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

  // ==========================================
  // SUBJECTS
  // ==========================================

  createSubject:
    async (data) => {
      try {
        const response =
          await api.post(
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

  deleteSubject:
    async (id) => {
      const response =
        await api.delete(
          `/admin/subjects/${id}`
        );

      return response.data;
    },

  // ==========================================
  // CHAPTERS
  // ==========================================

  createChapter:
    async (data) => {
      try {
        const response =
          await api.post(
            '/teacher/chapters',
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

  deleteChapter:
    async (id) => {
      const response =
        await api.delete(
          `/admin/chapters/${id}`
        );

      return response.data;
    },

  // ==========================================
  // STUDY NOTES
  //
  // IMPORTANT FIX
  //
  // AdminDashboard.jsx sends FormData:
  //
  // chapterId
  // subjectId
  // exam
  // className
  // title
  // content
  // pdf
  // OR pdfUrl
  //
  // Do NOT manually set multipart/form-data.
  // Browser/Axios must generate the boundary.
  // ==========================================

  createNote:
    async (data) => {
      try {
        const isFormData =
          typeof FormData !==
            'undefined' &&
          data instanceof FormData;

        let response;

        if (isFormData) {
          response =
            await api.post(
              '/teacher/notes',
              data,
              {
                headers: {
                  // Remove the default JSON
                  // Content-Type so Axios/browser
                  // can generate:
                  //
                  // multipart/form-data;
                  // boundary=...
                  //
                  'Content-Type':
                    undefined
                }
              }
            );
        } else {
          response =
            await api.post(
              '/teacher/notes',
              data
            );
        }

        return response.data;
      } catch (error) {
        console.error(
          'NAVTA createNote failed:',
          error.response?.data ||
            error.message
        );

        // FormData containing a File cannot
        // meaningfully be persisted to the
        // local mock database as the actual
        // uploaded server PDF.
        //
        // Only use mock fallback for normal
        // JSON note data.

        const isFormData =
          typeof FormData !==
            'undefined' &&
          data instanceof FormData;

        if (
          import.meta.env.DEV &&
          !error.response &&
          !isFormData
        ) {
          return mockAPI.admin.createNote(
            data
          );
        }

        throw new Error(
          getApiErrorMessage(
            error,
            'Failed to upload study note.'
          )
        );
      }
    },

  deleteNote:
    async (id) => {
      const response =
        await api.delete(
          `/admin/notes/${id}`
        );

      return response.data;
    },

  // ==========================================
  // PYQ
  // ==========================================

  createPYQ:
    async (data) => {
      const response =
        await api.post(
          '/teacher/pyqs',
          data
        );

      return response.data;
    },

  deletePYQ:
    async (id) => {
      const response =
        await api.delete(
          `/admin/pyqs/${id}`
        );

      return response.data;
    },

  // ==========================================
  // REWARDS
  // ==========================================

  createReward:
    async (data) => {
      try {
        const response =
          await api.post(
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

  // ==========================================
  // QUESTIONS
  // ==========================================

  getQuestions:
    async () => {
      const response =
        await api.get(
          '/admin/questions'
        );

      return response.data;
    },

  createQuestion:
    async (data) => {
      const response =
        await api.post(
          '/admin/questions',
          data
        );

      return response.data;
    },

  deleteQuestion:
    async (id) => {
      const response =
        await api.delete(
          `/admin/questions/${id}`
        );

      return response.data;
    },

  // ==========================================
  // TESTS
  // ==========================================

  createTest:
    async (data) => {
      const response =
        await api.post(
          '/teacher/tests',
          data
        );

      return response.data;
    },

  getAllResults:
    async () => {
      try {
        const response =
          await api.get(
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
  // ==========================================
  // GENERATE STANDARD TEST
  // ==========================================

  generateTest:
    async (data) => {
      const response =
        await api.post(
          '/navta-test/generate',
          data
        );

      return response.data;
    },

  // Alias used by some older components
  generate:
    async (data) => {
      const response =
        await api.post(
          '/navta-test/generate',
          data
        );

      return response.data;
    },

  // ==========================================
  // GET QUESTIONS
  // ==========================================

  getQuestions:
    async (params = {}) => {
      const response =
        await api.get(
          '/navta-test/questions',
          {
            params
          }
        );

      return response.data;
    },

  // ==========================================
  // CHECK MCQ ANSWER
  // ==========================================

  checkAnswer:
    async (data) => {
      const response =
        await api.post(
          '/navta-test/check-answer',
          data
        );

      return response.data;
    },

  // ==========================================
  // EVALUATE WRITTEN ANSWER
  // ==========================================

  evaluateWrittenAnswer:
    async (data) => {
      const response =
        await api.post(
          '/navta-test/evaluate-written',
          data
        );

      return response.data;
    },

  // Alias
  evaluateWritten:
    async (data) => {
      const response =
        await api.post(
          '/navta-test/evaluate-written',
          data
        );

      return response.data;
    },

  // ==========================================
  // SUBMIT TEST
  // ==========================================

  submitTest:
    async (data) => {
      const response =
        await api.post(
          '/navta-test/submit',
          data
        );

      return response.data;
    },

  // ==========================================
  // SAVE RESULT
  // ==========================================

  saveResult:
    async (data) => {
      const response =
        await api.post(
          '/navta-test/results',
          data
        );

      return response.data;
    },

  // ==========================================
  // BOSS BATTLE
  // ==========================================

  generateBossBattle:
    async (data) => {
      const response =
        await api.post(
          '/navta-test/boss-battle',
          data
        );

      return response.data;
    },

  // Alias
  generateBoss:
    async (data) => {
      const response =
        await api.post(
          '/navta-test/boss-battle',
          data
        );

      return response.data;
    },

  // ==========================================
  // REVENGE BATTLE
  // ==========================================

  generateRevenge:
    async (data) => {
      const response =
        await api.post(
          '/navta-test/revenge',
          data
        );

      return response.data;
    }
};

// ============================================
// MISTAKE NOTEBOOK API
// ============================================

export const mistakeNotebookAPI = {
  // ==========================================
  // GET ALL MISTAKES
  // ==========================================

  getMistakes:
    async (params = {}) => {
      const response =
        await api.get(
          '/mistake-notebook',
          {
            params
          }
        );

      return response.data;
    },

  // Alias
  getAll:
    async (params = {}) => {
      const response =
        await api.get(
          '/mistake-notebook',
          {
            params
          }
        );

      return response.data;
    },

  // ==========================================
  // GET ONE MISTAKE
  // ==========================================

  getMistake:
    async (id) => {
      const response =
        await api.get(
          `/mistake-notebook/${id}`
        );

      return response.data;
    },

  // ==========================================
  // SAVE MISTAKE
  // ==========================================

  addMistake:
    async (data) => {
      const response =
        await api.post(
          '/mistake-notebook',
          data
        );

      return response.data;
    },

  // Aliases used by different versions
  saveMistake:
    async (data) => {
      const response =
        await api.post(
          '/mistake-notebook',
          data
        );

      return response.data;
    },

  create:
    async (data) => {
      const response =
        await api.post(
          '/mistake-notebook',
          data
        );

      return response.data;
    },

  // ==========================================
  // UPDATE MISTAKE
  // ==========================================

  updateMistake:
    async (
      id,
      data
    ) => {
      const response =
        await api.put(
          `/mistake-notebook/${id}`,
          data
        );

      return response.data;
    },

  // ==========================================
  // DELETE MISTAKE
  // ==========================================

  deleteMistake:
    async (id) => {
      const response =
        await api.delete(
          `/mistake-notebook/${id}`
        );

      return response.data;
    },

  // ==========================================
  // MARK MASTERED
  // ==========================================

  markMastered:
    async (id) => {
      const response =
        await api.patch(
          `/mistake-notebook/${id}/mastered`
        );

      return response.data;
    },

  // ==========================================
  // STATS
  // ==========================================

  getStats:
    async () => {
      const response =
        await api.get(
          '/mistake-notebook/stats'
        );

      return response.data;
    }
};

// ============================================
// PANIC MODE API
// ============================================

export const panicModeAPI = {
  // ==========================================
  // GET CURRENT PLAN
  // ==========================================

  getPlan:
    async () => {
      const response =
        await api.get(
          '/panic-mode/plan'
        );

      return response.data;
    },

  // ==========================================
  // CREATE PLAN
  // ==========================================

  createPlan:
    async (data) => {
      const response =
        await api.post(
          '/panic-mode/plan',
          data
        );

      return response.data;
    },

  // ==========================================
  // RESET PLAN
  // ==========================================

  resetPlan:
    async () => {
      const response =
        await api.delete(
          '/panic-mode/plan'
        );

      return response.data;
    },

  // ==========================================
  // UPDATE CHAPTER PROGRESS
  // ==========================================

  updateChapterProgress:
    async (
      chapterId,
      data
    ) => {
      const response =
        await api.patch(
          `/panic-mode/chapters/${chapterId}`,
          data
        );

      return response.data;
    },

  // ==========================================
  // GENERATE TARGETED PRACTICE
  // ==========================================

  generatePractice:
    async (
      chapterId,
      data = {}
    ) => {
      const response =
        await api.post(
          `/panic-mode/chapters/${chapterId}/practice`,
          data
        );

      return response.data;
    },

  // ==========================================
  // CHECK PRACTICE ANSWER
  // ==========================================

  checkPracticeAnswer:
    async (
      chapterId,
      data
    ) => {
      const response =
        await api.post(
          `/panic-mode/chapters/${chapterId}/practice/check`,
          data
        );

      return response.data;
    },

  // ==========================================
  // COMPLETE PRACTICE
  // ==========================================

  completePractice:
    async (
      chapterId,
      questionIds = []
    ) => {
      const response =
        await api.post(
          `/panic-mode/chapters/${chapterId}/practice/complete`,
          {
            questionIds
          }
        );

      return response.data;
    },

  // ==========================================
  // START FIX TEST
  // ==========================================

  startFixTest:
    async (chapterId) => {
      const response =
        await api.post(
          `/panic-mode/chapters/${chapterId}/fix-test/start`
        );

      return response.data;
    },

  // ==========================================
  // SUBMIT FIX TEST
  // ==========================================

  submitFixTest:
    async (
      chapterId,
      attemptId,
      answers
    ) => {
      const response =
        await api.post(
          `/panic-mode/chapters/${chapterId}/fix-test/submit`,
          {
            attemptId,
            answers
          }
        );

      return response.data;
    },

  // ==========================================
  // GET PANIC MODE STATS
  // ==========================================

  getStats:
    async () => {
      const response =
        await api.get(
          '/panic-mode/stats'
        );

      return response.data;
    }
};

// ============================================
// NAVTA AI API
// ============================================

export const navtaAIAPI = {
  chat:
    async (data) => {
      const response =
        await api.post(
          '/ai/chat',
          data
        );

      return response.data;
    },

  ask:
    async (message) => {
      const response =
        await api.post(
          '/ai/chat',
          {
            message
          }
        );

      return response.data;
    }
};

// ============================================
// HEALTH API
// ============================================

export const healthAPI = {
  check: async () => {
    const response =
      await api.get(
        '/health'
      );

    return response.data;
  }
};

// ============================================
// DEFAULT AXIOS EXPORT
// ============================================

export default api;
