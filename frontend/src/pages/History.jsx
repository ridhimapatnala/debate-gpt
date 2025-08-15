import { useEffect, useState } from "react";
import axios from "axios";
import ChatBox from "../components/ChatBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

const History = () => {
  const [debateHistory, setDebateHistory] = useState([]);
  const [selectedDebate, setSelectedDebate] = useState(null); // for rendering ChatBox

  useEffect(() => {
    const fetchDebates = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/debates`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDebateHistory(response.data);
      } catch (error) {
        console.error("Error fetching debates:", error.message);
      }
    };

    fetchDebates();
  }, []);

  const showDebateDetails = (index) => {
    setSelectedDebate(debateHistory[index]);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/debates/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDebateHistory((prev) => prev.filter((debate) => debate._id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto mt-2">
      <h2 className="text-2xl font-bold mb-6">Debate History</h2>

      {selectedDebate ? (
        <>
          <button
            onClick={() => setSelectedDebate(null)}
            className="mb-4 text-blue-600 underline hover:text-blue-800"
          >
            ← Back to History
          </button>

          <ChatBox
            topic={selectedDebate.topic}
            messages={selectedDebate.messages.map((msg) => ({
              sender: msg.sender,
              content: msg.content, 
              feedback: msg.feedback
            }))}
            input=""
            setInput={() => {}}
            handleSend={() => {}}
          />
        </>
      ) : (
        <>
          {debateHistory.length === 0 ? (
            <p className="text-gray-600">No debates yet. Go start one!</p>
          ) : (
            <ul className="space-y-4">
              {debateHistory.map((item, index) => (
                <li
                  key={index}
                  className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => showDebateDetails(index)}
                      className="text-left w-full"
                    >
                      <h3 className="text-lg font-semibold">{item.topic}</h3>
                      <p className="text-sm text-gray-500">
                        Date: {new Date(item.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Total messages: {item.messages.length}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="ml-4 text-red-500 text-xl hover:text-red-600 pr-5"
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default History;
