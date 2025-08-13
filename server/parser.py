import os
import json
from pyresparser import ResumeParser
import sys
import re
import PyPDF2
import pdfplumber

def extract_text_from_pdf(file_path):
    """Extract raw text from PDF using multiple methods"""
    text = ""
    
    # Try pdfplumber first (better for structured text)
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except:
        # Fallback to PyPDF2
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except:
            pass
    
    return text

def parse_resume(file_path):
    try:
        # Check if the file exists and is a supported type
        if not os.path.exists(file_path):
            return {"error": f"File not found at: {file_path}"}
        
        _, file_extension = os.path.splitext(file_path)
        supported_extensions = ['.pdf', '.docx', '.doc']
        if file_extension.lower() not in supported_extensions:
            return {"error": f"Unsupported file type: {file_extension}"}

        # Get basic data from pyresparser
        raw_data = ResumeParser(file_path).get_extracted_data() or {}
        
        # Extract raw text for better parsing
        if file_extension.lower() == '.pdf':
            raw_text = extract_text_from_pdf(file_path)
        else:
            raw_text = ""
        
        # Initialize cleaned data structure
        cleaned_data = {
            'name': '',
            'email': '',
            'mobile_number': '',
            'summary': '',
            'skills': [],
            'experience': [],
            'education': []
        }
        
        # Extract basic info (prefer pyresparser results)
        cleaned_data['name'] = raw_data.get('name', '').strip()
        cleaned_data['email'] = raw_data.get('email', '').strip()
        cleaned_data['mobile_number'] = raw_data.get('mobile_number', '').strip()
        
        # Parse from raw text if available
        if raw_text:
            parsed_from_text = parse_text_content(raw_text)
            
            # Merge results, preferring text-based parsing for content sections
            if not cleaned_data['name'] and parsed_from_text.get('name'):
                cleaned_data['name'] = parsed_from_text['name']
            if not cleaned_data['email'] and parsed_from_text.get('email'):
                cleaned_data['email'] = parsed_from_text['email']
            if not cleaned_data['mobile_number'] and parsed_from_text.get('mobile_number'):
                cleaned_data['mobile_number'] = parsed_from_text['mobile_number']
                
            cleaned_data['summary'] = parsed_from_text.get('summary', '')
            cleaned_data['skills'] = parsed_from_text.get('skills', [])
            cleaned_data['experience'] = parsed_from_text.get('experience', [])
            cleaned_data['education'] = parsed_from_text.get('education', [])
        
        # Fallback to pyresparser data if text parsing failed
        if not cleaned_data['skills']:
            skills_from_parser = extract_skills_from_parser_data(raw_data)
            cleaned_data['skills'] = skills_from_parser
        
        if not cleaned_data['experience']:
            exp_from_parser = extract_experience_from_parser_data(raw_data)
            cleaned_data['experience'] = exp_from_parser
        
        if not cleaned_data['education']:
            edu_from_parser = extract_education_from_parser_data(raw_data)
            cleaned_data['education'] = edu_from_parser
        
        return cleaned_data

    except Exception as e:
        return {"error": str(e)}

def parse_text_content(text):
    """Parse resume content from raw text"""
    result = {
        'name': '',
        'email': '',
        'mobile_number': '',
        'summary': '',
        'skills': [],
        'experience': [],
        'education': []
    }
    
    # Extract name (usually first line or prominent text)
    name_match = re.search(r'^([A-Z\s]{2,30})\n', text.strip(), re.MULTILINE)
    if name_match:
        result['name'] = name_match.group(1).strip()
    
    # Extract email
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    if email_match:
        result['email'] = email_match.group()
    
    # Extract phone number
    phone_patterns = [
        r'\b0\d{9}\b',  # South African format
        r'\+27\d{9}\b',  # International SA format
        r'\b\d{10}\b'    # General 10-digit format
    ]
    for pattern in phone_patterns:
        phone_match = re.search(pattern, text)
        if phone_match:
            result['mobile_number'] = phone_match.group()
            break
    
    # Extract summary (look for paragraph that sounds like a professional summary)
    summary_patterns = [
        r'I am a[^.]*?(?:developer|engineer|professional|graduate)[^.]*?\.(?:[^.]*?\.)*',
        r'(?:Motivated|Experienced|Dedicated)[^.]*?(?:developer|engineer|professional)[^.]*?\.(?:[^.]*?\.)*'
    ]
    
    for pattern in summary_patterns:
        summary_match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if summary_match:
            summary = summary_match.group().strip()
            # Clean up the summary
            summary = re.sub(r'\s+', ' ', summary)
            if len(summary) > 50:  # Ensure it's substantial
                result['summary'] = summary
                break
    
    # Extract skills from Technical Proficiencies section
    skills_section = extract_section_content(text, 'Technical Proficiencies')
    if skills_section:
        result['skills'] = extract_structured_skills(skills_section)
    
    # Extract work experience
    work_section = extract_section_content(text, 'Work Experience')
    if work_section:
        result['experience'] = extract_work_experience(work_section)
    
    # Extract education
    education_section = extract_section_content(text, 'Education')
    if education_section:
        result['education'] = extract_education_info(education_section)
    
    return result

