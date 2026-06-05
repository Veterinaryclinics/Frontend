import { useState } from "react";
import { UserRound } from "lucide-react";

const sizeClasses = {
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
};

const iconSizes = {
  sm: 16,
  md: 18,
  lg: 22,
};

const getInitials = (name) => {
  if (!name) return null;

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const ChatAvatar = ({ src, name, size = "md" }) => {
  const [hasImageError, setHasImageError] = useState(false);

  const initials = getInitials(name);
  const canShowImage = src && !hasImageError;

  return (
    <div
      className={`
        ${sizeClasses[size] || sizeClasses.md}
        rounded-full overflow-hidden shrink-0
        bg-gradient-to-br from-primary/20 to-secondary/20
        text-primary flex items-center justify-center
        border border-base-300 font-semibold
      `}
    >
      {canShowImage ? (
        <img
          src={src}
          alt={name || "Client"}
          className="w-full h-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : initials ? (
        initials
      ) : (
        <UserRound size={iconSizes[size] || iconSizes.md} />
      )}
    </div>
  );
};

export default ChatAvatar;