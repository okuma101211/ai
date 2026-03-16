import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileText, Image as ImageIcon, Video, Globe, Loader2, Download, Flame, Users, Lock, CheckCircle2, XCircle, Bot, TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";
import { analyzeInput } from "@/src/services/geminiService";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import html2canvas from "html2canvas";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
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

const CASE_STUDIES = [
  {
    title: "Nintendo Wii U",
    description: "A confusing name and lack of clear differentiation from its predecessor led to massive consumer confusion.",
    catchphrase: "A masterclass in how to confuse your loyal fanbase.",
    investors: 15,
    consumers: 20,
    critics: 5,
    verdict: "ROASTED"
  },
  {
    title: "Pepsi Kendall Jenner Ad",
    description: "Attempted to co-opt social justice movements to sell soda, resulting in immediate and universal backlash.",
    catchphrase: "Solving systemic issues one sugary beverage at a time.",
    investors: 10,
    consumers: 5,
    critics: 0,
    verdict: "ROASTED"
  }
];

export default function Analyzer({ onAction }: { onAction?: () => boolean }) {
  const [inputType, setInputType] = useState<"text" | "image" | "video">("text");
  const [textInput, setTextInput] = useState("");
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [language, setLanguage] = useState("ja");
  const [scale, setScale] = useState<100 | 1000 | 10000>(1000);
  const [isRoastMode, setIsRoastMode] = useState(false);
  const [targetCountry, setTargetCountry] = useState("Global");
  const [targetGeneration, setTargetGeneration] = useState("Gen Z (10-25)");
  const [targetGender, setTargetGender] = useState("All");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [previousResults, setPreviousResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPivotLabActive, setIsPivotLabActive] = useState(false);
  const [improvedText, setImprovedText] = useState("");
  
  // Analytics & Feedback states
  const [logId, setLogId] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'liked' | 'disliked' | 'submitted'>('idle');
  const [feedbackText, setFeedbackText] = useState('');
  
  // Animation states
  const [approvedCount, setApprovedCount] = useState(0);
  const [roastedCount, setRoastedCount] = useState(0);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const { decrementCredits, profile } = useAuth();

  useEffect(() => {
    if (isAnalyzing) {
      setApprovedCount(0);
      setRoastedCount(0);
      
      const targetApproved = Math.floor(scale * (Math.random() * 0.4 + 0.1)); // 10% to 50% approved
      const targetRoasted = scale - targetApproved;
      
      const interval = setInterval(() => {
        setApprovedCount(prev => {
          if (prev >= targetApproved) return targetApproved;
          return prev + Math.max(1, Math.floor(targetApproved * 0.05));
        });
        setRoastedCount(prev => {
          if (prev >= targetRoasted) return targetRoasted;
          return prev + Math.max(1, Math.floor(targetRoasted * 0.05));
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [isAnalyzing, scale]);

  const handleExport = async () => {
    if (!resultCardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(resultCardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `pitch-roast-${Date.now()}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
      alert("Failed to generate Share Card.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAnalyze = async (isPivotReTest = false) => {
    const inputToAnalyze = isPivotReTest ? improvedText : textInput;
    if (!inputToAnalyze.trim() && !fileInput) return;

    if (onAction && !onAction()) return;

    setIsAnalyzing(true);
    setError(null);
    if (!isPivotReTest) {
      setPreviousResults(null);
      setResults(null);
    } else {
      setPreviousResults(results);
      setResults(null);
    }
    setLogId(null);
    setFeedbackStatus('idle');
    setFeedbackText('');

    const effectiveType = fileInput ? inputType : "text";

    try {
      const res = await analyzeInput({
        type: effectiveType as any,
        text: inputToAnalyze,
        file: fileInput,
        language,
        scale,
        isRoastMode,
        targetCountry,
        targetGeneration,
        targetGender,
      });
      setResults(res);
      await decrementCredits();
      if (isPivotReTest) {
        setIsPivotLabActive(false);
      }

      // Firestore Logging
      try {
        const logRef = await addDoc(collection(db, "analysis_logs"), {
          type: effectiveType,
          inputContent: inputToAnalyze,
          mediaDescription: fileInput ? `File: ${fileInput.name} (${fileInput.type})` : "",
          scale,
          isRoastMode,
          targetCountry,
          targetGeneration,
          targetGender,
          language,
          results: res,
          isPivotReTest,
          timestamp: serverTimestamp(),
        });
        setLogId(logRef.id);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, "analysis_logs");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const enterPivotLab = () => {
    setIsPivotLabActive(true);
    setImprovedText(textInput + "\n\n" + (results?.secretStrategies?.join("\n") || ""));
    // Scroll to top to see the input
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFeedback = async (isAccurate: boolean) => {
    if (!logId) return;
    
    if (isAccurate) {
      setFeedbackStatus('submitted');
      try {
        await addDoc(collection(db, "feedback"), {
          logId,
          isAccurate: true,
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, "feedback");
      }
    } else {
      setFeedbackStatus('disliked');
    }
  };

  const submitDislikeFeedback = async () => {
    if (!logId) return;
    
    setFeedbackStatus('submitted');
    try {
      await addDoc(collection(db, "feedback"), {
        logId,
        isAccurate: false,
        feedbackText,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "feedback");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (isVideo) {
      if (file.size > 20 * 1024 * 1024) {
        setError("Video size must be under 20MB.");
        return;
      }
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 31) {
          setError("Video duration must be under 30 seconds.");
          setFileInput(null);
        }
      };
      video.src = URL.createObjectURL(file);
      setInputType("video");
    } else if (isImage) {
      setInputType("image");
    }

    setFileInput(file);
    setError(null);
  };

  return (
    <div className="space-y-16 pb-20 max-w-4xl mx-auto w-full">
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

      <header className={cn("text-center space-y-4", isRoastMode ? "pt-4" : "")}>
        <h1 className={cn("text-4xl md:text-5xl font-light tracking-tighter", isRoastMode ? "text-red-500" : "")}>Pitch Roast</h1>
        <p className={cn("font-light text-lg", isRoastMode ? "text-red-400" : "text-gray-500")}>
          {scale.toLocaleString()} AI agents will {isRoastMode ? "brutally roast" : "objectively analyze"} your idea.
        </p>
      </header>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8 border-b border-gray-100 pb-8">
          {/* Language Selector */}
          <div className="flex flex-col space-y-3">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border-b border-gray-200 text-sm font-medium focus:border-black focus:ring-0 cursor-pointer outline-none text-black pb-1 pr-4"
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
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Scale Selector */}
          <div className="flex flex-col space-y-3">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Board Size</span>
            <div className="flex items-center space-x-1">
              {[100, 1000, 10000].map((s) => {
                const isLocked = s === 10000 && profile?.plan !== 'pro';
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (isLocked) {
                        alert("Upgrade to Pro to unlock 10,000 agents.");
                        return;
                      }
                      setScale(s as any);
                    }}
                    className={cn(
                      "relative px-4 py-2 text-xs font-mono transition-all duration-300 border-b-2 flex items-center",
                      scale === s 
                        ? "border-black text-black" 
                        : "border-transparent text-gray-400 hover:text-black",
                      isLocked && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {s.toLocaleString()}
                    {isLocked && <Lock className="w-3 h-3 ml-1" />}
                    {s === 10000 && scale === 10000 && (
                      <motion.span
                        className="absolute inset-0 bg-black/5 blur-md -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Roast Mode Toggle */}
          <div className="flex flex-col space-y-3">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Analysis Mode</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsRoastMode(false)}
                className={cn(
                  "px-4 py-2 text-xs font-medium transition-all duration-300 border-b-2",
                  !isRoastMode ? "border-black text-black" : "border-transparent text-gray-400 hover:text-black"
                )}
              >
                Standard Analysis
              </button>
              <button
                onClick={() => {
                  if (profile?.plan !== 'pro') {
                    alert("Upgrade to Pro to unlock Brutal Roast.");
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
                Brutal Roast
                {profile?.plan !== 'pro' && <Lock className="w-3 h-3 ml-1" />}
              </button>
            </div>
          </div>
        </div>

        {/* Target Persona Settings */}
        <div className="flex flex-col space-y-4 border-b border-gray-100 pb-8">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Target Persona</span>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div className="flex flex-col space-y-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Target Market</span>
              <select
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                className="bg-transparent border-b border-gray-200 text-sm font-medium focus:border-black focus:ring-0 cursor-pointer outline-none text-black pb-1 pr-4"
              >
                {["Global", "USA", "Japan", "UK", "Brazil", "India", "UAE (Dubai)", "Germany", "France", "South Korea", "China"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Generation</span>
              <select
                value={targetGeneration}
                onChange={(e) => setTargetGeneration(e.target.value)}
                className="bg-transparent border-b border-gray-200 text-sm font-medium focus:border-black focus:ring-0 cursor-pointer outline-none text-black pb-1 pr-4"
              >
                {["Gen Z (10-25)", "Millennials (26-40)", "Gen X (41-55)", "Boomers (56+)"].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Gender</span>
              <select
                value={targetGender}
                onChange={(e) => setTargetGender(e.target.value)}
                className="bg-transparent border-b border-gray-200 text-sm font-medium focus:border-black focus:ring-0 cursor-pointer outline-none text-black pb-1 pr-4"
              >
                {["All", "Male", "Female"].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex flex-col space-y-3">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Visual Input (Optional)</span>
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 hover:border-black transition-colors cursor-pointer relative group h-[300px]">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {fileInput ? (
                  <div className="text-center">
                    {fileInput.type.startsWith('image/') ? (
                      <img 
                        src={URL.createObjectURL(fileInput)} 
                        alt="Preview" 
                        className="max-h-[200px] mx-auto mb-4 object-contain"
                      />
                    ) : (
                      <Video className="w-12 h-12 text-black mx-auto mb-4" />
                    )}
                    <p className="text-sm text-black font-medium truncate max-w-[200px]">
                      {fileInput.name}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFileInput(null); }}
                      className="mt-2 text-[10px] uppercase tracking-widest text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-300 group-hover:text-black transition-colors mb-4" />
                    <p className="text-sm text-gray-500 font-light text-center">
                      Upload Banner, Screenshot,<br />or Video (Max 30s)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col space-y-3">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Content / Script</span>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Describe your business idea, ad copy, or video script here..."
                className="w-full h-[300px] p-6 bg-transparent border border-gray-100 focus:border-black outline-none resize-none transition-all font-light text-lg placeholder:text-gray-300"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">
          <Button
            onClick={() => handleAnalyze(false)}
            disabled={isAnalyzing || (!textInput && !fileInput)}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 rounded-none px-12 h-14 font-medium tracking-widest uppercase text-xs"
          >
            {isAnalyzing ? "Analyzing..." : isRoastMode ? "Roast My Pitch" : "Analyze My Pitch"}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-500 text-sm text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        {isAnalyzing && !results && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-20 flex flex-col items-center justify-center text-center space-y-16"
          >
            <div className="relative w-full max-w-md mx-auto">
              {/* Heavy Progress Bar */}
              <div className="h-1 w-full bg-gray-100 overflow-hidden rounded-full">
                <motion.div 
                  className="h-full bg-black"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 10, ease: "easeInOut" }}
                />
              </div>
              
              <div className="mt-4 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-gray-400">
                <span>Processing Neural Weights</span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  System Active
                </motion.span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-12 md:space-x-24 w-full">
              <div className="text-center space-y-4">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl md:text-7xl font-light tracking-tighter text-gray-300"
                >
                  {Math.min(approvedCount, scale).toLocaleString()}
                </motion.div>
                <div className="text-[10px] md:text-xs font-semibold tracking-widest uppercase text-gray-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approved
                </div>
              </div>
              
              <div className="w-px h-16 md:h-24 bg-gray-200" />
              
              <div className="text-center space-y-4">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl md:text-7xl font-light tracking-tighter text-black"
                >
                  {Math.min(roastedCount, scale).toLocaleString()}
                </motion.div>
                <div className="text-[10px] md:text-xs font-semibold tracking-widest uppercase text-black flex items-center justify-center">
                  <XCircle className="w-4 h-4 mr-2" /> Roasted
                </div>
              </div>
            </div>
            
            <div className="space-y-4 w-full">
              <p className="font-mono tracking-[0.3em] text-[10px] text-black uppercase">
                Synchronizing {scale.toLocaleString()} Agent Perspectives
              </p>
              <div className="flex justify-center space-x-1 mb-8">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [1, 2, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 h-4 bg-black"
                  />
                ))}
              </div>
              <AgentDiscussionEffect />
            </div>
          </motion.div>
        )}

        {results && !isAnalyzing && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div 
              ref={resultCardRef}
              className="p-8 md:p-12 bg-white text-black"
            >
              <div className="mb-16 text-center space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
                  <div className="inline-block px-4 py-1.5 border border-gray-200 rounded-full text-[10px] font-semibold tracking-widest uppercase text-gray-500">
                    Simulated Audience: {targetGeneration} in {targetCountry} ({targetGender})
                  </div>
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
                <h2 className="text-6xl md:text-8xl font-light tracking-tighter uppercase">
                  {isRoastMode ? "Deconstructed" : "Analyzed"}
                </h2>
                <p className="text-2xl md:text-3xl font-light italic text-gray-500 max-w-2xl mx-auto leading-relaxed">
                  "{results.catchphrase}"
                </p>
              </div>

              {/* Market Cap Simulator */}
              <div className="mb-16 p-8 bg-black text-white rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  {results.marketCapChange >= 0 ? <TrendingUp className="w-48 h-48" /> : <TrendingDown className="w-48 h-48" />}
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase">Market Cap Simulator</h3>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-end gap-6">
                    <div className={cn(
                      "text-6xl md:text-7xl font-light tracking-tighter tabular-nums",
                      results.marketCapChange >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {results.marketCapChange >= 0 ? "+" : ""}{results.marketCapChange}%
                    </div>
                    <p className="text-sm font-light text-gray-400 max-w-sm">
                      Predicted brand asset value fluctuation based on the Sovereign Intelligence's deconstruction of brand mythology.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-16 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { 
                        name: 'Investors', 
                        score: Math.round((results.investors.score / (scale * 0.3)) * 100),
                        previousScore: previousResults ? Math.round((previousResults.investors.score / (scale * 0.3)) * 100) : undefined
                      },
                      { 
                        name: 'Consumers', 
                        score: Math.round((results.consumers.score / (scale * 0.5)) * 100),
                        previousScore: previousResults ? Math.round((previousResults.consumers.score / (scale * 0.5)) * 100) : undefined
                      },
                      { 
                        name: 'Critics', 
                        score: Math.round((results.critics.score / (scale * 0.2)) * 100),
                        previousScore: previousResults ? Math.round((previousResults.critics.score / (scale * 0.2)) * 100) : undefined
                      },
                    ]}
                    margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value, name) => [`${value}%`, name === 'score' ? 'Current' : 'Previous']}
                    />
                    {previousResults && (
                      <Bar dataKey="previousScore" fill="#d1d5db" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    )}
                    <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {
                        [
                          { name: 'Investors', score: Math.round((results.investors.score / (scale * 0.3)) * 100) },
                          { name: 'Consumers', score: Math.round((results.consumers.score / (scale * 0.5)) * 100) },
                          { name: 'Critics', score: Math.round((results.critics.score / (scale * 0.2)) * 100) },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.score > 50 ? '#000000' : '#e5e7eb'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                <ResultColumn
                  title="Investors"
                  score={results.investors.score}
                  total={scale * 0.3}
                  verdict={results.investors.verdict}
                  subScores={results.investors.subScores}
                />
                <ResultColumn
                  title="Consumers"
                  score={results.consumers.score}
                  total={scale * 0.5}
                  verdict={results.consumers.verdict}
                  subScores={results.consumers.subScores}
                />
                <ResultColumn
                  title="Critics"
                  score={results.critics.score}
                  total={scale * 0.2}
                  verdict={results.critics.verdict}
                  subScores={results.critics.subScores}
                />
              </div>

              <div className="space-y-12 max-w-3xl mx-auto">
                <div>
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-6">
                    Board Resolution
                  </h3>
                  <p className="text-xl leading-relaxed font-light">
                    {results.resolutionLocal}
                  </p>
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-6">
                    Secret Strategies
                  </h3>
                  <ul className="space-y-6">
                    {results.secretStrategies.map((strategy: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-4 font-mono text-sm mt-1 text-gray-400">0{idx + 1}</span>
                        <span className="font-light text-lg leading-relaxed">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={cn(
                  "pt-8 border-t",
                  isRoastMode ? "border-red-900/30" : "border-gray-100"
                )}>
                  <h3 className={cn(
                    "text-xs font-semibold tracking-widest uppercase mb-6 flex items-center space-x-2",
                    isRoastMode ? "text-red-500 animate-pulse" : "text-gray-400"
                  )}>
                    {isRoastMode && <AlertTriangle className="w-4 h-4" />}
                    <span>{isRoastMode ? "Red Declaration: The Crushing of Human Complacency" : "Developer Notes (JA)"}</span>
                  </h3>
                  <p className={cn(
                    "text-lg leading-relaxed",
                    isRoastMode ? "text-red-50 font-serif italic" : "font-light text-gray-600"
                  )}>
                    {results.resolutionJa}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center pt-8 space-y-8">
              <Button 
                variant="outline" 
                className="rounded-none border-black text-black hover:bg-black hover:text-white px-8 h-12 text-xs tracking-widest uppercase transition-colors"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {isExporting ? "Generating..." : "Export Result"}
              </Button>

              {/* Feedback Loop */}
              {logId && (
                <div className="flex flex-col items-center space-y-4 pt-8 border-t border-gray-100 w-full max-w-md">
                  {feedbackStatus === 'idle' && (
                    <>
                      <p className="text-sm text-gray-500 font-light">Was this accurate?</p>
                      <div className="flex space-x-4">
                        <button 
                          onClick={() => handleFeedback(true)}
                          className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-black transition-all text-xl"
                        >
                          👍
                        </button>
                        <button 
                          onClick={() => handleFeedback(false)}
                          className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-black transition-all text-xl"
                        >
                          👎
                        </button>
                      </div>
                    </>
                  )}
                  
                  {feedbackStatus === 'disliked' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full space-y-3"
                    >
                      <p className="text-sm text-gray-500 font-light text-center">What felt inaccurate?</p>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g., I wanted more perspective from younger demographics..."
                        className="w-full h-24 p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black outline-none resize-none font-light"
                      />
                      <Button 
                        onClick={submitDislikeFeedback}
                        disabled={!feedbackText.trim()}
                        className="w-full bg-black text-white hover:bg-gray-800 rounded-lg h-10 text-xs tracking-widest uppercase"
                      >
                        Submit Feedback
                      </Button>
                    </motion.div>
                  )}

                  {feedbackStatus === 'submitted' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center space-x-2 text-green-600"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Thank you for your feedback!</span>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Pivot Lab Section */}
              <div className="mt-16 pt-16 border-t border-gray-100">
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-light tracking-tight mb-2">The Pivot Lab</h2>
                  <p className="text-gray-500 font-light text-sm">Apply AI suggestions and test your improved concept.</p>
                </div>

                {!isPivotLabActive ? (
                  <div className="flex justify-center">
                    <Button
                      onClick={enterPivotLab}
                      className="bg-black text-white hover:bg-gray-800 rounded-none px-12 h-14 font-medium tracking-widest uppercase text-xs"
                    >
                      Enter Pivot Lab
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="space-y-3">
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Refined Concept</span>
                      <textarea
                        value={improvedText}
                        onChange={(e) => setImprovedText(e.target.value)}
                        placeholder="Edit your concept based on the AI's feedback..."
                        className="w-full h-[300px] p-6 bg-transparent border border-gray-200 focus:border-black outline-none resize-none transition-all font-light text-lg placeholder:text-gray-300"
                      />
                    </div>
                    <div className="flex justify-end gap-4">
                      <Button
                        onClick={() => setIsPivotLabActive(false)}
                        variant="outline"
                        className="rounded-none px-8 h-12 font-medium tracking-widest uppercase text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleAnalyze(true)}
                        disabled={isAnalyzing || !improvedText.trim()}
                        className="bg-black text-white hover:bg-gray-800 rounded-none px-12 h-12 font-medium tracking-widest uppercase text-xs"
                      >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Re-Analyze"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Case Studies Section */}
      <div className="pt-24 mt-24 border-t border-gray-100">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-light tracking-tight mb-2">Legendary Failures</h2>
          <p className="text-gray-500 font-light text-sm">Even giants get roasted.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CASE_STUDIES.map((study, idx) => (
            <div key={idx} className="p-8 bg-[#fafafa] border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-medium">{study.title}</h3>
                <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-1 bg-black text-white">
                  {study.verdict}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-light mb-6 leading-relaxed">
                {study.description}
              </p>
              <p className="text-base font-light italic mb-8">
                "{study.catchphrase}"
              </p>
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>INV: {study.investors}%</span>
                <span>CON: {study.consumers}%</span>
                <span>CRI: {study.critics}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultColumn({ title, score, total, verdict, subScores }: any) {
  const percentage = Math.round((score / total) * 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">{title}</p>
        <div className="font-mono text-3xl font-light tracking-tighter">
          {percentage}<span className="text-lg text-gray-300">%</span>
        </div>
      </div>
      
      {subScores && (
        <div className="space-y-3">
          {Object.entries(subScores).map(([key, val]: any) => (
            <div key={key} className="flex justify-between items-center text-xs">
              <span className="capitalize font-medium text-gray-500">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="font-mono text-gray-400">{val}/100</span>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-sm font-light leading-relaxed text-gray-600 pt-4">
        "{verdict}"
      </p>
    </div>
  );
}
