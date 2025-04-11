
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { fetchTopQueriedDocuments, TopQueriedDocument } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const TopQueriedDocuments = () => {
  const [data, setData] = useState<TopQueriedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const topDocs = await fetchTopQueriedDocuments();
        // Sort by count
        topDocs.sort((a, b) => b.count - a.count);
        // Limit to top 10
        setData(topDocs.slice(0, 7));
      } catch (error) {
        console.error("Failed to load top queried documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Shorten document names for display
  const formattedData = data.map(item => {
    const parts = item.document.split('/');
    return {
      ...item,
      displayName: parts[parts.length - 1].length > 20 
        ? parts[parts.length - 1].substring(0, 20) + '...' 
        : parts[parts.length - 1],
      fullName: item.document
    };
  });

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm text-xs">
          <p className="font-medium text-wrap max-w-[200px]">{payload[0].payload.fullName}</p>
          <p>Count: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Top Queried Documents</CardTitle>
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
              <BarChart 
                data={formattedData} 
                layout="vertical"
                margin={{ top: 10, right: 30, left: 50, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="displayName" 
                  type="category" 
                  tick={{ fontSize: 12 }} 
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopQueriedDocuments;
