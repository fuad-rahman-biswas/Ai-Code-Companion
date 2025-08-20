require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth'); // ✅ For Word docs
const path = require('path');
const { Groq } = require('groq-sdk');

const app = express();
app.use(cors());
app.use(bodyParser.json());
const upload = multer({ storage: multer.memoryStorage() });

console.log('GROQ key from env:', process.env.GROQ_API_KEY);

app.use(express.static(path.join(__dirname, '../Frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const contexts = {};

// ✅ Supports TXT, PDF, DOCX
async function extractText(buffer, mimetype, originalname) {
  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8');
  } else if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text || '';
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    originalname.toLowerCase().endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  throw new Error('Unsupported file type');
}

// 📌 Upload & summarize
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const text = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!text.trim()) return res.status(400).json({ error: 'No extractable text found in file' });

    const prompt = `Please provide a concise summary of the following text:\n\n${text}\n\nSummary:`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
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

// 📌 Ask Q&A from notes
app.post('/api/ask', async (req, res) => {
  try {
    const { question, contextId } = req.body;
    if (!question) return res.status(400).json({ error: 'No question provided' });

    let contextText = '';
    if (contextId && contexts[contextId]) {
      contextText = contexts[contextId].text || '';
    }

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `Here are some notes:\n\n${contextText}\n\nQuestion: ${question}` }
      ],
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


// 📌 Generate quiz from uploaded notes
app.post('/api/quiz', async (req, res) => {
  try {
    const { contextId } = req.body;
    if (!contextId || !contexts[contextId]) {
      return res.status(400).json({ error: 'Invalid or missing contextId' });
    }

    const contextText = contexts[contextId].text || '';

    const prompt = `
Create 5 multiple-choice questions strictly based on the following notes.
Each question should have exactly 3 options, with the correct answer index as 0, 1, or 2.
Return ONLY a valid JSON array like this:
[
  { "q": "Question?", "options": ["opt1", "opt2", "opt3"], "answer": 1 }
]

Notes:
${contextText}
`;

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Respond ONLY with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    let quiz;
    try {
      quiz = JSON.parse(completion.choices[0].message.content.trim());
    } catch {
      console.error('Quiz JSON parse failed, returning fallback.');
      quiz = [
        { q: 'Could not generate questions from notes.', options: ['Try again', 'Upload shorter notes', 'Contact support'], answer: 0 }
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
