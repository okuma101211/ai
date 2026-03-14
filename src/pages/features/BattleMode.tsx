import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GitCompare, Loader2, Globe } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Card, CardContent } from "@/src/components/ui/Card";
import { cn } from "@/src/lib/utils";
import { battleIdeas } from "@/src/services/geminiService";

export default function BattleMode() {
  const [ideaA, setIdeaA] = useState("");
  const [ideaB, setIdeaB] = useState("");
  const [isBattling, setIsBattling] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBattle = async () => {
    if (!ideaA.trim() || !ideaB.trim()) return;

    setIsBattling(true);
    setError(null);
    setResults(null);

    try {
      const res = await battleIdeas({ ideaA, ideaB, language: "en" });
      setResults(res);
    } catch (err: any) {
      setError(err.message || "An error occurred during the battle.");
    } finally {
      setIsBattling(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto w-full">
      <header>
        <h1 className="text-3xl font-light tracking-tight mb-2">A/B Battle Mode</h1>
        <p className="text-gray-500 font-light">Pit two ideas against each other. 1,000 agents will decide the winner.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-gray-100 shadow-sm bg-white">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-4">Idea A</h3>
            <textarea
              value={ideaA}
              onChange={(e) => setIdeaA(e.target.value)}
              placeholder="Describe the first option..."
              className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none transition-all font-light"
            />
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm bg-white">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-4">Idea B</h3>
            <textarea
              value={ideaB}
              onChange={(e) => setIdeaB(e.target.value)}
              placeholder="Describe the second option..."
              className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none transition-all font-light"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-gray-100">
        <Button
          onClick={handleBattle}
          disabled={isBattling || !ideaA || !ideaB}
          className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 rounded-full px-8 h-12 font-medium tracking-wide"
        >
          {isBattling ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Simulating Battle...
            </>
          ) : (
            <>
              <GitCompare className="w-4 h-4 mr-2" />
              Commence Battle
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 text-red-900 p-4 rounded-xl border border-red-100 text-sm"
          >
            {error}
          </motion.div>
        )}

        {isBattling && !results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 flex flex-col items-center justify-center text-center"
          >
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-2 border-gray-100 rounded-full" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-black rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-medium text-white">
                VS
              </div>
            </div>
            <p className="text-gray-500 font-light tracking-wide animate-pulse">
              1,000 agents are debating the winner...
            </p>
          </motion.div>
        )}

        {results && !isBattling && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className={cn(
              "border-2 shadow-md overflow-hidden transition-all duration-500",
              results.winner === "A" ? "border-black" : "border-gray-200"
            )}>
              <div className="flex flex-col md:flex-row">
                <div className={cn(
                  "p-8 flex-1 flex flex-col justify-center items-center text-center",
                  results.winner === "A" ? "bg-black text-white" : "bg-white text-black"
                )}>
                  <h2 className="text-6xl font-light tracking-tighter mb-2">A</h2>
                  <p className="text-sm font-medium tracking-widest uppercase opacity-70">
                    {results.winner === "A" ? "Winner" : "Loser"}
                  </p>
                  {results.winner === "A" && (
                    <div className="mt-6 font-mono text-4xl font-light">
                      {results.winRate}%
                    </div>
                  )}
                </div>
                <div className={cn(
                  "p-8 flex-1 flex flex-col justify-center items-center text-center",
                  results.winner === "B" ? "bg-black text-white" : "bg-white text-black"
                )}>
                  <h2 className="text-6xl font-light tracking-tighter mb-2">B</h2>
                  <p className="text-sm font-medium tracking-widest uppercase opacity-70">
                    {results.winner === "B" ? "Winner" : "Loser"}
                  </p>
                  {results.winner === "B" && (
                    <div className="mt-6 font-mono text-4xl font-light">
                      {results.winRate}%
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="border-gray-100 shadow-sm">
              <CardContent className="p-6 md:p-8 space-y-8">
                <div>
                  <h3 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-4">
                    Fatal Difference
                  </h3>
                  <p className="text-lg leading-relaxed font-light">
                    {results.fatalDifferenceLocal}
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-4">
                    Japanese Translation & Developer Notes
                  </h3>
                  <p className="text-base leading-relaxed text-gray-700 font-light">
                    {results.fatalDifferenceJa}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
