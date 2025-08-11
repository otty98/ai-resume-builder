import sys
import json
import warnings
import os
from pathlib import Path

# Suppress warnings
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', category=FutureWarning)

def parse_resume(file_path):
    """Parse resume with better error handling and fallback options"""
    
    # Check if file exists
    if not os.path.exists(file_path):
        return {'error': f'File not found: {file_path}'}
    
    # Check file size
    file_size = os.path.getsize(file_path)
    if file_size == 0:
        return {'error': 'File is empty'}
    
    if file_size > 10 * 1024 * 1024:  # 10MB
        return {'error': 'File too large (>10MB)'}
    
    # Check file extension
    file_ext = Path(file_path).suffix.lower()
    supported_extensions = ['.pdf', '.docx', '.doc']
    if file_ext not in supported_extensions:
        return {'error': f'Unsupported file type: {file_ext}. Supported: {", ".join(supported_extensions)}'}
    
    try:
        # Try to import and use pyresparser
        from pyresparser import ResumeParser
        
        # Parse the resume
        parser = ResumeParser(file_path)
        data = parser.get_extracted_data()
        
        # Validate the extracted data
        if not data:
            return {'error': 'No data could be extracted from the resume'}
        
        # Clean and structure the data
        cleaned_data = {
            'name': data.get('name', ''),
            'email': data.get('email', ''),
            'mobile_number': data.get('mobile_number', ''),
            'skills': data.get('skills', []),
            'education': [],
            'experience': [],
            'summary': ''
        }
        
        # Process education data
        if 'education' in data and data['education']:
            for edu in data['education']:
                if isinstance(edu, dict):
                    cleaned_data['education'].append(edu)
                else:
                    # If education is just a string, create a basic structure
                    cleaned_data['education'].append({'degree': str(edu), 'institution': ''})
        
        # Process experience data
        if 'experience' in data and data['experience']:
            for exp in data['experience']:
                if isinstance(exp, dict):
                    cleaned_data['experience'].append(exp)
                else:
                    # If experience is just a string, create a basic structure
                    cleaned_data['experience'].append({'title': str(exp), 'company': '', 'description': ''})
        
        # Handle total experience
        if 'total_experience' in data:
            cleaned_data['total_experience'] = data['total_experience']
        
        return cleaned_data
        
    except ImportError as e:
        return {'error': f'Missing required package: {str(e)}. Please install pyresparser: pip install pyresparser'}
    
    except Exception as e:
        error_msg = str(e)
        
        # Provide more specific error messages for common issues
        if 'spacy' in error_msg.lower():
            return {'error': 'spaCy model not found. Please run: python -m spacy download en_core_web_sm'}
        elif 'nltk' in error_msg.lower():
            return {'error': 'NLTK data missing. Please run: python -c "import nltk; nltk.download(\'all\')"'}
        elif 'pdf' in error_msg.lower():
            return {'error': 'PDF parsing error. The PDF might be corrupted or password-protected.'}
        elif 'docx' in error_msg.lower() or 'word' in error_msg.lower():
            return {'error': 'Word document parsing error. The document might be corrupted.'}
        else:
            return {'error': f'Parsing failed: {error_msg}'}

def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Usage: python parser.py <file_path>'}), file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    try:
        result = parse_resume(file_path)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        error_result = {'error': f'Unexpected error: {str(e)}'}
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()