import requests
import argparse
import os

def upload_file(file_path, api_url="http://localhost:8000/upload-docs/"):
    """Uploads a file to the specified API endpoint."""
    try:
        # Check if the file exists
        if not os.path.isfile(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        file_path = os.path.abspath(file_path)  # Get absolute path for the file
        with open(file_path, 'rb') as f:
            files = {'files': (file_path.split('/')[-1], f)}
            print(f"Uploading {file_path} to {api_url}...")
            # Send a POST request to the API endpoint with the file
            response = requests.post(api_url, files=files)
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
            print("Upload successful!")
            print(response.json())
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
    except requests.exceptions.RequestException as e:
        print(f"Error: Request failed - {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload a file to the /upload-docs/ endpoint.")
    parser.add_argument("file_path", help="Path to the file to upload.")
    args = parser.parse_args()

    upload_file(args.file_path)
