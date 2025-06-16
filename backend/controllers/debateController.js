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
  try {
    const { topic, userStance, messages, feedback } = req.body;

    if (!topic || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    const stance = typeof userStance === 'object' ? userStance.stance : userStance;
    const aiStance = stance === 'for' ? 'against' : 'for';

    const chatMessages = [
      {
        role: 'system',
        content: `You are an AI assistant in a debate.
                  Your role is to argue strictly "${aiStance}" the topic: "${topic}".
                  You must NEVER argue from the "${stance}" side or present both sides.
                  Keep the response as short as possible and do not exceed more than 75 words strictly.
                  Be logical, respectful, and persuasive.`,
      },
      ...messages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content || '',
      })),
    ];

    const aiResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
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

    // Optional auth token handling
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
      messages: [...messages, { sender: 'ai', content: aiReply }],
      feedback: feedback || '',
      user: userId, // Save null for guest, ObjectId for logged-in
    });

    const savedDebate = await newDebate.save();

    res.status(201).json({
      success: true,
      data: savedDebate,
      aiReply,
    });
  } catch (err) {
    console.error('OpenRouter error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create debate or get AI reply.' });
  }
};


// PUT update a debate
const updateDebate = async (req, res) => {
  try {
    const { id } = req.params;
    const { messages, userStance, topic } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    const stance = typeof userStance === 'object' ? userStance.stance : userStance;
    const aiStance = stance === 'for' ? 'against' : 'for';
    const chatMessages = [
      {
        role: 'system',
        content: `You are an AI assistant in a debate.
                  Your role is to argue strictly "${aiStance}" the topic: "${topic}".
                  You must NEVER argue from the "${stance}" side or present both sides.
                  Keep the response as short as possible and do not exceed more than 75 words strictly.
                  Be logical, respectful, and persuasive.`
      },
      ...messages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content || '',
      })),
    ];

    const aiResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
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
    const updatedMessages = [...messages, { sender: 'ai', content: aiReply }];

    const updatedDebate = await Debate.findByIdAndUpdate(
      id,
      { $set: { messages: updatedMessages } },
      { new: true }
    );

    res.json({ success: true, aiReply, updatedDebate });
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
