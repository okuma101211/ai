import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Button } from "./ui/Button";

export function BetaModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem("boardroom_beta_modal_seen");
    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("boardroom_beta_modal_seen", "true");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 sm:p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center rounded-2xl mb-8 shadow-lg">
                <span className="font-mono text-2xl font-light tracking-tighter">1.0</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-light tracking-tighter mb-4">
                Beta is over. <br />
                <span className="text-black font-medium">v1.0.0 is Live.</span>
              </h2>
              
              <p className="text-gray-600 font-light leading-relaxed mb-10 text-sm sm:text-base">
                The ultimate business simulation is now stable.<br className="hidden sm:block" />
                Experience the power of 10,000 AI board members.<br />
                <span className="text-xs text-black font-semibold mt-4 block uppercase tracking-widest">Official Launch Special: Free for a limited time</span>
              </p>

              <Button 
                onClick={handleClose}
                className="w-full bg-black text-white hover:bg-gray-800 rounded-none h-14 text-sm tracking-widest uppercase transition-all shadow-md hover:shadow-xl font-medium"
              >
                Enter the Boardroom
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
