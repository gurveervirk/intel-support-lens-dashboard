
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { sendQuery } from "@/services/api";
import { toast } from "sonner";
import { CitedDocument } from "@/services/api";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  cited_documents?: CitedDocument[];
  timestamp: Date;
}

const ChatDrawer = ({ open, onClose }: ChatDrawerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);

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
        cited_documents: response.cited_documents,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast.error("Failed to get a response from the knowledge base");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCitation = (messageId: string) => {
    if (expandedCitation === messageId) {
      setExpandedCitation(null);
    } else {
      setExpandedCitation(messageId);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Knowledge Base Chat</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              Ask a question to get started!
            </div>
          )}
          
          {messages.map((message) => (
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
              
              {!message.isUser && message.cited_documents && message.cited_documents.length > 0 && (
                <div className="mt-1">
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => toggleCitation(message.id)}
                    className="text-xs text-muted-foreground"
                  >
                    {expandedCitation === message.id ? "Hide citations" : "View citations"}
                  </Button>
                  
                  {expandedCitation === message.id && (
                    <div className="mt-1 p-2 bg-muted/50 rounded-md text-xs">
                      <p className="font-medium mb-1">Cited Documents:</p>
                      <ul className="space-y-1">
                        {message.cited_documents.map((doc, index) => (
                          <li key={index} className="text-xs">
                            <p><span className="font-medium">File:</span> {doc.file_path}</p>
                            <p><span className="font-medium">Node:</span> {doc.node_id}</p>
                            <p><span className="font-medium">Score:</span> {doc.score.toFixed(2)}</p>
                            {index < message.cited_documents!.length - 1 && <Separator className="my-1" />}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <span className="text-xs text-muted-foreground mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              className="resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatDrawer;
