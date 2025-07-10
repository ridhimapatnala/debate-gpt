

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatBox = ({ topic, stance, setTopic, messages, input, setInput, handleSend, loading }) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [isFeedbackOn, setIsFeedbackOn] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-xl font-semibold mb-2">
        Debating: <span className="text-blue">{topic}</span>
      </h3>
      <div className="mb-4">
        <label className="font-semibold mr-2">Feedback:</label>
        <button
          className={`px-3 py-1 rounded mr-2 ${isFeedbackOn ? "bg-blue text-cream" : "bg-cream text-blue"}`}
          onClick={() => setIsFeedbackOn(true)}
        >
          On
        </button>
        <button
          className={`px-3 py-1 rounded ${isFeedbackOn === false ? "bg-blue text-cream" : "bg-cream text-blue"}`}
          onClick={() => setIsFeedbackOn(false)}
        >
          Off
        </button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <p className="pl-5 text-blue">
          System: <span className="text-navy">{stance === 'for' ? 'Against' : 'For'}</span>
        </p>
        <p className="pr-5 text-blue">
          You: <span className="text-navy">{stance === 'for' ? 'For' : 'Against'}</span>
        </p>
      </div>

      <div className="bg-cream border rounded-lg h-80 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg max-w-[80%] break-words ${
              msg.sender === 'user'
                ? 'bg-blue/10 self-end text-right ml-auto'
                : 'bg-navy/10 self-start text-left mr-auto'
            }`}
          >
            <p className="text-xs font-semibold text-navy mb-1">
              {msg.sender === 'user' ? 'You' : 'AI'}
            </p>
            <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
            {/* Show feedback under user message in green (using blue for positive, red for negative, navy for neutral) */}
            {isFeedbackOn === true && msg.sender === 'user' && msg.feedback && (
              <p className="text-xs italic text-blue bg-blue/10 rounded px-2 py-1 mt-2">
                {msg.feedback}
              </p>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-navy text-sm italic">AI is thinking...</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 mt-4">
        <input
          type="text"
          className="flex-1 p-2 border rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
          
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue text-cream rounded hover:bg-navy"
          disabled={loading}
        >
          Send
        </button>
        <button
          onClick={() => navigate('/home')}
          className="px-4 py-2 bg-red text-cream rounded hover:bg-darkRed"
        >
          End
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
