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
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Dashboard Overview</h1>
      <p className="text-sm text-gray-500 mb-4">
        Welcome back, Dr. Smith. Here’s what’s happening today.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard title="Today's Appointments" value="12" change="+2 from yesterday" icon={Calendar} color="blue" />
        <DashboardCard title="Active Video Calls" value="3" change="+2 scheduled next" icon={Video} color="green" />
        <DashboardCard title="Unread Messages" value="24" change="+5 urgent replies" icon={MessageSquare} color="orange" />
        <DashboardCard title="Total Clients" value="1,247" change="+12 this week" icon={Users} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Today's Appointments</h2>
          {appointments.map((a, i) => (
            <AppointmentItem key={i} {...a} />
          ))}
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Recent Messages</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
            <p className="mb-2 text-gray-800 font-medium">Lisa Davis</p>
            <p className="text-gray-600 mb-1">Is it normal for my cat to sleep 16 hours a day?</p>
            <div className="text-xs text-indigo-600 space-x-2">
              <button>Reply</button>
              <button>Mark as Read</button>
            </div>
            <hr className="my-3" />
            <p className="mb-2 text-gray-800 font-medium">Tom Anderson</p>
            <p className="text-gray-600 mb-1">Thank you for the consultation yesterday!</p>
            <div className="text-xs text-indigo-600 space-x-2">
              <button>Reply</button>
              <button>Mark as Read</button>
            </div>
            <hr className="my-3" />
            <button className="w-full mt-2 bg-indigo-600 text-white text-xs py-2 rounded-md hover:bg-indigo-500">
              View All Messages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
