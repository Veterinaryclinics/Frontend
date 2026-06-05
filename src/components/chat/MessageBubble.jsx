import ChatAvatar from "./ChatAvatar";

const CHAT_TIME_ZONE = "Africa/Cairo";

const parseBackendDate = (dateValue) => {
  if (!dateValue) return null;

  if (dateValue instanceof Date) return dateValue;

  const value = String(dateValue);

  const hasTimezone =
    value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value);

  const normalizedValue = hasTimezone ? value : `${value}Z`;

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
};
const formatMessageTime = (dateValue) => {
  const date = parseBackendDate(dateValue);

  if (!date) return "";

  return date.toLocaleTimeString("en-US", {
    timeZone: CHAT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getMessageContent = (msg) => {
  if (msg.type === 0 || msg.type === undefined) {
    return msg.content || msg.text || "";
  }

  if (msg.type === 1) return "Voice message";
  if (msg.type === 2) return "Image message";
  if (msg.type === 3) return "Video message";

  return msg.content || "Unsupported message";
};

const MessageBubble = ({
  msg,
  clientName,
  clientAvatarUrl,
  showAvatar = false,
  reserveAvatarSpace = false,
}) => {
  const isMine = Boolean(msg.isMine);

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-end gap-2 max-w-[75%] ${
          isMine ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {!isMine && reserveAvatarSpace && (
          <div className="w-8 h-8 shrink-0">
            {showAvatar && (
              <ChatAvatar
                src={clientAvatarUrl}
                name={clientName}
                size="sm"
              />
            )}
          </div>
        )}

        <div
          className={`px-4 py-2 rounded-2xl text-sm shadow-sm border border-base-300 ${
            isMine
              ? "bg-primary text-primary-content rounded-br-none"
              : "bg-base-100 text-base-content rounded-bl-none"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">
            {getMessageContent(msg)}
          </p>

          <div
            className={`text-[10px] mt-1 flex justify-end gap-1 ${
              isMine ? "text-primary-content/70" : "text-base-content/50"
            }`}
          >
            <span>{formatMessageTime(msg.sentAt) || msg.time}</span>

            {isMine && msg.isSeen && <span>Seen</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;