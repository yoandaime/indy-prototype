import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import LoginDurationChart from "./LoginDurationChart"
import VisitorTrendChart from "./VisitorTrendChart"
import DimensionBarChart from "./DimensionBarChart"

export default function PlatformActivitySummary({ stats }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">Platform Activity Summary</h3>
        <p className="text-sm text-muted-foreground">General usage and data quality activity across Indy</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Login Duration</CardTitle>
            <CardDescription className="space-y-0.5">
              <p className="text-lg font-semibold text-foreground">
                {stats.avgLoginMinutes} minutes
              </p>
              <p>Average time spent per visit</p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginDurationChart buckets={stats.loginDurationBuckets} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Visitor Trend</CardTitle>
            <CardDescription>Visitors over the course of the day</CardDescription>
          </CardHeader>
          <CardContent>
            <VisitorTrendChart
              hours={stats.visitorTrend.hours}
              visitors={stats.visitorTrend.visitors}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Dimension per Apps</CardTitle>
            <CardDescription>Data quality dimension coverage across applications</CardDescription>
          </CardHeader>
          <CardContent>
            <DimensionBarChart rows={stats.dimensionPerApp} palette="indigo" />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Dimension per Category Data</CardTitle>
            <CardDescription>Data quality dimension coverage across category data</CardDescription>
          </CardHeader>
          <CardContent>
            <DimensionBarChart rows={stats.dimensionPerCategory} palette="teal" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
