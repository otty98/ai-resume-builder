require('dotenv').config(); 
const fs = require('fs');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai'); 
const mongoose = require('mongoose');
const multer = require('multer');
const axios = require('axios');
const { spawn } = require('child_process');
const pdf = require('html-pdf');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/resumeBuilderDB')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


// --- Google Gemini API Setup ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY not found in environment variables');
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);


// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Use a unique name + the original file extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
    }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file types
    const allowedTypes = ['.pdf', '.docx', '.doc'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} files are allowed.`));
    }
  }
});



// Serve static files - fix the path
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json({ limit: '10mb' })); // Increased limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Add CORS headers for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});


// --- Mongoose Schema ---
const resumeSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  summary: String,
  workExperience: Array,
  education: Array,
  skills: Array,
  createdAt: { type: Date, default: Date.now }
});
const Resume = mongoose.model('Resume', resumeSchema);



// --- API Routes ---

// Route to handle file upload and parsing with enhanced error handling
app.post('/api/upload-resume', (req, res) => {
    console.log('Upload endpoint hit');

    // Use multer middleware
    upload.single('resumeFile')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err.message);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
          }
        }
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        console.error('No file received');
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      console.log('File received:', req.file.originalname, req.file.size, 'bytes');
      const filePath = req.file.path;

      // Check if Python is available
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      const pythonProcess = spawn(pythonCommand, [path.join(__dirname, 'parser.py'), filePath]);

      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.error(`Python stderr: ${data}`);
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        cleanupFile(filePath);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Python interpreter not found. Please ensure Python is installed.' });
        }
      });

      // Set a timeout for the Python process
      const timeoutId = setTimeout(() => {
        if (!pythonProcess.killed) {
          pythonProcess.kill();
          console.log('Python process timed out and was killed');
          if (!res.headersSent) {
            res.status(500).json({ error: 'Parser timed out. Please try with a smaller file.' });
          }
        }
      }, 30000); // 30 seconds

      pythonProcess.on('close', (code) => {
        clearTimeout(timeoutId); // Prevent timeout firing after close
        console.log(`Python process exited with code: ${code}`);
        cleanupFile(filePath);

        if (res.headersSent) return; // Prevent double response

        if (code !== 0) {
          console.error(`Python script failed with code ${code}. Error: ${errorString}`);
          return res.status(500).json({
            success: false,
            error: `Parsing failed: ${errorString || 'Unknown error from parser.'}`,
            details: `Exit code: ${code}`
          });
        }

        if (!dataString.trim()) {
          console.error('No data received from Python script');
          return res.status(500).json({ success: false, error: 'No data received from parser.' });
        }

        try {
          console.log('Raw Python output:', dataString);
          const extractedData = JSON.parse(dataString);
          console.log('Parsed data:', extractedData);

          if (extractedData.error) {
            return res.status(500).json({ success: false, error: extractedData.error });
          }

          res.json({ success: true, data: extractedData });
        } catch (parseError) {
          console.error('Failed to parse JSON from Python script:', parseError);
          console.error('Raw output was:', dataString);
          res.status(500).json({
            success: false,
            error: 'Invalid data received from parser.',
            details: parseError.message,
            rawOutput: dataString.substring(0, 500)
          });
        }
      });
    });
});


// Helper function to delete temp file
function cleanupFile(filePath) {
  fs.unlink(filePath, (unlinkErr) => {
    if (unlinkErr) {
      console.error('Error deleting temp file:', unlinkErr);
    } else {
      console.log('Temporary file deleted:', filePath);
    }
  });
}


// Route to generate AI content with better error handling
app.post('/api/generate-content', async (req, res) => {
  const { userCareerInfo, jobDescription, jobTitle, experience } = req.body;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured. Please set GEMINI_API_KEY.' });
  }

  
  // Use jobTitle and experience if userCareerInfo is not provided (backward compatibility)
  const careerInfo = userCareerInfo || `Job Title: ${jobTitle}, Experience: ${experience}`;

  const summaryPrompt = `Based on the following career information, write a professional resume summary in 2-3 sentences: ${careerInfo}`;
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Updated model name
    
    console.log('Generating AI content for:', careerInfo.substring(0, 100) + '...');
    
    // Generate a professional summary
    const summaryResult = await model.generateContent(summaryPrompt);
    const summary = summaryResult.response.text();

    let keywords = '';
    let matchingAnalysis = '';

    // Only generate additional content if job description is provided
    if (jobDescription && jobDescription.trim()) {
      const keywordPrompt = `Given this job description: "${jobDescription}", and this resume text: "${careerInfo}". What are 5 key skills or keywords I should add to my resume to better match the job? List them as a comma-separated list.`;
      const matchingPrompt = `Analyze how well this resume matches the following job description. Provide a brief analysis and a percentage match score. Resume: "${careerInfo}". Job Description: "${jobDescription}"`;
      
      const keywordsResult = await model.generateContent(keywordPrompt);
      keywords = keywordsResult.response.text();
      
      const matchingResult = await model.generateContent(matchingPrompt);
      matchingAnalysis = matchingResult.response.text();
    }

    res.json({
      success: true,
      content: summary, // For backward compatibility
      summary: summary,
      keywords: keywords,
      matchingAnalysis: matchingAnalysis
    });
  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate content from AI.',
      details: error.message 
    });
  }
});

// Route to save the resume
app.post('/api/save-resume', async (req, res) => {
  try {
    console.log('Saving resume:', req.body);
    const newResume = new Resume(req.body);
    const savedResume = await newResume.save();
    res.status(201).json({ 
      message: 'Resume saved successfully!', 
      id: savedResume._id 
    });
  } catch (error) {
    console.error('Save resume error:', error);
    res.status(500).json({ 
      message: 'Failed to save resume.', 
      error: error.message 
    });
  }
});


// Route to download a CV
app.post('/api/download-resume', (req, res) => {
    const resumeData = req.body;

    // Define a simple HTML template string
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .container { max-width: 800px; margin: auto; padding: 20px; border: 1px solid #ccc; }
                h1 { color: #333; }
                ul { list-style-type: none; padding: 0; }
                li { margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${resumeData.name || 'Resume'}</h1>
                <p>Email: ${resumeData.email || ''} | Mobile: ${resumeData.mobile_number || ''}</p>
                
                <h3>Summary</h3>
                <p>${resumeData.summary || ''}</p>
                
                <h3>Skills</h3>
                <p>${resumeData.skills || ''}</p>
                
                <h3>Work Experience</h3>
                <ul>
                    ${(resumeData.workExperience || []).map(exp => `
                        <li>
                            <strong>${exp.title || ''}</strong> at ${exp.company || ''}
                            <p>${exp.description || ''}</p>
                        </li>
                    `).join('')}
                </ul>
                
                <h3>Education</h3>
                <ul>
                    ${(resumeData.education || []).map(edu => `
                        <li>
                            <strong>${edu.degree || ''}</strong> from ${edu.institution || ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        </body>
        </html>
    `;
    
    // Create the PDF from the HTML string
    pdf.create(htmlContent, { format: 'A4', border: '10mm' }).toStream((err, stream) => {
        if (err) {
            console.error('PDF creation error:', err);
            return res.status(500).send('Failed to generate PDF.');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${resumeData.name || 'resume'}.pdf"`);
        stream.pipe(res);
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uploadsDir: uploadsDir,
    uploadsDirExists: fs.existsSync(uploadsDir)
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error', details: error.message });
});

// Serve the main HTML file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log(`Uploads directory exists: ${fs.existsSync(uploadsDir)}`);
});