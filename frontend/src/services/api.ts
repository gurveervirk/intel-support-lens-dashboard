import { toast } from "sonner";

const API_BASE_URL = "http://localhost:8000";

// API Response Types
export interface QueryLogVolume {
  daily_count: number;
  weekly_count: number;
  monthly_count: number;
}

export interface LLMResponseMetrics {
  avg_latency: number;
  success_rate: number;
}

export interface TopQueriedDocument {
  file_path: string;
  count: number;
}

export interface CitedDocument {
  file_path: string;
  content: string;
  score: number;
}

export interface TopSimilarDocument {
  file_path: string;
  score: number;
  content: string;
}

export interface QueryLog {
  id: number;
  query: string;
  response: string;
  latency: number;
  success: boolean;
  error: string | null;
  timestamp: string;
  citations: CitedDocument[];
}

export interface ChatResponse {
  response: string;
  citations: CitedDocument[];
}

// API Calls
export const fetchQueryLogVolume = async (): Promise<QueryLogVolume> => {
  try {
    const response = await fetch(`${API_BASE_URL}/query-log-volume/`);
    if (!response.ok) {
      throw new Error(`Error fetching query log volume: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching query log volume:", error);
    toast.error("Failed to fetch query volume data");
    return {
      daily_count: 0,
      weekly_count: 0,
      monthly_count: 0,
    };
  }
};

export const fetchLLMResponseMetrics = async (period: 'day' | 'week' | 'month'): Promise<LLMResponseMetrics> => {
  try {
    let url = `${API_BASE_URL}/llm-response-metrics/`;
    let body: string | undefined = undefined;

    const startDate = new Date();
    if (period === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    }
    body = JSON.stringify({ start_date: startDate.toISOString().split('T')[0] });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Error fetching LLM metrics: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching LLM metrics:", error);
    toast.error("Failed to fetch LLM metrics data");
    return { avg_latency: 0, success_rate: 0 };
  }
};

export const fetchTopQueriedDocuments = async (): Promise<TopQueriedDocument[]> => {
  try {
    // Send k = 5 in a JSON body
    const response = await fetch(`${API_BASE_URL}/top-queried-documents/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ k: 5 }),
    });
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

export const fetchQueryLogs = async (include_citations: boolean = true, include_errors: boolean = true): Promise<QueryLog[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/query-logs/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ include_citations, include_errors }),
    });
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

export const fetchTopSimilarDocuments = async (query: string, k: number = 5): Promise<TopSimilarDocument[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/top-similar-documents/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, k }),
    });

    if (!response.ok) {
      throw new Error(`Error fetching similar documents: ${response.statusText}`);
    }

    const documents = await response.json();

    // Process file paths to make them cleaner
    return documents.map((doc: TopSimilarDocument) => ({
      ...doc,
      file_path: doc.file_path.split('\\tmp\\').pop() || doc.file_path,
    }));
  } catch (error) {
    console.error("Error fetching similar documents:", error);
    toast.error("Failed to fetch similar documents");
    return [];
  }
};
