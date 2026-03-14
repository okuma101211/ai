import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileText, Image as ImageIcon, Video, Globe, Loader2, Download, Flame, Users, Lock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";
import { analyzeInput } from "@/src/services/geminiService";
import html2canvas from "html2canvas";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

export default function Analyzer() {
  const [inputType, setInputType] = useState<"text" | "image" | "video">("text");
  const [textInput, setTextInput] = useState("");
  const [scale, setScale] = useState<100 | 1000 | 10000>(1000);
  const [isRoastMode, setIsRoastMode] = useState(false);
  const [targetCountry, setTargetCountry] = useState("Global");
  const [targetGeneration, setTargetGeneration] = useState("Gen Z (10-25)");
  const [targetGender, setTargetGender] = useState("All");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Analytics & Feedback states
  const [analyticsId, setAnalyticsId] = useState<number | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'liked' | 'disliked' | 'submitted'>('idle');
  const [feedbackText, setFeedbackText] = useState('');
  
  // Animation states
  const [approvedCount, setApprovedCount] = useState(0);
  const [roastedCount, setRoastedCount] = useState(0);
  const resultCardRef = useRef<HTMLDivElement>(null);

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

  const handleAnalyze = async () => {
    if (!textInput.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    setAnalyticsId(null);
    setFeedbackStatus('idle');
    setFeedbackText('');

    try {
      const res = await analyzeInput({
        type: "text",
        text: textInput,
        file: null,
        language: "en",
        scale,
        isRoastMode,
        targetCountry,
        targetGeneration,
        targetGender,
      });
      setResults(res);

      // Stealth Data Collection
      try {
        const analyticsRes = await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputContent: textInput,
            targetCountry,
            targetGeneration,
            targetGender
          })
        });
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalyticsId(data.id);
        }
      } catch (e) {
        console.error("Failed to save analytics", e);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFeedback = async (isAccurate: boolean) => {
    if (!analyticsId) return;
    
    if (isAccurate) {
      setFeedbackStatus('submitted');
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analyticsId, isAccurate: true })
        });
      } catch (e) {
        console.error("Failed to save feedback", e);
      }
    } else {
      setFeedbackStatus('disliked');
    }
  };

  const submitDislikeFeedback = async () => {
    if (!analyticsId) return;
    
    setFeedbackStatus('submitted');
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyticsId, isAccurate: false, feedbackText })
      });
    } catch (e) {
      console.error("Failed to save feedback", e);
    }
  };

  return (
    <div className="space-y-16 pb-20 max-w-4xl mx-auto w-full">
      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-light tracking-tighter">Pitch Roast</h1>
        <p className="text-gray-500 font-light text-lg">
          {scale.toLocaleString()} AI agents will {isRoastMode ? "brutally roast" : "objectively analyze"} your idea.
        </p>
      </header>

      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8 border-b border-gray-100 pb-8">
          {/* Scale Selector */}
          <div className="flex flex-col space-y-3">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400">Board Size</span>
            <div className="flex items-center space-x-1">
              {[100, 1000, 10000].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s as any)}
                  className={cn(
                    "relative px-4 py-2 text-xs font-mono transition-all duration-300 border-b-2",
                    scale === s 
                      ? "border-black text-black" 
                      : "border-transparent text-gray-400 hover:text-black"
                  )}
                >
                  {s.toLocaleString()}
                  {s === 10000 && scale === 10000 && (
                    <motion.span
                      className="absolute inset-0 bg-black/5 blur-md -z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    />
                  )}
                </button>
              ))}
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
                onClick={() => setIsRoastMode(true)}
                className={cn(
                  "px-4 py-2 text-xs font-medium transition-all duration-300 border-b-2",
                  isRoastMode ? "border-red-500 text-red-500" : "border-transparent text-gray-400 hover:text-black"
                )}
              >
                Brutal Roast
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

        <div className="flex justify-center space-x-8 border-b border-gray-100 pb-4">
          {[
            { id: "text", icon: FileText, label: "Text Idea", comingSoon: false },
            { id: "image", icon: ImageIcon, label: "Design / Ad", comingSoon: true },
            { id: "video", icon: Video, label: "Video / CM", comingSoon: true },
          ].map((tab) => (
            <div key={tab.id} className="relative group">
              <button
                onClick={() => !tab.comingSoon && setInputType(tab.id as any)}
                disabled={tab.comingSoon}
                className={cn(
                  "flex items-center space-x-2 pb-4 -mb-[17px] text-sm font-medium transition-colors border-b-2",
                  inputType === tab.id
                    ? "border-black text-black"
                    : tab.comingSoon
                    ? "border-transparent text-gray-300 cursor-not-allowed"
                    : "border-transparent text-gray-400 hover:text-black"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.comingSoon && <Lock className="w-3 h-3 opacity-50 ml-1" />}
              </button>
              {tab.comingSoon && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  🚀 This feature is currently in training (Coming Soon)
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Describe your business idea, ad copy, or presentation..."
            className="w-full h-48 p-6 bg-transparent border-b border-gray-200 focus:border-black outline-none resize-none transition-all font-light text-xl md:text-2xl placeholder:text-gray-300"
          />

          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !textInput}
              className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 rounded-none px-12 h-14 font-medium tracking-widest uppercase text-xs"
            >
              {isAnalyzing ? "Analyzing..." : isRoastMode ? "Roast My Pitch" : "Analyze My Pitch"}
            </Button>
          </div>
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
            className="py-20 flex flex-col items-center justify-center text-center space-y-12"
          >
            <div className="flex items-center justify-center space-x-8 md:space-x-16 w-full">
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-6xl font-light tracking-tighter text-gray-300">
                  {Math.min(approvedCount, scale).toLocaleString()}
                </div>
                <div className="text-[10px] md:text-xs font-semibold tracking-widest uppercase text-gray-400 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                </div>
              </div>
              
              <div className="w-px h-12 md:h-16 bg-gray-200" />
              
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-6xl font-light tracking-tighter text-black">
                  {Math.min(roastedCount, scale).toLocaleString()}
                </div>
                <div className="text-[10px] md:text-xs font-semibold tracking-widest uppercase text-black flex items-center justify-center">
                  <XCircle className="w-3 h-3 mr-1" /> Roasted
                </div>
              </div>
            </div>
            
            <p className="font-light tracking-widest text-sm text-gray-400 uppercase animate-pulse">
              {scale.toLocaleString()} Agents Voting...
            </p>
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
                <div className="inline-block px-4 py-1.5 border border-gray-200 rounded-full text-[10px] font-semibold tracking-widest uppercase text-gray-500 mb-4">
                  Simulated Audience: {targetGeneration} in {targetCountry} ({targetGender})
                </div>
                <h2 className="text-6xl md:text-8xl font-light tracking-tighter uppercase">
                  {isRoastMode ? "Roasted" : "Analyzed"}
                </h2>
                <p className="text-2xl md:text-3xl font-light italic text-gray-500 max-w-2xl mx-auto leading-relaxed">
                  "{results.catchphrase}"
                </p>
              </div>

              <div className="mb-16 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Investors', score: Math.round((results.investors.score / (scale * 0.3)) * 100) },
                      { name: 'Consumers', score: Math.round((results.consumers.score / (scale * 0.5)) * 100) },
                      { name: 'Critics', score: Math.round((results.critics.score / (scale * 0.2)) * 100) },
                    ]}
                    margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) => [`${value}%`, 'Approval']}
                    />
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

                <div className="pt-8 border-t border-gray-100">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-6">
                    Developer Notes (JA)
                  </h3>
                  <p className="text-lg leading-relaxed font-light text-gray-600">
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
              {analyticsId && (
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
