import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import MessageInput from "./MessageInput";
import MessageBubble from "./MessageBubble";
import ChatAvatar from "./ChatAvatar";
import api from "../../lib/axios";

const normalizeMessages = (responseData) => {
  if (!responseData) return [];
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.messages)) return responseData.messages;
  if (Array.isArray(responseData?.data?.messages)) return responseData.data.messages;
  if (Array.isArray(responseData?.result)) return responseData.result;
  if (Array.isArray(responseData?.data?.result)) return responseData.data.result;
  return [];
};

const getMessageDateValue = (message) => {
  return (
    message?.sentAt ||
    message?.createdAt ||
    message?.timeStamp ||
    message?.timestamp ||
    message?.messageTime ||
    message?.time ||
    null
  );
};

const getLocalDateKey = (dateValue) => {
  const date = parseBackendDate(dateValue);
  if (!date) return "unknown-date";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHAT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
};

const getDayLabel = (dateValue) => {
  const date = parseBackendDate(dateValue);
  if (!date) return "Unknown date";
  const todayKey = getLocalDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);
  const dateKey = getLocalDateKey(date);
  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    timeZone: CHAT_TIME_ZONE,
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const ChatDayDivider = ({ dateValue }) => (
  <div className="flex items-center gap-3 py-4">
    <div className="h-px flex-1 bg-base-300" />
    <div className="px-4 py-1.5 rounded-full bg-base-100 border border-base-300 shadow-sm text-[11px] font-semibold text-base-content/60">
      {getDayLabel(dateValue)}
    </div>
    <div className="h-px flex-1 bg-base-300" />
  </div>
);

const getClientName = (client) => {
  if (!client) return null;
  const fullName = `${client.firstName || ""} ${client.lastName || ""}`.trim();
  return fullName || client.userName || client.email || null;
};

const CHAT_TIME_ZONE = "Africa/Cairo";

const parseBackendDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  const value = String(dateValue);
  const hasTimezone = value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value);
  const date = new Date(hasTimezone ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};
const normalizeId = (id) => String(id || "").trim().toLowerCase();

