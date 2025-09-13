import { LocalStorageService } from "./storage";
import { BaseEntity } from "./types";

export enum Role {
    Asker,
    Answerer
}

export type UserId = string;

export interface User extends BaseEntity {
    id: UserId;
    name: string;
    role: Role;
    // This is at the moment never set.
    avatar?: string;
}

export class UserStorage {
    USER_STORAGE_KEY = 'storage/src/lib/user.ts:main';
    USER_VERSION_KEY = '1.0';
    CURRENT_USER_KEY = 'storage/src/lib/user.ts:current';
    private localStorage = new LocalStorageService<User>(this.USER_STORAGE_KEY, this.USER_VERSION_KEY);
    
    async create(name: string, role: Role): Promise<User> {
        const result = await this.localStorage.create({ name, role });
        if (!result.success || !result.data) {
            throw new Error(result.error?.message || 'Failed to create user');
        }
        return result.data;
    }
    
    async list(role?: Role): Promise<User[]> {
        const result = await this.localStorage.getAll();
        if (!result.success || !result.data) {
            return [];
        }
        if (role !== undefined) {
            return result.data.filter(user => user.role === role);
        }
        return result.data;
    }
    
    async delete(id: UserId): Promise<void> {
        const result = await this.localStorage.delete(id);
        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to delete user');
        }
        
        // If the deleted user was the current user, clear current user
        const currentUserId = this.getCurrentUserId();
        if (currentUserId === id) {
            this.clearCurrentUser();
        }
    }
    
    async getById(id: UserId): Promise<User | null> {
        const result = await this.localStorage.getById(id);
        if (!result.success) {
            return null;
        }
        return result.data || null;
    }
    
    getCurrentUserId(): UserId | null {
        return localStorage.getItem(this.CURRENT_USER_KEY);
    }
    
    setCurrentUserId(id: UserId): void {
        localStorage.setItem(this.CURRENT_USER_KEY, id);
    }
    
    clearCurrentUser(): void {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    }
    
    async getCurrentUser(): Promise<User | null> {
        const currentUserId = this.getCurrentUserId();
        if (!currentUserId) {
            return null;
        }
        return this.getById(currentUserId);
    }
}