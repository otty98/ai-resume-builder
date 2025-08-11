// Function to render the live resume preview
function renderResumePreview(data) {
    const previewDiv = document.getElementById('resume-preview');
    let workExpHTML = '';
    let educationHTML = '';

    if (data.workExperience) {
        workExpHTML = data.workExperience.map(exp => `
            <li>
                <strong>${exp.title}</strong> at <strong>${exp.company}</strong>
                <p>${exp.description || ''}</p>
            </li>
        `).join('');
    }

    if (data.education) {
        educationHTML = data.education.map(edu => `
            <li>
                <strong>${edu.degree}</strong> from <strong>${edu.institution}</strong>
            </li>
        `).join('');
    }

    previewDiv.innerHTML = `
        <div class="preview-section">
            <h3>${data.name || ''}</h3>
            <p>Email: ${data.email || ''}</p>
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
            <p>${data.skills || ''}</p>
        </div>
    `;
}

// Function to add a new work experience field
function addWorkExperienceField() {
    const container = document.getElementById('work-experience-container');
    const newField = document.createElement('div');
    newField.classList.add('dynamic-field');
    newField.innerHTML = `
        <label>Job Title:</label>
        <input type="text" name="workTitle">
        <label>Company:</label>
        <input type="text" name="workCompany">
        <label>Description:</label>
        <textarea name="workDescription"></textarea>
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
        <input type="text" name="eduDegree">
        <label>Institution:</label>
        <input type="text" name="eduInstitution">
    `;
    container.appendChild(newField);
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
    const formData = new FormData();
    formData.append('resumeFile', fileInput.files[0]);

    try {
        const response = await fetch('/api/upload-resume', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            // Populate form fields
            document.getElementById('name').value = result.data.name || '';
            document.getElementById('summary').value = result.data.summary || '';
            document.getElementById('skills').value = result.data.skills ? result.data.skills.join(', ') : '';
            // TODO: Dynamically populate work experience and education fields from extracted data
            renderResumePreview(result.data);
            alert('Resume data extracted successfully!');
        } else {
            alert('Failed to upload and extract resume data.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during upload.');
    }
});

// Event listener for generating AI content
document.getElementById('generateSummaryBtn').addEventListener('click', async () => {
    const summaryTextarea = document.getElementById('summary');
    const jobTitle = "Software Engineer"; // Placeholder for user input
    const experience = "5 years of full-stack development"; // Placeholder

    try {
        const response = await fetch('/api/generate-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jobTitle, experience })
        });
        const result = await response.json();
        summaryTextarea.value = result.content;
        
        // Update the preview with the new summary
        const currentData = {
            name: document.getElementById('name').value,
            summary: result.content,
            // ... other form data
        };
        renderResumePreview(currentData);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate summary.');
    }
});

// Event listener for form input changes to update preview
document.getElementById('resumeForm').addEventListener('input', () => {
    const data = {
        name: document.getElementById('name').value,
        summary: document.getElementById('summary').value,
        skills: document.getElementById('skills').value,
        // TODO: Get data from the dynamic work experience and education fields
        workExperience: [{
          title: "Software Engineer",
          company: "Tech Company",
          description: "Developed and maintained web applications."
        }],
        education: [{
          degree: "B.S. Computer Science",
          institution: "University of Technology"
        }]
    };
    renderResumePreview(data);
});

// Initial render of the resume preview
renderResumePreview({
    name: 'John Doe',
    summary: 'A passionate developer with experience in creating dynamic web applications.',
    skills: 'JavaScript, HTML, CSS, Node.js, Express, MongoDB',
    workExperience: [{
        title: "Software Engineer",
        company: "Tech Company",
        description: "Developed and maintained web applications."
    }],
    education: [{
        degree: "B.S. Computer Science",
        institution: "University of Technology"
    }]
});