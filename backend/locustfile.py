import random
from datetime import date, timedelta
from locust import HttpUser, task, between

class SupportLensUser(HttpUser):
    # Set wait time between requests to achieve 10-50 RPS with enough users
    wait_time = between(1, 3)
    
    def on_start(self):
        """Setup before tests begin."""
        # No files needed since we're not testing upload-docs anymore
        pass

    def get_random_date_range(self, max_days_back=30):
        """Generate a random date range within the last month."""
        today = date.today()
        start_date = today - timedelta(days=random.randint(1, max_days_back))
        end_date = min(start_date + timedelta(days=random.randint(0, 10)), today)
        return start_date, end_date

    @task(5)
    def get_query_log_volume(self):
        """Test the query log volume endpoint."""
        self.client.get("/query-log-volume/", name="/query-log-volume/")

    @task(3)
    def get_top_queried_documents(self):
        """Test the top queried documents endpoint."""
        start_date, end_date = self.get_random_date_range()
        k = random.randint(5, 20)
        
        payload = {
            "k": k,
            "start_date": str(start_date),
            "end_date": str(end_date)
        }
        
        self.client.post("/top-queried-documents/", json=payload, name="/top-queried-documents/")

    @task(3)
    def get_llm_response_metrics(self):
        """Test the LLM response metrics endpoint."""
        start_date, end_date = self.get_random_date_range()
        
        payload = {
            "start_date": str(start_date),
            "end_date": str(end_date)
        }
        
        self.client.post("/llm-response-metrics/", json=payload, name="/llm-response-metrics/")

    @task(4)
    def get_query_logs(self):
        """Test the query logs endpoint."""
        start_date, end_date = self.get_random_date_range()
        
        payload = {
            "start_date": str(start_date),
            "end_date": str(end_date),
            "k": random.randint(5, 50),
            "include_citations": random.choice([True, False]),
            "include_errors": random.choice([True, False])
        }
        
        self.client.post("/query-logs/", json=payload, name="/query-logs/")

# To run this file with Locust:
# locust -f locustfile.py --host=http://localhost:8000
# Then open http://localhost:8089 in your browser to configure and start the test
