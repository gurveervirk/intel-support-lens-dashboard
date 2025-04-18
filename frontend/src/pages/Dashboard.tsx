import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import MetricsCard from "@/components/dashboard/MetricsCard";
import QueryVolumeData from "@/components/dashboard/QueryVolumeData";
import TopQueriedDocuments from "@/components/dashboard/TopQueriedDocuments";
import { fetchLLMResponseMetrics, LLMResponseMetrics } from "@/services/api";
import { Clock, PercentSquare, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [dayMetrics, setDayMetrics] = useState<LLMResponseMetrics>({
    avg_latency: 0,
    success_rate: 0,
  });
  const [weekMetrics, setWeekMetrics] = useState<LLMResponseMetrics>({
    avg_latency: 0,
    success_rate: 0,
  });
  const [monthMetrics, setMonthMetrics] = useState<LLMResponseMetrics>({
    avg_latency: 0,
    success_rate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const dayLLMMetrics = await fetchLLMResponseMetrics('day');
        setDayMetrics(dayLLMMetrics);
        const weekLLMMetrics = await fetchLLMResponseMetrics('week');
        setWeekMetrics(weekLLMMetrics);
        const monthLLMMetrics = await fetchLLMResponseMetrics('month');
        setMonthMetrics(monthLLMMetrics);
      } catch (error) {
        console.error("Failed to load LLM metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();

    // Refresh data every 5 minutes
    const intervalId = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <MetricsCard
                title="Average Latency (Day)"
                value={dayMetrics.avg_latency < 1 
                  ? `${(dayMetrics.avg_latency * 1000).toFixed(0)} ms` 
                  : `${dayMetrics.avg_latency.toFixed(2)} s`}
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                description="Average response time for LLM queries (Last 24 hours)"
              />
              <MetricsCard
                title="Success Rate (Day)"
                value={`${dayMetrics.success_rate.toFixed(1)}%`}
                icon={<PercentSquare className="h-4 w-4 text-muted-foreground" />}
                description="Percentage of successful query responses (Last 24 hours)"
              />
              <MetricsCard
                title="Average Latency (Week)"
                value={weekMetrics.avg_latency < 1
                  ? `${(weekMetrics.avg_latency * 1000).toFixed(0)} ms`
                  : `${weekMetrics.avg_latency.toFixed(2)} s`}
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                description="Average response time for LLM queries (Last 7 days)"
              />
              <MetricsCard
                title="Success Rate (Week)"
                value={`${weekMetrics.success_rate.toFixed(1)}%`}
                icon={<PercentSquare className="h-4 w-4 text-muted-foreground" />}
                description="Percentage of successful query responses (Last 7 days)"
              />
               <MetricsCard
                title="Average Latency (Month)"
                value={monthMetrics.avg_latency < 1
                  ? `${(monthMetrics.avg_latency * 1000).toFixed(0)} ms`
                  : `${monthMetrics.avg_latency.toFixed(2)} s`}
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                description="Average response time for LLM queries (Last 30 days)"
              />
              <MetricsCard
                title="Success Rate (Month)"
                value={`${monthMetrics.success_rate.toFixed(1)}%`}
                icon={<PercentSquare className="h-4 w-4 text-muted-foreground" />}
                description="Percentage of successful query responses (Last 30 days)"
              />
            </>
          )}
          
          <QueryVolumeData />
          <TopQueriedDocuments />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
