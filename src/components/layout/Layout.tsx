
import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, FileText, MessageSquareText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatDrawer from "../chat/ChatDrawer";
import DocumentUploader from "../documents/DocumentUploader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  
  // Get current path
  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Support Knowledge Base Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsChatOpen(true)}>
              <MessageSquareText className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsUploaderOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        <nav className="w-60 bg-secondary border-r p-4">
          <div className="space-y-1">
            <Link to="/">
              <div
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                  currentPath === "/" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </div>
            </Link>
            <Link to="/query-logs">
              <div
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                  currentPath === "/query-logs" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <FileText className="w-4 h-4 mr-2" />
                Query Logs
              </div>
            </Link>
          </div>
        </nav>
        
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      
      <ChatDrawer
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
      
      <DocumentUploader
        open={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
      />
    </div>
  );
};

export default Layout;
