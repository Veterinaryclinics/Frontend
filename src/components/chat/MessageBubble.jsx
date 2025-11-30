const MessageBubble = ({ msg }) => {
  const isVet = msg.from === "vet";

  return (
    <div className={`flex ${isVet ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-xs px-4 py-2 rounded-2xl text-sm shadow-sm
          border border-base-300

          ${
            isVet
              ? "bg-primary text-primary-content rounded-br-none"
              : "bg-base-200 text-base-content rounded-bl-none"
          }
        `}
      >
        {msg.text}

        <div
          className={`
            text-[10px] mt-1
            ${isVet ? "text-primary-content/70" : "text-base-content/50"}
          `}
        >
          {msg.time}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
