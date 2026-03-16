import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, LayoutDashboard, MessageSquare, GitCompare, Menu, X, Zap, LogIn, Lock } from "lucide-react";
import { cn } from "@/src/lib/utils";
import Analyzer from "./features/Analyzer";
import BattleMode from "./features/BattleMode";
import Consultant from "./features/Consultant";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/src/components/ui/Button";

type Tab = "analyzer" | "battle" | "consultant";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading, signInWithGoogle, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("analyzer");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [freeTrialsLeft, setFreeTrialsLeft] = useState(1);
  const [showAuthWall, setShowAuthWall] = useState(false);

  useEffect(() => {
    // Initialize free trials from local storage if not logged in
    if (!loading && !user) {
      const storedTrials = localStorage.getItem("boardroom_free_trials");
      if (storedTrials !== null) {
        setFreeTrialsLeft(parseInt(storedTrials, 10));
      } else {
        localStorage.setItem("boardroom_free_trials", "1");
        setFreeTrialsLeft(1);
      }
    }
  }, [user, loading]);

  const handleAction = () => {
    if (user) {
      if (profile && profile.credits <= 0) {
        navigate("/pricing");
        return false;
      }
      return true; // Proceed with action, decrement handled in feature components
    } else {
      if (freeTrialsLeft > 0) {
        const newTrials = freeTrialsLeft - 1;
        setFreeTrialsLeft(newTrials);
        localStorage.setItem("boardroom_free_trials", newTrials.toString());
        return true;
      } else {
        setShowAuthWall(true);
        return false;
      }
    }
  };

  const tabs = [
    { id: "analyzer", label: "Multi-Modal Analyzer", icon: LayoutDashboard, comingSoon: false, description: "Text, Image & Video Analysis" },
    { id: "battle", label: "A/B Battle", icon: GitCompare, comingSoon: false, description: "Compare strategies" },
    { id: "consultant", label: "AI Board Consultation", icon: MessageSquare, comingSoon: false, description: "Direct chat with the board" },
  ] as const;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-black">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col md:flex-row font-sans selection:bg-black selection:text-white relative">
      {/* Auth Wall Modal */}
      <AnimatePresence>
        {showAuthWall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white text-black p-8 md:p-12 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-light tracking-tight">Free Trial Ended</h2>
                <p className="text-gray-500 leading-relaxed font-light">
                  You've experienced the power of the Boardroom. Sign in now to unlock 3 free credits and continue analyzing your strategies.
                </p>
                <div className="pt-6 space-y-4">
                  <Button
                    onClick={async () => {
                      await signInWithGoogle();
                      setShowAuthWall(false);
                    }}
                    className="w-full bg-black text-white hover:bg-gray-800 h-14 rounded-xl text-sm font-medium tracking-widest uppercase flex items-center justify-center"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In with Google
                  </Button>
                  <button
                    onClick={() => setShowAuthWall(false)}
                    className="text-xs text-gray-400 hover:text-black uppercase tracking-widest font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-6 bg-white border-b border-gray-100 z-20">
        <h2 className="text-xl font-medium tracking-tighter">
          BOARDROOM <span className="font-light text-gray-400">10,000</span>
        </h2>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-black">
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 flex flex-col justify-between p-8 shrink-0 transform transition-transform duration-500 ease-[0.16,1,0.3,1] md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          <div className="mb-12 hidden md:block">
            <h2 className="text-2xl font-medium tracking-tighter">
              BOARDROOM <span className="font-light text-gray-400">10,000</span>
            </h2>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold tracking-widest uppercase">v2.0.0</span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Monetized Build</span>
            </div>
          </div>

          {/* User Profile / Credits Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img src={user.photoURL || ""} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{profile?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Zap className={cn("w-4 h-4", profile?.credits && profile.credits > 0 ? "text-emerald-500" : "text-gray-400")} />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Credits</span>
                  </div>
                  <span className="text-lg font-light tabular-nums">{profile?.credits ?? 0}</span>
                </div>
                {profile?.plan !== 'pro' && (
                  <Button 
                    onClick={() => navigate('/pricing')}
                    className="w-full bg-black text-white hover:bg-gray-800 text-xs tracking-widest uppercase py-2 h-auto rounded-lg"
                  >
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center space-x-2 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Free Trial: {freeTrialsLeft} Left</span>
                </div>
                <Button 
                  onClick={signInWithGoogle}
                  className="w-full bg-white text-black border border-gray-200 hover:bg-gray-50 text-xs tracking-widest uppercase py-2 h-auto rounded-lg flex items-center justify-center"
                >
                  <LogIn className="w-3 h-3 mr-2" /> Sign In
                </Button>
              </div>
            )}
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as Tab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 p-4 rounded-xl transition-all duration-300 group",
                    isActive
                      ? "bg-black text-white shadow-xl shadow-black/10"
                      : "text-gray-500 hover:bg-gray-50 hover:text-black"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-gray-400 group-hover:text-black")} />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium tracking-tight">{tab.label}</span>
                    <span className={cn("text-[10px] font-light", isActive ? "text-gray-400" : "text-gray-400")}>
                      {tab.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-8 md:mt-0 pt-8 border-t border-gray-50">
          {user ? (
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-black transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-black transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-16 w-full bg-white">
        <div className="max-w-6xl mx-auto h-full flex flex-col w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 w-full"
            >
              {activeTab === "analyzer" && <Analyzer onAction={handleAction} />}
              {activeTab === "battle" && <BattleMode onAction={handleAction} />}
              {activeTab === "consultant" && <Consultant onAction={handleAction} />}
            </motion.div>
          </AnimatePresence>
          
          <footer className="mt-24 pt-12 border-t border-gray-100 text-center pb-12">
            <p className="text-[10px] text-gray-300 uppercase tracking-[0.3em] font-light">
              A personal project by a student to give back to their mother.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
