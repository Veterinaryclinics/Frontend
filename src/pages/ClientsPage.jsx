import { useEffect, useMemo, useState } from "react";
import { Search, Mail, Phone, UserRound, PawPrint, X, Cake, Scale, VenusAndMars, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { useClinicStore } from "../store/useClinicStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeClients = (responseData) => {
  if (!responseData) return [];
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData?.clients)) return responseData.clients;
  if (Array.isArray(responseData?.data?.clients)) return responseData.data.clients;
  if (Array.isArray(responseData?.result)) return responseData.result;
  if (Array.isArray(responseData?.data?.result)) return responseData.data.result;
  if (responseData?.id || responseData?.email) return [responseData];
  if (responseData?.data?.id || responseData?.data?.email) return [responseData.data];
  return [];
};

const getClientName = (client) => {
  const fullName = `${client?.firstName || ""} ${client?.lastName || ""}`.trim();
  return fullName || client?.userName || client?.email || "Unnamed Client";
};

const getInitials = (name) =>
  name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const getClientPhone = (client) => client?.phoneNumber || null;
const getClientPets = (client) => Array.isArray(client?.pets) ? client.pets : [];

const formatDate = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const formatPetGender = (gender) => {
  if (gender === 0) return "Male";
  if (gender === 1) return "Female";
  return null;
};

const findMatchingFullClient = (clickedClient, fullClients) =>
  fullClients.find((c) => c.id === clickedClient.id) ||
  fullClients.find((c) => c.email === clickedClient.email) ||
  clickedClient;

// ─── Sub-components ───────────────────────────────────────────────────────────

const ClientAvatar = ({ client, size = "md" }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const clientName = getClientName(client);
  const imageUrl = client?.profilePictureUrl;
  const sizeClasses = { sm: "w-10 h-10 text-xs", md: "w-12 h-12 text-sm", lg: "w-16 h-16 text-lg" };
  const hasValidImage = Boolean(imageUrl) && !imageFailed;

  if (hasValidImage) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border border-base-200 shrink-0`}>
        <img src={imageUrl} alt={clientName} className="w-full h-full object-cover" onError={() => setImageFailed(true)} referrerPolicy="no-referrer" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 border border-primary/20`} title={clientName}>
      {getInitials(clientName) || <UserRound size={size === "lg" ? 22 : 16} />}
    </div>
  );
};

