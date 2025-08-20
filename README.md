# 🚀 AI Study Companion

A sleek, modern web application that transforms your study materials into interactive learning experiences using AI. Upload documents, get instant summaries, ask questions, and test your knowledge with auto-generated quizzes.

![AI Study Companion Demo](assets/Screenshot-01.png)

## ✨ Features

### 📄 **Smart Document Processing**
- Drag & drop file upload with visual feedback
- Support for .txt files (frontend) and .pdf files (backend required)
- Real-time document preview
- Instant AI-powered summarization

### 💬 **Interactive Q&A Chat**
- WhatsApp/iMessage style chat interface with typing animations
- Context-aware responses based on uploaded documents
- Chat history with recent Q&A sidebar
- Real-time message rendering with smooth animations

### 🧠 **Intelligent Quiz Generation**
- Auto-generated multiple-choice questions from your content
- Interactive quiz interface with instant feedback
- Real-time scoring and performance tracking
- Visual feedback for correct/incorrect answers

### 🎨 **Modern UI/UX**
- Dark theme with glassmorphism effects
- Smooth animations and micro-interactions
- Responsive design for all screen sizes
- Accessible keyboard navigation
- Professional gradient designs and hover effects

## 🛠️ Tech Stack

**Frontend:**
- Pure HTML5, CSS3, and Vanilla JavaScript
- Modern CSS features (Grid, Flexbox, Custom Properties)
- Glassmorphism and modern design principles
- No external dependencies for maximum performance

**Backend Integration:**
- RESTful API endpoints for document processing
- File upload handling with multipart form data
- Context-aware AI responses
- Quiz generation based on document content

## 🚀 Quick Start

### Frontend Only (Demo Mode)
1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-study-companion.git
cd ai-study-companion
```

2. Open `index.html` in your browser:
```bash
# Using Python's built-in server
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Or simply open index.html in your browser
```

3. The app will run in demo mode with simulated responses.

### Full Backend Integration
For complete functionality including PDF processing and real AI responses, you'll need to set up the backend:

1. **Backend Setup** (Python Flask example):
```python
# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    # Handle file upload and return summary
    file = request.files['file']
    # Process file and generate summary using your AI service
    return jsonify({
        'contextId': 'unique-id',
        'text': 'extracted text',
        'summary': 'AI generated summary'
    })

@app.route('/api/ask', methods=['POST'])
def ask_question():
    data = request.json
    # Process question with context and return AI response
    return jsonify({'answer': 'AI generated answer'})

@app.route('/api/quiz', methods=['POST'])
def generate_quiz():
    # Generate quiz questions from context
    return jsonify({'quiz': [
        {
            'q': 'Sample question?',
            'options': ['A', 'B', 'C', 'D'],
            'answer': 0
        }
    ]})

if __name__ == '__main__':
    app.run(debug=True)
```

2. **Install dependencies:**
```bash
pip install flask flask-cors
# Add your AI service dependencies (OpenAI, Anthropic, etc.)
```

3. **Run the backend:**
```bash
python app.py
```

4. **Update API endpoint** in the frontend if needed (currently set to `http://localhost:5000`)

## 📁 Project Structure

```
ai-study-companion/
├── index.html              # Main application file
├── README.md               # Project documentation
├── LICENSE                 # License file
├── backend/                # Backend implementation (optional)
│   ├── app.py             # Flask server example
│   ├── requirements.txt   # Python dependencies
│   └── utils/             # Helper functions
├── assets/                # Static assets
│   ├── images/           # Screenshots and demos
│   └── docs/             # Additional documentation
└── examples/              # Example documents for testing
```

## 🎯 API Endpoints

### `POST /api/upload`
Upload and process documents
- **Body:** FormData with file
- **Response:** `{contextId, text, summary}`

### `POST /api/ask`
Ask questions about uploaded content
- **Body:** `{question, contextId?}`
- **Response:** `{answer}`

### `POST /api/quiz`
Generate quiz from content
- **Body:** `{contextId?}`
- **Response:** `{quiz: [{q, options, answer}]}`

## 🎨 Customization

### Themes
The app supports light/dark themes. Modify CSS custom properties in `:root` to customize colors:

```css
:root {
  --primary: #6366f1;        /* Primary brand color */
  --secondary: #06b6d4;      /* Secondary accent */
  --bg-primary: #0f0f23;     /* Main background */
  --text-primary: #ffffff;    /* Primary text */
  /* ... more variables */
}
```

### Styling
The entire design system uses CSS custom properties, making it easy to rebrand or modify the appearance without touching core styles.

## 🔧 Configuration

### Environment Variables
```bash
# Backend configuration
API_BASE_URL=http://localhost:5000
OPENAI_API_KEY=your-openai-key
MAX_FILE_SIZE=10485760  # 10MB
```

### Frontend Configuration
Update the API endpoint in the JavaScript:
```javascript
const API_BASE_URL = 'http://localhost:5000'; // Change this to your backend URL
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and naming conventions
- Add comments for complex functionality
- Test your changes across different browsers
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Design inspired by modern productivity applications
- Icons and emojis for enhanced user experience
- Built with accessibility and performance in mind

## 📸 Screenshots

### Document Upload & Summary
![Upload Interface](https://via.placeholder.com/600x400/1a1a2e/ffffff?text=Upload+%26+Summary+View)

### Interactive Chat
![Chat Interface](https://via.placeholder.com/600x400/1a1a2e/ffffff?text=AI+Chat+Interface)

### Quiz Generation
![Quiz Interface](https://via.placeholder.com/600x400/1a1a2e/ffffff?text=Interactive+Quiz+Mode)

## 🚦 Roadmap

- [ ] **Mobile app** using React Native
- [ ] **Collaboration features** for team study
- [ ] **More file formats** (DOCX, PPT, etc.)
- [ ] **Export functionality** (PDF reports, flashcards)
- [ ] **Study analytics** and progress tracking
- [ ] **Integration** with popular learning platforms

## 📞 Support

Having issues? Here's how to get help:

1. **Check** existing [Issues](https://github.com/yourusername/ai-study-companion/issues)
2. **Create** a new issue with detailed description
3. **Join** our [Discord community](https://discord.gg/yourinvite)
4. **Email** us at support@yourdomain.com

---

⭐ **Star this repo** if you find it helpful! 

**Built with ❤️ for students and lifelong learners everywhere.**
