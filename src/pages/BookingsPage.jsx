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

  // Filter dynamically
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.client.toLowerCase().includes(search.toLowerCase()) ||
      b.pet.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-base-100 p-8 text-base-content">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Bookings Management</h1>
        <p className="text-sm text-base-content/70">
          Manage and track all clinic appointments
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        
        {/* Search bar */}
        <div className="flex items-center bg-base-100 border border-base-300 rounded-lg px-4 py-2 w-full sm:w-1/2 lg:w-1/3 shadow-sm">
          <Search size={18} className="text-base-content/50 mr-2" />
          <input
            type="text"
            placeholder="Search by client or pet name..."
            className="w-full text-sm bg-transparent focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select select-bordered text-sm w-40"
        >
          <option value="All">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
        </select>

        {/* New Booking button */}
        <button className="btn btn-primary ml-auto">
          New Booking
        </button>
      </div>

      {/* Booking Cards */}
      <div className="space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking, idx) => (
            <div
              key={idx}
              className="bg-base-100 border border-base-300 rounded-xl p-5 flex justify-between items-center shadow-sm hover:shadow-md transition"
            >
              {/* Left: Date + Icon */}
              <div className="flex items-center gap-4">
                <div className="bg-primary/20 text-primary p-3 rounded-xl">
                  <Calendar size={22} />
                </div>
                <div>
                  <p className="font-medium">{booking.date}</p>
                  <p className="text-sm text-base-content/70">{booking.time}</p>
                </div>
              </div>

              {/* Middle: Booking Info */}
              <div className="flex-1 px-6">
                <p className="font-semibold">
                  {booking.client}{" "}
                  <span className="font-normal text-base-content/60">
                    • {booking.pet}
                  </span>
                </p>
                <p className="text-sm">{booking.service}</p>
                <p className="text-sm text-base-content/70">
                  <span className="font-medium">Note:</span> {booking.note}
                </p>
              </div>

              {/* Right: Status + Actions */}
              <div className="flex flex-col items-end gap-2">
                
                <div className="flex items-center gap-2">
                  <span
                    className={`badge px-3 py-[5px] ${
                      booking.status === "Confirmed"
                        ? "badge-success"
                        : "badge-warning"
                    }`}
                  >
                    {booking.status}
                  </span>

                  <button className="btn btn-sm btn-outline">
                    View Details
                  </button>
                </div>

              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-base-content/70 py-10">
            No bookings found.
          </p>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
