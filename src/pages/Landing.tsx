import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Button } from "@/src/components/ui/Button";
import { ArrowRight } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const handleDeveloperAccess = () => {
    localStorage.setItem("boardroom_session", "dev_access");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background gradient/glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl text-center z-10"
      >
        <h1 className="font-sans text-5xl md:text-7xl font-light tracking-tighter mb-6">
          The Boardroom <span className="font-medium">1000</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide mb-12 max-w-2xl mx-auto leading-relaxed">
          Subject your ideas to the ultimate test. A virtual boardroom of 1,000 AI agents—investors, consumers, and critics—ready to analyze, debate, and judge your next move.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={handleDeveloperAccess}
            className="bg-white text-black hover:bg-gray-200 h-14 px-8 rounded-full text-sm tracking-widest uppercase font-medium group"
          >
            Developer Access
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 text-xs text-gray-600 tracking-widest uppercase"
      >
        Minimalist Luxury Business Simulation
      </motion.div>
    </div>
  );
}
