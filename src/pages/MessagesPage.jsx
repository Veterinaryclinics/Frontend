import ChatSidebar from "../components/chat/ChatSidebar";
import ChatWindow from "../components/chat/ChatWindow";
import { useState } from "react";

const MessagesPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="flex h-[88vh] bg-base-100 text-base-content overflow-hidden">

      {/* Sidebar (Chats list) */}
      <div className="w-80 h-full border-r border-base-300 bg-base-100">
        <ChatSidebar
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
        />
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 h-full bg-base-100">
        <ChatWindow selectedChat={selectedChat} />
      </div>

    </div>
  );
};

export default MessagesPage;
