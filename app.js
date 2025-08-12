/* Ultra frontend (no frameworks) with backend integration */

// ---------- DOM ----------
const app = document.getElementById('app');
const navBtns = Array.from(document.querySelectorAll('.nav-btn'));
const views = {
  summary: document.getElementById('view-summary'),
  ask: document.getElementById('view-ask'),
  quiz: document.getElementById('view-quiz')
};

/* Summary DOM */
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const btnSummarize = document.getElementById('btnSummarize');
const btnClear = document.getElementById('btnClear');
const btnCopy = document.getElementById('btnCopy');
const progress = document.getElementById('progress');
const summaryContent = document.getElementById('summaryContent');
const summaryMeta = document.getElementById('summaryMeta');
const previewText = document.getElementById('previewText');

/* Chat DOM */
const chatArea = document.getElementById('chatArea');
const questionInput = document.getElementById('questionInput');
const askBtn = document.getElementById('askBtn');
const recentQA = document.getElementById('recentQA');

/* Quiz DOM */
const genQuizBtn = document.getElementById('genQuizBtn');
const gradeBtn = document.getElementById('gradeBtn');
const quizList = document.getElementById('quizList');
const quizResult = document.getElementById('quizResult');

/* Theme */
const themeToggle = document.getElementById('themeToggle');

/* state */
let uploadedText = '';
let qaHistory = [];
let quizData = [];
let currentContextId = null;  // Store context ID from upload response

/* ---------- Nav handling ---------- */
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    Object.values(views).forEach(v => v.classList.remove('active'));
    if (views[view]) views[view].classList.add('active');
    Object.entries(views).forEach(([k, v]) => v.setAttribute('aria-hidden', views[k] === views[view] ? 'false' : 'true'));
  });
});

/* ---------- Theme (persist) ---------- */
function setTheme(t){
  if(t === 'dark') app.setAttribute('data-theme','dark');
  else app.removeAttribute('data-theme');
  themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('asc_theme', t);
}
themeToggle.addEventListener('click', () => {
  const cur = localStorage.getItem('asc_theme') || 'light';
  setTheme(cur === 'dark' ? 'light' : 'dark');
});
setTheme(localStorage.getItem('asc_theme') || 'light');


/* ---------- Dropzone & file ---------- */
function handleFileText(text){
  uploadedText = text;
  previewText.textContent = text.length > 400 ? text.slice(0,400) + '…' : (text || 'No preview available.');
  summaryContent.textContent = '📝 Demo summary: ' + (text.slice(0,200).replace(/\s+/g,' ') + '…');
  summaryMeta.textContent = `Preview: ${Math.max(0, Math.min(250, text.length))} chars`;
}

// click to open
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if(!f) return;
  if(f.type === 'application/pdf'){
    previewText.textContent = 'PDF uploaded — backend parsing recommended for full extraction.';
    summaryContent.textContent = '📝 PDF detected. Use backend to extract text.';
    uploadedText = '';
    return;
  }
  const r = new FileReader();
  r.onload = (ev) => handleFileText(ev.target.result || '');
  r.readAsText(f);
});

// drag/drop
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault(); dropZone.classList.remove('dragover');
  const f = e.dataTransfer.files[0]; if(!f) return;
  if(f.type === 'application/pdf'){ previewText.textContent = 'PDF uploaded (backend recommended)'; summaryContent.textContent = 'PDF detected.'; uploadedText = ''; return; }
  const r = new FileReader(); r.onload = (ev) => handleFileText(ev.target.result || ''); r.readAsText(f);
});

/* ---------- Summarize action (calls backend) ---------- */
function showProgress(msg = 'Working…'){
  progress.classList.add('show'); progress.querySelector('span').textContent = msg;
}
function hideProgress(){
  progress.classList.remove('show');
}

btnSummarize.addEventListener('click', async () => {
  if (!fileInput.files.length) {
    alert('Please drop or select a .txt or .pdf file first.');
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);

  btnSummarize.textContent = 'Processing…';
  btnSummarize.disabled = true;
  showProgress('Summarizing…');

  try {
    const response = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();

    // Update UI with backend response
    previewText.textContent = data.text.length > 400 ? data.text.slice(0, 400) + '…' : data.text || 'No preview available.';
    summaryContent.textContent = data.summary || 'No summary returned.';
    summaryMeta.textContent = `Context ID: ${data.contextId || 'N/A'}`;
    
    currentContextId = data.contextId || null;

  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    hideProgress();
    btnSummarize.textContent = 'Summarize';
    btnSummarize.disabled = false;
  }
});

/* ---------- Copy summary ---------- */
btnCopy.addEventListener('click', async () => {
  try{
    await navigator.clipboard.writeText(summaryContent.textContent || '');
    btnCopy.textContent = 'Copied!';
    setTimeout(()=> btnCopy.textContent = 'Copy Summary', 1200);
  }catch(e){
    alert('Copy failed');
  }
});

/* ---------- Clear ---------- */
btnClear.addEventListener('click', () => {
  fileInput.value = ''; uploadedText = '';
  previewText.textContent = 'No file loaded.'; 
  summaryContent.textContent = '—'; 
  summaryMeta.textContent = 'No summary yet';
  chatArea.innerHTML = '<div class="chat-empty small-muted">Ask anything about your notes.</div>';
  recentQA.innerHTML = 'No interactions yet.'; 
  quizList.innerHTML = 'Click “Generate Quiz” to create questions.'; 
  quizResult.textContent = '';
  qaHistory = []; quizData = [];
  currentContextId = null;
});