const PetCard = ({ pet }) => (
  <div className="bg-base-200/60 border border-base-200 rounded-2xl p-4">
    <div className="flex items-start gap-3 mb-3">
      {pet.photoUrl ? (
        <img src={pet.photoUrl} alt={pet.name || "Pet"} className="w-10 h-10 rounded-xl object-cover border border-base-200" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <PawPrint size={16} />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-base-content text-sm">{pet.name || "Unnamed Pet"}</p>
        <p className="text-xs text-base-content/50 capitalize">
          {[pet.species, pet.breed].filter(Boolean).join(" · ") || "Unknown"}
        </p>
      </div>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-base-content/50">
      {formatPetGender(pet.gender) && (
        <span className="flex items-center gap-1"><VenusAndMars size={11} />{formatPetGender(pet.gender)}</span>
      )}
      {pet.dateOfBirth && (
        <span className="flex items-center gap-1"><Cake size={11} />{formatDate(pet.dateOfBirth)}</span>
      )}
      {pet.weight && (
        <span className="flex items-center gap-1"><Scale size={11} />{pet.weight} kg</span>
      )}
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-base-content/60">
      <Icon size={12} className="shrink-0 text-base-content/30" />
      <span className="truncate">{value}</span>
    </div>
  );
};

const ClientProfileModal = ({ client, isOpen, isLoading, onClose }) => {
  if (!isOpen) return null;
  const clientName = getClientName(client);
  const pets = getClientPets(client);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-base-100 border border-base-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-base-200">
          <div className="flex items-center gap-3 min-w-0">
            <ClientAvatar client={client} size="lg" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-base-content truncate">{clientName}</h2>
              <p className="text-xs text-base-content/40 mt-0.5">{client?.email || "No email"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-base-content/40">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          ) : client ? (
            <div className="space-y-6">
              {/* Contact */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-base-content/30 mb-3">Contact</p>
                <div className="bg-base-200/50 border border-base-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <UserRound size={14} className="text-base-content/30 shrink-0" />
                    <span className="text-sm font-medium text-base-content">{clientName}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail size={14} className="text-base-content/30 shrink-0" />
                      <span className="text-sm text-base-content/70">{client.email}</span>
                    </div>
                  )}
                  {client.phoneNumber && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={14} className="text-base-content/30 shrink-0" />
                      <span className="text-sm text-base-content/70">{client.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pets */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-base-content/30">Pets</p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {pets.length} {pets.length === 1 ? "pet" : "pets"}
                  </span>
                </div>
                {pets.length > 0 ? (
                  <div className="space-y-2.5">
                    {pets.map((pet) => <PetCard key={pet.id || pet.name} pet={pet} />)}
                  </div>
                ) : (
                  <div className="bg-base-200/50 border border-base-200 rounded-2xl p-4 text-xs text-base-content/40 text-center">
                    No pets registered for this client.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-base-content/40 py-12 text-sm">No profile data found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ClientsPage = () => {
  const selectedClinic = useClinicStore((state) => state.selectedClinic);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingFullProfile, setIsLoadingFullProfile] = useState(false);
  const [selectedClientProfile, setSelectedClientProfile] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const clinicId = selectedClinic?.id || selectedClinic?.clinicId;

  useEffect(() => {
    const fetchSoftClients = async () => {
      if (!clinicId) { setClients([]); setIsLoadingClients(false); toast.error("No clinic selected"); return; }
      setIsLoadingClients(true);
      try {
        const res = await api.get(`/clinic/${clinicId}/clients/soft`);
        setClients(normalizeClients(res.data));
      } catch (error) {
        toast.error("Failed to load clients");
      } finally {
        setIsLoadingClients(false);
      }
    };
    fetchSoftClients();
  }, [clinicId]);

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter((c) => {
      const name = getClientName(c).toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phoneNumber || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [clients, search]);

  const handleViewFullProfile = async (client) => {
    if (!clinicId) { toast.error("No clinic selected"); return; }
    setIsProfileModalOpen(true);
    setSelectedClientProfile(client);
    setIsLoadingFullProfile(true);
    try {
      const res = await api.get(`/clinic/${clinicId}/clients/full`);
      const fullClients = normalizeClients(res.data);
      setSelectedClientProfile(findMatchingFullClient(client, fullClients));
    } catch (error) {
      toast.error("Failed to load full client profile");
    } finally {
      setIsLoadingFullProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-base-content">Clients</h1>
          <p className="text-sm text-base-content/50 mt-1">
            {selectedClinic?.name || "Select a clinic"} · {clients.length} total
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2.5 mb-6 p-3.5 bg-base-200/50 border border-base-200 rounded-2xl max-w-md">
        <Search size={14} className="text-base-content/40 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-base-content/30"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="text-base-content/30 hover:text-base-content">
            <X size={13} />
          </button>
        )}
      </div>

      {/* List */}
      {isLoadingClients ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="loading loading-spinner loading-md text-primary" />
          <p className="text-sm text-base-content/40">Loading clients…</p>
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredClients.map((client, idx) => {
            const clientName = getClientName(client);
            const petCount = getClientPets(client).length;
            return (
              <div
                key={client.id || client.email || idx}
                className="group bg-base-100 border border-base-200 rounded-2xl p-4 hover:border-base-300 hover:shadow-md transition-all duration-150"
              >
                <div className="flex items-center gap-3 mb-3">
                  <ClientAvatar client={client} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-base-content truncate">{clientName}</p>
                    {petCount > 0 && (
                      <p className="text-xs text-base-content/40 flex items-center gap-1 mt-0.5">
                        <PawPrint size={10} /> {petCount} {petCount === 1 ? "pet" : "pets"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <InfoRow icon={Mail} value={client.email} />
                  <InfoRow icon={Phone} value={getClientPhone(client)} />
                </div>

                <button
                  type="button"
                  onClick={() => handleViewFullProfile(client)}
                  className="btn btn-xs w-full rounded-xl btn-ghost border border-base-200 text-base-content/60 hover:text-base-content hover:border-base-300"
                >
                  View Profile
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center">
            <Users size={20} className="text-base-content/30" />
          </div>
          <p className="text-sm font-medium text-base-content/50">No clients found</p>
          <p className="text-xs text-base-content/30">Try adjusting your search</p>
        </div>
      )}

      <ClientProfileModal
        isOpen={isProfileModalOpen}
        client={selectedClientProfile}
        isLoading={isLoadingFullProfile}
        onClose={() => { setIsProfileModalOpen(false); setSelectedClientProfile(null); }}
      />
    </div>
  );
};

export default ClientsPage;