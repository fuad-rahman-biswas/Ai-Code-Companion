require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

(async () => {
  try {
    const completion = await groq.chat.completions.create({
      model: "mixtral-8x7b",
      messages: [{ role: "user", content: "Say hello" }],
    });
    console.log(completion.choices[0].message.content);
  } catch (err) {
    console.error(err);
  }
})();
