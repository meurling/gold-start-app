import React, { createContext, useContext, ReactNode } from 'react';
import { useUser, UseUserReturn } from '../hooks/useUser';

const UserContext = createContext<UseUserReturn | undefined>(undefined);

export interface UserProviderProps {
    children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
    const userState = useUser();
    return (
        <UserContext.Provider value={userState}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext(): UseUserReturn {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
}