// Function to render the live resume preview
function renderResumePreview(data) {
    const previewDiv = document.getElementById('resume-preview');
    
    // Process skills
    const skillsList = Array.isArray(data.skills) ? data.skills.join(', ') : data.skills || '';
    
    // Process work experience
    let workExpHTML = '';
    if (data.workExperience && Array.isArray(data.workExperience)) {
        workExpHTML = data.workExperience.map(exp => `
            <li>
                <strong>${exp.title || 'Position'}</strong> at <strong>${exp.company || 'Company'}</strong>
                <p>${exp.description || ''}</p>
            </li>
        `).join('');
    } else if (data.experience && Array.isArray(data.experience)) {
        workExpHTML = data.experience.map(exp => `<li>${exp}</li>`).join('');
    }
    
    // Process education
    let educationHTML = '';
    if (data.education && Array.isArray(data.education)) {
        educationHTML = data.education.map(edu => `
            <li>
                <strong>${edu.degree || 'Degree'}</strong> from <strong>${edu.institution || 'Institution'}</strong>
            </li>
        `).join('');
    } else if (data.degree || data.college_name) {
        educationHTML = `
            <li>
                <strong>${data.degree || 'Degree Not Found'}</strong> from <strong>${data.college_name || 'Institution Not Found'}</strong>
            </li>
        `;
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
            <p>${skillsList}</p>
        </div>
    `;
}

// Show error
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
    
    document.querySelectorAll('.error-message').forEach(err => err.remove());
    
    if (element) {
        element.appendChild(errorDiv);
    } else {
        document.querySelector('.container').prepend(errorDiv);
    }
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Show success
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
    
    document.querySelectorAll('.success-message').forEach(msg => msg.remove());
    
    document.querySelector('.container').prepend(successDiv);
    
    setTimeout(() => successDiv.remove(), 3000);
}

// Loading state
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

// Validate file
function validateFile(file) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024;
    
    if (!allowedTypes.includes(file.type)) {
        return 'Please upload a PDF or Word document (.pdf, .doc, .docx)';
    }
    if (file.size > maxSize) {
        return 'File size must be less than 10MB';
    }
    if (file.size === 0) {
        return 'File appears to be empty';
    }
    return null;
}

// Add work experience
function addWorkExperienceField(title = '', company = '', description = '') {
    const container = document.getElementById('work-experience-container');
    const newField = document.createElement('div');
    newField.classList.add('dynamic-field');
    newField.innerHTML = `
        <label>Job Title:</label>
        <input type="text" name="workTitle" value="${title}">
        <label>Company:</label>
        <input type="text" name="workCompany" value="${company}">
        <label>Description:</label>
        <textarea name="workDescription">${description}</textarea>
        <button type="button" class="remove-field">Remove</button> 
    `;
    container.appendChild(newField);
}

// Add education
function addEducationField(degree = '', institution = '') {
    const container = document.getElementById('education-container');
    const newField = document.createElement('div');
    newField.classList.add('dynamic-field');
    newField.innerHTML = `
        <label>Degree:</label>
        <input type="text" name="eduDegree" value="${degree}">
        <label>Institution:</label>
        <input type="text" name="eduInstitution" value="${institution}">
        <button type="button" class="remove-field">Remove</button>
    `;
    container.appendChild(newField);
}

document.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('remove-field')) {
        e.preventDefault();
        e.target.closest('.dynamic-field').remove();
    }
});


// Collect form data
function collectFormData() {
    const workExperience = [];
    const education = [];
    
    document.querySelectorAll('#work-experience-container .dynamic-field').forEach(field => {
        const title = field.querySelector('[name="workTitle"]').value;
        const company = field.querySelector('[name="workCompany"]').value;
        const description = field.querySelector('[name="workDescription"]').value;
        if (title || company || description) {
            workExperience.push({ title, company, description });
        }
    });
    
    document.querySelectorAll('#education-container .dynamic-field').forEach(field => {
        const degree = field.querySelector('[name="eduDegree"]').value;
        const institution = field.querySelector('[name="eduInstitution"]').value;
        if (degree || institution) {
            education.push({ degree, institution });
        }
    });
    
    return {
        name: document.getElementById('name').value,
        email: document.getElementById('email')?.value || '',
        mobile_number: document.getElementById('phone')?.value || '',
        summary: document.getElementById('summary').value,
        skills: document.getElementById('skills').value,
        workExperience,
        education,
        template: document.getElementById('cvTemplate').value
    };
}

// Button listeners
document.getElementById('addWorkExpBtn').addEventListener('click', () => addWorkExperienceField());
document.getElementById('addEducationBtn').addEventListener('click', () => addEducationField());
addWorkExperienceField();
addEducationField();

// Upload form
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
        const response = await fetch('http://localhost:3000/api/upload-resume', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        const parsedData = result.data;

        document.getElementById('name').value = parsedData.name || '';
        document.getElementById('summary').value = parsedData.summary || '';
        
        const emailField = document.getElementById('email');
        if (emailField) {
            emailField.value = parsedData.email || '';
        }
        
        const skillsValue = Array.isArray(parsedData.skills) ? parsedData.skills.join(', ') : (parsedData.skills || '');
        document.getElementById('skills').value = skillsValue;
        
        document.getElementById('work-experience-container').innerHTML = '';
        if (parsedData.experience && parsedData.experience.length > 0) {
            parsedData.experience.forEach(exp => addWorkExperienceField('', '', exp));
        } else {
            addWorkExperienceField();
        }
        
        document.getElementById('education-container').innerHTML = '';
        if (parsedData.degree || parsedData.college_name) {
            addEducationField(parsedData.degree, parsedData.college_name);
        } else {
            addEducationField();
        }
        
        renderResumePreview(parsedData);
        showSuccess('Resume data extracted successfully!');
        
    } catch (error) {
        console.error('Network or parsing error:', error);
        showError('An error occurred. Check console for details.');
    } finally {
        setLoading(submitButton, false);
    }
});

// AI summary generation
document.getElementById('generateSummaryBtn').addEventListener('click', async () => {
    const summaryTextarea = document.getElementById('summary');
    const generateButton = document.getElementById('generateSummaryBtn');
    
    const formData = collectFormData();
    const userCareerInfo = `
        Name: ${formData.name}
        Skills: ${formData.skills}
        Work Experience: ${formData.workExperience.map(exp => `${exp.title} at ${exp.company}: ${exp.description}`).join('; ')}
        Education: ${formData.education.map(edu => `${edu.degree} from ${edu.institution}`).join('; ')}
    `.trim();

    if (!userCareerInfo || userCareerInfo.length < 10) {
        showError('Please fill in some basic information before generating a summary.');
        return;
    }

    setLoading(generateButton, true);

    try {
        const response = await fetch('/api/generate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userCareerInfo })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            summaryTextarea.value = result.summary || result.content;
            const currentData = collectFormData();
            currentData.summary = result.summary || result.content;
            renderResumePreview(currentData);
            showSuccess('AI summary generated successfully!');
        } else {
            showError(result.error || 'Failed to generate summary.');
        }
    } catch (error) {
        console.error('AI generation error:', error);
        showError('Failed to generate summary.');
    } finally {
        setLoading(generateButton, false);
    }
});

document.getElementById('resumeForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const saveButton = document.getElementById('saveResumeBtn');
    setLoading(saveButton, true);

    const formData = collectFormData();
    
    try {
        const response = await fetch('/api/save-resume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess(result.message);
            console.log('Resume saved with ID:', result.id);
        } else {
            showError(result.message || 'Failed to save resume.');
        }

    } catch (error) {
        console.error('Error saving resume:', error);
        showError('An error occurred while saving the resume. Check console for details.');
    } finally {
        setLoading(saveButton, false);
    }
});

// New event listener for the download button
document.getElementById('downloadCvBtn').addEventListener('click', async () => {
    const downloadButton = document.getElementById('downloadCvBtn');
    setLoading(downloadButton, true);

    // Collect all form data, including the new template selection
    const resumeData = collectFormData();
    resumeData.template = document.getElementById('cvTemplate').value;

    try {
        const response = await fetch('http://localhost:3000/api/download-resume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resumeData)
        });

        if (response.ok) {
            // Create a blob from the response and trigger a download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${resumeData.name || 'resume'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            showSuccess('CV downloaded successfully!');
        } else {
            const errorText = await response.text();
            throw new Error(errorText);
        }
    } catch (error) {
        console.error('Download error:', error);
        showError('Failed to download CV. Please try again.');
    } finally {
        setLoading(downloadButton, false);
    }
});

// Update preview on form change
document.getElementById('resumeForm').addEventListener('input', () => {
    renderResumePreview(collectFormData());
});
