'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

export default function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [users, setUsers] = useState([]);
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [view, setView] = useState('initial'); 
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    setUsername(JSON.parse(user).username);

    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('activeUsers', (users) => {
      setUsers(users);
    });

    return () => {
      socket.off('message');
      socket.off('activeUsers');
    };
  }, [router]);

  const generateRoomId = () => {
    const uniqueId = 'room-' + Math.random().toString(36).substr(2, 9);
    setGeneratedRoomId(uniqueId);
  };

  const handleJoinRoom = async () => {
    if (username && room) {
      try {
        const response = await fetch(`http://localhost:3001/api/messages/${room}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
          socket.emit('joinRoom', { username, room });
          setView('chat');
        } else {
          setError('Room does not exist.');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Error fetching messages. Please try again.');
      }
    }
  };

  const handleCreateRoom = () => {
    if (username && generatedRoomId) {
      socket.emit('createRoom', { username, room: generatedRoomId });
      setRoom(generatedRoomId);
      setGeneratedRoomId('');
      setView('chat');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && room) {
      socket.emit('sendMessage', { message, room, username });
      setMessage('');
    }
  };

  const fetchMessages = async (roomId) => {
    const response = await fetch(`http://localhost:3001/api/messages/${roomId}`);
    const data = await response.json();
    setMessages(data);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-2xl">
        {view === 'initial' && (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Welcome</h1>
            <div className="space-y-4">
              <button
                onClick={() => setView('join')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              >
                Join Room
              </button>
              <button
                onClick={() => setView('create')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
              >
                Create Room
              </button>
            </div>
          </div>
        )}

        {view === 'join' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Join a Chat Room</h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="px-4 py-2 border rounded-lg bg-gray-700 text-gray-100 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter room ID"
              className="px-4 py-2 border rounded-lg bg-gray-700 text-gray-100 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleJoinRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            >
              Join Room
            </button>
            <button
              onClick={() => setView('initial')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 ml-4"
            >
              Back
            </button>
            {error && <div className="text-red-500 mt-4">{error}</div>}
          </div>
        )}

        {view === 'create' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Create a Chat Room</h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="px-4 py-2 border rounded-lg bg-gray-700 text-gray-100 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={generateRoomId}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 mb-4"
            >
              Generate Room ID
            </button>
            {generatedRoomId && (
              <div className="mb-4">
                <div className="text-lg font-semibold mb-2">Generated Room ID: {generatedRoomId}</div>
              </div>
            )}
            <button
              onClick={handleCreateRoom}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
            >
              Create Room
            </button>
            <button
              onClick={() => setView('initial')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 ml-4"
            >
              Back
            </button>
          </div>
        )}

        {view === 'chat' && (
          <div>
            <div className="border-b border-gray-700 pb-4 mb-4">
              <h2 className="text-xl font-semibold mb-2">Chat Room: {room}</h2>
              <div className="mb-4">
                <div className="overflow-y-auto h-60 border border-gray-700 p-4 rounded-lg">
                  {messages.map((msg, index) => (
                    <div key={index} className="mb-4 w-[60%] ml-48 p-2 bg-gray-700 rounded-lg">
                      <div className="text-sm font-mono mb-1 ml-2">{msg.username}</div>
                      <div className="text-base p-2 ml-5">
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message"
                  className="flex-1 px-4 py-2 border rounded-lg bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                >
                  Send
                </button>
              </form>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Active Users</h3>
                <ul>
                  {users.map((user, index) => (
                    <li key={index} className="mb-1">{user}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('user');
                router.push('/login');
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
            >
              Leave Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
