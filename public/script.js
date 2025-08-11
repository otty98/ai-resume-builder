async function uploadResume(formData) {
  try {
    const response = await fetch('http://localhost:5500/api/upload-resume', {
      method: 'POST', // Must match backend
      body: formData,
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Function to render the live resume preview
function renderResumePreview(data) {
    const previewDiv = document.getElementById('resume-preview');
    let workExpHTML = '';
    let educationHTML = '';

    if (data.workExperience || data.experience) {
        const workData = data.workExperience || data.experience || [];
        workExpHTML = workData.map(exp => `
            <li>
                <strong>${exp.title || exp.job_title || 'Position'}</strong> at <strong>${exp.company || exp.organization || 'Company'}</strong>
                <p>${exp.description || exp.details || ''}</p>
            </li>
        `).join('');
    }

    if (data.education) {
        educationHTML = data.education.map(edu => `
            <li>
                <strong>${edu.degree || edu.qualification || 'Degree'}</strong> from <strong>${edu.institution || edu.school || edu.university || 'Institution'}</strong>
            </li>
        `).join('');
    }

    previewDiv.innerHTML = `
        <div class="preview-section">
            <h3>${data.name || ''}</h3>
            <p>Email: ${data.email || ''}</p>
            <p>Phone: ${data.mobile_number || data.phone || ''}</p>
        </div>
        <div class="preview-section">
            <h4>Summary</h4>
            <p>${data.summary || ''}</p>
        </div>
        <div class="preview-section">
            <h4>Work Experience</h4>
            <ul>${workExpHTML}</ul>
        </div>
        <div class="preview-section">
            <h4>Education</h4>
            <ul>${educationHTML}</ul>
        </div>
        <div class="preview-section">
            <h4>Skills</h4>
            <p>${Array.isArray(data.skills) ? data.skills.join(', ') : data.skills || ''}</p>
        </div>
    `;
}

// Function to show error messages
function showError(message, element = null) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #fee;
        border: 1px solid #fcc;
        color: #c33;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
        font-weight: 500;
    `;
    errorDiv.textContent = message;
    
    // Remove any existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(err => err.remove());
    
    if (element) {
        element.appendChild(errorDiv);
    } else {
        document.querySelector('.container').prepend(errorDiv);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// Function to show success messages
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        background: #efe;
        border: 1px solid #cfc;
        color: #3c3;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
        font-weight: 500;
    `;
    successDiv.textContent = message;
    
    // Remove any existing success messages
    const existingMessages = document.querySelectorAll('.success-message');
    existingMessages.forEach(msg => msg.remove());
    
    document.querySelector('.container').prepend(successDiv);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

// Function to show loading state
function setLoading(element, isLoading) {
    if (isLoading) {
        element.disabled = true;
        element.classList.add('loading');
        element.setAttribute('data-original-text', element.textContent);
        element.textContent = 'Processing...';
    } else {
        element.disabled = false;
        element.classList.remove('loading');
        element.textContent = element.getAttribute('data-original-text') || element.textContent;
    }
}

// Function to validate file before upload
function validateFile(file) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
        return 'Please upload a PDF or Word document (.pdf, .doc, .docx)';
    }
    
    if (file.size > maxSize) {
        return 'File size must be less than 10MB';
    }
    
    if (file.size === 0) {
        return 'File appears to be empty';
    }
    
    return null; // No error
}

// Function to add a new work experience field
function addWorkExperienceField() {
    const container = document.getElementById('work-experience-container');
    const newField = document.createElement('div');
    newField.classList.add('dynamic-field');
    newField.innerHTML = `
        <label>Job Title:</label>
        <input type="text" name="workTitle" placeholder="e.g., Software Engineer">
        <label>Company:</label>
        <input type="text" name="workCompany" placeholder="e.g., Tech Corp">
        <label>Description:</label>
        <textarea name="workDescription" placeholder="Describe your responsibilities and achievements..."></textarea>
        <button type="button" class="remove-field" onclick="removeField(this)">Remove</button>
    `;
    container.appendChild(newField);
}

// Function to add a new education field
function addEducationField() {
    const container = document.getElementById('education-container');
    const newField = document.createElement('div');
    newField.classList.add('dynamic-field');
    newField.innerHTML = `
        <label>Degree:</label>
        <input type="text" name="eduDegree" placeholder="e.g., B.S. Computer Science">
        <label>Institution:</label>
        <input type="text" name="eduInstitution" placeholder="e.g., University Name">
        <button type="button" class="remove-field" onclick="removeField(this)">Remove</button>
    `;
    container.appendChild(newField);
}

// Function to remove a field
function removeField(button) {
    button.parentElement.remove();
}

// Function to collect form data
function collectFormData() {
    const workExperience = [];
    const education = [];
    
    // Collect work experience
    const workFields = document.querySelectorAll('#work-experience-container .dynamic-field');
    workFields.forEach(field => {
        const title = field.querySelector('[name="workTitle"]').value;
        const company = field.querySelector('[name="workCompany"]').value;
        const description = field.querySelector('[name="workDescription"]').value;
        
        if (title || company || description) {
            workExperience.push({ title, company, description });
        }
    });
    
    // Collect education
    const eduFields = document.querySelectorAll('#education-container .dynamic-field');
    eduFields.forEach(field => {
        const degree = field.querySelector('[name="eduDegree"]').value;
        const institution = field.querySelector('[name="eduInstitution"]').value;
        
        if (degree || institution) {
            education.push({ degree, institution });
        }
    });
    
    return {
        name: document.getElementById('name').value,
        email: document.getElementById('email')?.value || '',
        summary: document.getElementById('summary').value,
        skills: document.getElementById('skills').value,
        workExperience,
        education
    };
}

// Event listener for adding work experience fields
document.getElementById('addWorkExpBtn').addEventListener('click', addWorkExperienceField);

// Event listener for adding education fields
document.getElementById('addEducationBtn').addEventListener('click', addEducationField);

// Initial call to add one field for a better user experience
addWorkExperienceField();
addEducationField();

// Event listener for the upload form
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('resumeFile');
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        showError('Please select a file to upload.');
        return;
    }

    const file = fileInput.files[0];
    const validationError = validateFile(file);
    if (validationError) {
        showError(validationError);
        return;
    }

    const formData = new FormData();
    formData.append('resumeFile', file);

    setLoading(submitButton, true);

    try {
        const response = await fetch('/api/upload-resume', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Populate form fields
            const data = result.data;
            
            document.getElementById('name').value = data.name || '';
            document.getElementById('summary').value = data.summary || '';
            
            // Handle email field if it exists
            const emailField = document.getElementById('email');
            if (emailField) {
                emailField.value = data.email || '';
            }
            
            // Handle skills
            const skillsValue = Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || '');
            document.getElementById('skills').value = skillsValue;
            
            // Clear existing dynamic fields and populate with extracted data
            document.getElementById('work-experience-container').innerHTML = '';
            document.getElementById('education-container').innerHTML = '';
            
            // Add work experience from extracted data
            if (data.experience && data.experience.length > 0) {
                data.experience.forEach((exp, index) => {
                    addWorkExperienceField();
                    const workFields = document.querySelectorAll('#work-experience-container .dynamic-field');
                    const lastField = workFields[workFields.length - 1];
                    
                    lastField.querySelector('[name="workTitle"]').value = exp.title || exp.job_title || '';
                    lastField.querySelector('[name="workCompany"]').value = exp.company || exp.organization || '';
                    lastField.querySelector('[name="workDescription"]').value = exp.description || exp.details || '';
                });
            } else {
                addWorkExperienceField(); // Add at least one empty field
            }
            
            // Add education from extracted data
            if (data.education && data.education.length > 0) {
                data.education.forEach((edu, index) => {
                    addEducationField();
                    const eduFields = document.querySelectorAll('#education-container .dynamic-field');
                    const lastField = eduFields[eduFields.length - 1];
                    
                    lastField.querySelector('[name="eduDegree"]').value = edu.degree || edu.qualification || '';
                    lastField.querySelector('[name="eduInstitution"]').value = edu.institution || edu.school || edu.university || '';
                });
            } else {
                addEducationField(); // Add at least one empty field
            }
            
            renderResumePreview(data);
            showSuccess('Resume data extracted successfully!');
        } else {
            const errorMsg = result.error || 'Failed to upload and extract resume data.';
            showError(errorMsg);
            console.error('Upload error:', result);
        }
    } catch (error) {
        console.error('Network error:', error);
        showError('Network error occurred. Please check your connection and try again.');
    } finally {
        setLoading(submitButton, false);
    }
});

