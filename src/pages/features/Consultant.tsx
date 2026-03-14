import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Card, CardContent } from "@/src/components/ui/Card";
import { cn } from "@/src/lib/utils";
import { consultBoard } from "@/src/services/geminiService";

export default function Consultant() {
  const [messages, setMessages] = useState<{ role: "user" | "model"; content: string }[]>([
    {
      role: "model",
      content: "Welcome to the Interactive Consultant. How can I help you improve your proposal's approval rating today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

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
      
      setMessages([...newMessages, { role: "model", content: response || "I'm sorry, I couldn't process that request." }]);
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
    <div className="h-full flex flex-col pb-6 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-light tracking-tight mb-2">Interactive Consultant</h1>
        <p className="text-gray-500 font-light">Ask for specific advice to increase your investment probability.</p>
      </header>

      <Card className="flex-1 flex flex-col border-gray-100 shadow-sm bg-white overflow-hidden min-h-[500px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-start max-w-[80%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "user" ? "bg-black text-white ml-3" : "bg-gray-100 text-gray-600 mr-3"
                )}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm font-light leading-relaxed",
                  msg.role === "user" 
                    ? "bg-black text-white rounded-tr-none" 
                    : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none"
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
              className="flex items-start max-w-[80%] mr-auto"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 mr-3 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 rounded-tl-none flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask how to improve your idea..."
              className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none transition-all font-light text-sm h-14 overflow-hidden"
              rows={1}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 rounded-full w-10 h-10 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
