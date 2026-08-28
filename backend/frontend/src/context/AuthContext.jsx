import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback
} from 'react';

import {
  authAPI,
  studentAPI
} from '../utils/api';

const AuthContext = createContext();

/* =====================================================
   AUTH PROVIDER
===================================================== */

export const AuthProvider = ({ children }) => {
  const [user, setUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [streak, setStreak] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  /* ===================================================
     LOAD NAVTA TEST STREAK
  =================================================== */

  const loadStudentStreak =
    useCallback(
      async (
        currentUser,
        fallbackStreak = null
      ) => {
        /*
         * Only students use the NAVTA TEST
         * streak system.
         */
        if (
          !currentUser ||
          currentUser.role !== 'student'
        ) {
          setStreak(
            fallbackStreak || null
          );

          return (
            fallbackStreak || null
          );
        }

        try {
          const analyticsResponse =
            await studentAPI.getAnalytics();

          /*
           * api.js may return either:
           *
           * response
           *
           * OR
           *
           * response.data
           *
           * depending on your API wrapper.
           */
          const analyticsData =
            analyticsResponse?.data ||
            analyticsResponse ||
            {};

          const navtaStreak =
            analyticsData?.streak ||
            fallbackStreak ||
            null;

          setStreak(navtaStreak);

          return navtaStreak;
        } catch (err) {
          console.error(
            'Failed to load NAVTA streak:',
            err
          );

          /*
           * Do not log the student out
           * just because analytics failed.
           */
          setStreak(
            fallbackStreak || null
          );

          return (
            fallbackStreak || null
          );
        }
      },
      []
    );

  /* ===================================================
     REFRESH STREAK
  =================================================== */

  const refreshStreak =
    useCallback(
      async () => {
        if (
          !user ||
          user.role !== 'student'
        ) {
          return null;
        }

        return loadStudentStreak(
          user,
          streak
        );
      },
      [
        user,
        streak,
        loadStudentStreak
      ]
    );

  /* ===================================================
     LOAD CURRENT USER
  =================================================== */

  const loadCurrentUser =
    useCallback(
      async () => {
        const token =
          localStorage.getItem('token');

        if (!token) {
          setUser(null);
          setProfile(null);
          setStreak(null);
          return null;
        }

        const response =
          await authAPI.getMe();

        const currentUser =
          response?.user || null;

        const currentProfile =
          response?.profile || null;

        const fallbackStreak =
          response?.streak || null;

        setUser(currentUser);
        setProfile(currentProfile);

        await loadStudentStreak(
          currentUser,
          fallbackStreak
        );

        return currentUser;
      },
      [loadStudentStreak]
    );

  /* ===================================================
     INITIAL AUTH LOAD
  =================================================== */

  useEffect(() => {
    let mounted = true;

    const initialiseAuth =
      async () => {
        try {
          const token =
            localStorage.getItem(
              'token'
            );

          if (!token) {
            if (mounted) {
              setUser(null);
              setProfile(null);
              setStreak(null);
            }

            return;
          }

          await loadCurrentUser();
        } catch (err) {
          console.error(
            'Failed to load user:',
            err
          );

          localStorage.removeItem(
            'token'
          );

          if (mounted) {
            setUser(null);
            setProfile(null);
            setStreak(null);
            setError(null);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    initialiseAuth();

    return () => {
      mounted = false;
    };
  }, [loadCurrentUser]);

  /* ===================================================
     LOGIN
  =================================================== */

  const login =
    async (
      email,
      password
    ) => {
      setLoading(true);
      setError(null);

      try {
        const loginResponse =
          await authAPI.login({
            email,
            password
          });

        localStorage.setItem(
          'token',
          loginResponse.token
        );

        /*
         * Load fresh profile immediately
         * after token has been stored.
         */
        const profileResponse =
          await authAPI.getMe();

        const currentUser =
          profileResponse?.user ||
          null;

        const currentProfile =
          profileResponse?.profile ||
          null;

        const fallbackStreak =
          profileResponse?.streak ||
          null;

        setUser(currentUser);
        setProfile(currentProfile);

        await loadStudentStreak(
          currentUser,
          fallbackStreak
        );

        setLoading(false);

        return currentUser;
      } catch (err) {
        console.error(
          'Login failed:',
          err
        );

        localStorage.removeItem(
          'token'
        );

        setUser(null);
        setProfile(null);
        setStreak(null);

        setError(
          err?.message ||
          'Login failed'
        );

        setLoading(false);

        throw err;
      }
    };

  /* ===================================================
     GOOGLE LOGIN
  =================================================== */

  const googleLogin =
    async (
      credential
    ) => {
      setLoading(true);
      setError(null);

      try {
        const loginResponse =
          await authAPI.googleLogin(
            credential
          );

        localStorage.setItem(
          'token',
          loginResponse.token
        );

        const profileResponse =
          await authAPI.getMe();

        const currentUser =
          profileResponse?.user ||
          null;

        const currentProfile =
          profileResponse?.profile ||
          null;

        const fallbackStreak =
          profileResponse?.streak ||
          null;

        setUser(currentUser);
        setProfile(currentProfile);

        await loadStudentStreak(
          currentUser,
          fallbackStreak
        );

        setLoading(false);

        return currentUser;
      } catch (err) {
        console.error(
          'Google login failed:',
          err
        );

        localStorage.removeItem(
          'token'
        );

        setUser(null);
        setProfile(null);
        setStreak(null);

        setError(
          err?.message ||
          'Google login failed'
        );

        setLoading(false);

        throw err;
      }
    };

  /* ===================================================
     REGISTER
  =================================================== */

  const register =
    async (
      signUpData
    ) => {
      setLoading(true);
      setError(null);

      try {
        const registerResponse =
          await authAPI.register(
            signUpData
          );

        localStorage.setItem(
          'token',
          registerResponse.token
        );

        const profileResponse =
          await authAPI.getMe();

        const currentUser =
          profileResponse?.user ||
          null;

        const currentProfile =
          profileResponse?.profile ||
          null;

        const fallbackStreak =
          profileResponse?.streak ||
          null;

        setUser(currentUser);
        setProfile(currentProfile);

        await loadStudentStreak(
          currentUser,
          fallbackStreak
        );

        setLoading(false);

        return currentUser;
      } catch (err) {
        console.error(
          'Registration failed:',
          err
        );

        localStorage.removeItem(
          'token'
        );

        setUser(null);
        setProfile(null);
        setStreak(null);

        setError(
          err?.message ||
          'Registration failed'
        );

        setLoading(false);

        throw err;
      }
    };

  /* ===================================================
     LOGOUT
  =================================================== */

  const logout = () => {
    localStorage.removeItem(
      'token'
    );

    setUser(null);
    setProfile(null);
    setStreak(null);
    setError(null);
    setLoading(false);
  };

  /* ===================================================
     UPDATE PROFILE STATS
  =================================================== */

  const updateProfileStats = (
    newCoins,
    newXp,
    newLevel,
    newBadges = null
  ) => {
    setProfile(
      previousProfile => {
        if (!previousProfile) {
          return previousProfile;
        }

        const updatedProfile = {
          ...previousProfile,
          coins:
            newCoins !== undefined
              ? newCoins
              : previousProfile.coins,
          xp:
            newXp !== undefined
              ? newXp
              : previousProfile.xp,
          level:
            newLevel !== undefined
              ? newLevel
              : previousProfile.level
        };

        if (newBadges !== null) {
          updatedProfile.badges =
            newBadges;
        }

        return updatedProfile;
      }
    );
  };

  /* ===================================================
     UPDATE COIN BALANCE ONLY
  =================================================== */

  const updateCoinBalance = (
    newCoinBalance
  ) => {
    if (
      newCoinBalance === undefined ||
      newCoinBalance === null
    ) {
      return;
    }

    setProfile(
      previousProfile => {
        if (!previousProfile) {
          return previousProfile;
        }

        return {
          ...previousProfile,
          coins:
            Number(
              newCoinBalance
            ) || 0
        };
      }
    );
  };

  /* ===================================================
     UPDATE STREAK FROM NAVTA TEST RESPONSE
  =================================================== */

  const updateStreak = (
    newStreak
  ) => {
    if (!newStreak) {
      return;
    }

    setStreak(newStreak);
  };

  /* ===================================================
     CONTEXT
  =================================================== */

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        streak,

        loading,
        error,

        login,
        googleLogin,
        register,
        logout,

        loadCurrentUser,
        refreshStreak,

        updateProfileStats,
        updateCoinBalance,
        updateStreak,

        setUser,
        setProfile,
        setStreak
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =====================================================
   AUTH HOOK
===================================================== */

export const useAuth = () => {
  return useContext(
    AuthContext
  );
};
