import { useState, useEffect } from "react";
import { Search } from "lucide-react";

const ChatSidebar = ({ selectedChat, setSelectedChat }) => {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    // Simulated fetch
    setConversations([
      { id: 1, name: "Lisa Davis", lastMessage: "Can I book for Max tomorrow?", time: "2m ago", unread: true },
      { id: 2, name: "Tom Anderson", lastMessage: "Thank you for your help!", time: "1h ago", unread: false },
      { id: 3, name: "Emma Wilson", lastMessage: "Luna seems better now.", time: "3h ago", unread: false },
    ]);
  }, []);

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-80 border-r border-base-300 bg-base-200 flex flex-col">
      
      {/* Header */}
      <div className="p-4 border-b border-base-300 bg-base-100 flex-shrink-0">
        <h1 className="text-lg font-semibold text-base-content">Messages</h1>

        {/* Search bar */}
        <div className="mt-3 flex items-center bg-base-200 rounded-lg px-3 py-2 border border-base-300">
          <Search size={16} className="text-base-content/50 mr-2" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full bg-transparent text-sm focus:outline-none text-base-content"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((chat) => {
          const isActive = selectedChat?.id === chat.id;

          return (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`px-4 py-3 cursor-pointer border-b border-base-300 transition 
                ${isActive ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-base-200"}
              `}
            >
              <div className="flex justify-between items-center">
                <h2 className="font-medium text-base-content text-sm">
                  {chat.name}
                </h2>
                <span className="text-xs text-base-content/50">{chat.time}</span>
              </div>

              <p className="text-xs text-base-content/70 truncate">
                {chat.lastMessage}
              </p>

              {chat.unread && (
                <span className="inline-block mt-1 text-[10px] bg-primary text-primary-content px-2 py-[1px] rounded-full">
                  New
                </span>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default ChatSidebar;