/* ---------- Chat with backend ---------- */
function appendMessage(text, who='bot', opts={type:true}){
  const placeholder = chatArea.querySelector('.chat-empty');
  if(placeholder) placeholder.remove();

  const el = document.createElement('div');
  el.className = `chat-bubble ${who === 'user' ? 'user' : 'bot'}`;
  if(opts.type){
    el.textContent = '';
    chatArea.appendChild(el);
    chatArea.scrollTop = chatArea.scrollHeight;
    typeText(text, el, 12 + Math.random()*8);
  } else {
    el.textContent = text; chatArea.appendChild(el);
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}

async function typeText(text, el, speed=20){
  for(let i=0;i<text.length;i++){
    el.textContent += text[i];
    chatArea.scrollTop = chatArea.scrollHeight;
    await new Promise(r => setTimeout(r, speed));
  }
}

askBtn.addEventListener('click', askQuestion);
questionInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault(); askQuestion();
  }
});

async function askQuestion(){
  const q = questionInput.value.trim();
  if(!q) return;
  appendMessage(q, 'user', {type:false});
  questionInput.value = '';
  appendMessage('⏳ thinking...', 'bot', {type:false});

  try {
    const body = { question: q };
    if(currentContextId) body.contextId = currentContextId;

    const response = await fetch('http://localhost:5000/api/ask', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

    const data = await response.json();

    // Remove 'thinking' bubble
    const bubbles = chatArea.querySelectorAll('.chat-bubble.bot');
    const last = bubbles[bubbles.length-1];
    if(last && last.textContent.includes('thinking')) last.remove();

    // Show real answer typed
    appendMessage(data.answer || 'No answer from server.', 'bot', {type:true});

    // Store recent
    qaHistory.push({q, a: data.answer || ''});
    updateRecentQA();

  } catch(err) {
    alert(`Error: ${err.message}`);
    // Remove 'thinking' bubble on error
    const bubbles = chatArea.querySelectorAll('.chat-bubble.bot');
    const last = bubbles[bubbles.length-1];
    if(last && last.textContent.includes('thinking')) last.remove();
  }
}

function updateRecentQA(){
  recentQA.innerHTML = '';
  if(!qaHistory.length){ recentQA.textContent = 'No interactions yet.'; return; }
  qaHistory.slice(-4).reverse().forEach(item => {
    const p = document.createElement('div'); 
    p.className='small-muted'; 
    p.textContent = `Q: ${item.q} — A: ${item.a.slice(0,80)}${item.a.length>80?'…':''}`; 
    recentQA.appendChild(p);
  });
}

/* ---------- Quiz with backend ---------- */
genQuizBtn.addEventListener('click', async () => {
  genQuizBtn.disabled = true; genQuizBtn.textContent = 'Generating…';
  showProgress('Generating quiz…');

  try {
    // If you want to pass contextId for quiz generation
    const body = {};
    if(currentContextId) body.contextId = currentContextId;

    const response = await fetch('http://localhost:5000/api/quiz', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

    const data = await response.json();

    quizData = data.quiz || [];

    if(!quizData.length) {
      quizList.textContent = 'No quiz questions returned.';
    } else {
      renderQuiz();
    }

  } catch(err) {
    alert(`Error: ${err.message}`);
    quizList.textContent = 'Failed to generate quiz.';
  } finally {
    hideProgress();
    genQuizBtn.disabled = false;
    genQuizBtn.textContent = 'Generate Quiz';
  }
});

function renderQuiz(){
  quizList.innerHTML = '';
  quizData.forEach((it, idx) => {
    const card = document.createElement('div'); 
    card.className = 'q-card';
    card.innerHTML = `<div><strong>${idx+1}. ${it.q}</strong></div>`;

    const opts = document.createElement('div'); 
    opts.className='options mt-small';

    it.options.forEach((opt, i) => {
      const b = document.createElement('button'); 
      b.textContent = opt;

      b.addEventListener('click', () => {
        it.userAnswer = i;

        // Mark selected visually
        Array.from(opts.children).forEach((c,j)=> {
          c.classList.toggle('selected', j === i);
          c.disabled = true; // lock answers after selection
        });

        // Instant grading feedback
        if (i === it.answer) {
          b.classList.add('correct');
        } else {
          b.classList.add('wrong');
          opts.children[it.answer].classList.add('correct'); // show correct answer
        }

        // Update score instantly
        updateQuizScore();
      });

      opts.appendChild(b);
    });

    card.appendChild(opts); 
    quizList.appendChild(card);
  });
  quizResult.textContent = '';
}

function updateQuizScore(){
  let score = quizData.filter(q => q.userAnswer === q.answer).length;
  let answered = quizData.filter(q => q.userAnswer !== undefined).length;
  quizResult.textContent = `✅ Score: ${score} / ${quizData.length} (${answered} answered)`;
}

gradeBtn.addEventListener('click', () => {
  if(!quizData.length){ quizResult.textContent = 'No quiz to grade.'; return; }
  let score = 0; quizData.forEach(q => { if(q.userAnswer === q.answer) score++; });
  quizResult.textContent = `✅ You scored ${score} / ${quizData.length}`;
});

/* ---------- init UI ---------- */
chatArea.innerHTML = '<div class="chat-empty small-muted">Ask anything about your notes.</div>';
quizList.innerHTML = 'Click “Generate Quiz” to create questions.';
recentQA.textContent = 'No interactions yet.';

/* ---------- Accessibility / nice touches ---------- */
// ensure focus states and keyboard users get good behavior
dropZone.addEventListener('keyup', (e) => { if(e.key === 'Enter') fileInput.click(); });
