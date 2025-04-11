
import { toast } from "sonner";

const API_BASE_URL = "http://localhost:8000";

// API Response Types
export interface QueryLogVolume {
  date: string;
  count: number;
}

export interface LLMResponseMetrics {
  average_latency: number;
  success_rate: number;
}

export interface TopQueriedDocument {
  document: string;
  count: number;
}

export interface CitedDocument {
  file_path: string;
  node_id: string;
  score: number;
  query_log_id: number;
}

export interface QueryLog {
  id: number;
  query: string;
  response: string;
  latency: number;
  success: boolean;
  error: string | null;
  timestamp: string;
  cited_documents: CitedDocument[];
}

export interface ChatResponse {
  response: string;
  cited_documents: CitedDocument[];
}

// API Calls
export const fetchQueryLogVolume = async (): Promise<QueryLogVolume[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/query-log-volume/`);
    if (!response.ok) {
      throw new Error(`Error fetching query log volume: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching query log volume:", error);
    toast.error("Failed to fetch query volume data");
    return [];
  }
};

export const fetchLLMResponseMetrics = async (): Promise<LLMResponseMetrics> => {
  try {
    const response = await fetch(`${API_BASE_URL}/llm-response-metrics/`);
    if (!response.ok) {
      throw new Error(`Error fetching LLM metrics: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching LLM metrics:", error);
    toast.error("Failed to fetch LLM metrics data");
    return { average_latency: 0, success_rate: 0 };
  }
};

export const fetchTopQueriedDocuments = async (): Promise<TopQueriedDocument[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/top-queried-documents/`);
    if (!response.ok) {
      throw new Error(`Error fetching top queried documents: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching top queried documents:", error);
    toast.error("Failed to fetch top queried documents");
    return [];
  }
};

export const fetchQueryLogs = async (): Promise<QueryLog[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/query-logs/`);
    if (!response.ok) {
      throw new Error(`Error fetching query logs: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching query logs:", error);
    toast.error("Failed to fetch query logs");
    return [];
  }
};

export const sendQuery = async (query: string): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    
    if (!response.ok) {
      throw new Error(`Error sending query: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error sending query:", error);
    toast.error("Failed to send query to knowledge base");
    throw error;
  }
};

export const uploadDocuments = async (files: File[]): Promise<void> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${API_BASE_URL}/upload-docs/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error uploading documents: ${response.statusText}`);
    }

    toast.success("Documents uploaded successfully");
  } catch (error) {
    console.error("Error uploading documents:", error);
    toast.error("Failed to upload documents");
    throw error;
  }
};
