// FarmEazy In-App Chat Support Component
import { useState } from 'react';

export default function ChatSupport() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'support', text: 'Welcome to FarmEazy support! How can we help you today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input }]);
    setInput('');
    // Simulate support reply
    setTimeout(() => {
      setMessages(msgs => [...msgs, { sender: 'support', text: 'Thank you for your message. Our team will respond soon.' }]);
    }, 1200);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMessages([...messages, { sender: 'user', text: `Sent a file: ${file.name}` }]);
      // Simulate support reply
      setTimeout(() => {
        setMessages(msgs => [...msgs, { sender: 'support', text: 'File received. Our team will review it.' }]);
      }, 1200);
    }
  };

  const handleFAQ = (question) => {
    setMessages([...messages, { sender: 'user', text: question }]);
    // Simulate FAQ bot reply
    setTimeout(() => {
      setMessages(msgs => [...msgs, { sender: 'support', text: 'Here is an answer to your question.' }]);
    }, 800);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && (
        <button className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700" onClick={() => setOpen(true)} aria-label="Open chat support">
          💬
        </button>
      )}
      {open && (
        <div className="w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg flex flex-col">
          <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-2 rounded-t-lg">
            <span className="font-bold">Support Chat</span>
            <button className="text-xl" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto" style={{ maxHeight: 300 }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}> 
                <span className={`inline-block px-3 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'}`}>{msg.text}</span>
              </div>
            ))}
            <div className="mt-2">
              <button className="btn btn-xs mr-2" onClick={() => handleFAQ('How do I add a farm?')}>How do I add a farm?</button>
              <button className="btn btn-xs" onClick={() => handleFAQ('How to schedule irrigation?')}>How to schedule irrigation?</button>
            </div>
          </div>
          <div className="flex p-2 border-t border-slate-700">
            <input
              className="flex-1 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg px-2 py-1 mr-2 focus:outline-none"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              aria-label="Chat input"
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              id="chat-file-upload"
              onChange={handleFileUpload}
            />
            <label htmlFor="chat-file-upload" className="bg-slate-700 text-slate-300 px-2 py-1 rounded-lg mr-2 cursor-pointer hover:bg-slate-600">📎</label>
            <button className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-500" onClick={handleSend} aria-label="Send message">Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
