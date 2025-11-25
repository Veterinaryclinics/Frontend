import { useState, useEffect } from "react";
import { Search, Mail, Phone, Calendar } from "lucide-react";

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");

  const demoClients = [
    {
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "(555) 123-4567",
      pets: ["Max - Golden Retriever"],
      lastVisit: "2025-10-20",
      visits: 12,
    },
    {
      name: "Mike Chen",
      email: "mike.chen@email.com",
      phone: "(555) 234-5678",
      pets: ["Whiskers - Persian", "Shadow - Siamese"],
      lastVisit: "2025-10-25",
      visits: 18,
    },
    {
      name: "Emma Wilson",
      email: "emma.w@email.com",
      phone: "(555) 345-6789",
      pets: ["Buddy - Beagle"],
      lastVisit: "2025-10-22",
      visits: 24,
    },
    {
      name: "John Davis",
      email: "john.davis@email.com",
      phone: "(555) 456-7890",
      pets: ["Luna - Holland Lop"],
      lastVisit: "2025-10-18",
      visits: 6,
    },
    {
      name: "Lisa Anderson",
      email: "lisa.a@email.com",
      phone: "(555) 567-8901",
      pets: ["Rocky - German Shepherd"],
      lastVisit: "2025-10-26",
      visits: 15,
    },
  ];

  useEffect(() => {
    setClients(demoClients);
  }, []);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-base-100 p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-base-content">Client Management</h1>
        <p className="text-sm text-base-content/70">
          View and manage client profiles and pet histories
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-base-100 border border-base-300 rounded-lg px-4 py-2 w-full sm:w-1/2 lg:w-1/3 shadow-sm mb-6">
        <Search size={18} className="text-base-content/50 mr-2" />
        <input
          type="text"
          placeholder="Search clients by name or email..."
          className="w-full text-sm bg-transparent focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredClients.length > 0 ? (
          filteredClients.map((client, idx) => (
            <div
              key={idx}
              className="bg-base-100 border border-base-300 rounded-xl p-5 shadow-sm hover:shadow-md transition"
            >
              {/* Top section */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
                    {client.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-base-content">{client.name}</p>
                    <p className="text-xs text-base-content/70">
                      {client.pets.length} {client.pets.length > 1 ? "Pets" : "Pet"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-base-content/80">
                  <Mail size={14} /> {client.email}
                </div>
                <div className="flex items-center gap-2 text-base-content/80">
                  <Phone size={14} /> {client.phone}
                </div>
                <div className="flex items-center gap-2 text-base-content/80">
                  <Calendar size={14} /> Last visit: {client.lastVisit}
                </div>
              </div>

              {/* Button */}
              <button className="btn btn-sm btn-outline w-full mt-5">
                View Full Profile
              </button>
            </div>
          ))
        ) : (
          <p className="text-base-content/70 col-span-full text-center py-10">
            No clients found.
          </p>
        )}
      </div>
    </div>
  );
};

export default ClientsPage;
