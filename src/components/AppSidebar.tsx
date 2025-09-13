import { 
  HelpCircle,
  MessageSquare
} from "lucide-react"
import { NavLink } from "react-router-dom"
import { ProjectSelector } from "./ProjectSelector"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { title: "Questions", url: "/questions", icon: HelpCircle },
  { title: "Answers", url: "/answers", icon: MessageSquare },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-primary font-medium border-l-2 border-sidebar-primary" 
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-4">
          {!isCollapsed && (
            <>
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <div>
                <h2 className="text-h3 font-semibold text-sidebar-foreground">DAIRO</h2>
                <p className="text-small text-sidebar-foreground/70">Dataroom</p>
              </div>
            </>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ProjectSelector isCollapsed={isCollapsed} />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavClass}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="text-body-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}