const appendUniqueMessage = (currentMessages, newMessage) => {
  if (!newMessage?.id) {
    return [...currentMessages, newMessage];
  }

  const alreadyExists = currentMessages.some(
    (message) => message.id === newMessage.id
  );

  if (alreadyExists) return currentMessages;

  return [...currentMessages, newMessage];
};
const markMessagesAsSeen = async (messages, selectedChat) => {
  if (!selectedChat?.otherUserId && !selectedChat?.receiverId) return [];

  const otherUserId = selectedChat.otherUserId || selectedChat.receiverId;

  const unseenIncomingMessages = messages.filter((message) => {
    return (
      message.id &&
      message.senderId === otherUserId &&
      message.isSeen === false
    );
  });

  if (unseenIncomingMessages.length === 0) return [];

  console.log("MARKING MESSAGES AS SEEN:", unseenIncomingMessages);

  const results = await Promise.allSettled(
    unseenIncomingMessages.map((message) =>
      api.post("/messages/seen", {
        messageId: message.id,
      })
    )
  );

  const successfulSeenIds = unseenIncomingMessages
    .filter((_, index) => results[index].status === "fulfilled")
    .map((message) => message.id);

  console.log("MARK SEEN RESULTS:", {
    results,
    successfulSeenIds,
  });

  if (successfulSeenIds.length > 0) {
    window.dispatchEvent(new Event("petzy:inbox-updated"));
  }

  return successfulSeenIds;
};
const ChatWindow = ({ selectedChat, liveMessage, onMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat?.conversationId) {
        setMessages([]);
        return;
      }

      setIsLoadingMessages(true);

      try {
        const res = await api.get(`/messages/${selectedChat.conversationId}`);

        console.log("MESSAGES RESPONSE:", res.data);

        const normalizedMessages = normalizeMessages(res.data);

        setMessages(normalizedMessages);

        const seenIds = await markMessagesAsSeen(normalizedMessages, selectedChat);

        setMessages((prev) =>
          prev.map((message) =>
            seenIds.includes(message.id) ? { ...message, isSeen: true } : message
          )
        );
      } catch (error) {
        console.log("FETCH MESSAGES ERROR:", error.response?.data || error.message);
        toast.error("Failed to load messages");
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedChat?.conversationId]);
  useEffect(() => {
  if (!liveMessage?.conversationId) return;
  if (!selectedChat?.conversationId) return;

  const liveConversationId = normalizeId(liveMessage.conversationId);
  const selectedConversationId = normalizeId(selectedChat.conversationId);

  if (liveConversationId !== selectedConversationId) return;

  setMessages((prev) => appendUniqueMessage(prev, liveMessage));
  if (
  liveMessage.senderId === selectedChat.otherUserId &&
  liveMessage.isSeen === false
) {
  markMessagesAsSeen([liveMessage], selectedChat);

  setMessages((prev) =>
    prev.map((message) =>
      message.id === liveMessage.id ? { ...message, isSeen: true } : message
    )
  );
}
}, [liveMessage, selectedChat?.conversationId, selectedChat?.otherUserId]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

const handleSend = async (content) => {
  const trimmedContent = content.trim();

  if (!trimmedContent || !selectedChat?.conversationId) return;

  setIsSending(true);

  try {
    const payload = {
      conversationId: selectedChat.conversationId,
      content: trimmedContent,
      type: 0,
    };

    console.log("SEND MESSAGE PAYLOAD:", payload);

    const res = await api.post("/messages", payload);

    console.log("SEND MESSAGE RESPONSE:", res.data);

    const createdMessage = res.data?.data ?? res.data;

    setMessages((prev) => appendUniqueMessage(prev, createdMessage));

    onMessageSent?.(createdMessage);
  } catch (error) {
    console.log("SEND MESSAGE ERROR:", error.response?.data || error.message);
    toast.error("Failed to send message");
  } finally {
    setIsSending(false);
  }
};

  const clientName =
    selectedChat?.displayName ||
    getClientName(selectedChat?.client) ||
    "Client";

  const clientAvatarUrl =
    selectedChat?.avatarUrl || selectedChat?.client?.profilePictureUrl;

  return (
    <section className="flex flex-col h-full bg-base-100">
      {selectedChat ? (
        <>
          <div className="p-4 border-b border-base-300 bg-base-100 flex items-center gap-3">
            <ChatAvatar src={clientAvatarUrl} name={clientName} size="lg" />
            <div className="min-w-0">
              <h2 className="font-semibold text-base-content truncate">{clientName}</h2>
              <p className="text-xs text-base-content/50 truncate">Client conversation</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-base-200 p-6 space-y-2 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-100">
            {isLoadingMessages ? (
              <div className="flex justify-center py-16">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : messages.length > 0 ? (
              messages.map((message, index) => {
                const previousMessage = messages[index - 1];
                const messageDate = getMessageDateValue(message);
                const previousMessageDate = previousMessage
                  ? getMessageDateValue(previousMessage)
                  : null;
                const isMine = message.senderId !== selectedChat.otherUserId;
                const previousIsMine = previousMessage
                  ? previousMessage.senderId !== selectedChat.otherUserId
                  : null;
                const currentDateKey = getLocalDateKey(messageDate);
                const previousDateKey = previousMessage
                  ? getLocalDateKey(previousMessageDate)
                  : null;
                const shouldShowDayDivider =
                  index === 0 || currentDateKey !== previousDateKey;
                const isFirstInSenderGroup =
                  index === 0 ||
                  isMine !== previousIsMine ||
                  currentDateKey !== previousDateKey;

                return (
                  <div key={message.id || index} className="space-y-2">
                    {shouldShowDayDivider && (
                      <ChatDayDivider dateValue={messageDate} />
                    )}
                    <MessageBubble
                      msg={{ ...message, isMine }}
                      clientName={clientName}
                      clientAvatarUrl={clientAvatarUrl}
                      showAvatar={!isMine && isFirstInSenderGroup}
                      reserveAvatarSpace={!isMine}
                    />
                  </div>
                );
              })
            ) : (
              <div className="flex justify-center py-16">
                <p className="text-sm text-base-content/60">
                  No messages in this conversation yet.
                </p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <MessageInput
            onSend={handleSend}
            isSending={isSending}
            disabled={isLoadingMessages}
          />
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