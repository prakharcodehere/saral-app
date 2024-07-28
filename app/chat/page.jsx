'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from "socket.io-client";

const socket = io("http://localhost:1337");

export default function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [users, setUsers] = useState([]);
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [view, setView] = useState('initial'); 
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    setUsername(JSON.parse(user).username);

    socket.on('message', (msg) => {
      console.log('Received message:', msg); 
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

  const fetchUsersInRoom = async (roomId) => {
    try {
      const response = await fetch(`http://localhost:1337/api/messages?filters[roomId][$eq]=${roomId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      const uniqueUsers = [...new Set(data.data.map((msg) => msg.attributes.userId))];
      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      await fetchMessages(room); 
      await saveUserToRoom(room); 
      await fetchUsersInRoom(room); 
    }
  };

  const handleCreateRoom = async () => {
    if (username && generatedRoomId) {
      socket.emit('createRoom', { username, room: generatedRoomId });
      setRoom(generatedRoomId);
      setGeneratedRoomId('');
      setView('chat');
      await fetchMessages(generatedRoomId); 
      await saveUserToRoom(generatedRoomId); 
      await fetchUsersInRoom(generatedRoomId); 
    }
  };

  const saveUserToRoom = async (roomId) => {
    try {
      const response = await fetch('http://localhost:1337/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            roomId,
            userId: username,
            message: '',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save user to room');
      }

      const data = await response.json();
      console.log('User saved to room:', data);
    } catch (error) {
      console.error('Error saving user to room:', error);
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

  const handleLeaveRoom = () => {
    socket.emit('leaveRoom', { username, room });
    setRoom('');
    setMessages([]);
    setUsers([]);
    setView('initial');
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(generatedRoomId);
    alert('Room ID copied to clipboard!');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="max-w-md w-full p-6 bg-gray-800 rounded-lg shadow-md">
        {view === 'initial' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Join or Create a Room</h2>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter room ID"
              className="w-full px-4 py-2 mb-4 border rounded-lg bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleJoinRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 w-full"
            >
              Join Room
            </button>
            <div className="flex items-center justify-between mt-4">
              <hr className="flex-1 border-gray-600" />
              <span className="px-2 text-gray-400">or</span>
              <hr className="flex-1 border-gray-600" />
            </div>
            <button
              onClick={() => {
                generateRoomId();
                setView('createRoom');
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200 w-full mt-4"
            >
              Create Room
            </button>
          </div>
        )}

        {view === 'createRoom' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Create a New Room</h2>
            {generatedRoomId && (
              <div className="mb-4">
                <span className="block text-gray-400 mb-2">Room ID: {generatedRoomId}</span>
                <button
                  onClick={handleCopyRoomId}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
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
            <h2 className="text-xl font-semibold mb-4">Chat Room: {room}</h2>
            <p className="mb-4">Active Users: {users.length}</p>
            <div className="overflow-y-auto h-60 border gap-6 mb-10 border-gray-700 p-4 rounded-lg">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-4 flex flex-col m-2 w-fit max-w-xs rounded-lg text-white ${
                    msg.username === username ? 'bg-blue-600 self-end' : 'bg-gray-700 self-start'
                  }`}
                  style={{ alignSelf: msg.username === username ? 'flex-end' : 'flex-start' }}
                >
                  <span className="text-xs font-semibold">{msg.username}</span>
                  <span>{msg.message}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex items-center mt-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message"
                className="flex-grow px-4 py-2 border rounded-lg bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              >
                Send
              </button>
              <button
                type="button"
                onClick={handleLeaveRoom}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200 ml-4"
              >
                Leave Room
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
