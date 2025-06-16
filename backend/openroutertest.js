const axios = require('axios');
require('dotenv').config(); 

(async () => {
  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1:free',
        messages: [
          { role: 'user', content: 'Hello AI!' }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, // or paste directly: 'Bearer your-key'
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("AI Reply:", res.data.choices[0].message.content);
  } catch (error) {
    console.error("OpenRouter Test Error:", error.response?.data || error.message);
  }
})();
