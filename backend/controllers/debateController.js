const axios = require('axios');
const Debate = require('../models/Debate');
const jwt=require('jsonwebtoken');
const JWT_SECRET=process.env.JWT_SECRET;
// GET all debates
const getAllDebates = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } else {
      return res.status(401).json({ error: 'No token provided' });
    }

    const debates = await Debate.find({ user: userId }).sort({ createdAt: -1 });
    res.json(debates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user-specific debates' });
  }
};


// POST create a new debate

const createDebate = async (req, res) => {
  console.log('####Hit /api/debates POST route');
  console.log('####req.body:', req.body);
  console.log( '####typeof req.body.messages:', typeof req.body.messages);

  try {
    const { topic, userStance, messages } = req.body;
    console.log(req.body);
    if (!topic || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    const stance = typeof userStance === 'object' ? userStance.stance : userStance;
    const aiStance = stance === 'for' ? 'against' : 'for';

    const chatMessages = [
      {
        role: 'system',
        content: `You are a helpful AI debate assistant.

        Your role is to strictly argue for the stance: "${aiStance}" the topic: "${topic}". 
        Build on the user's perspective and always reply in simple, clear language.

        Keep responses **very short**, ideally matching the user's content length, and **never exceed 40 words**.

        If the user asks off-topic questions, gently guide them back to the debate topic.

        Be logical, respectful, and persuasive at all times.`
      },
      ...messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content || '',
      }))
    ];

    const aiResponse = await axios.post(
      `${process.env.OPENROUTER_API_URL}`,
      {
        model: 'deepseek/deepseek-r1:free',
        messages: chatMessages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiReply = aiResponse.data.choices[0]?.message?.content || 'No response from AI';
    

    // Feedback on last user message
    const lastUserIndex = [...messages].map(m => m.sender).lastIndexOf('user');
    let feedback = '';
    let updatedMessages = [...messages];
    console.log('#### messages received in request:', messages);
    console.log('#### lastUserIndex:', lastUserIndex);
    if (lastUserIndex !== -1) {
      const feedbackPrompt = [
        {
          role: 'system',
          content: `You are an impartial AI debate judge.

          You are evaluating the user's last message in a debate on the topic: "${topic}".
          The user's stance is "${stance}", and they are debating against the AI stance: "${aiStance}".

          Give a **one-line**, constructive, and unbiased feedback on how well the user's last message supported their stance.
          Keep it brief and helpful. Do **not** exceed 30 words. Focus only on the user's last message.`,
        },
        {
          role: 'user',
          content: messages[lastUserIndex].content || '',
        }
      ];

      const feedbackRes = await axios.post(
        `${process.env.OPENROUTER_API_URL}`,
        {
          model: 'deepseek/deepseek-r1:free',
          messages: feedbackPrompt,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      feedback = feedbackRes.data.choices[0]?.message?.content || 'No feedback from AI';
      console.log('🟢 AI Feedback generated :(createDebate)', feedback);
      // Add feedback to last user message
      updatedMessages[lastUserIndex] = {
        ...updatedMessages[lastUserIndex],
        feedback,
      };
    }

    // Optional auth
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (tokenErr) {
        console.warn('Invalid token, proceeding as guest.');
      }
    }

    const newDebate = new Debate({
      topic,
      userStance: stance,
      messages: [...updatedMessages, { sender: 'ai', content: aiReply }],
      user: userId,
    });

    const savedDebate = await newDebate.save();

    /* res.status(201).json({
      success: true,
      data: savedDebate,
      aiReply,
      aiFeedback: feedback,
    }); */
    const finalDebate = await Debate.findById(savedDebate._id); // re-fetch to get fully saved data

    res.status(201).json({
      success: true,
      data: finalDebate,
      aiReply,
      aiFeedback: feedback,
    });



  } catch (err) {
    console.error('OpenRouter error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create debate or get AI reply.' });
  }
};

