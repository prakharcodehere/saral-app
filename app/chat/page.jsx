'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';

const socket = io('http://localhost:3001'); // Adjust the backend URL as needed

export default function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [users, setUsers] = useState([]);
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [view, setView] = useState('initial'); // Manage views
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    setUsername(JSON.parse(user).username);

    // Listen for incoming messages
    socket.on('message', (msg) => {
      console.log('Received message:', msg); // Debugging line
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    // Listen for active users
    socket.on('activeUsers', (users) => {
      setUsers(users);
    });

    return () => {
      socket.off('message');
      socket.off('activeUsers');
    };
  }, [router]);

  const fetchMessages = async (roomId) => {
    try {
      const response = await fetch(`http://localhost:1337/api/chats?filters[roomId][$eq]=${roomId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data.data.map((msg) => msg.attributes));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const generateRoomId = () => {
    const uniqueId = 'room-' + Math.random().toString(36).substr(2, 9);
    setGeneratedRoomId(uniqueId);
  };

  const handleJoinRoom = async () => {
    if (username && room) {
      socket.emit('joinRoom', { username, room });
      setRoom(room);
      setView('chat');
      await fetchMessages(room); // Fetch messages when joining the room
    }
  };

  const handleCreateRoom = async () => {
    if (username && generatedRoomId) {
      socket.emit('createRoom', { username, room: generatedRoomId });
      setRoom(generatedRoomId);
      setGeneratedRoomId('');
      setView('chat');
      await fetchMessages(generatedRoomId); // Fetch messages when creating the room

      // Make a POST request to /api/messages
      try {
        const response = await fetch('http://localhost:1337/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              roomId: generatedRoomId,
              userId: username,
              message: ''
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create room message');
        }

        const data = await response.json();
        console.log('Room message created:', data);
      } catch (error) {
        console.error('Error creating room message:', error);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() && room) {
      console.log('Sending message:', message); 
      socket.emit('sendMessage', { message, room, username }); 

      setMessages((prevMessages) => [
        ...prevMessages,
        { username, message } 
      ]);

      // Make a POST request to /api/chats
      try {
        const response = await fetch('http://localhost:1337/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              roomId: room,
              userId: username,
              message: message
            }
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        console.log('Message sent:', data);
      } catch (error) {
        console.error('Error sending message:', error);
      }

      setMessage('');
    }
  };

  const handleCopyRoomId = () => {
    if (generatedRoomId) {
      navigator.clipboard.writeText(generatedRoomId).then(() => {
        alert('Room ID copied to clipboard!');
      }).catch((err) => {
        console.error('Failed to copy text: ', err);
      });
    }
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
                <button
                  onClick={handleCopyRoomId}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
                >
                  Copy Room ID
                </button>
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
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold">Room: {room}</h1>
            </div>
            <div className="overflow-y-auto h-60 border gap-6 mb-10 border-gray-700 flex-end p-4 rounded-lg">
              {messages.map((msg, index) => (
                <div key={index} className={`p-4 flex flex-col m-2 w-fit  rounded-lg ${msg.userId === username ? 'bg-blue-600' : 'bg-gray-700'} text-white`}>
                  <span className=' font-mono text-sm'>{msg.username} </span>
                  <span className='ml-10  text-md'>{msg.message} </span>
                
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message"
                  className="flex-grow px-4 py-2 border rounded-lg bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
