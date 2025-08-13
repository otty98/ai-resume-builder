// Function to render the live resume preview
function renderResumePreview(data) {
    const previewDiv = document.getElementById('resume-preview');
    if (!previewDiv) {
        console.warn("Live preview container with ID 'resume-preview' not found.");
        return;
    }

    let skillsList = Array.isArray(data.skills) ? data.skills.join(', ') : data.skills || '';
    
    let workExpHTML = '';
    if (data.workExperience && Array.isArray(data.workExperience)) {
        workExpHTML = data.workExperience.map(exp => `
            <li>
                <strong>${exp.title || 'Position'}</strong> at <strong>${exp.company || 'Company'}</strong>
                <p>${exp.description || ''}</p>
            </li>
        `).join('');
    }
    
    let educationHTML = '';
    if (data.education && Array.isArray(data.education)) {
        educationHTML = data.education.map(edu => {
            if (typeof edu === 'object' && edu !== null) {
                return `
                    <li>
                        <strong>${edu.degree || 'Degree'}</strong> from <strong>${edu.institution || 'Institution'}</strong>
                    </li>
                `;
            } else {
                return `<li>${edu}</li>`;
            }
        }).join('');
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
        const container = document.querySelector('.container');
        if (container) {
            container.prepend(errorDiv);
        }
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
    
    const container = document.querySelector('.container');
    if (container) {
        container.prepend(successDiv);
    }
    
    setTimeout(() => successDiv.remove(), 3000);
}

// Loading state
function setLoading(element, isLoading) {
    if (element) {
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

// Add work experience field
function addWorkExperienceField(title = '', company = '', description = '') {
    const container = document.getElementById('work-experience-container');
    if (!container) return;
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
    
// Add education field
function addEducationField(degree = '', institution = '') {
    const container = document.getElementById('education-container');
    if (!container) return;
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

// Collect form data
function collectFormData() {
    const workExperience = [];
    document.querySelectorAll('#work-experience-container .dynamic-field').forEach(field => {
        const title = field.querySelector('[name="workTitle"]')?.value || '';
        const company = field.querySelector('[name="workCompany"]')?.value || '';
        const description = field.querySelector('[name="workDescription"]')?.value || '';
        if (title || company || description) {
            workExperience.push({ title, company, description });
        }
    });
    
    const education = [];
    document.querySelectorAll('#education-container .dynamic-field').forEach(field => {
        const degree = field.querySelector('[name="eduDegree"]')?.value || '';
        const institution = field.querySelector('[name="eduInstitution"]')?.value || '';
        if (degree || institution) {
            education.push({ degree, institution });
        }
    });
    
    return {
        name: document.getElementById('name')?.value || '',
        email: document.getElementById('email')?.value || '',
        mobile_number: document.getElementById('phone')?.value || '',
        summary: document.getElementById('summary')?.value || '',
        skills: document.getElementById('skills')?.value || '',
        workExperience,
        education
    };
}

// Helper function to parse experience string
function parseExperienceString(expString) {
    const atMatch = expString.match(/^([^@]+?)\s+at\s+([^,\n]+)/i);
    if (atMatch) {
        return {
            title: atMatch[1].trim(),
            company: atMatch[2].trim(),
            description: expString.replace(atMatch[0], '').trim()
        };
    }
    return { title: '', company: '', description: expString };
}

// Helper function to parse education string
function parseEducationString(eduString) {
    const fromMatch = eduString.match(/^(.+?)\s+from\s+(.+)/i);
    if (fromMatch) {
        return {
            degree: fromMatch[1].trim(),
            institution: fromMatch[2].trim()
        };
    } else {
        const degreeKeywords = ['bachelor', 'master', 'phd', 'degree', 'diploma', 'certification'];
        const lowerString = eduString.toLowerCase();
        
        for (const keyword of degreeKeywords) {
            if (lowerString.includes(keyword)) {
                return { degree: eduString, institution: '' };
            }
        }
    }
    return { degree: '', institution: eduString };
}

// Wait for the DOM to be fully loaded before adding event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add initial dynamic fields
    addWorkExperienceField();
    addEducationField();

    // Initial render of the live preview
    renderResumePreview(collectFormData());

    // Event listener for the form input to update preview
    const resumeForm = document.getElementById('resumeForm');
    if (resumeForm) {
        resumeForm.addEventListener('input', () => {
            renderResumePreview(collectFormData());
        });
    }

    // Event listener for adding new fields
    const addWorkExpBtn = document.getElementById('addWorkExpBtn');
    if (addWorkExpBtn) {
        addWorkExpBtn.addEventListener('click', () => {
            addWorkExperienceField();
            renderResumePreview(collectFormData());
        });
    }
    
    const addEducationBtn = document.getElementById('addEducationBtn');
    if (addEducationBtn) {
        addEducationBtn.addEventListener('click', () => {
            addEducationField();
            renderResumePreview(collectFormData());
        });
    }

    // Event listener for removing fields (using event delegation)
    document.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('remove-field')) {
            e.preventDefault();
            e.target.closest('.dynamic-field')?.remove();
            renderResumePreview(collectFormData());
        }
    });

    // Event listener for the upload form
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
    
            const fileInput = document.getElementById('resumeFile');
            const submitButton = e.target.querySelector('button[type="submit"]');
            
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
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
    
                if (document.getElementById('name')) document.getElementById('name').value = parsedData.name || '';
                if (document.getElementById('summary')) document.getElementById('summary').value = parsedData.summary || '';
                if (document.getElementById('email')) document.getElementById('email').value = parsedData.email || '';
                if (document.getElementById('phone')) document.getElementById('phone').value = parsedData.mobile_number || parsedData.phone || '';
                
                let skillsValue = Array.isArray(parsedData.skills) ? parsedData.skills.join(', ') : parsedData.skills || '';
                if (document.getElementById('skills')) document.getElementById('skills').value = skillsValue;
                
                const workExpContainer = document.getElementById('work-experience-container');
                if (workExpContainer) {
                    workExpContainer.innerHTML = '';
                    if (parsedData.experience && parsedData.experience.length > 0) {
                        parsedData.experience.forEach(exp => {
                            if (typeof exp === 'object' && exp !== null) {
                                addWorkExperienceField(exp.title || '', exp.company || '', exp.description || '');
                            } else if (typeof exp === 'string') {
                                const { title, company, description } = parseExperienceString(exp);
                                addWorkExperienceField(title, company, description);
                            }
                        });
                    } else {
                        addWorkExperienceField();
                    }
                }
                
                const educationContainer = document.getElementById('education-container');
                if (educationContainer) {
                    educationContainer.innerHTML = '';
                    if (parsedData.education && parsedData.education.length > 0) {
                        parsedData.education.forEach(edu => {
                            if (typeof edu === 'object' && edu !== null) {
                                addEducationField(edu.degree || '', edu.institution || '');
                            } else if (typeof edu === 'string') {
                                const { degree, institution } = parseEducationString(edu);
                                addEducationField(degree, institution);
                            }
                        });
                    } else {
                        addEducationField();
                    }
                }
                
                renderResumePreview(collectFormData());
                showSuccess('Resume data extracted successfully!');
                
            } catch (error) {
                console.error('Network or parsing error:', error);
                showError('An error occurred. Check console for details.');
            } finally {
                setLoading(submitButton, false);
            }
        });
    }

    // AI summary generation
    const generateSummaryBtn = document.getElementById('generateSummaryBtn');
    if (generateSummaryBtn) {
        generateSummaryBtn.addEventListener('click', async () => {
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
                    if (summaryTextarea) summaryTextarea.value = result.summary || result.content;
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
    }
    
    // Save resume
    const saveResumeBtn = document.getElementById('saveResumeBtn');
    if (saveResumeBtn) {
        saveResumeBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const saveButton = document.getElementById('saveResumeBtn');
            setLoading(saveButton, true);
            const formData = collectFormData();
            
            try {
                const response = await fetch('/api/save-resume', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
    }

    // Event listener for the download button
    const downloadCvBtn = document.getElementById('downloadCvBtn');
    if (downloadCvBtn) {
        downloadCvBtn.addEventListener('click', async () => {
            const downloadButton = document.getElementById('downloadCvBtn');
            setLoading(downloadButton, true);
    
            const resumeData = collectFormData();
            
            try {
                const response = await fetch('http://localhost:3000/api/download-resume', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(resumeData)
                });
    
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${resumeData.name || 'resume'}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
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
    }
});