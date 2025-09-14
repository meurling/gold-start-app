import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { DashboardHeader } from "@/components/DashboardHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"

const Index = () => {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-h1 font-bold text-foreground">Welcome</h1>
              <p className="text-body text-muted-foreground mt-2">
                Choose what you'd like to work with today.
              </p>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
              <Card className="shadow-subtle hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/questions')}>
                <CardHeader>
                  <CardTitle className="text-h3">Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-body text-muted-foreground">
                    Upload questions
                  </p>
                  <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/questions'); }}>
                    Go to Questions
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="shadow-subtle hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/answers')}>
                <CardHeader>
                  <CardTitle className="text-h3">Answers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-body text-muted-foreground">
                    Upload answers
                  </p>
                  <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/answers'); }}>
                    Go to Answers
                  </Button>
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
