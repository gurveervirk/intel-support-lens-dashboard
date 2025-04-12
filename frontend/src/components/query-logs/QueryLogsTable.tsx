import { useState, useEffect } from "react";
import { fetchQueryLogs, QueryLog, CitedDocument } from "@/services/api";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Check, 
  X, 
  FileText, 
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';
import Papa from 'papaparse';

interface CitedDocsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documents: CitedDocument[];
  query: string;
}

const CitedDocsDialog = ({ isOpen, onClose, documents, query }: CitedDocsDialogProps) => {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);

  const showContent = (content: string, file_path: string) => {
    setSelectedDocument(file_path === selectedDocument ? null : file_path);
    setSelectedContent(file_path === selectedDocument ? null : content);
    if (getFileType(file_path) === 'csv' && content) {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data);
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          setCsvData([]);
        }
      });
    } else {
      setCsvData([]);
    }
  };

  const fileType = selectedDocument ? getFileType(selectedDocument) : null;

  function getFileType(file_path: string): string | null {
    const parts = file_path.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
    return null;
  }

  function onDialogClose() {
    setSelectedDocument(null);
    setSelectedContent(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onDialogClose}>
      <DialogContent className="max-w-4xl flex">
        <div className="w-1/2 p-4">
          <DialogHeader className="pb-4">
            <DialogTitle>Cited Documents for Query</DialogTitle>
          </DialogHeader>
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Query:</p>
            <p className="text-sm">{query}</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {documents.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No documents cited for this query
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Path</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showContent(doc.content || null, doc.file_path)}
                          className={selectedDocument === doc.file_path ? "text-purple-500" : ""}
                        >
                          {doc.file_path}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        {doc.score.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        <div className="w-1/2 p-4 border-l">
          {selectedDocument ? (
            <div>
              <DialogTitle>Content</DialogTitle>
              <div className="mt-2 p-2 bg-muted rounded-md text-sm max-h-96 overflow-y-auto">
                {fileType === 'md' ? (
                  <ReactMarkdown children={selectedContent} />
                ) : fileType === 'csv' ? (
                  csvData.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(csvData[0]).map((header, index) => (
                            <TableHead key={index}>{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((cell, index) => (
                              <TableCell key={index}>{String(cell)}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div>Parsing CSV...</div>
                  )
                ) : (
                  <div>{selectedContent}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Select a document to view its content
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const QueryLogsTable = () => {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocuments, setSelectedDocuments] = useState<CitedDocument[]>([]);
  const [selectedQuery, setSelectedQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      try {
        const queryLogs = await fetchQueryLogs();
        // Sort by timestamp, newest first
        queryLogs.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        // Process queryLogs to process the file_path, splitting by '\\tmp\\' if it is an absolute path
        queryLogs.forEach(log => {
          if (log.citations) {
            log.citations.forEach(doc => {
              const parts = doc.file_path.split('\\tmp\\');
              doc.file_path = parts[parts.length - 1];
            });
          }
        });
        setLogs(queryLogs);
      } catch (error) {
        console.error("Failed to load query logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogs();
  }, []);

  const showCitedDocuments = (log: QueryLog) => {
    setSelectedDocuments(log.citations || []);
    setSelectedQuery(log.query);
    setIsDialogOpen(true);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
    } catch (e) {
      return timestamp;
    }
  };

  // Format latency
  const formatLatency = (latency: number) => {
    if (latency < 1) {
      return `${(latency * 1000).toFixed(0)} ms`;
    }
    return `${latency.toFixed(2)} s`;
  };

  // Truncate long text
  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No query logs available
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Success</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Citations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono">
                    {index + 1}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate" title={log.query}>
                      {truncateText(log.query, 50)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="truncate" title={log.response}>
                      {truncateText(log.response, 80)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatLatency(log.latency)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.success ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <Check className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        <X className="h-3 w-3 mr-1" />
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => showCitedDocuments(log)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CitedDocsDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        documents={selectedDocuments}
        query={selectedQuery}
      />
    </div>
  );
};

export default QueryLogsTable;
