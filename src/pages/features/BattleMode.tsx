import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GitCompare, Loader2, Globe, CheckCircle2, Upload, X, Trophy, Eye, Zap, Activity, TrendingUp, TrendingDown, Skull, Target, AlertTriangle, Lock } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";
import { battleIdeas } from "@/src/services/geminiService";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

const AGENT_MESSAGES = [
  "Analyzing cognitive load...",
  "High emotional friction detected.",
  "Virality coefficient seems low.",
  "Brand consistency is solid.",
  "Conversion impulse is weak.",
  "Target demographic mismatch.",
  "Pricing strategy needs review.",
  "Competitor analysis initiated.",
  "Sentiment analysis: Neutral.",
  "Evaluating market fit...",
  "Checking cultural nuances...",
  "Assessing risk factors...",
  "Calculating ROI probability...",
  "Reviewing visual hierarchy...",
  "Testing call-to-action effectiveness...",
  "Simulating consumer backlash...",
  "Projecting 12-month growth...",
  "Cross-referencing historical failures...",
];

function AgentDiscussionEffect() {
  const [messages, setMessages] = useState<{ id: number; text: string; agentId: string }[]>([]);

  useEffect(() => {
    let idCounter = 0;
    const interval = setInterval(() => {
      const newMessage = {
        id: idCounter++,
        text: AGENT_MESSAGES[Math.floor(Math.random() * AGENT_MESSAGES.length)],
        agentId: `Agent-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
      };
      
      setMessages(prev => {
        const newMessages = [...prev, newMessage];
        if (newMessages.length > 5) return newMessages.slice(newMessages.length - 5);
        return newMessages;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-32 w-full max-w-md mx-auto overflow-hidden relative border border-gray-100 rounded-lg bg-gray-50/50 p-4">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-gray-50/50 via-transparent to-gray-50/50 z-10" />
      <div className="flex flex-col justify-end h-full space-y-2">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-left"
            >
              <span className="text-[10px] font-mono text-gray-400 mr-2">{msg.agentId}:</span>
              <span className="text-xs font-mono text-gray-600">{msg.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface BattleResult {
  winner: "A" | "B";
  winRate: number;
  metrics: {
    A: { cognitiveLoad: number; emotionalFriction: number; viralityCoefficient: number; brandConsistency: number; conversionImpulse: number };
    B: { cognitiveLoad: number; emotionalFriction: number; viralityCoefficient: number; brandConsistency: number; conversionImpulse: number };
  };
  marketCapChange: number;
  heavySummaryJa: string;
  conceptAAnalysis: {
    status: "VICTORIOUS" | "ANNIHILATED" | "OBSOLETE" | "CRUSHED";
    weaknesses: string[];
    failureScenario3Year: string;
    visualCritique: string;
  };
  conceptBAnalysis: {
    status: "VICTORIOUS" | "ANNIHILATED" | "OBSOLETE" | "CRUSHED";
    weaknesses: string[];
    failureScenario3Year: string;
    visualCritique: string;
  };
  analysis: {
    judgmentOfGlance: string;
    deepRejection: string;
    visualAnatomy: string;
    behavioralRoast: string;
    surgicalDirectives: string;
  };
  fatalDifferenceJa: string;
  confidenceScore: number;
}

export default function BattleMode({ onAction }: { onAction?: () => boolean }) {
  const [ideaA, setIdeaA] = useState("");
  const [ideaB, setIdeaB] = useState("");
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<string | null>(null);
  const [previewB, setPreviewB] = useState<string | null>(null);
  const [language, setLanguage] = useState("ja");
  const [isBattling, setIsBattling] = useState(false);
  const [isRoastMode, setIsRoastMode] = useState(false);
  const [results, setResults] = useState<BattleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Animation states
  const [votesA, setVotesA] = useState(5000);
  const [votesB, setVotesB] = useState(5000);
  const [isVoting, setIsVoting] = useState(false);
  const votingInterval = useRef<NodeJS.Timeout | null>(null);

  const { decrementCredits, profile } = useAuth();

  const handleFileChange = (side: "A" | "B", file: File | null) => {
    if (side === "A") {
      setFileA(file);
      if (file) setPreviewA(URL.createObjectURL(file));
      else setPreviewA(null);
    } else {
      setFileB(file);
      if (file) setPreviewB(URL.createObjectURL(file));
      else setPreviewB(null);
    }
  };

  const startVotingAnimation = () => {
    setIsVoting(true);
    votingInterval.current = setInterval(() => {
      const total = 10000;
      const randomA = Math.floor(Math.random() * 4000) + 3000; // Fluctuates between 3000 and 7000
      setVotesA(randomA);
      setVotesB(total - randomA);
    }, 100);
  };

  const stopVotingAnimation = (finalWinRate: number, winner: "A" | "B") => {
    if (votingInterval.current) clearInterval(votingInterval.current);
    
    const finalA = winner === "A" ? (finalWinRate / 100) * 10000 : ((100 - finalWinRate) / 100) * 10000;
    const finalB = 10000 - finalA;
    
    setVotesA(finalA);
    setVotesB(finalB);
    setIsVoting(false);
  };

  const handleBattle = async () => {
    if (!fileA || !fileB) {
      setError("Please upload both images to start the battle.");
      return;
    }

    if (onAction && !onAction()) return;

    setIsBattling(true);
    setError(null);
    setResults(null);
    startVotingAnimation();

    try {
      const res = await battleIdeas({ ideaA, ideaB, fileA, fileB, language, isRoastMode });
      await decrementCredits();
      
      // Wait a bit to show the animation
      setTimeout(() => {
        setResults(res);
        stopVotingAnimation(res.winRate, res.winner);
        setIsBattling(false);

        // Firestore Logging
        try {
          addDoc(collection(db, "battle_logs"), {
            ideaA,
            ideaB,
            language,
            results: res,
            timestamp: serverTimestamp(),
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, "battle_logs");
        }
      }, 3000);
    } catch (err: any) {
      if (votingInterval.current) clearInterval(votingInterval.current);
      setError(err.message || "An error occurred during the battle.");
      setIsBattling(false);
      setIsVoting(false);
    }
  };

  const resetBattle = () => {
    setResults(null);
    setVotesA(5000);
    setVotesB(5000);
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-700 relative",
      isRoastMode ? "bg-[#0a0000]" : "bg-white"
    )}>
      {isRoastMode && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-red-900/10 via-transparent to-red-900/10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.05),transparent_70%)] animate-pulse" style={{ animationDuration: '4s' }} />
        </motion.div>
      )}

      <div className="space-y-16 pb-20 max-w-6xl mx-auto w-full px-4 font-sans relative z-10">
        {isRoastMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-red-950/50 border border-red-900/50 text-red-500 py-3 px-4 rounded-lg flex items-center justify-center space-x-3 mt-8 backdrop-blur-sm"
          >
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase">
              Emergency State Active: Human Complacency Will Be Crushed
            </span>
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </motion.div>
        )}

        <header className={cn("text-center space-y-4", isRoastMode ? "pt-8" : "pt-12")}>
          <h1 className={cn(
            "text-4xl md:text-6xl font-light tracking-tighter",
            isRoastMode ? "text-red-50" : "text-gray-900"
          )}>A/B Battle</h1>
          <p className={cn(
            "font-light text-lg uppercase tracking-[0.3em] text-[10px]",
            isRoastMode ? "text-red-200/60" : "text-gray-500"
          )}>
            10,000 Agents • Real-time Decision • Visual Impact
          </p>
        </header>

        <div className="space-y-12">
          {/* Language Selection & Roast Mode */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="flex flex-col items-center space-y-3">
              <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-gray-400">Analysis Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={cn(
                  "bg-transparent border-b text-sm font-medium focus:ring-0 cursor-pointer outline-none pb-1 pr-4 text-center",
                  isRoastMode ? "border-red-900/50 text-red-100 focus:border-red-500" : "border-gray-200 text-black focus:border-black"
                )}
              >
                {[
                  { code: "en", name: "English" },
                  { code: "ja", name: "Japanese" },
                  { code: "zh", name: "Chinese" },
                  { code: "ko", name: "Korean" },
                  { code: "es", name: "Spanish" },
                  { code: "fr", name: "French" },
                  { code: "de", name: "German" },
                  { code: "pt", name: "Portuguese" },
                  { code: "ar", name: "Arabic" },
                  { code: "vi", name: "Vietnamese" }
                ].map(l => (
                  <option key={l.code} value={l.code} className="text-black">{l.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-gray-400">Analysis Mode</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsRoastMode(false)}
                  className={cn(
                    "px-4 py-2 text-xs font-medium transition-all duration-300 border-b-2",
                    !isRoastMode ? "border-black text-black" : "border-transparent text-gray-400 hover:text-red-200"
                  )}
                >
                  Standard Battle
                </button>
                <button
                  onClick={() => {
                    if (profile?.plan !== 'pro') {
                      alert("Upgrade to Pro to unlock Public Execution.");
                      return;
                    }
                    setIsRoastMode(true);
                  }}
                  className={cn(
                    "px-4 py-2 text-xs font-medium transition-all duration-300 border-b-2 flex items-center",
                    isRoastMode ? "border-red-500 text-red-500" : "border-transparent text-gray-400 hover:text-black",
                    profile?.plan !== 'pro' && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Public Execution
                  {profile?.plan !== 'pro' && <Lock className="w-3 h-3 ml-1" />}
                </button>
              </div>
            </div>
          </div>

        {/* Battle Arena */}
        <div className="relative">
          {/* VS Icon for Mobile */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 md:hidden">
            <div className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold tracking-widest border-4 border-white">
              VS
            </div>
          </div>

          <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-px overflow-hidden rounded-2xl border",
            isRoastMode ? "bg-red-950/30 border-red-900/30" : "bg-gray-200 border-[#E5E7EB]"
          )}>
            {/* Side A */}
            <div className={cn(
              "relative p-8 md:p-12 transition-all duration-500",
              isRoastMode ? "bg-[#0a0000]" : "bg-white",
              results?.winner === "B" && "opacity-40 grayscale"
            )}>
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "text-[10px] font-bold tracking-[0.4em] uppercase",
                    isRoastMode ? "text-red-500" : "text-black"
                  )}>[ Concept Alpha ]</span>
                </div>
                
                <div className={cn(
                  "aspect-[4/5] border border-dashed rounded-xl relative group flex items-center justify-center overflow-hidden",
                  isRoastMode ? "bg-red-950/10 border-red-900/30" : "bg-gray-50 border-[#E5E7EB]"
                )}>
                  {previewA ? (
                    <>
                      <img src={previewA} alt="Preview A" className="w-full h-full object-contain" />
                      {!isBattling && !results && (
                        <button 
                          onClick={() => handleFileChange("A", null)}
                          className="absolute top-4 right-4 p-2 bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <input
                        type="file"
                        id="fileA"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange("A", e.target.files?.[0] || null)}
                      />
                      <label htmlFor="fileA" className="cursor-pointer flex flex-col items-center">
                        <Upload className={cn("w-8 h-8 mb-4", isRoastMode ? "text-red-900" : "text-gray-300")} />
                        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-gray-400">Upload Visual Alpha (Optional)</span>
                      </label>
                    </div>
                  )}
                  {results?.winner === "A" && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "absolute top-4 left-4 p-3 rounded-full shadow-xl",
                        isRoastMode ? "bg-red-950 text-red-500" : "bg-black text-white"
                      )}
                    >
                      <Trophy className="w-6 h-6" />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">Concept A</label>
                  <textarea
                    value={ideaA}
                    onChange={(e) => setIdeaA(e.target.value)}
                    placeholder="Describe the concept or enter ad copy..."
                    disabled={isBattling || !!results}
                    className={cn(
                      "w-full bg-transparent border rounded-xl p-4 outline-none min-h-[120px] resize-none font-light tracking-tight text-sm transition-all",
                      isRoastMode 
                        ? "border-red-900/30 focus:border-red-500 text-red-100 placeholder:text-red-900/50" 
                        : "border-[#E5E7EB] focus:border-black text-black placeholder:text-gray-300"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Side B */}
            <div className={cn(
              "relative p-8 md:p-12 transition-all duration-500",
              isRoastMode ? "bg-[#0a0000]" : "bg-white",
              results?.winner === "A" && "opacity-40 grayscale"
            )}>
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "text-[10px] font-bold tracking-[0.4em] uppercase",
                    isRoastMode ? "text-red-500" : "text-black"
                  )}>[ Concept Beta ]</span>
                </div>

                <div className={cn(
                  "aspect-[4/5] border border-dashed rounded-xl relative group flex items-center justify-center overflow-hidden",
                  isRoastMode ? "bg-red-950/10 border-red-900/30" : "bg-gray-50 border-[#E5E7EB]"
                )}>
                  {previewB ? (
                    <>
                      <img src={previewB} alt="Preview B" className="w-full h-full object-contain" />
                      {!isBattling && !results && (
                        <button 
                          onClick={() => handleFileChange("B", null)}
                          className="absolute top-4 right-4 p-2 bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <input
                        type="file"
                        id="fileB"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange("B", e.target.files?.[0] || null)}
                      />
                      <label htmlFor="fileB" className="cursor-pointer flex flex-col items-center">
                        <Upload className={cn("w-8 h-8 mb-4", isRoastMode ? "text-red-900" : "text-gray-300")} />
                        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-gray-400">Upload Visual Beta (Optional)</span>
                      </label>
                    </div>
                  )}
                  {results?.winner === "B" && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "absolute top-4 left-4 p-3 rounded-full shadow-xl",
                        isRoastMode ? "bg-red-950 text-red-500" : "bg-black text-white"
                      )}
                    >
                      <Trophy className="w-6 h-6" />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">Concept B</label>
                  <textarea
                    value={ideaB}
                    onChange={(e) => setIdeaB(e.target.value)}
                    placeholder="Describe the concept or enter ad copy..."
                    disabled={isBattling || !!results}
                    className={cn(
                      "w-full bg-transparent border rounded-xl p-4 outline-none min-h-[120px] resize-none font-light tracking-tight text-sm transition-all",
                      isRoastMode 
                        ? "border-red-900/30 focus:border-red-500 text-red-100 placeholder:text-red-900/50" 
                        : "border-[#E5E7EB] focus:border-black text-black placeholder:text-gray-300"
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Visualization */}
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-end px-2">
            <div className="text-left">
              <div className={cn(
                "text-4xl md:text-6xl font-light tabular-nums tracking-tighter",
                isRoastMode ? "text-red-50" : "text-black"
              )}>{votesA.toLocaleString()}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Votes for Alpha</div>
            </div>
            <div className="text-center pb-2 hidden sm:block">
              <div className={cn(
                "text-[10px] font-bold uppercase tracking-[0.3em]",
                isRoastMode ? "text-red-500" : "text-black"
              )}>10,000 Agents Voting</div>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-4xl md:text-6xl font-light tabular-nums tracking-tighter",
                isRoastMode ? "text-red-50" : "text-black"
              )}>{votesB.toLocaleString()}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Votes for Beta</div>
            </div>
          </div>

          <div className={cn(
            "h-2 w-full overflow-hidden flex rounded-full",
            isRoastMode ? "bg-red-950/30" : "bg-gray-100"
          )}>
            <motion.div 
              animate={{ width: `${(votesA / 10000) * 100}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              className={cn("h-full", isRoastMode ? "bg-red-600" : "bg-black")}
            />
            <div className={cn("h-full flex-1", isRoastMode ? "bg-red-950/50" : "bg-gray-200")} />
          </div>

          <AnimatePresence>
            {isBattling && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-8"
              >
                <AgentDiscussionEffect />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-8">
          {results ? (
            <Button
              onClick={resetBattle}
              className={cn(
                "rounded-full px-16 h-16 font-medium tracking-[0.2em] uppercase text-[10px] transition-all",
                isRoastMode 
                  ? "bg-transparent border border-red-900 text-red-500 hover:bg-red-950/30" 
                  : "bg-white text-black border border-black hover:bg-gray-50"
              )}
            >
              New Battle
            </Button>
          ) : (
            <Button
              onClick={handleBattle}
              disabled={isBattling || (!fileA && !ideaA.trim()) || (!fileB && !ideaB.trim())}
              className={cn(
                "rounded-full px-16 h-16 font-medium tracking-[0.2em] uppercase text-[10px] transition-all duration-500",
                isRoastMode 
                  ? "bg-red-950 hover:bg-red-900 text-red-50 shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.5)]" 
                  : "bg-black text-white hover:bg-gray-800"
              )}
            >
              {isBattling ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                  {isRoastMode ? "Executing Public Execution..." : "Simulating 10,000 Agents..."}
                </span>
              ) : (
                isRoastMode ? "Execute Battle" : "Start Battle"
              )}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        {results && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* The Sovereign's Verdict (Heavy Summary) */}
            <div className={cn(
              "p-8 md:p-12 border rounded-3xl shadow-sm text-center space-y-6",
              isRoastMode ? "bg-[#1a0505] border-red-900/50" : "bg-black text-white border-gray-800"
            )}>
              <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
                <div className={cn(
                  "inline-block px-4 py-1.5 border rounded-full text-[10px] font-semibold tracking-widest uppercase",
                  results.confidenceScore >= 80 ? "border-emerald-200 text-emerald-600 bg-emerald-50" : 
                  results.confidenceScore >= 50 ? "border-yellow-200 text-yellow-600 bg-yellow-50" : 
                  "border-red-200 text-red-600 bg-red-50"
                )}>
                  Confidence: {results.confidenceScore}%
                  {results.confidenceScore < 80 && " (More data needed for higher accuracy)"}
                </div>
              </div>
              <h2 className={cn(
                "text-2xl md:text-4xl font-serif italic leading-relaxed tracking-wide",
                isRoastMode ? "text-red-50" : "text-white"
              )}>
                "{results.heavySummaryJa}"
              </h2>
              <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-500">
                The Sovereign's Verdict
              </div>
            </div>

            {/* Deep Layer Analysis (Concept A vs B) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Concept A Analysis */}
              <div className={cn(
                "p-8 border rounded-3xl space-y-8 shadow-sm flex flex-col",
                results.conceptAAnalysis.status === "VICTORIOUS" ? "bg-emerald-50/30 border-emerald-200" : 
                isRoastMode ? "bg-red-950/20 border-red-900/30" : "bg-white border-[#E5E7EB]"
              )}>
                <div className="text-center space-y-2 border-b pb-6 border-gray-100">
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">Concept Alpha</h3>
                  <div className={cn(
                    "text-3xl font-black tracking-tighter uppercase",
                    results.conceptAAnalysis.status === "VICTORIOUS" ? "text-emerald-600" : "text-red-600"
                  )}>
                    [{results.conceptAAnalysis.status}]
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center">
                      <Target className="w-3 h-3 mr-2" /> 暗黙の前提の崩壊 (Weaknesses)
                    </h4>
                    <ul className="space-y-2">
                      {results.conceptAAnalysis.weaknesses.map((weakness, i) => (
                        <li key={i} className="text-sm font-light text-gray-600 flex items-start">
                          <span className="text-red-400 mr-2 mt-0.5">×</span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center">
                      <Skull className="w-3 h-3 mr-2" /> 3年後の市場死 (3-Year Failure Scenario)
                    </h4>
                    <p className="text-sm leading-relaxed font-light text-gray-600 italic">
                      "{results.conceptAAnalysis.failureScenario3Year}"
                    </p>
                  </div>

                  {results.conceptAAnalysis.visualCritique && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center">
                        <Eye className="w-3 h-3 mr-2" /> 微細ピクセルの不快感 (Visual Critique)
                      </h4>
                      <p className="text-sm leading-relaxed font-light text-gray-600">
                        {results.conceptAAnalysis.visualCritique}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Concept B Analysis */}
              <div className={cn(
                "p-8 border rounded-3xl space-y-8 shadow-sm flex flex-col",
                results.conceptBAnalysis.status === "VICTORIOUS" ? "bg-emerald-50/30 border-emerald-200" : 
                isRoastMode ? "bg-red-950/20 border-red-900/30" : "bg-white border-[#E5E7EB]"
              )}>
                <div className="text-center space-y-2 border-b pb-6 border-gray-100">
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">Concept Beta</h3>
                  <div className={cn(
                    "text-3xl font-black tracking-tighter uppercase",
                    results.conceptBAnalysis.status === "VICTORIOUS" ? "text-emerald-600" : "text-red-600"
                  )}>
                    [{results.conceptBAnalysis.status}]
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center">
                      <Target className="w-3 h-3 mr-2" /> 暗黙の前提の崩壊 (Weaknesses)
                    </h4>
                    <ul className="space-y-2">
                      {results.conceptBAnalysis.weaknesses.map((weakness, i) => (
                        <li key={i} className="text-sm font-light text-gray-600 flex items-start">
                          <span className="text-red-400 mr-2 mt-0.5">×</span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center">
                      <Skull className="w-3 h-3 mr-2" /> 3年後の市場死 (3-Year Failure Scenario)
                    </h4>
                    <p className="text-sm leading-relaxed font-light text-gray-600 italic">
                      "{results.conceptBAnalysis.failureScenario3Year}"
                    </p>
                  </div>

                  {results.conceptBAnalysis.visualCritique && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center">
                        <Eye className="w-3 h-3 mr-2" /> 微細ピクセルの不快感 (Visual Critique)
                      </h4>
                      <p className="text-sm leading-relaxed font-light text-gray-600">
                        {results.conceptBAnalysis.visualCritique}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics Visualization */}
            <div className={cn(
              "p-8 md:p-12 border rounded-3xl shadow-sm space-y-12",
              isRoastMode ? "bg-[#0f0505] border-red-900/30" : "bg-white border-[#E5E7EB]"
            )}>
              <div className="text-center space-y-2">
                <h2 className={cn(
                  "text-2xl font-light tracking-tight",
                  isRoastMode ? "text-red-50" : "text-black"
                )}>KPI Comparison</h2>
              </div>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'Cognitive Load', A: results.metrics.A.cognitiveLoad, B: results.metrics.B.cognitiveLoad, fullMark: 100 },
                    { subject: 'Emotional Friction', A: results.metrics.A.emotionalFriction, B: results.metrics.B.emotionalFriction, fullMark: 100 },
                    { subject: 'Virality', A: results.metrics.A.viralityCoefficient, B: results.metrics.B.viralityCoefficient, fullMark: 100 },
                    { subject: 'Brand Consistency', A: results.metrics.A.brandConsistency, B: results.metrics.B.brandConsistency, fullMark: 100 },
                    { subject: 'Conversion Impulse', A: results.metrics.A.conversionImpulse, B: results.metrics.B.conversionImpulse, fullMark: 100 },
                  ]}>
                    <PolarGrid stroke={isRoastMode ? "#450a0a" : "#E5E7EB"} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: isRoastMode ? '#fca5a5' : '#9CA3AF', fontSize: 10, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Concept Alpha"
                      dataKey="A"
                      stroke={isRoastMode ? "#ef4444" : "#000000"}
                      fill={isRoastMode ? "#ef4444" : "#000000"}
                      fillOpacity={0.1}
                    />
                    <Radar
                      name="Concept Beta"
                      dataKey="B"
                      stroke={isRoastMode ? "#7f1d1d" : "#9CA3AF"}
                      fill={isRoastMode ? "#7f1d1d" : "#9CA3AF"}
                      fillOpacity={0.1}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px', color: isRoastMode ? '#fca5a5' : '#000' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Market Cap Simulator */}
            <div className="p-8 md:p-12 bg-black text-white rounded-3xl shadow-2xl space-y-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                {results.marketCapChange >= 0 ? <TrendingUp className="w-64 h-64" /> : <TrendingDown className="w-64 h-64" />}
              </div>
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase">Market Cap Simulator</h3>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-end gap-8">
                  <div className="space-y-2">
                    <div className={cn(
                      "text-6xl md:text-8xl font-light tracking-tighter tabular-nums",
                      results.marketCapChange >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {results.marketCapChange >= 0 ? "+" : ""}{results.marketCapChange}%
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Predicted Asset Value Fluctuation</div>
                  </div>
                  
                  <div className="flex-1 max-w-md">
                    <p className="text-sm font-light leading-relaxed text-gray-400">
                      Based on the collective desire of 10,000 agents and the deconstruction of brand mythology, 
                      adopting Concept {results.winner} is projected to shift the brand's market capitalization by the amount shown above.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Death Match Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Judgment of Glance */}
              <div className={cn(
                "p-8 border rounded-3xl space-y-6 shadow-sm",
                isRoastMode ? "bg-red-950/20 border-red-900/30" : "bg-white border-[#E5E7EB]"
              )}>
                <div className={cn(
                  "flex items-center space-x-3",
                  isRoastMode ? "text-red-400" : "text-black"
                )}>
                  <Target className="w-5 h-5" />
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase">Judgment of a Glance</h3>
                </div>
                <div className="space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">0.1s Retinal Dominance</div>
                  <p className={cn(
                    "text-sm leading-relaxed font-light",
                    isRoastMode ? "text-red-100/80" : "text-gray-600"
                  )}>
                    {results.analysis.judgmentOfGlance}
                  </p>
                </div>
              </div>

              {/* Deep Rejection */}
              <div className={cn(
                "p-8 border rounded-3xl space-y-6 shadow-sm",
                isRoastMode ? "bg-red-950/20 border-red-900/30" : "bg-white border-[#E5E7EB]"
              )}>
                <div className={cn(
                  "flex items-center space-x-3",
                  isRoastMode ? "text-red-400" : "text-black"
                )}>
                  <Skull className="w-5 h-5" />
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase">Deep Rejection</h3>
                </div>
                <div className="space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Why the Loser was Discarded</div>
                  <p className={cn(
                    "text-sm leading-relaxed font-light italic",
                    isRoastMode ? "text-red-100/80" : "text-gray-600"
                  )}>
                    {results.analysis.deepRejection}
                  </p>
                </div>
              </div>
            </div>

            {/* Forensic Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Visual Anatomy */}
              <div className={cn(
                "p-8 border rounded-3xl space-y-6 shadow-sm",
                isRoastMode ? "bg-red-950/10 border-red-900/20" : "bg-white border-[#E5E7EB]"
              )}>
                <div className={cn(
                  "flex items-center space-x-3",
                  isRoastMode ? "text-red-400" : "text-black"
                )}>
                  <Eye className="w-5 h-5" />
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase">Visual Anatomy</h3>
                </div>
                <p className={cn(
                  "text-sm leading-relaxed font-light",
                  isRoastMode ? "text-red-100/80" : "text-gray-600"
                )}>
                  {results.analysis.visualAnatomy}
                </p>
              </div>

              {/* Behavioral Roast */}
              <div className={cn(
                "p-8 border rounded-3xl space-y-6 shadow-sm",
                isRoastMode ? "bg-red-950/10 border-red-900/20" : "bg-white border-[#E5E7EB]"
              )}>
                <div className={cn(
                  "flex items-center space-x-3",
                  isRoastMode ? "text-red-400" : "text-black"
                )}>
                  <Zap className="w-5 h-5" />
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase">Behavioral Roast</h3>
                </div>
                <p className={cn(
                  "text-sm leading-relaxed font-light italic",
                  isRoastMode ? "text-red-100/80" : "text-gray-600"
                )}>
                  {results.analysis.behavioralRoast}
                </p>
              </div>

              {/* Surgical Directives */}
              <div className={cn(
                "p-8 rounded-3xl space-y-6 shadow-xl",
                isRoastMode ? "bg-red-950 text-red-50 border border-red-900/50" : "bg-black text-white"
              )}>
                <div className={cn(
                  "flex items-center space-x-3",
                  isRoastMode ? "text-red-400" : "text-white"
                )}>
                  <Activity className="w-5 h-5" />
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase">Surgical Directives</h3>
                </div>
                <p className={cn(
                  "text-sm leading-relaxed font-light",
                  isRoastMode ? "text-red-200" : "text-gray-300"
                )}>
                  {results.analysis.surgicalDirectives}
                </p>
              </div>
            </div>

            {/* Japanese Summary / Red Declaration */}
            <div className={cn(
              "p-12 border rounded-3xl space-y-8 relative overflow-hidden",
              isRoastMode ? "bg-red-950/40 border-red-600/50 shadow-[0_0_50px_rgba(220,38,38,0.2)]" : "bg-gray-50 border-[#E5E7EB]"
            )}>
              {isRoastMode && (
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(220,38,38,0.05)_10px,rgba(220,38,38,0.05)_20px)] pointer-events-none" />
              )}
              <div className="max-w-3xl mx-auto space-y-6 relative z-10">
                <h3 className={cn(
                  "text-[10px] font-bold tracking-[0.4em] uppercase text-center flex items-center justify-center space-x-3",
                  isRoastMode ? "text-red-500 animate-pulse" : "text-gray-400"
                )}>
                  {isRoastMode && <AlertTriangle className="w-4 h-4" />}
                  <span>{isRoastMode ? "Red Declaration: The Crushing of Human Complacency" : "Executive Summary (JP)"}</span>
                  {isRoastMode && <AlertTriangle className="w-4 h-4" />}
                </h3>
                <p className={cn(
                  "text-lg leading-relaxed font-light text-center",
                  isRoastMode ? "text-red-50 font-serif italic" : "text-gray-800"
                )}>
                  {results.fatalDifferenceJa}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
