let appState = {
  contextId: null,
  extractedText: null,
  quiz: [],
  answers: []
};

const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const clearBtn = document.getElementById('clearBtn');
const summaryContent = document.getElementById('summaryContent');

const chatArea = document.getElementById('chatArea');
const questionInput = document.getElementById('questionInput');
const askBtn = document.getElementById('askBtn');

const genQuizBtn = document.getElementById('genQuizBtn');
const quizList = document.getElementById('quizList');
const gradeBtn = document.getElementById('gradeBtn');
const quizResult = document.getElementById('quizResult');

function appendChat(message, who='bot') {
  const d = document.createElement('div');
  d.className = 'chat-bubble ' + (who === 'user' ? 'user' : 'bot');
  d.textContent = message;
  chatArea.appendChild(d);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// Upload
uploadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) { alert('Pick a PDF or TXT file first.'); return; }

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';

  try {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');

    const data = await res.json();
    summaryContent.innerHTML = data.summary || data.text || 'No summary returned.';
    appState.contextId = data.contextId || null;
    appState.extractedText = data.text || null;
  } catch (err) {
    console.error(err);
    alert('Upload failed — check console.');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload & Summarize';
  }
});

// Clear
clearBtn.addEventListener('click', () => {
  fileInput.value = '';
  summaryContent.innerHTML = '';
  chatArea.innerHTML = '';
  questionInput.value = '';
  quizList.innerHTML = '';
  quizResult.innerHTML = '';
  appState = { contextId: null, extractedText: null, quiz: [], answers: [] };
});

// Ask
askBtn.addEventListener('click', async () => {
  const q = questionInput.value.trim();
  if (!q) return;
  appendChat(q, 'user');
  questionInput.value = '';
  appendChat('Thinking...', 'bot');

  try {
    const payload = { question: q };
    if (appState.contextId) payload.contextId = appState.contextId;
    else if (appState.extractedText) payload.context = appState.extractedText;

    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    chatArea.lastChild.textContent = data.answer || 'No answer returned.';
  } catch (err) {
    console.error(err);
    chatArea.lastChild.textContent = 'Error answering — check console.';
  }
});

// Generate Quiz
genQuizBtn.addEventListener('click', async () => {
  genQuizBtn.disabled = true;
  genQuizBtn.textContent = 'Generating...';
  quizList.innerHTML = '';
  quizResult.innerHTML = '';
  appState.quiz = [];
  appState.answers = [];

  try {
    const payload = {};
    if (appState.contextId) payload.contextId = appState.contextId;
    else if (appState.extractedText) payload.context = appState.extractedText;

    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Quiz generation failed');

    const data = await res.json();
    appState.quiz = data.quiz || [];
    renderQuiz();
  } catch (err) {
    console.error(err);
    quizList.innerHTML = '<div class="text-danger">Quiz generation failed.</div>';
  } finally {
    genQuizBtn.disabled = false;
    genQuizBtn.textContent = 'Generate Quiz (5 Qs)';
  }
});

function renderQuiz() {
  quizList.innerHTML = '';
  appState.quiz.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'mb-3';
    card.innerHTML = `
      <div class="fw-semibold">Q${idx+1}. ${item.q}</div>
      <div class="options-list mt-2" id="q-${idx}"></div>
    `;
    quizList.appendChild(card);

    const optContainer = card.querySelector(`#q-${idx}`);
    item.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-primary';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        appState.answers[idx] = i;
        [...optContainer.children].forEach(c => c.classList.remove('btn-primary'));
        btn.classList.add('btn-primary');
      });
      optContainer.appendChild(btn);
    });
  });

  if (appState.quiz.length === 0) {
    quizList.innerHTML = '<div class="text-muted">No quiz returned.</div>';
  }
}

// Grade
gradeBtn.addEventListener('click', () => {
  if (appState.quiz.length === 0) {
    quizResult.innerHTML = '<div class="text-danger">No quiz to grade.</div>';
    return;
  }
  let score = 0;
  appState.quiz.forEach((q, idx) => {
    if (appState.answers[idx] === q.correctIndex) score++;
  });
  quizResult.innerHTML = `<div class="alert alert-info p-2">Score: <strong>${score}</strong> / ${appState.quiz.length}</div>`;
});
