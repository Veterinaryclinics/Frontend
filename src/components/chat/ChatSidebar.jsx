import { useState, useEffect } from "react";
import { Search } from "lucide-react";

const ChatSidebar = ({ selectedChat, setSelectedChat }) => {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    // Simulate fetch (replace with backend later)
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
    <aside className="w-80 border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white flex-shrink-0">
        <h1 className="text-lg font-semibold text-gray-800">Messages</h1>
        <div className="mt-3 flex items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full bg-transparent text-sm focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {filtered.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setSelectedChat(chat)}
            className={`px-4 py-3 cursor-pointer border-b transition ${
              selectedChat?.id === chat.id
                ? "bg-indigo-50 border-l-4 border-indigo-600"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-medium text-gray-800 text-sm">{chat.name}</h2>
              <span className="text-xs text-gray-400">{chat.time}</span>
            </div>
            <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
            {chat.unread && (
              <span className="inline-block mt-1 text-[10px] bg-indigo-600 text-white px-2 py-[1px] rounded-full">
                New
              </span>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ChatSidebar;
