import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";
import { consultBoard } from "@/src/services/geminiService";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function Consultant({ onAction }: { onAction?: () => boolean }) {
  const [messages, setMessages] = useState<{ role: "user" | "model"; content: string }[]>([
    {
      role: "model",
      content: "Welcome to the Boardroom Consultation. I am the collective intelligence of 10,000 agents. How can I refine your strategy today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { decrementCredits } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (onAction && !onAction()) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Format history for the service
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await consultBoard({ history, message: userMessage });
      const modelResponse = response || "I'm sorry, I couldn't process that request.";
      
      const finalMessages = [...newMessages, { role: "model" as const, content: modelResponse }];
      setMessages(finalMessages);
      await decrementCredits();

      // Firestore Logging
      try {
        if (!chatId) {
          const chatRef = await addDoc(collection(db, "consultation_logs"), {
            initialMessage: userMessage,
            history: finalMessages,
            timestamp: serverTimestamp(),
          });
          setChatId(chatRef.id);
        } else {
          // In a real app we'd update the doc, but for simplicity we'll just log the session
          await addDoc(collection(db, "consultation_messages"), {
            chatId,
            userMessage,
            modelResponse,
            timestamp: serverTimestamp(),
          });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, "consultation_logs");
      }
    } catch (error) {
      console.error("Consultant error:", error);
      setMessages([...newMessages, { role: "model", content: "An error occurred while consulting the board. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col pb-6 max-w-4xl mx-auto w-full space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-light tracking-tighter">AI Consultant</h1>
        <p className="text-gray-500 font-light text-lg">
          Direct access to the collective wisdom of 10,000 simulated agents.
        </p>
      </header>

      <div className="flex-1 flex flex-col bg-white border border-gray-100 overflow-hidden min-h-[600px] relative">
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-start max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-10 h-10 flex items-center justify-center shrink-0 border",
                  msg.role === "user" ? "bg-black text-white ml-4 border-black" : "bg-white text-black mr-4 border-gray-100"
                )}>
                  {msg.role === "user" ? <User className="w-5 h-5" /> : <span className="text-sm font-bold">B</span>}
                </div>
                <div className={cn(
                  "p-6 text-base font-light leading-relaxed",
                  msg.role === "user" 
                    ? "bg-black text-white" 
                    : "bg-gray-50 text-black"
                )}>
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start max-w-[85%] mr-auto"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0 border border-gray-100 bg-white text-black mr-4">
                <span className="text-sm font-bold">B</span>
              </div>
              <div className="p-6 bg-gray-50 flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-8 border-t border-gray-100 bg-white">
          <div className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for strategic advice..."
              className="w-full pl-6 pr-16 py-6 bg-transparent border-b border-gray-200 focus:border-black outline-none resize-none transition-all font-light text-lg h-20 overflow-hidden"
              rows={1}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-0 bottom-4 w-12 h-12 bg-black text-white hover:bg-gray-800 transition-colors rounded-none"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <div className="mt-4 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-gray-400">
            <span>Encrypted Session</span>
            <span>v1.0.0 Stable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
