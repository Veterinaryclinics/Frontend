import { useEffect, useMemo, useState } from "react";
import { Search, MessageCircle } from "lucide-react";
import api from "../../lib/axios";
import ChatAvatar from "./ChatAvatar";

const CHAT_TIME_ZONE = "Africa/Cairo";

const normalizeInbox = (responseData) => {
  if (!responseData) return [];
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.inbox)) return responseData.inbox;
  if (Array.isArray(responseData?.data?.inbox)) return responseData.data.inbox;
  if (Array.isArray(responseData?.result)) return responseData.result;
  if (Array.isArray(responseData?.data?.result)) return responseData.data.result;
  return [];
};

const normalizeId = (id) => String(id || "").trim().toLowerCase();

const parseBackendDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  const value = String(dateValue);
  const hasTimezone = value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value);
  const date = new Date(hasTimezone ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Extract a display name from any user/client-like object
const getNameFromObject = (obj) => {
  if (!obj) return null;
  const full = `${obj.firstName || obj.first_name || ""} ${obj.lastName || obj.last_name || ""}`.trim();
  return full || obj.userName || obj.username || obj.name || obj.displayName || obj.email || null;
};

const formatInboxTime = (dateValue) => {
  const date = parseBackendDate(dateValue);
  if (!date) return "";
  return date.toLocaleString("en-US", {
    timeZone: CHAT_TIME_ZONE,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getShortId = (id) => {
  if (!id) return "Unknown Client";
  return `Client ${String(id).slice(0, 8)}`;
};

const getAvatarUrl = (conversation, resolved) => {
  return (
    resolved?.profilePictureUrl ||
    resolved?.profileImageUrl ||
    resolved?.avatarUrl ||
    resolved?.picture ||
    resolved?.user?.profilePictureUrl ||
    conversation.profilePictureUrl ||
    conversation.otherUserProfilePictureUrl ||
    conversation.clientProfilePictureUrl ||
    null
  );
};

const findInMap = (map, ids) => {
  for (const id of ids.filter(Boolean)) {
    const match = map[normalizeId(id)];
    if (match) return match;
  }
  return null;
};

const ChatSidebar = ({
  selectedChat,
  setSelectedChat,
  clientMap = {},
  isLoadingClients = false,
  hasLoadedClients = false,
  liveMessage = null,
  refreshKey = 0,
}) => {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);
  const [openedConversationIds, setOpenedConversationIds] = useState([]);

  useEffect(() => {
    const fetchInbox = async () => {
      setIsLoadingInbox(true);
      try {
        const res = await api.get("/inbox");
        console.log("INBOX RESPONSE:", JSON.stringify(res.data, null, 2));
        const normalized = normalizeInbox(res.data);
        setConversations(normalized);
      }catch (error) {
        console.log("FETCH INBOX ERROR:", error.response?.data || error.message);
        setConversations([]);
      } finally {
        setIsLoadingInbox(false);
      }
    };
    fetchInbox();
  }, [refreshKey]);
  useEffect(() => {
  if (!liveMessage?.conversationId) return;

  setConversations((prev) => {
    const exists = prev.some(
      (conversation) =>
        normalizeId(conversation.conversationId) ===
        normalizeId(liveMessage.conversationId)
    );

    if (!exists) return prev;

    return prev.map((conversation) => {
      const isSameConversation =
        normalizeId(conversation.conversationId) ===
        normalizeId(liveMessage.conversationId);

      if (!isSameConversation) return conversation;

      const isCurrentlyOpen =
        normalizeId(selectedChat?.conversationId) ===
        normalizeId(liveMessage.conversationId);

      return {
        ...conversation,
        lastMessage: liveMessage.content,
        lastMessageTime: liveMessage.sentAt,
        unreadCount: isCurrentlyOpen
          ? 0
          : (conversation.unreadCount || 0) + 1,
      };
    });
  });
}, [liveMessage, selectedChat?.conversationId]);
const enhancedConversations = useMemo(() => {
  if (!hasLoadedClients) return [];

  return conversations
    .map((conversation) => {
      const possibleIds = [
        conversation.otherUserId,
        conversation.clientId,
        conversation.userId,
        conversation.senderId,
        conversation.receiverId,
      ];

      const clientMatch = findInMap(clientMap, possibleIds);

      if (!clientMatch) {
        console.log("CHAT HIDDEN - NOT CURRENT CLINIC CLIENT:", {
          otherUserId: conversation.otherUserId,
          conversationId: conversation.conversationId,
        });

        return null;
      }

      const displayName =
        getNameFromObject(clientMatch) ||
        conversation.otherUserName ||
        conversation.otherUserFullName ||
        conversation.clientName ||
        conversation.name ||
        conversation.otherUserEmail ||
        conversation.email ||
        getShortId(conversation.otherUserId);

      console.log("CHAT SIDEBAR MATCH:", {
        otherUserId: conversation.otherUserId,
        clientMapHit: true,
        displayName,
      });

      const wasOpened = openedConversationIds.includes(
        conversation.conversationId
      );

      return {
        ...conversation,
        id: conversation.conversationId,
        receiverId: conversation.otherUserId,
        displayName,
        client: clientMatch,
        avatarUrl: getAvatarUrl(conversation, clientMatch),
        unreadCount: wasOpened ? 0 : conversation.unreadCount || 0,
      };
    })
    .filter(Boolean);
}, [conversations, clientMap, openedConversationIds, hasLoadedClients]);
  useEffect(() => {
  if (!selectedChat) return;
  if (!hasLoadedClients) return;

  const stillVisible = enhancedConversations.some(
    (conversation) =>
      conversation.conversationId === selectedChat.conversationId
  );

  if (!stillVisible) {
    setSelectedChat(null);
  }
}, [selectedChat, enhancedConversations, hasLoadedClients, setSelectedChat]);
  const filtered = enhancedConversations.filter((conversation) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      conversation.displayName.toLowerCase().includes(query) ||
      String(conversation.lastMessage || "").toLowerCase().includes(query)
    );
  });

 const handleSelectChat = (chat) => {
  setOpenedConversationIds((prev) =>
    prev.includes(chat.conversationId) ? prev : [...prev, chat.conversationId]
  );

  setConversations((prev) =>
    prev.map((conversation) =>
      conversation.conversationId === chat.conversationId
        ? { ...conversation, unreadCount: 0 }
        : conversation
    )
  );

  setSelectedChat({ ...chat, unreadCount: 0 });
};

  return (
    <aside className="w-full border-r border-base-300 bg-base-100 flex flex-col h-full">
      <div className="p-4 border-b border-base-300 bg-base-100 flex-shrink-0">
        <h1 className="text-lg font-semibold text-base-content">Messages</h1>
        <div className="mt-3 flex items-center bg-base-200 rounded-xl px-3 py-2 border border-base-300">
          <Search size={16} className="text-base-content/50 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full bg-transparent text-sm focus:outline-none text-base-content min-w-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-base-200/40 p-2 space-y-1">
        {isLoadingInbox || isLoadingClients || !hasLoadedClients ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((chat) => {
            const isActive = selectedChat?.conversationId === chat.conversationId;
            return (
              <button
                type="button"
                key={chat.conversationId}
                onClick={() => handleSelectChat(chat)}
                className={`relative w-full text-left rounded-2xl px-4 py-4 transition border ${
                  isActive
                    ? "bg-base-100 border-primary/40 shadow-sm"
                    : "bg-base-100 border-base-300 hover:border-base-content/10 hover:shadow-sm"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-primary" />
                )}
                <div className="flex items-start gap-3 min-w-0">
                  <ChatAvatar src={chat.avatarUrl} name={chat.displayName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <h2
                        className="font-semibold text-base-content text-[15px] leading-snug min-w-0 pr-2"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          wordBreak: "break-word",
                        }}
                      >
                        {chat.displayName}
                      </h2>
                      <span className="text-[10px] text-base-content/45 shrink-0 whitespace-nowrap pt-1">
                        {formatInboxTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 min-w-0">
                      <p className="text-xs text-base-content/60 truncate flex-1 min-w-0">
                        {chat.lastMessage || "No messages yet"}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <MessageCircle size={28} className="text-base-content/20 mb-3" />
            <p className="text-sm text-base-content/60">No active client conversations</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;