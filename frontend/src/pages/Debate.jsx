import React, { useState } from 'react';
import axios from 'axios';
import ChatBox from '../components/ChatBox';

const Debate = () => {
  const [topic, setTopic] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [debateId, setDebateId] = useState(null);
  const [stance, setStance] = useState("for");
  const [loading, setLoading] = useState(false);

  const debateTopics = [
    "Should AI be regulated?",
    "Pineapple belongs on pizza",
    "Online education is better than offline",
    "Homework should be banned",
    "Social media does more harm than good",
    "Video games are harmful",
    "Space exploration is a waste of money",
    "School uniforms should be mandatory",
    "Zoos should be abolished",
    "Climate change is the biggest threat",
    "Cats are better pets than dogs",
    "Online education is better than offline.",
    "Everyone should take afternoon naps.",
    "Typing in all caps should be banned.",
    "Social media does more harm than good."
  ];

  const handleRandomTopic = () => {
    const random = debateTopics[Math.floor(Math.random() * debateTopics.length)];
    setTopic(random);
  };

  const handleStartDebate = () => {
    if (topic.trim()) {
      setSubmitted(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', content: input };
    const updatedMessages = [...messages, userMsg];
    setLoading(true);
    setMessages(updatedMessages);
    setInput('');

    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
      };
      let response;
      if (!debateId) {
        response = await axios.post('http://localhost:5000/api/debates', {
          topic,
          userStance: stance,
          messages: updatedMessages,
          feedback: '',
        }, config);
        setDebateId(response.data.data._id);
      } else {
        response = await axios.put(`http://localhost:5000/api/debates/${debateId}`, {
          messages: updatedMessages,
          userStance: stance,
          topic,
          feedback: '',
        }, config);
      }

      const updatedDebate =
        response.data.updatedDebate || response.data.data;

      if (updatedDebate?.messages) {
        setMessages(updatedDebate.messages);
      }
      console.log('Response', response.data);

    } catch (e) {
      console.error('Error sending message', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-0">
      {!submitted ? (
        <>
          <h2 className="text-2xl font-bold mb-4">Enter a Debate Topic</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="e.g. Should AI be regulated?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button
              onClick={handleRandomTopic}
              className="px-4 py-2 bg-blue text-white rounded hover:bg-blue-700"
            >
              Random
            </button>
          </div>

          <div className="mb-4">
            <label className="font-semibold mr-2">Your stance:</label>
            <button
              className={`px-3 py-1 rounded mr-2 ${stance === "for" ? "bg-navy text-white" : "bg-gray-200"}`}
              onClick={() => setStance("for")}
            >
              For
            </button>
            <button
              className={`px-3 py-1 rounded ${stance === "against" ? "bg-navy text-white" : "bg-gray-200"}`}
              onClick={() => setStance("against")}
            >
              Against
            </button>
          </div>

          <button
            onClick={handleStartDebate}
            className="mt-4 px-5 py-2 bg-red text-white rounded hover:bg-blue-700"
          >
            Start Debate
          </button>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Sample Topics:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {debateTopics
                .slice(0, 3)
                .map((t, i) => (
                  <li
                    key={i}
                    onClick={() => setTopic(t)}
                    className="cursor-pointer hover:underline"
                  >
                    {t}
                  </li>
                ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="mt-2">
          <ChatBox
            topic={topic}
            stance={stance}
            setTopic={setTopic}
            messages={messages}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default Debate;
