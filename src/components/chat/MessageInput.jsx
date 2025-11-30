import { useState } from "react";
import { Send, Paperclip } from "lucide-react";

const MessageInput = ({ onSend }) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const handleSend = () => {
    if (!text.trim() && !file) return;
    onSend(text, file);
    setText("");
    setFile(null);
  };

  return (
    <div className="p-4 border-t border-base-300 bg-base-100 flex items-center gap-3 flex-shrink-0">
      
      {/* File Upload */}
      <label className="cursor-pointer bg-base-200 border border-base-300 p-2 rounded-full hover:bg-base-300 transition">
        <Paperclip size={18} className="text-base-content" />
        <input
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </label>

      {/* Input */}
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        className="flex-1 input input-bordered rounded-full text-sm"
      />

      {/* Send */}
      <button
        onClick={handleSend}
        className="btn btn-primary btn-circle"
      >
        <Send size={18} />
      </button>
    </div>
  );
};

export default MessageInput;
