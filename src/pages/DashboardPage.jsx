import DashboardCard from "../components/DashboardCard";
import AppointmentItem from "../components/AppointmentItem";
import { Calendar, Video, MessageSquare, Users } from "lucide-react";

const DashboardPage = () => {
  const appointments = [
    { name: "Emma Johnson", pet: "Routine Checkup for Max (Golden Retriever)", time: "10:30 AM", status: "In Progress" },
    { name: "Michael Brown", pet: "Vaccination for Luna (Persian Cat)", time: "11:15 AM", status: "Upcoming" },
    { name: "Sarah Wilson", pet: "Surgery Consultation for Buddy (Labrador)", time: "2:00 PM", status: "Upcoming" },
  ];

  return (
    <div className="min-h-screen bg-base-100 p-6 space-y-6">

      {/* Header */}
      <h1 className="text-2xl font-semibold text-base-content">Dashboard Overview</h1>
      <p className="text-sm text-base-content/70">
        Welcome back, Dr. Smith. Here’s what’s happening today.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard title="Today's Appointments" value="12" change="+2 from yesterday" icon={Calendar} color="primary" />
        <DashboardCard title="Today's Video Calls" value="3" change="+2 scheduled next" icon={Video} color="secondary" />
        <DashboardCard title="Unread Messages" value="24" change="+5 urgent replies" icon={MessageSquare} color="accent" />
        <DashboardCard title="Total Clients" value="8" change="+12 this week" icon={Users} color="neutral" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Appointments Section */}
        <div className="col-span-2">
          <h2 className="text-sm font-medium text-base-content mb-2">Today's Appointments</h2>

          {/* 🔥 FIXED — Theme matching background */}
          <div className="bg-base-200 rounded-xl p-4 border border-base-300 shadow-sm">
            {appointments.map((a, i) => (
              <AppointmentItem key={i} {...a} />
            ))}
          </div>
        </div>       

      </div>
    </div>
  );
};

export default DashboardPage;
