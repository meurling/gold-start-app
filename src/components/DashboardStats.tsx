import { TrendingUp, TrendingDown, Users, DollarSign, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    title: "Active Users",
    value: "2,847",
    change: "+8.2%",
    trend: "up" as const,
    icon: Users,
  },
  {
    title: "Conversion Rate",
    value: "3.24%",
    change: "-2.1%",
    trend: "down" as const,
    icon: Activity,
  },
  {
    title: "Growth Rate",
    value: "24.8%",
    change: "+4.7%",
    trend: "up" as const,
    icon: TrendingUp,
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-body-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold text-foreground">{stat.value}</div>
            <div className="flex items-center text-small mt-1">
              {stat.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-success mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive mr-1" />
              )}
              <span
                className={
                  stat.trend === "up" ? "text-success" : "text-destructive"
                }
              >
                {stat.change}
              </span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}