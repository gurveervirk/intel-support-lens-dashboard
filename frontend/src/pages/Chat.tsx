import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { sendQuery } from "@/services/api";
import { toast } from "sonner";
import { CitedDocument } from "@/services/api";
import ReactMarkdown from 'react-markdown';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  citations?: CitedDocument[];
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<CitedDocument | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      const response = await sendQuery(inputValue);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        citations: response.citations,
        timestamp: new Date(),
      };

      // Process citations to split and store actual citation file_path
      if (response.citations && response.citations.length > 0) {
        const processedCitations = response.citations.map((doc) => ({
          ...doc,
          file_path: doc.file_path.split('\\tmp\\').pop() || doc.file_path,
        }));
        aiMessage.citations = processedCitations;
      }
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast.error("Failed to get a response from the knowledge base");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = (citation: CitedDocument) => {
    setSelectedCitation(citation === selectedCitation ? null : citation);
    if (citation && getFileType(citation.file_path) === 'csv') {
      Papa.parse(citation.content, {
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

  const getFileType = (file_path: string): string | null => {
    const parts = file_path.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Knowledge Base Chat</h2>
        
        <div className="flex gap-6 h-[calc(100vh-240px)]">
          <Card className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="max-w-md">
                    <h3 className="text-xl font-semibold mb-2">Welcome to Support Knowledge Base</h3>
                    <p className="text-muted-foreground">
                      Ask any question about Intel support documentation and get instant answers backed by our knowledge base.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex flex-col ${message.isUser ? "items-end" : "items-start"}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.isUser 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {!message.isUser && message.citations && message.citations.length > 0 && (
                      <div className="mt-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>Cited Documents:</span>
                          {message.citations.map((doc, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleCitationClick(doc)}
                              className={`rounded-full px-3 py-1 text-xs ${selectedCitation === doc
                                ? "bg-purple-500 text-white border-none"
                                : "text-muted-foreground border-muted"
                                }`}
                            >
                              {doc.file_path}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <span className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="mt-4 flex space-x-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question about Intel support..."
                className="resize-none"
                rows={2}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" className="h-auto" disabled={isLoading || !inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>
          
          {selectedCitation ? (
            <Card className="w-1/3 p-4 overflow-y-auto">
              <h3 className="font-medium mb-2 flex items-center justify-between">
                {selectedCitation.file_path}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCitation(null)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </h3>
              <div className="p-3 bg-muted/50 rounded-md text-sm">
                {getFileType(selectedCitation.file_path) === 'md' ? (
                  <ReactMarkdown>{selectedCitation.content}</ReactMarkdown>
                ) : getFileType(selectedCitation.file_path) === 'csv' ? (
                  csvData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(csvData[0]).map((header, index) => (
                              <TableHead key={index} className="whitespace-nowrap">{header}</TableHead>
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
                    </div>
                  ) : (
                    <div>Parsing CSV...</div>
                  )
                ) : (
                  <div>{selectedCitation.content}</div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="w-1/3 p-4 flex items-center justify-center bg-muted/10">
              <div className="text-center text-muted-foreground">
                <p>Select a citation to view its content</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Chat;