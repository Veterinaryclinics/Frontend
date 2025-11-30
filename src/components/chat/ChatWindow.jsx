import { useState, useEffect, useRef } from "react";
import MessageInput from "./MessageInput";
import MessageBubble from "./MessageBubble";

const ChatWindow = ({ selectedChat }) => {
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (selectedChat) {
      setMessages([
        { from: "client", text: "Hi Doctor!", time: "2m ago" },
        { from: "vet", text: "Hey Lisa, how can I help today?", time: "1m ago" },
      ]);
    }
  }, [selectedChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (msg) => {
    if (!msg.trim()) return;
    const newMsg = { from: "vet", text: msg, time: "Just now" };
    setMessages((prev) => [...prev, newMsg]);
  };

  return (
    <section className="flex flex-col h-full bg-base-100">
      {selectedChat ? (
        <>
          {/* Header */}
          <div className="p-4 border-b border-base-300 bg-base-100 flex justify-between items-center">
            <h2 className="font-semibold text-base-content">
              {selectedChat.name}
            </h2>
          </div>

          {/* Messages */}
          <div
            className="
              flex-1 overflow-y-auto 
              bg-base-200 
              p-6 space-y-4 
              scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100
            "
          >
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <MessageInput onSend={handleSend} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-base-content/70 text-sm">
          Select a conversation to start chatting
        </div>
      )}
    </section>
  );
};

export default ChatWindow;
