import { useState } from 'react';
import { ChevronDown, Plus, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useProjects, useActiveProject } from '@/hooks/useStorage';
import { Project } from '@/lib/types';
import { NewProjectModal } from './NewProjectModal';

interface ProjectSelectorProps {
  isCollapsed?: boolean;
}

export function ProjectSelector({ isCollapsed = false }: ProjectSelectorProps) {
  const { data: projects, loading, create } = useProjects();
  const { activeProject, setActive } = useActiveProject();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Debug logging
  console.log('ProjectSelector - projects:', projects);
  console.log('ProjectSelector - activeProject:', activeProject);
  console.log('ProjectSelector - loading:', loading);

  const handleProjectSelect = async (project: Project) => {
    console.log('ProjectSelector - selecting project:', project);
    const result = await setActive(project);
    console.log('ProjectSelector - setActive result:', result);
  };

  const handleCreateNew = () => {
    setIsNewProjectModalOpen(true);
  };

  const handleNewProjectCreated = async (newProject: Project) => {
    setIsNewProjectModalOpen(false);
    await setActive(newProject);
  };

  if (loading) {
    return (
      <div className="px-3 py-2">
        <div className="h-8 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <>
      <div className="px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-8 justify-between px-3 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border border-sidebar-border"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Folder className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-body-sm truncate">
                    {activeProject?.name || 'Select Project'}
                  </span>
                )}
              </div>
              {!isCollapsed && <ChevronDown className="h-4 w-4 flex-shrink-0" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </DropdownMenuItem>
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={activeProject?.id === project.id ? 'bg-accent' : ''}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  {project.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                <Folder className="mr-2 h-4 w-4" />
                No projects yet
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={handleNewProjectCreated}
      />
    </>
  );
}
