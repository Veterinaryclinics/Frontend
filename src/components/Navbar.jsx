const Navbar = () => {
  const today = new Date();

  // Format: e.g. "Today, Oct 29, 2025"
  const formattedDate = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="flex items-center justify-end px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-6">
        <p className="text-sm text-gray-500">Today, {formattedDate}</p>
      </div>
    </header>
  );
};

export default Navbar;
