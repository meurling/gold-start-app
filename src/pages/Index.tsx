import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { DashboardHeader } from "@/components/DashboardHeader"
import { DashboardStats } from "@/components/DashboardStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-h1 font-bold text-foreground">Dashboard</h1>
              <p className="text-body text-muted-foreground mt-2">
                Welcome back! Here's what's happening with your business today.
              </p>
            </div>
            
            <DashboardStats />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle className="text-h3">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      "New user registration: sarah@example.com",
                      "Payment processed: $299.00",
                      "Support ticket resolved: #1234",
                      "Feature update deployed",
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded bg-muted/30">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-body-sm text-card-foreground">{activity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle className="text-h3">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Create new user account",
                    "Generate monthly report", 
                    "Send marketing campaign",
                    "Update billing settings",
                  ].map((action, i) => (
                    <button
                      key={i}
                      className="w-full text-left p-3 rounded border border-border hover:bg-accent hover:border-primary transition-colors text-body-sm"
                    >
                      {action}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default Index;
