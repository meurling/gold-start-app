import { useState, useEffect, useCallback } from 'react';
import { User, UserId, UserStorage, Role } from '../lib/user';

const userStorage = new UserStorage();

export interface UseUserReturn {
    users: User[];
    currentUser: User | null;
    isLoading: boolean;
    error: string | null;
    createUser: (name: string, role: Role) => Promise<User | null>;
    deleteUser: (id: UserId) => Promise<void>;
    switchUser: (id: UserId) => Promise<void>;
    clearCurrentUser: () => void;
    refreshUsers: () => Promise<void>;
}

export function useUser(): UseUserReturn {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const allUsers = await userStorage.list();
            setUsers(allUsers);
            
            const currentUserData = await userStorage.getCurrentUser();
            setCurrentUser(currentUserData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const createUser = useCallback(async (name: string, role: Role): Promise<User | null> => {
        try {
            setError(null);
            const newUser = await userStorage.create(name, role);
            await loadUsers();
            return newUser;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
            return null;
        }
    }, [loadUsers]);

    const deleteUser = useCallback(async (id: UserId): Promise<void> => {
        try {
            setError(null);
            await userStorage.delete(id);
            await loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
            throw err;
        }
    }, [loadUsers]);

    const switchUser = useCallback(async (id: UserId): Promise<void> => {
        try {
            setError(null);
            const user = await userStorage.getById(id);
            if (!user) {
                throw new Error('User not found');
            }
            userStorage.setCurrentUserId(id);
            setCurrentUser(user);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to switch user');
            throw err;
        }
    }, []);

    const clearCurrentUser = useCallback(() => {
        userStorage.clearCurrentUser();
        setCurrentUser(null);
    }, []);

    const refreshUsers = useCallback(async (): Promise<void> => {
        await loadUsers();
    }, [loadUsers]);

    return {
        users,
        currentUser,
        isLoading,
        error,
        createUser,
        deleteUser,
        switchUser,
        clearCurrentUser,
        refreshUsers,
    };
}