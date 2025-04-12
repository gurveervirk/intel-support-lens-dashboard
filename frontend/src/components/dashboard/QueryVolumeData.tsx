import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchQueryLogVolume, QueryLogVolume } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const QueryVolumeData = () => {
  const [data, setData] = useState<QueryLogVolume>({
    daily_count: 0,
    weekly_count: 0,
    monthly_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const volumeData = await fetchQueryLogVolume();
        setData(volumeData);
      } catch (error) {
        console.error("Failed to load query volume data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Query Volume</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full aspect-[2/1]">
            <Skeleton className="w-full h-full" />
          </div>
        ) : Object.keys(data).length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <span className="font-medium">Daily Queries:</span>{" "}
              {data?.daily_count}
            </div>
            <div>
              <span className="font-medium">Weekly Queries:</span>{" "}
              {data?.weekly_count}
            </div>
            <div>
              <span className="font-medium">Monthly Queries:</span>{" "}
              {data?.monthly_count}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryVolumeData;
