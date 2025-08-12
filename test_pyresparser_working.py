from pyresparser import ResumeParser
import os

try:
    print("🧪 Testing pyresparser with new config...")
    
    # Create a simple test resume
    test_content = """
    John Doe
    Software Developer
    Email: john.doe@email.com
    Phone: +1 (555) 123-4567
    
    EXPERIENCE:
    Senior Python Developer at Tech Corp (2020-2023)
    - Developed web applications using Django and Flask
    - Worked with databases like PostgreSQL and MongoDB
    
    Junior Developer at StartupXYZ (2018-2020)
    - Built REST APIs
    - Collaborated with cross-functional teams
    
    EDUCATION:
    Bachelor of Science in Computer Science
    University of Technology (2014-2018)
    
    SKILLS:
    Python, JavaScript, React, Node.js, SQL, Git, Docker
    """
    
    # Save to a temporary file
    with open("test_resume.txt", "w", encoding="utf-8") as f:
        f.write(test_content)
    
    print("📄 Created test resume file")
    
    # Parse the resume
    print("🔍 Parsing resume...")
    data = ResumeParser("test_resume.txt").get_extracted_data()
    
    print("✅ Resume parsing successful!")
    print("\n📊 Extracted Data:")
    for key, value in data.items():
        if value:  # Only show non-empty fields
            print(f"  {key}: {value}")
    
    # Clean up
    os.remove("test_resume.txt")
    print("\n🧹 Test file cleaned up")
    
except Exception as e:
    print(f"❌ Error during testing: {e}")
    # Clean up even if there's an error
    if os.path.exists("test_resume.txt"):
        os.remove("test_resume.txt")
        print("🧹 Test file cleaned up after error")