def extract_section_content(text, section_name):
    """Extract content from a specific section"""
    # Look for the section header and extract content until next major section
    section_pattern = rf'{re.escape(section_name)}\s*\n(.*?)(?=\n[A-Z][a-zA-Z\s]*\n|\nReferences|\nAchievements|\Z)'
    
    match = re.search(section_pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return ""

def extract_structured_skills(skills_text):
    """Extract skills from the technical proficiencies section"""
    skills = []
    
    # Look for bullet points with categories
    bullet_lines = re.findall(r'•\s*([^•\n]+)', skills_text)
    
    for line in bullet_lines:
        # Handle structured format like "Programming: Java & Python"
        if ':' in line:
            category, skill_list = line.split(':', 1)
            # Extract individual skills
            individual_skills = re.split(r'[,&]+', skill_list.strip())
            for skill in individual_skills:
                skill = skill.strip()
                if skill and len(skill) > 1:
                    skills.append(skill)
        else:
            # Handle simple bullet points
            skill = line.strip()
            if skill and len(skill) > 1:
                skills.append(skill)
    
    # Clean and deduplicate
    cleaned_skills = []
    seen = set()
    
    for skill in skills:
        # Remove extra whitespace and common prefixes
        skill = re.sub(r'\s+', ' ', skill).strip()
        skill = re.sub(r'^(and|&)\s+', '', skill, flags=re.IGNORECASE).strip()
        
        if skill and skill.lower() not in seen and len(skill) > 1:
            cleaned_skills.append(skill)
            seen.add(skill.lower())
    
    return cleaned_skills

def extract_work_experience(work_text):
    """Extract work experience from work section"""
    experiences = []
    
    # Look for company/position patterns
    # Pattern: COMPANY – Position or Position – Company
    exp_pattern = r'([A-Z][A-Z\s&]+)\s*[–\-]\s*([^\n•]+)'
    matches = re.findall(exp_pattern, work_text)
    
    for match in matches:
        company = match[0].strip()
        title = match[1].strip()
        
        # Find the description (text after the title line)
        desc_pattern = rf'{re.escape(title)}(.*?)(?=\n[A-Z][A-Z\s&]+\s*[–\-]|\nAchievements|\Z)'
        desc_match = re.search(desc_pattern, work_text, re.DOTALL)
        
        description = ""
        if desc_match:
            desc_text = desc_match.group(1).strip()
            # Extract bullet points as description
            bullet_points = re.findall(r'•\s*([^•\n]+)', desc_text)
            if bullet_points:
                description = '. '.join(bullet_points)
        
        experiences.append({
            'title': title,
            'company': company,
            'description': description
        })
    
    return experiences

def extract_education_info(education_text):
    """Extract education information"""
    education = []
    
    # Look for institution and degree patterns
    lines = education_text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('•'):
            continue
            
        # Pattern: Institution – Degree Year or Degree from Institution
        if '–' in line or '-' in line:
            parts = re.split(r'[–\-]', line, 1)
            if len(parts) == 2:
                institution = parts[0].strip()
                degree_info = parts[1].strip()
                education.append({
                    'degree': degree_info,
                    'institution': institution
                })
        else:
            # Single line entries
            if len(line) > 5:  # Reasonable minimum length
                education.append({
                    'degree': line,
                    'institution': ''
                })
    
    return education

def extract_skills_from_parser_data(raw_data):
    """Extract and clean skills from parser data"""
    skills = []
    skills_data = raw_data.get('skills', [])
    
    if isinstance(skills_data, list):
        for skill in skills_data:
            if isinstance(skill, str) and len(skill.strip()) > 1:
                # Clean the skill
                cleaned = re.sub(r'^(Programming:|Tools:|Web Development:|Databases:|Testing:)\s*', '', skill.strip())
                if cleaned and len(cleaned) > 1:
                    skills.append(cleaned)
    
    return list(set(skills))  # Remove duplicates

def extract_experience_from_parser_data(raw_data):
    """Extract experience from parser data"""
    experiences = []
    exp_data = raw_data.get('experience', [])
    
    if isinstance(exp_data, list):
        for exp in exp_data:
            if isinstance(exp, str) and len(exp.strip()) > 3:
                experiences.append({
                    'title': 'Position',
                    'company': 'Company',
                    'description': exp.strip()
                })
    
    return experiences

def extract_education_from_parser_data(raw_data):
    """Extract education from parser data"""
    education = []
    
    # Check various fields
    edu_data = raw_data.get('education', [])
    degree = raw_data.get('degree', '')
    college = raw_data.get('college_name', '')
    
    if edu_data and isinstance(edu_data, list):
        for edu in edu_data:
            if isinstance(edu, dict):
                education.append(edu)
            else:
                education.append({'degree': str(edu), 'institution': ''})
    elif degree or college:
        education.append({'degree': degree, 'institution': college})
    
    return education

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided."}))
    else:
        file_path = sys.argv[1]
        parsed_data = parse_resume(file_path)
        print(json.dumps(parsed_data, indent=4))