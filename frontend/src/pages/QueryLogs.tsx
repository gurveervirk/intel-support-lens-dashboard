
import Layout from "@/components/layout/Layout";
import QueryLogsTable from "@/components/query-logs/QueryLogsTable";

const QueryLogs = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Query Logs</h2>
        <p className="text-muted-foreground">
          View detailed logs of user interactions with the knowledge base.
        </p>
        
        <QueryLogsTable />
      </div>
    </Layout>
  );
};

export default QueryLogs;
