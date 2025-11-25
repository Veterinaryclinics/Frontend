import { useState } from "react";
import { Send, Paperclip } from "lucide-react";

const MessageInput = ({ onSend }) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const handleSend = () => {
    onSend(text);
    setText("");
    setFile(null);
  };

  return (
    <div className="p-4 border-t bg-white flex items-center gap-3 flex-shrink-0 sticky bottom-0">
      {/* File Upload */}
      <label className="cursor-pointer bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
        <Paperclip size={18} className="text-gray-600" />
        <input
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </label>

      {/* Textbox */}
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      {/* Send */}
      <button
        onClick={handleSend}
        className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-full shadow-sm transition"
      >
        <Send size={18} />
      </button>
    </div>
  );
};

export default MessageInput;
