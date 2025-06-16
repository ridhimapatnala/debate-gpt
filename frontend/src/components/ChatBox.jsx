import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatBox = ({ topic, stance, setTopic, messages, input, setInput, handleSend, loading }) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  // Auto-scroll to the bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-xl font-semibold mb-2">
        Debating: <span className="text-blue-600">{topic}</span>
      </h3>
      <div className="flex justify-between items-center mb-4">
        <p className="pl-5 text-blue-600">
          System: <span className="text-black">{stance === 'for' ? 'Against' : 'For'}</span>
        </p>
        <p className="pr-5 text-blue-600">
          You: <span className="text-black">{stance === 'for' ? 'For' : 'Against'}</span>
        </p>
      </div>



      <div className="bg-white border rounded-lg h-80 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg max-w-[80%] break-words ${
              msg.sender === 'user'
                ? 'bg-blue-100 self-end text-right ml-auto'
                : 'bg-gray-200 self-start text-left mr-auto'
            }`}
          >
            <p className="text-xs font-semibold text-gray-500 mb-1">
              {msg.sender === 'user' ? 'You' : 'AI'}
            </p>
            <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}

        {loading && (
          <div className="text-gray-500 text-sm italic">AI is thinking...</div>
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
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          Send
        </button>
        <button
          onClick={() => navigate('/home')}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          End
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
