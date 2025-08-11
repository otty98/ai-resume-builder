require('dotenv').config(); 
const fs = require('fs');
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const axios = require('axios'); // For making API calls to an AI service
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/resumeBuilderDB')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

  // --- Google Gemini API Setup ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const genAI = new GoogleGenAI(GEMINI_API_KEY);

  // Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json()); // Middleware to parse JSON bodies

// --- Mongoose Schema ---
const resumeSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  summary: String,
  workExperience: Array,
  education: Array,
  skills: Array
});
const Resume = mongoose.model('Resume', resumeSchema);

// --- API Routes ---

// Route to handle file upload and parsing
app.post('/api/upload-resume', upload.single('resumeFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;

    const pythonProcess = spawn('python', ['parser.py', filePath]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        // Always delete the uploaded file after processing
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });

        if (code !== 0) {
            console.error(`Python script exited with code ${code}. Error: ${errorString}`);
            return res.status(500).send(`Parsing failed: ${errorString || 'Unknown error.'}`);
        }

        try {
            const extractedData = JSON.parse(dataString);
            res.json({ success: true, data: extractedData });
        } catch (error) {
            console.error('Failed to parse JSON from Python script:', error);
            res.status(500).send('Invalid data received from parser.');
        }
    });
});


// Route to generate AI content (e.g., a summary)
app.post('/api/generate-content', async (req, res) => {
    const { userCareerInfo, jobDescription } = req.body;

    // A prompt to ask the LLM to generate a professional summary
    const summaryPrompt = `Based on the following career information, write a professional resume summary: ${userCareerInfo}`;
    
    // A prompt for keyword optimization
    const keywordPrompt = `Given this job description: "${jobDescription}", and this resume text: "${userCareerInfo}". What are 5 key skills or keywords I should add to my resume to better match the job? List them only.`;
    
    // A prompt for job matching analysis
    const matchingPrompt = `Analyze how well this resume matches the following job description. Provide a brief analysis and a percentage match score. Resume: "${userCareerInfo}". Job Description: "${jobDescription}"`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Use the appropriate Gemini model
        
        // Generate a professional summary
        const summaryResult = await model.generateContent(summaryPrompt);
        const summary = summaryResult.response.text;
        
        // Optimize keywords
        const keywordsResult = await model.generateContent(keywordPrompt);
        const keywords = keywordsResult.response.text;
        
        // Perform job matching analysis
        const matchingResult = await model.generateContent(matchingPrompt);
        const matchingAnalysis = matchingResult.response.text;

        res.json({
            success: true,
            summary: summary,
            keywords: keywords,
            matchingAnalysis: matchingAnalysis
        });
    } catch (error) {
        console.error('AI API Error:', error);
        res.status(500).send('Failed to generate content from AI.');
    }
});

// Route to save the resume
app.post('/api/save-resume', async (req, res) => {
  try {
    const newResume = new Resume(req.body);
    await newResume.save();
    res.status(201).json({ message: 'Resume saved successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save resume.', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});