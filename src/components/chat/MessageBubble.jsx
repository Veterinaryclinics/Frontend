const MessageBubble = ({ msg }) => (
  <div className={`flex ${msg.from === "vet" ? "justify-end" : "justify-start"}`}>
    <div
      className={`max-w-xs px-4 py-2 rounded-2xl border text-sm ${
        msg.from === "vet"
          ? "bg-indigo-600 text-white rounded-br-none shadow-sm"
          : "bg-white border-gray-200 text-gray-800 rounded-bl-none"
      }`}
    >
      {msg.text}
      <div
        className={`text-[10px] mt-1 ${
          msg.from === "vet" ? "text-indigo-200" : "text-gray-400"
        }`}
      >
        {msg.time}
      </div>
    </div>
  </div>
);

export default MessageBubble;
