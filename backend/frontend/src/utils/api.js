import axios from 'axios';

// ============================================
// API BASE URL
// ============================================
//
// Accepts either:
//   https://example.com
//   https://example.com/
//   https://example.com/api
//   https://example.com/api/
//
// and guarantees exactly one /api suffix.
//
const rawEnvUrl = String(
  import.meta.env.VITE_API_URL || ''
).trim();

const normalizedEnvUrl =
  rawEnvUrl.replace(/\/+$/, '');

const API_URL = normalizedEnvUrl
  ? (
      normalizedEnvUrl.endsWith('/api')
        ? normalizedEnvUrl
        : `${normalizedEnvUrl}/api`
    )
  : '/api';

const api = axios.create({
  baseURL: API_URL,

  // Prevent a dead backend request from hanging the
  // whole admin dashboard forever.
  timeout: 15000,

  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token');

    if (token) {
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
      localStorage.removeItem(
        'token'
      );

      localStorage.removeItem(
        'user'
      );
    }

    return Promise.reject(error);
  }
);

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
  // AUTH ROUTES
  // ==========================================

  auth: {
    register: async (data) => {
      const db =
        getMockDB();

      const existingUser =
        db.users.find(
          (user) =>
            user.email ===
            data.email
        );

      if (existingUser) {
        throw new Error(
          'User already exists'
        );
      }

      const user = {
        id:
          'user_' +
          Date.now(),

        name:
          data.name,

        email:
          data.email,

        password:
          data.password,

        role:
          data.role ||
          'student',

        isVerified:
          true,

        isProfileComplete:
          false,

        createdAt:
          new Date().toISOString()
      };

      db.users.push(user);

      saveMockDB(db);

      return {
        success:
          true,

        token:
          'mock_jwt_token_' +
          user.id,

        user: {
          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role,

          isVerified:
            user.isVerified,

          isProfileComplete:
            user.isProfileComplete
        }
      };
    },

    login: async (data) => {
      const db =
        getMockDB();

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
        success:
          true,

        token:
          'mock_jwt_token_' +
          user.id,

        user: {
          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role,

          isVerified:
            user.isVerified,

          isProfileComplete:
            user.isProfileComplete
        }
      };
    },

    getMe: async () => {
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

      const db =
        getMockDB();

      const user =
        db.users.find(
          (item) =>
            item.id ===
            userId
        );

      if (!user) {
        throw new Error(
          'User not found'
        );
      }

      return {
        success:
          true,

        user: {
          ...user
        }
      };
    },

    googleLogin: async (
      credential
    ) => {
      const db =
        getMockDB();

      const user = {
        id:
          'google_' +
          Date.now(),

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

      db.students[
        user.id
      ] = {
        user:
          user.id,

        coins:
          0,

        xp:
          0,

        level:
          1,

        stream:
          'General',

        badges: [
          {
            name:
              'Welcome Aboard',

            icon:
              'award',

            earnedAt:
              new Date().toISOString()
          }
        ],

        rewardsRedeemed:
          []
      };

      db.streaks[
        user.id
      ] = {
        user:
          user.id,

        currentStreak:
          1,

        longestStreak:
          1,

        lastActiveDate:
          new Date().toISOString()
      };

      saveMockDB(db);

      return {
        success:
          true,

        token:
          'mock_jwt_token_' +
          user.id,

        user: {
          id:
            user.id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role,

          isVerified:
            user.isVerified,

          isProfileComplete:
            user.isProfileComplete
        }
      };
    },

    completeProfile: async (
      data
    ) => {
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

      const db =
        getMockDB();

      const user =
        db.users.find(
          (u) =>
            u.id === userId
        );

      if (!user) {
        throw new Error(
          'User not found'
        );
      }

      if (data.role) {
        user.role =
          data.role;
      }

      if (data.stream) {
        user.stream =
          data.stream;
      }

      if (data.department) {
        user.department =
          data.department;
      }

      if (data.schoolName) {
        user.schoolName =
          data.schoolName;
      }

      if (data.address) {
        user.address =
          data.address;
      }

      user.isProfileComplete =
        true;

      if (
        user.role ===
          'student' &&
        !db.students[
          userId
        ]
      ) {
        db.students[
          userId
        ] = {
          user:
            userId,

          coins:
            0,

          xp:
            0,

          level:
            1,

          stream:
            data.stream ||
            'General',

          badges:
            [],

          rewardsRedeemed:
            []
        };
      } else if (
        user.role ===
          'teacher' &&
        !db.teachers[
          userId
        ]
      ) {
        db.teachers[
          userId
        ] = {
          user:
            userId,

          qualification:
            'Qualified Educator',

          bio:
            '',

          subjects:
            []
        };
      }

      saveMockDB(db);

      return {
        success:
          true,

        user: {
          ...user
        }
      };
    }
  },

  // ==========================================
  // CONTENT ROUTES
  // ==========================================

  content: {
    getSubjects: async () => {
      const db =
        getMockDB();

      return {
        success:
          true,

        data:
          db.subjects
      };
    },

    getChapters: async (
      subjectId
    ) => {
      const db =
        getMockDB();

      const chapters =
        db.chapters.filter(
          (chapter) =>
            chapter.subject ===
            subjectId
        );

      return {
        success:
          true,

        data:
          chapters
      };
    },

    getNotes: async (
      chapterId
    ) => {
      const db =
        getMockDB();

      const notes =
        db.notes.filter(
          (note) =>
            note.chapter ===
            chapterId
        );

      return {
        success:
          true,

        data:
          notes
      };
    },

    getPYQs: async (
      subjectId
    ) => {
      const db =
        getMockDB();

      const pyqs =
        db.pyqs.filter(
          (pyq) =>
            pyq.subject ===
            subjectId
        );

      return {
        success:
          true,

        data:
          pyqs
      };
    },

    getTests: async (
      subjectId,
      chapterId = null
    ) => {
      const db =
        getMockDB();

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
              test.chapter &&
              test.chapter._id ===
                chapterId
          );
      }

      return {
        success:
          true,

        data:
          tests
      };
    },

    getTestDetail: async (
      testId
    ) => {
      const db =
        getMockDB();

      const test =
        db.tests.find(
          (item) =>
            item._id ===
            testId
        );

      if (!test) {
        throw new Error(
          'Test not found'
        );
      }

      const questionsList =
        test.questions.map(
          (questionId) =>
            db.questions.find(
              (question) =>
                question._id ===
                questionId
            )
        );

      return {
        success:
          true,

        data: {
          ...test,

          questions:
            questionsList
        }
      };
    }
  },

  // ==========================================
  // STUDENT ROUTES
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

      const db =
        getMockDB();

      const student =
        db.students[
          userId
        ] || {
          coins:
            0,

          xp:
            0,

          level:
            1,

          badges:
            []
        };

      const streak =
        db.streaks[
          userId
        ] || {
          currentStreak:
            0,

          longestStreak:
            0
        };

      return {
        success:
          true,

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

      const db =
        getMockDB();

      const user =
        db.users.find(
          (item) =>
            item.id ===
            userId
        );

      const student =
        db.students[
          userId
        ];

      return {
        success:
          true,

        data: {
          ...user,
          ...student
        }
      };
    },

    updateProfile: async (
      data
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

      const db =
        getMockDB();

      const userIndex =
        db.users.findIndex(
          (item) =>
            item.id ===
            userId
        );

      if (
        userIndex !== -1
      ) {
        db.users[
          userIndex
        ] = {
          ...db.users[
            userIndex
          ],

          ...data
        };
      }

      if (
        db.students[
          userId
        ]
      ) {
        db.students[
          userId
        ] = {
          ...db.students[
            userId
          ],

          ...data
        };
      }

      saveMockDB(db);

      return {
        success:
          true,

        data: {
          ...db.users[
            userIndex
          ],

          ...db.students[
            userId
          ]
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

      const db =
        getMockDB();

      const streak =
        db.streaks[
          userId
        ] || {
          currentStreak:
            0,

          longestStreak:
            0
        };

      return {
        success:
          true,

        data:
          streak
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

      const db =
        getMockDB();

      if (
        !db.streaks[
          userId
        ]
      ) {
        db.streaks[
          userId
        ] = {
          user:
            userId,

          currentStreak:
            1,

          longestStreak:
            1,

          lastActiveDate:
            new Date().toISOString()
        };
      } else {
        const streak =
          db.streaks[
            userId
          ];

        streak.currentStreak +=
          1;

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
        success:
          true,

        data:
          db.streaks[
            userId
          ]
      };
    },

    getRewards: async () => {
      const db =
        getMockDB();

      return {
        success:
          true,

        data:
          db.rewards
      };
    },

    redeemReward: async (
      rewardId
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

      const db =
        getMockDB();

      const reward =
        db.rewards.find(
          (item) =>
            item._id ===
            rewardId
        );

      const student =
        db.students[
          userId
        ];

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
        success:
          true,

        data: {
          reward,
          coins:
            student.coins
        }
      };
    },

    submitTest: async (
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

      const db =
        getMockDB();

      const test =
        db.tests.find(
          (item) =>
            item._id ===
            testId
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
          'result_' +
          Date.now(),

        user:
          userId,

        test:
          testId,

        answers,

        correct,

        total,

        score,

        createdAt:
          new Date().toISOString()
      };

      db.results.push(
        result
      );

      if (
        db.students[
          userId
        ]
      ) {
        db.students[
          userId
        ].xp +=
          correct * 10;
      }

      saveMockDB(db);

      return {
        success:
          true,

        data:
          result
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

      const db =
        getMockDB();

      return {
        success:
          true,

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
        const db =
          getMockDB();

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
                b.xp -
                a.xp
            );

        return {
          success:
            true,

          data:
            leaderboard
        };
      }
  },

  // ==========================================
  // TEACHER ROUTES
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

      const db =
        getMockDB();

      const user =
        db.users.find(
          (item) =>
            item.id ===
            userId
        );

      const teacher =
        db.teachers[
          userId
        ];

      return {
        success:
          true,

        data: {
          ...user,
          ...teacher
        }
      };
    },

    updateProfile: async (
      data
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

      const db =
        getMockDB();

      if (
        !db.teachers[
          userId
        ]
      ) {
        db.teachers[
          userId
        ] = {
          user:
            userId
        };
      }

      db.teachers[
        userId
      ] = {
        ...db.teachers[
          userId
        ],

        ...data
      };

      saveMockDB(db);

      return {
        success:
          true,

        data:
          db.teachers[
            userId
          ]
      };
    },

    createNote: async (
      data
    ) => {
      const db =
        getMockDB();

      const note = {
        _id:
          'note_' +
          Date.now(),

        ...data
      };

      db.notes.push(
        note
      );

      saveMockDB(db);

      return {
        success:
          true,

        data:
          note
      };
    },

    createQuestion:
      async (data) => {
        const db =
          getMockDB();

        const question = {
          _id:
            'question_' +
            Date.now(),

          ...data
        };

        db.questions.push(
          question
        );

        saveMockDB(db);

        return {
          success:
            true,

          data:
            question
        };
      },

    createTest: async (
      data
    ) => {
      const db =
        getMockDB();

      const test = {
        _id:
          'test_' +
          Date.now(),

        ...data
      };

      db.tests.push(
        test
      );

      saveMockDB(db);

      return {
        success:
          true,

        data:
          test
      };
    },

    getTests: async () => {
      const db =
        getMockDB();

      return {
        success:
          true,

        data:
          db.tests
      };
    },

    getResults: async () => {
      const db =
        getMockDB();

      return {
        success:
          true,

        data:
          db.results
      };
    }
  },

  // ==========================================
  // ADMIN ROUTES
  // ==========================================

  admin: {
    getDashboard: async () => {
      const db =
        getMockDB();

      return {
        success:
          true,

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
      const db =
        getMockDB();

      return {
        success:
          true,

        data:
          db.users
      };
    },

    updateUser: async (
      userId,
      data
    ) => {
      const db =
        getMockDB();

      const index =
        db.users.findIndex(
          (user) =>
            user.id ===
            userId
        );

      if (
        index === -1
      ) {
        throw new Error(
          'User not found'
        );
      }

      db.users[
        index
      ] = {
        ...db.users[
          index
        ],

        ...data
      };

      saveMockDB(db);

      return {
        success:
          true,

        data:
          db.users[
            index
          ]
      };
    },

    deleteUser: async (
      userId
    ) => {
      const db =
        getMockDB();

      db.users =
        db.users.filter(
          (user) =>
            user.id !==
            userId
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
        success:
          true,

        message:
          'User deleted'
      };
    },

    createSubject: async (
      data
    ) => {
      const db =
        getMockDB();

      const subject = {
        _id:
          'subject_' +
          Date.now(),

        ...data
      };

      db.subjects.push(
        subject
      );

      saveMockDB(db);

      return {
        success:
          true,

        data:
          subject
      };
    },

    createChapter: async (
      data
    ) => {
      const db =
        getMockDB();

      const chapter = {
        _id:
          'chapter_' +
          Date.now(),

        ...data
      };

      db.chapters.push(
        chapter
      );

      saveMockDB(db);

      return {
        success:
          true,

        data:
          chapter
      };
    },

    createReward: async (
      data
    ) => {
      const db =
        getMockDB();

      const reward = {
        _id:
          'reward_' +
          Date.now(),

        ...data
      };

      db.rewards.push(
        reward
      );

      saveMockDB(db);

      return {
        success:
          true,

        data:
          reward
      };
    },

    getAllResults:
      async () => {
        const db =
          getMockDB();

        return {
          success:
            true,

          data:
            db.results
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
        return mockAPI.auth.register(
          data
        );
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
        return mockAPI.auth.login(
          data
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

  googleLogin: async (
    credential
  ) => {
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

      const payload =
        response?.data;

      console.log(
        'NAVTA API /content/subjects:',
        payload
      );

      return payload;
    } catch (error) {
      console.error(
        'NAVTA getSubjects failed:',
        {
          url:
            `${API_URL}/content/subjects`,

          status:
            error?.response?.status,

          data:
            error?.response?.data,

          message:
            error?.message
        }
      );

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
  getDashboard: async () => {
    try {
      const response = await api.get(
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

  getStreak: async () => {
    try {
      const response = await api.get(
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
      const response = await api.post(
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

  redeemReward: async (
    rewardId
  ) => {
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

  submitTest: async (
    testId,
    answers
  ) => {
    try {
      const response = await api.post(
        `/student/tests/${testId}/submit`,
        {
          answers
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
  // AdminDashboard.jsx uses getDashboardStats().
  // Keep getDashboard() as well for older components.
  getDashboardStats: async () => {
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

  createUser: async (data) => {
    try {
      const response = await api.post(
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

  // AdminDashboard.jsx uses getQuestions().
  // NAVTA Test questions are managed under /navta-test/questions.
  getQuestions: async () => {
    try {
      const response = await api.get(
        '/navta-test/questions'
      );

      return response.data;
    } catch (error) {
      console.error(
        'NAVTA admin getQuestions failed:',
        {
          status:
            error?.response?.status,

          data:
            error?.response?.data,

          message:
            error?.message
        }
      );

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
  getPlan: async () => {
    const response = await api.get(
      '/panic-mode/plan'
    );

    return response.data;
  },

  createPlan: async (data) => {
    const response = await api.post(
      '/panic-mode/plan',
      data
    );

    return response.data;
  },

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
  // START SECURE FIX TEST
  // ------------------------------------------

  startFixTest: async (
    chapterId,
    data = {}
  ) => {
    const response = await api.post(
      `/panic-mode/chapters/${chapterId}/fix-test/start`,
      data
    );

    return response.data;
  },

  // ------------------------------------------
  // SUBMIT SECURE FIX TEST
  // ------------------------------------------

  submitFixTest: async (
    chapterId,
    attemptId,
    answers
  ) => {
    const response = await api.post(
      `/panic-mode/chapters/${chapterId}/fix-test/submit`,
      {
        attemptId,
        answers
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
