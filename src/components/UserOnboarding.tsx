import { useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { Role } from '@/lib/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Users, UserCheck, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function UserOnboarding() {
    const { users, createUser, deleteUser, switchUser, error } = useUserContext();
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<Role>(Role.Asker);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateUser = async () => {
        if (newUserName.trim()) {
            setIsCreating(true);
            try {
                const user = await createUser(newUserName.trim(), newUserRole);
                if (user) {
                    setNewUserName('');
                    await switchUser(user.id);
                }
            } finally {
                setIsCreating(false);
            }
        }
    };

    const handleSelectUser = async (userId: string) => {
        await switchUser(userId);
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            await deleteUser(id);
        }
    };

    const hasUsers = users.length > 0;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Welcome!</CardTitle>
                    <CardDescription className="text-base">
                        {hasUsers ? 'Select a user or create a new one' : 'Create your first user to get started'}
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
                            {error}
                        </div>
                    )}
                    
                    {hasUsers ? (
                        <Tabs defaultValue="existing" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="existing">Existing Users</TabsTrigger>
                                <TabsTrigger value="new">Create New</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="existing" className="space-y-4 mt-4">
                                <div className="max-h-80 overflow-y-auto space-y-2">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {user.role === Role.Asker ? 'Asker' : 'Answerer'}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleSelectUser(user.id)}
                                                >
                                                    <UserCheck className="w-4 h-4 mr-1" />
                                                    Select
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="new" className="space-y-4 mt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium">
                                            User Name
                                        </label>
                                        <Input
                                            id="name"
                                            placeholder="Enter your name"
                                            value={newUserName}
                                            onChange={(e) => setNewUserName(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleCreateUser()}
                                            disabled={isCreating}
                                            autoFocus
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label htmlFor="role" className="text-sm font-medium">
                                            Role
                                        </label>
                                        <Select
                                            value={newUserRole.toString()}
                                            onValueChange={(value) => setNewUserRole(Number(value) as Role)}
                                            disabled={isCreating}
                                        >
                                            <SelectTrigger id="role">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={Role.Asker.toString()}>
                                                    <div>
                                                        <div className="font-medium">Asker</div>
                                                        <div className="text-xs text-muted-foreground">Ask questions and seek help</div>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value={Role.Answerer.toString()}>
                                                    <div>
                                                        <div className="font-medium">Answerer</div>
                                                        <div className="text-xs text-muted-foreground">Provide answers and solutions</div>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={handleCreateUser}
                                        disabled={!newUserName.trim() || isCreating}
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        {isCreating ? 'Creating...' : 'Create User'}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">
                                    User Name
                                </label>
                                <Input
                                    id="name"
                                    placeholder="Enter your name"
                                    value={newUserName}
                                    onChange={(e) => setNewUserName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateUser()}
                                    disabled={isCreating}
                                    autoFocus
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="role-initial" className="text-sm font-medium">
                                    Role
                                </label>
                                <Select
                                    value={newUserRole.toString()}
                                    onValueChange={(value) => setNewUserRole(Number(value) as Role)}
                                    disabled={isCreating}
                                >
                                    <SelectTrigger id="role-initial">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={Role.Asker.toString()}>
                                            <div>
                                                <div className="font-medium">Asker</div>
                                                <div className="text-xs text-muted-foreground">Ask questions and seek help</div>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value={Role.Answerer.toString()}>
                                            <div>
                                                <div className="font-medium">Answerer</div>
                                                <div className="text-xs text-muted-foreground">Provide answers and solutions</div>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleCreateUser}
                                disabled={!newUserName.trim() || isCreating}
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                {isCreating ? 'Creating...' : 'Create User'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}