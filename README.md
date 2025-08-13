AI Resume Builder
This is a web application that helps you create and manage your resume. You can upload an existing CV to automatically extract information, generate a professional summary with the help of an AI, and build or edit your resume using a simple form. The live preview feature allows you to see your changes in real-time. Finally, you can download your completed resume as a PDF file.

Features
Upload and Parse CV: Upload an existing resume in .pdf or .docx format to automatically populate the form fields.

AI-Powered Summary Generation: Click a button to generate a professional summary based on your work experience and skills.

Interactive Form: Easily add, edit, and remove sections for work experience and education.

Live Preview: See a live preview of your resume as you make changes to the form.

Download as PDF: Download your final resume as a clean PDF document.

How to Run
Prerequisites
Node.js installed

MongoDB installed and running

Python 3.x installed

pyresparser Python library installed. You can install it using pip:

Bash

pip install pyresparser
Google Gemini API Key

Obtain an API key from Google AI Studio.

Create a .env file in the root directory of your project.

Add your API key to the .env file like this: GEMINI_API_KEY="YOUR_API_KEY"

Backend
Navigate to the project's root directory in your terminal.

Install the Node.js dependencies:

Bash

npm install
Start the backend server:

Bash

node server.js
The server will run on http://localhost:3000.
