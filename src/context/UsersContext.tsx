import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getUsers,
  getUserById,
  getLeaderboard,
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
  getAuthToken,
  type UserRow,
  type UserInput,
  type LeaderboardRow,
} from "@/lib/api";

export const CURRENT_USER_ID_KEY = "phishguard_current_user_id";

function readStoredUserId(): number | null {
  try {
    const v = localStorage.getItem(CURRENT_USER_ID_KEY);
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function writeStoredUserId(id: number | null) {
  try {
    if (id == null) localStorage.removeItem(CURRENT_USER_ID_KEY);
    else localStorage.setItem(CURRENT_USER_ID_KEY, String(id));
  } catch {
    /* ignore */
  }
}

type UsersContextValue = {
  users: UserRow[];
  leaderboard: LeaderboardRow[];
  loading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
  currentUserId: number | null;
  setCurrentUserId: (id: number | null) => void;
  currentUser: UserRow | null;
  isAdmin: boolean;
  createUser: (body: UserInput) => Promise<UserRow>;
  updateUser: (id: number, body: UserInput) => Promise<UserRow>;
  deleteUser: (id: number) => Promise<void>;
  getUserFromCache: (id: number) => UserRow | undefined;
};

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserIdState] = useState<number | null>(
    readStoredUserId,
  );
  const mounted = useRef(true);

  const setCurrentUserId = useCallback((id: number | null) => {
    setCurrentUserIdState(id);
    writeStoredUserId(id);
  }, []);

  const refreshUsers = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      if (!mounted.current) return;
      setError(null);
      setUsers([]);
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const list = await getUsers();
      if (!mounted.current) return;
      setUsers(list);
      try {
        const board = await getLeaderboard(50);
        if (mounted.current) setLeaderboard(board);
      } catch {
        if (mounted.current) setLeaderboard([]);
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "Failed to load users");
      // Keep prior cache on transient fetch failures to avoid auth/UI flicker.
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refreshUsers();
    return () => {
      mounted.current = false;
    };
  }, [refreshUsers]);

  const currentUser = useMemo(() => {
    if (currentUserId == null) return null;
    return users.find((u) => u.id === currentUserId) ?? null;
  }, [users, currentUserId]);

  const isAdmin = useMemo(() => {
    return currentUser?.role === "ROLE_ADMIN";
  }, [currentUser]);

  const getUserFromCache = useCallback(
    (id: number) => users.find((u) => u.id === id),
    [users],
  );

  const createUser = useCallback(
    async (body: UserInput) => {
      const created = await apiCreateUser(body);
      await refreshUsers();
      return created;
    },
    [refreshUsers],
  );

  const updateUser = useCallback(
    async (id: number, body: UserInput) => {
      const updated = await apiUpdateUser(id, body);
      await refreshUsers();
      return updated;
    },
    [refreshUsers],
  );

  const deleteUser = useCallback(
    async (id: number) => {
      await apiDeleteUser(id);
      if (currentUserId === id) setCurrentUserId(null);
      await refreshUsers();
    },
    [refreshUsers, currentUserId, setCurrentUserId],
  );

  const value = useMemo<UsersContextValue>(
    () => ({
      users,
      leaderboard,
      loading,
      error,
      refreshUsers,
      currentUserId,
      setCurrentUserId,
      currentUser,
      isAdmin,
      createUser,
      updateUser,
      deleteUser,
      getUserFromCache,
    }),
    [
      users,
      leaderboard,
      loading,
      error,
      refreshUsers,
      currentUserId,
      setCurrentUserId,
      currentUser,
      isAdmin,
      createUser,
      updateUser,
      deleteUser,
      getUserFromCache,
    ],
  );

  return (
    <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
  );
}

export function useUsersContext(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) {
    throw new Error("useUsersContext must be used within UsersProvider");
  }
  return ctx;
}

/** List + loading/error + refresh */
export function useUsers() {
  const {
    users,
    leaderboard,
    loading,
    error,
    refreshUsers,
    getUserFromCache,
  } = useUsersContext();
  return { users, leaderboard, loading, error, refreshUsers, getUserFromCache };
}

/** Logged-in (selected) user from shared cache */
export function useCurrentUser() {
  const {
    currentUser,
    currentUserId,
    setCurrentUserId,
    loading,
    error,
    refreshUsers,
    isAdmin,
  } = useUsersContext();
  return {
    currentUser,
    currentUserId,
    setCurrentUserId,
    loading,
    error,
    refreshUsers,
    isAdmin,
  };
}

export function useCreateUser() {
  const { createUser } = useUsersContext();
  const [pending, setPending] = useState(false);
  const run = useCallback(
    async (body: UserInput) => {
      setPending(true);
      try {
        return await createUser(body);
      } finally {
        setPending(false);
      }
    },
    [createUser],
  );
  return { createUser: run, isLoading: pending };
}

export function useUpdateUser() {
  const { updateUser } = useUsersContext();
  const [pending, setPending] = useState(false);
  const run = useCallback(
    async (id: number, body: UserInput) => {
      setPending(true);
      try {
        return await updateUser(id, body);
      } finally {
        setPending(false);
      }
    },
    [updateUser],
  );
  return { updateUser: run, isLoading: pending };
}

export function useDeleteUser() {
  const { deleteUser } = useUsersContext();
  const [pending, setPending] = useState(false);
  const run = useCallback(
    async (id: number) => {
      setPending(true);
      try {
        await deleteUser(id);
      } finally {
        setPending(false);
      }
    },
    [deleteUser],
  );
  return { deleteUser: run, isLoading: pending };
}

/**
 * Profile by id: prefers shared user list; fetches one user if missing (deep link / stale cache).
 */
export function useUserProfile(userId: number | null) {
  const { users, loading, error, refreshUsers, getUserFromCache } =
    useUsersContext();
  const [oneOff, setOneOff] = useState<UserRow | null>(null);
  const [oneLoading, setOneLoading] = useState(false);
  const [oneError, setOneError] = useState<string | null>(null);

  const cached = userId != null ? getUserFromCache(userId) : undefined;

  useEffect(() => {
    if (userId == null) {
      setOneOff(null);
      setOneError(null);
      return;
    }
    if (cached) {
      setOneOff(null);
      setOneError(null);
      return;
    }
    let cancel = false;
    setOneLoading(true);
    setOneError(null);
    void getUserById(userId)
      .then((u) => {
        if (!cancel) setOneOff(u);
      })
      .catch((e) => {
        if (!cancel) {
          setOneOff(null);
          setOneError(e instanceof Error ? e.message : "User not found");
        }
      })
      .finally(() => {
        if (!cancel) setOneLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [userId, cached]);

  const user =
    userId == null ? null : (cached ?? oneOff ?? null);

  const notFound =
    userId != null &&
    !loading &&
    !oneLoading &&
    !user &&
    oneError != null;

  return {
    user,
    loading: loading || oneLoading,
    error: oneError ?? error,
    notFound,
    refreshUsers,
  };
}
