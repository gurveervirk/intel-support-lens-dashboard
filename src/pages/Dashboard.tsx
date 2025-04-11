
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import MetricsCard from "@/components/dashboard/MetricsCard";
import QueryVolumeChart from "@/components/dashboard/QueryVolumeChart";
import TopQueriedDocuments from "@/components/dashboard/TopQueriedDocuments";
import { fetchLLMResponseMetrics, LLMResponseMetrics } from "@/services/api";
import { Clock, PercentSquare, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [metrics, setMetrics] = useState<LLMResponseMetrics>({
    average_latency: 0,
    success_rate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const llmMetrics = await fetchLLMResponseMetrics();
        setMetrics(llmMetrics);
      } catch (error) {
        console.error("Failed to load LLM metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();

    // Refresh data every 30 seconds
    const intervalId = setInterval(loadMetrics, 30000);
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
            </>
          ) : (
            <>
              <MetricsCard
                title="Average Latency"
                value={metrics.average_latency < 1 
                  ? `${(metrics.average_latency * 1000).toFixed(0)} ms` 
                  : `${metrics.average_latency.toFixed(2)} s`}
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                description="Average response time for LLM queries"
              />
              <MetricsCard
                title="Success Rate"
                value={`${metrics.success_rate.toFixed(1)}%`}
                icon={<PercentSquare className="h-4 w-4 text-muted-foreground" />}
                description="Percentage of successful query responses"
              />
            </>
          )}
          
          <QueryVolumeChart />
          <TopQueriedDocuments />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
