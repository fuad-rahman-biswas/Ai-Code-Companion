require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const { Groq } = require('groq-sdk'); // ✅ Groq SDK

const app = express();
app.use(cors());
app.use(bodyParser.json());
const upload = multer({ storage: multer.memoryStorage() });

console.log('GROQ key from env:', process.env.GROQ_API_KEY); // For debugging

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../Frontend')));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

// ✅ Groq client setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// In-memory storage for uploaded texts and summaries
const contexts = {};

async function extractText(buffer, mimetype) {
  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8');
  } else if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text || '';
  }
  throw new Error('Unsupported file type');
}

// Upload file and get summary
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const text = await extractText(req.file.buffer, req.file.mimetype);
    if (!text.trim()) return res.status(400).json({ error: 'No extractable text found in file' });

    const prompt = `Please provide a concise summary of the following text:\n\n${text}\n\nSummary:`;

    const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant", // or "llama2-70b-4096"
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 150,
  });

    const summary = completion.choices[0].message.content.trim();
    const contextId = `ctx-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    contexts[contextId] = { text, summary };

    res.json({ text, summary, contextId });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Ask a question
app.post('/api/ask', async (req, res) => {
  try {
    const { question, contextId } = req.body;
    if (!question) return res.status(400).json({ error: 'No question provided' });

    let contextText = '';
    if (contextId && contexts[contextId]) {
      contextText = contexts[contextId].text || '';
    }

    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
    ];
    if (contextText) {
      messages.push({ role: 'user', content: `Here are some notes:\n\n${contextText}` });
    }
    messages.push({ role: 'user', content: `Answer this question:\n${question}` });

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    const answer = completion.choices[0].message.content.trim();
    res.json({ answer });
  } catch (error) {
    console.error('Ask error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Generate quiz
app.post('/api/quiz', async (req, res) => {
  try {
    const { contextId } = req.body;
    let contextText = '';
    if (contextId && contexts[contextId]) {
      contextText = contexts[contextId].text || '';
    }

    const prompt = `
Create 5 multiple-choice questions based on the following notes. 
Each question should have 3 options and indicate the correct answer index (0, 1, or 2).
Format the output as a JSON array like this:
[
  { "q": "Question?", "options": ["opt1", "opt2", "opt3"], "answer": 1 }
]

Notes:
${contextText}

Questions:
`;

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    let quiz = [];
    try {
      quiz = JSON.parse(completion.choices[0].message.content.trim());
    } catch {
      quiz = [
        { q: 'What does AI stand for?', options: ['Artificial Intelligence', 'Apple Inc', 'Automobile Industry'], answer: 0 },
        { q: 'Which language is used for styling?', options: ['HTML', 'CSS', 'Python'], answer: 1 }
      ];
    }

    res.json({ quiz });
  } catch (error) {
    console.error('Quiz error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
