import { useEffect, useState } from 'react';
import Message from './Message';

export default function ChatRoom({ socket }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [room, setRoom] = useState('default');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (socket) {
      socket.on('message', (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
    }
  }, [socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    socket.emit('sendMessage', { content: message, username, room });
    setMessage('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Chat Room: {room}</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="overflow-y-auto h-64 mb-4">
          {messages.map((msg, index) => (
            <Message key={index} user={msg.user} text={msg.text} />
          ))}
        </div>
        <form onSubmit={sendMessage} className="flex">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button
            type="submit"
            className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
