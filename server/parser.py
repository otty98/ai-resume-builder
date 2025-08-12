import sys
import json
import os
from pyresparser import ResumeParser

def parse_resume(file_path):
    try:
        # Check if the file exists
        if not os.path.exists(file_path):
            return {"error": f"File not found at: {file_path}"}
        
        # Determine the file extension to ensure it's supported
        _, file_extension = os.path.splitext(file_path)
        file_extension = file_extension.lower()

        supported_extensions = ['.pdf', '.docx', '.doc']
        if file_extension not in supported_extensions:
            return {"error": f"Unsupported file type: {file_extension}. Supported: {', '.join(supported_extensions)}"}

        # Use ResumeParser to extract data
        data = ResumeParser(file_path).get_extracted_data()
        
        if data:
            return data
        else:
            return {"error": "Failed to extract data from the resume."}

    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided."}))
    else:
        file_path = sys.argv[1]
        parsed_data = parse_resume(file_path)
        print(json.dumps(parsed_data, indent=4))