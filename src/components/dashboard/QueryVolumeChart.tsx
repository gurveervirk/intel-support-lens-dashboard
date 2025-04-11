
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { fetchQueryLogVolume, QueryLogVolume } from "@/services/api";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const QueryVolumeChart = () => {
  const [data, setData] = useState<QueryLogVolume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const volumeData = await fetchQueryLogVolume();
        // Sort by date
        volumeData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setData(volumeData);
      } catch (error) {
        console.error("Failed to load query volume data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Format date for display
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(new Date(item.date), 'MMM dd')
  }));

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm text-xs">
          <p className="font-medium">{payload[0].payload.formattedDate}</p>
          <p>Queries: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Query Volume Per Day</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full aspect-[2/1]">
            <Skeleton className="w-full h-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryVolumeChart;
