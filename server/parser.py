import sys
import json
import warnings
from pyresparser import ResumeParser

warnings.filterwarnings('ignore', category=UserWarning)

if __name__ == '__main__':
    # The file path is passed as the first command-line argument
    file_path = sys.argv[1]

    try:
        data = ResumeParser(file_path).get_extracted_data()
        # Print the data as a JSON string
        print(json.dumps(data))
    except Exception as e:
        # In case of an error, print an error message to stderr
        print(json.dumps({'error': str(e)}), file=sys.stderr)