// PUT update a debate
const updateDebate = async (req, res) => {
  console.log('####Hit /api/debates PUT route');
  console.log('####req.body:', req.body);
  console.log('####typeof req.body.messages:', typeof req.body.messages);
  try {
    const { id } = req.params;
    const { messages, userStance, topic } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    const stance = typeof userStance === 'object' ? userStance.stance : userStance;
    const aiStance = stance === 'for' ? 'against' : 'for';

    const systemPrompt = {
      role: 'system',
      content: `You are a helpful AI debate assistant.

      Your role is to strictly argue for the stance: "${aiStance}" the topic: "${topic}". 

      Build on the user's perspective and always reply in simple, clear language.

      Keep responses **very short**, ideally matching the user's content length, and **never exceed 40 words**.

      If the user asks off-topic questions, gently guide them back to the debate topic.

      Be logical, respectful, and persuasive at all times.`
    };

    const chatMessages = [
      systemPrompt,
      ...messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content || ''
      }))
    ];

    const aiResponse = await axios.post(
      `${process.env.OPENROUTER_API_URL}`,
      {
        model: 'deepseek/deepseek-r1:free',
        messages: chatMessages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiReply = aiResponse.data.choices[0]?.message?.content || 'No response from AI';
    
    const lastUserIndex = [...messages].map(m => m.sender).lastIndexOf('user');
    console.log('#### messages received in request:', messages);
    console.log('#### lastUserIndex:', lastUserIndex);
    let aiFeedback = '';
    let updatedMessages = [...messages];

    if (lastUserIndex !== -1) {
      const feedbackPrompt = [
        {
          role: 'system',
          content: `You are an impartial AI debate judge.

          You are evaluating the user's last message in a debate on the topic: "${topic}".
          The user's stance is "${stance}", and they are debating against the AI stance: "${aiStance}".

          Give a **one-line**, constructive, and unbiased feedback on how well the user's last message supported their stance.
          Keep it brief and helpful. Do **not** exceed 30 words. Focus only on the user's last message.`,
        },
        {
          role: 'user',
          content: messages[lastUserIndex].content || '',
        }
      ];

      const aiFeedbackRes = await axios.post(
        `${process.env.OPENROUTER_API_URL}`,
        {
          model: 'deepseek/deepseek-r1:free',
          messages: feedbackPrompt,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      aiFeedback = aiFeedbackRes.data.choices[0]?.message?.content || 'No feedback from AI';
      console.log('🟢 AI Feedback generated: (updateDebate)', aiFeedback);
      updatedMessages[lastUserIndex] = {
        ...updatedMessages[lastUserIndex],
        feedback: aiFeedback,
      };
    }

    updatedMessages.push({ sender: 'ai', content: aiReply });

    const updatedDebate = await Debate.findByIdAndUpdate(
      id,
      { $set: { messages: updatedMessages } },
      { new: true }
    );

    const finalUpdated = await Debate.findById(updatedDebate._id);

    res.json({
      success: true,
      aiReply,
      aiFeedback,
      updatedDebate: finalUpdated
    });

  } catch (err) {
    console.error('Update error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to update debate or get AI reply.' });
  }
};

// DELETE debata
const deleteDebate = async (req, res) => {
  try {
    const { id } = req.params;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const debate = await Debate.findById(id);
    if (!debate) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    // Check if the user is the owner of the debate
    if (debate.user && debate.user.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this debate' });
    }

    await Debate.findByIdAndDelete(id);

    res.json({ success: true, message: 'Debate deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete debate' });
  }
};

module.exports = {
  getAllDebates,
  createDebate,
  updateDebate,
  deleteDebate
};

/* 
const axios = require('axios');
const Debate = require('../models/Debate');
const { getUserIdFromAuthHeader } = require('../utils/auth');

// Format system prompt
const buildSystemPrompt = (stance, topic) => {
  const aiStance = stance === 'for' ? 'against' : 'for';
  return {
    role: 'system',
    content: `You are a helpful AI debate assistant.
    Your role is to strictly argue for the stance: "${aiStance}" on the topic: "${topic}". 
    Never argue from the opposing side ("${stance}") or present both sides.

    Build on the user's perspective and always reply in simple, clear language.

    Keep responses **very short**, ideally matching the user's content length, and **never exceed 40 words**.

    If the user asks off-topic questions, gently guide them back to the debate topic.

    Be logical, respectful, and persuasive at all times.`
  };
};

// Format judge prompt
const buildJudgePrompt = (topic, userMessage) => [
  {
    role: 'system',
    content: `You are a debate judge. Critique the user's statement below as an unbiased judge.
    Topic: "${topic}"
    Your task is to give **short feedback** (1-2 sentences max) on clarity, relevance, and argument strength. Be professional.`
  },
  {
    role: 'user',
    content: userMessage,
  },
];

const prepareChatMessages = (messages, systemPrompt) => [
  systemPrompt,
  ...messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content || ''
  }))
];

const getAIReply = async (chatMessages) => {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'deepseek/deepseek-r1:free',
      messages: chatMessages,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
    }
  );
  return response.data.choices[0]?.message?.content || 'No response from AI';
};

const getAllDebates = async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);
    const debates = await Debate.find({ user: userId }).sort({ createdAt: -1 });
    res.json(debates);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const createDebate = async (req, res) => {
  try {
    const { topic, userStance, messages, feedback } = req.body;
    if (!topic || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    const stance = typeof userStance === 'object' ? userStance.stance : userStance;
    const systemPrompt = buildSystemPrompt(stance, topic);
    const chatMessages = prepareChatMessages(messages, systemPrompt);

    const aiReply = await getAIReply(chatMessages);

    const lastUserIndex = [...messages].map(m => m.sender).lastIndexOf('user');
    let aiFeedback = '';
    let updatedMessages = [...messages];

    if (lastUserIndex !== -1) {
      const feedbackPrompt = buildJudgePrompt(topic, messages[lastUserIndex].content);
      aiFeedback = await getAIReply(feedbackPrompt);
      updatedMessages[lastUserIndex] = { ...updatedMessages[lastUserIndex], feedback: aiFeedback };
    }

    let userId = null;
    try {
      userId = getUserIdFromAuthHeader(req.headers.authorization);
    } catch (_) {}

    const newDebate = new Debate({
      topic,
      userStance: stance,
      messages: [...updatedMessages, { sender: 'ai', content: aiReply }],
      feedback: feedback || '',
      user: userId,
    });

    const savedDebate = await newDebate.save();

    console.log('####USER MESSAGE:', updatedMessages.map(m => m.content));
    console.log('####AI REPLY:', aiReply);
    console.log('####AI FEEDBACK:', aiFeedback);

    res.status(201).json({ success: true, data: savedDebate, aiReply });
  } catch (err) {
    console.error('Create Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create debate or get AI reply.' });
  }
};

const updateDebate = async (req, res) => {
  try {
    const { id } = req.params;
    const { messages, userStance, topic } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    const stance = typeof userStance === 'object' ? userStance.stance : userStance;
    const systemPrompt = buildSystemPrompt(stance, topic);
    const chatMessages = prepareChatMessages(messages, systemPrompt);

    const aiReply = await getAIReply(chatMessages);

    const lastUserIndex = [...messages].map(m => m.sender).lastIndexOf('user');
    let aiFeedback = '';
    let updatedMessages = [...messages];

    if (lastUserIndex !== -1) {
      const feedbackPrompt = buildJudgePrompt(topic, messages[lastUserIndex].content);
      aiFeedback = await getAIReply(feedbackPrompt);
      updatedMessages[lastUserIndex] = { ...updatedMessages[lastUserIndex], feedback: aiFeedback };
    }

    updatedMessages.push({ sender: 'ai', content: aiReply });

    const updatedDebate = await Debate.findByIdAndUpdate(
      id,
      { $set: { messages: updatedMessages } },
      { new: true }
    );

    console.log('####USER MESSAGES:', updatedMessages.map(m => m.content));
    console.log('####AI REPLY:', aiReply);
    console.log('####AI FEEDBACK:', aiFeedback);

    res.json({ success: true, aiReply, updatedDebate });
  } catch (err) {
    console.error('Update error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to update debate or get AI reply.' });
  }
};

const deleteDebate = async (req, res) => {
  try {
    const userId = getUserIdFromAuthHeader(req.headers.authorization);
    const { id } = req.params;

    const debate = await Debate.findById(id);
    if (!debate) {
      return res.status(404).json({ error: 'Debate not found' });
    }

    if (debate.user && debate.user.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this debate' });
    }

    await Debate.findByIdAndDelete(id);
    res.json({ success: true, message: 'Debate deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete debate' });
  }
};

module.exports = {
  getAllDebates,
  createDebate,
  updateDebate,
  deleteDebate
}; */