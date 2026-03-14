import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, LayoutDashboard, MessageSquare, Share2, Globe, GitCompare, Lock, Menu, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import Analyzer from "./features/Analyzer";
import BattleMode from "./features/BattleMode";
import Consultant from "./features/Consultant";

type Tab = "analyzer" | "battle" | "consultant";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("analyzer");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("boardroom_session");
    if (!session) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("boardroom_session");
    navigate("/");
  };

  const tabs = [
    { id: "analyzer", label: "Pitch Roast", icon: LayoutDashboard, comingSoon: false },
    { id: "battle", label: "A/B Battle", icon: GitCompare, comingSoon: true },
    { id: "consultant", label: "AI Chat Consultation", icon: MessageSquare, comingSoon: true },
  ] as const;

  return (
    <div className="min-h-screen bg-[#fafafa] text-black flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 z-20">
        <h2 className="text-lg font-medium tracking-tight">
          Boardroom <span className="font-light text-gray-400">10,000</span>
        </h2>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500 hover:text-black">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col justify-between p-6 shrink-0 transform transition-transform duration-300 ease-in-out md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          <div className="mb-12 hidden md:block">
            <h2 className="text-xl font-medium tracking-tight">
              Boardroom <span className="font-light text-gray-400">10,000</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Beta</p>
          </div>
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <div key={tab.id} className="relative group">
                  <button
                    onClick={() => {
                      if (!tab.comingSoon) {
                        setActiveTab(tab.id as Tab);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    disabled={tab.comingSoon}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-black text-white shadow-md"
                        : tab.comingSoon
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50 hover:text-black"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.comingSoon && <Lock className="w-3 h-3 opacity-50" />}
                  </button>
                  {tab.comingSoon && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 hidden md:block">
                      🚀 This feature is currently in training (Coming Soon)
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="mt-8 md:mt-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-black transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Boardroom</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12 w-full">
        <div className="max-w-5xl mx-auto h-full flex flex-col w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 w-full"
            >
              {activeTab === "analyzer" && <Analyzer />}
              {activeTab === "battle" && <BattleMode />}
              {activeTab === "consultant" && <Consultant />}
            </motion.div>
          </AnimatePresence>
          
          <footer className="mt-12 pt-6 border-t border-gray-100 text-center pb-8">
            <p className="text-xs text-gray-400">
              A personal project by a student to give back to their mother.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
