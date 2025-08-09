/* Ultra frontend (no frameworks)
   - Polished UX
   - Drag/drop + file read for txt (PDF stub)
   - Animated theme toggle (persisted)
   - Typing animation for AI replies
   - Loading / progress UI
   - Ready to replace simulated parts with backend fetch() calls
*/

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

/* ---------- Nav handling ---------- */
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    Object.values(views).forEach(v => v.classList.remove('active'));
    if (views[view]) views[view].classList.add('active');
    // set aria-hidden appropriately
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

/* ---------- Summarize action (demo with progress) ---------- */
function showProgress(msg = 'Working…'){
  progress.classList.add('show'); progress.querySelector('span').textContent = msg;
}
function hideProgress(){
  progress.classList.remove('show');
}

btnSummarize.addEventListener('click', async () => {
  if(!uploadedText && !fileInput.files.length){
    alert('Drop or choose a .txt file first (demo). For PDFs, backend needed.');
    return;
  }

  // UI loading
  btnSummarize.textContent = btnSummarize.dataset?.loadingText || 'Processing…';
  btnSummarize.disabled = true;
  showProgress('Summarizing…');

  // simulate network / LLM time with animated progress
  await new Promise(r => setTimeout(r, 900 + Math.random()*900));

  // Demo summary — replace with fetch('/api/upload', FormData) integrated with your backend
  if(uploadedText){
    const lines = uploadedText.split(/\n+/).filter(Boolean);
    const first = lines.slice(0,6).join(' ').slice(0,600);
    summaryContent.textContent = `• Key ideas: ${first}…\n\n(Replace with LLM-generated bullets via backend)`;
    summaryMeta.textContent = `Length: ${uploadedText.length} chars • ${lines.length} lines`;
  } else {
    summaryContent.textContent = 'No raw text available in demo frontend. Use backend for PDF extraction.';
    summaryMeta.textContent = 'PDF uploaded — backend recommended';
  }

  hideProgress();
  btnSummarize.textContent = 'Summarize';
  btnSummarize.disabled = false;
});

/* copy summary */
btnCopy.addEventListener('click', async () => {
  try{
    await navigator.clipboard.writeText(summaryContent.textContent || '');
    btnCopy.textContent = 'Copied!';
    setTimeout(()=> btnCopy.textContent = 'Copy Summary', 1200);
  }catch(e){
    alert('Copy failed');
  }
});

/* clear */
btnClear.addEventListener('click', () => {
  fileInput.value = ''; uploadedText = '';
  previewText.textContent = 'No file loaded.'; summaryContent.textContent = '—'; summaryMeta.textContent = 'No summary yet';
  chatArea.innerHTML = '<div class="chat-empty small-muted">Ask anything about your notes.</div>';
  recentQA.innerHTML = 'No interactions yet.'; quizList.innerHTML = 'Click “Generate Quiz” to create questions.'; quizResult.textContent = '';
  qaHistory = []; quizData = [];
});

/* ---------- Chat (typing animation) ---------- */
function appendMessage(text, who='bot', opts={type:true}){
  // remove placeholder
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

/* ask action */
askBtn.addEventListener('click', askQuestion);
questionInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault(); askQuestion();
  }
});

function askQuestion(){
  const q = questionInput.value.trim();
  if(!q) return;
  appendMessage(q, 'user', {type:false});
  questionInput.value = '';
  appendMessage('⏳ thinking...', 'bot', {type:false});

  // simulate LLM delay then replace thinking with typed answer
  setTimeout(async () => {
    // remove last thinking bubble
    const bubbles = chatArea.querySelectorAll('.chat-bubble.bot');
    const last = bubbles[bubbles.length-1];
    if(last && last.textContent.includes('thinking')) last.remove();

    // compute demo answer
    let answer = '🤖 Demo answer: hook up your backend for real responses.';
    if(uploadedText){
      const kw = q.split(' ').slice(0,3).join(' ').replace(/[^\w\s]/g,'');
      const match = uploadedText.match(new RegExp(`(.{0,120}${kw}.{0,120})`, 'i'));
      if(match) answer = `From notes: ${match[0].slice(0,280)}…`;
      else answer = 'From notes: could not find a direct match — try a more specific question.';
    }
    appendMessage(answer, 'bot', {type:true});

    // store recent
    qaHistory.push({q, a: answer});
    updateRecentQA();
  }, 700 + Math.random()*800);
}

function updateRecentQA(){
  recentQA.innerHTML = '';
  if(!qaHistory.length){ recentQA.textContent = 'No interactions yet.'; return; }
  qaHistory.slice(-4).reverse().forEach(item => {
    const p = document.createElement('div'); p.className='small-muted'; p.textContent = `Q: ${item.q} — A: ${item.a.slice(0,80)}${item.a.length>80?'…':''}`; recentQA.appendChild(p);
  });
}

/* ---------- Quiz ---------- */
genQuizBtn.addEventListener('click', async () => {
  // show progress
  genQuizBtn.disabled = true; genQuizBtn.textContent = 'Generating…';
  showProgress('Generating quiz…');

  // simulate LLM/processing delay
  await new Promise(r => setTimeout(r, 900 + Math.random()*900));

  // demo question set — replace with fetch('/api/quiz', {context}) to backend
  quizData = [
    { q:'What does AI commonly stand for?', options:['A food','Artificial Intelligence','A movie'], answer:1 },
    { q:'ML commonly means?', options:['Master Logic','Machine Learning','Mega Lunch'], answer:1 },
    { q:'HTML is used for?', options:['Structure','Style','Computation'], answer:0 },
    { q:'CSS focuses on?', options:['Behavior','Styling','Storage'], answer:1 },
    { q:'JS stands for?', options:['JustScript','JavaScript','JumpScript'], answer:1 }
  ];
  renderQuiz();
  hideProgress();
  genQuizBtn.disabled = false; genQuizBtn.textContent = 'Generate Quiz';
});

function renderQuiz(){
  quizList.innerHTML = '';
  quizData.forEach((it, idx) => {
    const card = document.createElement('div'); card.className = 'q-card';
    card.innerHTML = `<div><strong>${idx+1}. ${it.q}</strong></div>`;
    const opts = document.createElement('div'); opts.className='options mt-small';
    it.options.forEach((opt, i) => {
      const b = document.createElement('button'); b.textContent = opt;
      b.addEventListener('click', () => {
        it.userAnswer = i;
        Array.from(opts.children).forEach((c,j)=> c.classList.toggle('selected', j===i));
      });
      opts.appendChild(b);
    });
    card.appendChild(opts); quizList.appendChild(card);
  });
  quizResult.textContent = '';
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

/* ---------- Notes ----------
To integrate with backend:
- /api/upload: send FormData {file} -> returns {summary, text, contextId?}
- Replace btnSummarize handler to POST to /api/upload and set summaryContent from response.
- /api/ask: POST { question, contextId? } -> returns { answer }
- /api/quiz: POST { contextId? } -> returns { quiz: [{q, options, correctIndex}] }

This frontend is intentionally modular so you can swap simulated parts for real fetch() calls.
------------------------------------- */