// Event listener for generating AI content
document.getElementById('generateSummaryBtn').addEventListener('click', async () => {
    const summaryTextarea = document.getElementById('summary');
    const generateButton = document.getElementById('generateSummaryBtn');
    
    // Collect current form data to provide context
    const formData = collectFormData();
    const userCareerInfo = `
        Name: ${formData.name}
        Skills: ${formData.skills}
        Work Experience: ${formData.workExperience.map(exp => `${exp.title} at ${exp.company}: ${exp.description}`).join('; ')}
        Education: ${formData.education.map(edu => `${edu.degree} from ${edu.institution}`).join('; ')}
    `.trim();

    if (!userCareerInfo || userCareerInfo.length < 10) {
        showError('Please fill in some basic information (name, skills, work experience) before generating a summary.');
        return;
    }

    setLoading(generateButton, true);

    try {
        const response = await fetch('/api/generate-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userCareerInfo })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            summaryTextarea.value = result.summary || result.content;
            
            // Update the preview with the new summary
            const currentData = collectFormData();
            currentData.summary = result.summary || result.content;
            renderResumePreview(currentData);
            
            showSuccess('AI summary generated successfully!');
        } else {
            const errorMsg = result.error || 'Failed to generate summary.';
            showError(errorMsg);
        }
    } catch (error) {
        console.error('AI generation error:', error);
        showError('Failed to generate summary. Please try again.');
    } finally {
        setLoading(generateButton, false);
    }
});

// Event listener for form input changes to update preview
document.getElementById('resumeForm').addEventListener('input', () => {
    const data = collectFormData();
    renderResumePreview(data);
});