import { useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { Role } from '@/lib/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Users, UserPlus, Trash2, UserCheck, ChevronUp, ChevronDown, UserX } from 'lucide-react';

export function DebugPanel() {
    const { users, currentUser, createUser, deleteUser, switchUser, clearCurrentUser, error } = useUserContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<Role>(Role.Asker);

    const handleCreateUser = async () => {
        if (newUserName.trim()) {
            await createUser(newUserName.trim(), newUserRole);
            setNewUserName('');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            await deleteUser(id);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
                title="Open Debug Panel"
            >
                <Users className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
            <Card className="shadow-2xl border-2">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Debug Panel - Users
                        </CardTitle>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="h-8 w-8 p-0"
                            >
                                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    {error && (
                        <div className="text-sm text-red-500 mt-2">{error}</div>
                    )}
                </CardHeader>
                
                {!isMinimized && (
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Create New User</div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="User name"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateUser()}
                                    className="flex-1"
                                />
                                <Select
                                    value={newUserRole.toString()}
                                    onValueChange={(value) => setNewUserRole(Number(value) as Role)}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={Role.Asker.toString()}>Asker</SelectItem>
                                        <SelectItem value={Role.Answerer.toString()}>Answerer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    onClick={handleCreateUser}
                                    disabled={!newUserName.trim()}
                                >
                                    <UserPlus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">
                                    Users ({users.length})
                                    {currentUser && (
                                        <span className="text-muted-foreground ml-2">
                                            Current: {currentUser.name}
                                        </span>
                                    )}
                                </div>
                                {currentUser && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearCurrentUser}
                                        className="h-7 px-2 text-xs"
                                    >
                                        <UserX className="w-3 h-3 mr-1" />
                                        Deselect
                                    </Button>
                                )}
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-1">
                                {users.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-4 text-center">
                                        No users yet. Create one above.
                                    </div>
                                ) : (
                                    users.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                                                currentUser?.id === user.id
                                                    ? 'bg-primary/10 border border-primary'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                {currentUser?.id === user.id && (
                                                    <UserCheck className="w-4 h-4 text-primary" />
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {user.role === Role.Asker ? 'Asker' : 'Answerer'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {currentUser?.id !== user.id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => switchUser(user.id)}
                                                        className="h-7 px-2"
                                                    >
                                                        Switch
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}