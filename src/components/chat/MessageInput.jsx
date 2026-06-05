import { useState } from "react";
import { Send } from "lucide-react";

const MessageInput = ({ onSend, isSending = false, disabled = false }) => {
  const [text, setText] = useState("");

  const handleSend = async () => {
    const trimmedText = text.trim();

    if (!trimmedText || isSending || disabled) return;

    await onSend(trimmedText);

    setText("");
  };

  return (
    <div className="p-4 border-t border-base-300 bg-base-100 flex items-center gap-3 flex-shrink-0">
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        disabled={disabled || isSending}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSend();
          }
        }}
        className="flex-1 input input-bordered rounded-full text-sm"
      />

      <button
        type="button"
        onClick={handleSend}
        className="btn btn-primary btn-circle"
        disabled={!text.trim() || isSending || disabled}
      >
        {isSending ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <Send size={18} />
        )}
      </button>
    </div>
  );
};

export default MessageInput;