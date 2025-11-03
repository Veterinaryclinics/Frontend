import { useState } from "react";
import { Search, Calendar, Filter } from "lucide-react";

const bookings = [
  {
    date: "2025-10-27",
    time: "09:00 AM",
    client: "Sarah Johnson",
    pet: "Max (Golden Retriever)",
    service: "Annual Check-up",
    note: "First visit, bring vaccination records",
    status: "Confirmed",
  },
  {
    date: "2025-10-27",
    time: "10:30 AM",
    client: "Mike Chen",
    pet: "Whiskers (Cat)",
    service: "Vaccination",
    note: "Rabies booster due",
    status: "Confirmed",
  },
  {
    date: "2025-10-27",
    time: "02:00 PM",
    client: "Emma Wilson",
    pet: "Buddy (Beagle)",
    service: "Surgery Follow-up",
    note: "Post-op check, remove stitches",
    status: "Confirmed",
  },
  {
    date: "2025-10-28",
    time: "09:30 AM",
    client: "John Davis",
    pet: "Luna (Rabbit)",
    service: "Dental Cleaning",
    note: "Anesthesia required",
    status: "Pending",
  },
];

const BookingsPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ✅ Filter bookings dynamically by search and status
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.client.toLowerCase().includes(search.toLowerCase()) ||
      b.pet.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Bookings Management</h1>
        <p className="text-sm text-gray-500">
          Manage and track all clinic appointments
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-4 py-2 w-full sm:w-1/2 lg:w-1/3 shadow-sm">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by client or pet name..."
            className="w-full text-sm focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 shadow-sm focus:outline-none"
        >
          <option value="All">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
        </select>

        {/* New Booking Button */}
        <button className="ml-auto px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
          New Booking
        </button>
      </div>

      {/* Booking Cards */}
      <div className="space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-xl p-5 flex justify-between items-center shadow-sm hover:shadow-md transition"
            >
              {/* Left: Date & Time */}
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl">
                  <Calendar size={22} />
                </div>
                <div>
                  <p className="text-gray-800 font-medium">{booking.date}</p>
                  <p className="text-gray-600 text-sm">{booking.time}</p>
                </div>
              </div>

              {/* Middle: Booking Info */}
              <div className="flex-1 px-6">
                <p className="font-semibold text-gray-800">
                  {booking.client}{" "}
                  <span className="font-normal text-gray-500">• {booking.pet}</span>
                </p>
                <p className="text-sm text-gray-700">{booking.service}</p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Note:</span> {booking.note}
                </p>
              </div>

              {/* Right: Status & Actions */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-3 py-[4px] rounded-full ${
                      booking.status === "Confirmed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {booking.status}
                  </span>
                  <button className="text-sm border border-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-10">No bookings found.</p>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
