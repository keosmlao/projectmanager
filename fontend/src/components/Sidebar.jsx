import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Home, Folder, BarChart2, CheckSquare, LogOut, Menu, X, User, CheckCircle } from "lucide-react"; // Imported all potentially useful icons

export default function Sidebar({ username, role, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Helper function to dynamically get icons based on path
  const getIcon = (path) => {
    switch (path) {
      case "/sale-admin":
      case "/sale-manager":
      case "/service-admin":
      case "/service-manager":
        return <Home size={20} />; // Dashboard/home icon
      case "/sale-admin/listproject":
        return <Folder size={20} />; // Project/folder icon
      case "/sale-admin/reports":
        return <CheckCircle size={20} />; // Chart/report icon
      case "/sale-admin/listwaitingapprove":
        return <CheckCircle size={20} />; // Chart/report icon
      case "/sale-manager/approvals":
        return <CheckSquare size={20} />; // Approval/checkbox icon
      default:
        return null; // No icon by default
    }
  };

  const sidebarLinks = {
    sale_admin: [
      { label: "Dashboard", path: "/sale-admin" },
      { label: "ໂຄງການ", path: "/sale-admin/listproject" },
      { label: "ລາຍການຂໍອະນຸມັດ", path: "/sale-admin/listwaitingapprove" },
      // { label: "Reports", path: "/sale-admin/reports" },
    ],
    sale_manager: [
      { label: "Manager Panel", path: "/sale-manager" },
      { label: "Approvals", path: "/sale-manager/approvals" },
    ],
    service_admin: [
      { label: "Service Dashboard", path: "/service-admin" },
    ],
    service_manager: [
      { label: "Manage Requests", path: "/service-manager" },
    ],
  };

  return (
    <>
      {/* Mobile Overlay (appears when sidebar is open on small screens) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)} // Close sidebar when clicking overlay
          aria-hidden="true" // Hide from accessibility tree when not open
        ></div>
      )}

      {/* Toggle Button for Mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-controls="main-sidebar" // Links to the sidebar element
          aria-expanded={isOpen} // Indicates whether the controlled element is expanded
          aria-label={isOpen ? "ປິດ Sidebar" : "ເປີດ Sidebar"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Main Content */}
      <aside
        id="main-sidebar" // ID for accessibility linking
        className={`fixed top-0 left-0 h-full w-64 bg-slate-800 text-slate-100 flex flex-col p-6 transform ${isOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-auto z-40 shadow-2xl md:shadow-none`}
        aria-label="Main navigation"
      >
        {/* Sidebar Header / Brand / Logo Area */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-700/50"> {/* Added bottom padding and border */}
          <div className="text-2xl font-extrabold text-blue-400 tracking-wide select-none"> {/* Added select-none */}
            ODG Project
          </div>
          {/* Close button for mobile inside the sidebar itself */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-full"
            aria-label="ປິດ Sidebar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow space-y-2" aria-label="Primary">
          {sidebarLinks[role]?.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setIsOpen(false); // Close sidebar on mobile after navigation
                }}
                className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 ease-in-out font-medium
                  ${isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg" // Active state with gradient and larger shadow
                    : "text-slate-300 hover:bg-slate-700 hover:text-white" // Inactive state
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800
                `}
                aria-current={isActive ? "page" : undefined} // Indicate current page for screen readers
              >
                {getIcon(link.path)}
                <span className="text-lg">{link.label}</span> {/* Removed font-medium here as it's on the button */}
              </button>
            );
          })}
        </nav>

        {/* User Information & Logout Button */}
        <div className="mt-8 pt-6 border-t border-slate-700/50"> {/* Increased top padding and subtle border */}
          <div className="flex items-center text-sm text-slate-300 mb-2">
            <User size={16} className="mr-2 text-slate-400" />
            Welcome, <strong className="font-semibold text-white ml-1">{username}</strong>
          </div>
          <div className="text-xs text-slate-400 mb-4">
            Role: <span className="font-mono text-blue-300 capitalize">{role.replace('_', ' ')}</span>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 w-full py-2.5 rounded-lg text-white font-semibold transition-colors shadow-lg flex items-center justify-center gap-2
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}