const Navbar = () => {
  const today = new Date();

  // Format: "Today, Oct 29, 2025"
  const formattedDate = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="flex items-center justify-end px-6 py-4 bg-base-100 border-b border-base-300">
      <div className="flex items-center gap-6">
        <p className="text-sm text-base-content/70">
          Today, {formattedDate}
        </p>
      </div>
    </header>
  );
};

export default Navbar;
