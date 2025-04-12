import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, FileText } from "lucide-react";
import { fetchTopSimilarDocuments, TopSimilarDocument } from "@/services/api";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import Papa from 'papaparse';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const SearchDocuments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<TopSimilarDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<TopSimilarDocument | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [resultsLimit, setResultsLimit] = useState(5);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    try {
      const results = await fetchTopSimilarDocuments(searchQuery, resultsLimit);
      setDocuments(results);
      
      // Clear selected document when performing a new search
      setSelectedDocument(null);
    } catch (error) {
      toast.error("Failed to search documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentClick = (document: TopSimilarDocument) => {
    setSelectedDocument(document === selectedDocument ? null : document);
    if (document && getFileType(document.file_path) === 'csv') {
      Papa.parse(document.content, {
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
        <h2 className="text-3xl font-bold tracking-tight">Search Documents</h2>
        
        <Card className="p-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !searchQuery.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <Label htmlFor="results-limit" className="min-w-[160px]">
                Results limit: {resultsLimit}
              </Label>
              <Slider
                id="results-limit"
                defaultValue={[5]}
                max={20}
                min={1}
                step={1}
                onValueChange={(value) => setResultsLimit(value[0])}
                className="flex-1"
              />
            </div>
          </form>
        </Card>
        
        <div className="flex gap-6 h-[calc(100vh-340px)]">
          <Card className="flex-1 p-4 overflow-hidden">
            <h3 className="font-medium mb-4">Search Results</h3>
            
            <div className="overflow-y-auto h-[calc(100%-40px)]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="max-w-md">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Documents Found</h3>
                    <p className="text-muted-foreground">
                      Try searching for something else or adjust your search query.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <Card
                      key={index}
                      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedDocument === doc ? "bg-purple-100 border-purple-500" : ""
                      }`}
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="overflow-hidden">
                          <div className="font-medium truncate">{doc.file_path}</div>
                          <div className="text-xs text-muted-foreground">
                            Score: {(doc.score * 100).toFixed(1)}% match
                          </div>
                        </div>
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {doc.content.substring(0, 150)}...
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
          
          {selectedDocument ? (
            <Card className="w-1/2 p-4 overflow-y-auto">
              <h3 className="font-medium mb-2 flex items-center justify-between">
                {selectedDocument.file_path}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedDocument(null)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </h3>
              <div className="p-3 bg-muted/50 rounded-md text-sm">
                {getFileType(selectedDocument.file_path) === 'md' ? (
                  <ReactMarkdown>{selectedDocument.content}</ReactMarkdown>
                ) : getFileType(selectedDocument.file_path) === 'csv' ? (
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
                  <div className="whitespace-pre-wrap">{selectedDocument.content}</div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="w-1/2 p-4 flex items-center justify-center bg-muted/10">
              <div className="text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Select a document to view its content</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SearchDocuments;