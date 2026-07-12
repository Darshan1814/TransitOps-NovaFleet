"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Download, BarChart2 } from "lucide-react";
import { usePathname } from "next/navigation";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string; special?: "pdf" | "graph" }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, contextPath: pathname })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      let reply = data.reply as string;
      let special: "pdf" | "graph" | undefined = undefined;

      if (reply.includes("[GENERATE_PDF]")) {
        special = "pdf";
        reply = reply.replace("[GENERATE_PDF]", "").trim();
      } else if (reply.includes("[SHOW_GRAPH]")) {
        special = "graph";
        reply = reply.replace("[SHOW_GRAPH]", "").trim();
      }

      setMessages(prev => [...prev, { role: "bot", content: reply, special }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", content: "Sorry, I encountered a cosmic anomaly and couldn't process that request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--accent-glow)] rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-80 transition-all z-50"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            style={{ maxHeight: "60vh" }}
          >
            <div className="bg-[var(--bg-panel-2)] p-4 flex justify-between items-center border-b border-[var(--border-subtle)]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-glow)] animate-pulse" />
                Nova AI
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-[var(--text-tertiary)] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-[var(--text-secondary)] text-sm my-4">
                  Hello! I am Nova, your fleet assistant. Ask me anything about your current dashboard.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${
                    msg.role === "user" 
                      ? "bg-[var(--accent-glow)] text-white rounded-tr-none" 
                      : "bg-[var(--bg-panel-2)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border-subtle)]"
                  }`}>
                    {msg.content}
                  </div>
                  
                  {msg.special === "pdf" && (
                    <button onClick={() => window.print()} className="mt-2 text-xs flex items-center gap-1 btn-secondary py-1 px-3">
                      <Download className="w-3 h-3" /> Download PDF Report
                    </button>
                  )}
                  {msg.special === "graph" && (
                    <div className="mt-2 p-3 bg-black/30 border border-[var(--border)] rounded flex items-center justify-center text-[var(--accent-glow)] text-xs">
                      <BarChart2 className="w-4 h-4 mr-2" />
                      Dynamic graph visualization loaded
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-1 text-[var(--accent-glow)] ml-2">
                  <span className="animate-bounce">.</span><span className="animate-bounce" style={{animationDelay: "0.2s"}}>.</span><span className="animate-bounce" style={{animationDelay: "0.4s"}}>.</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-[var(--border-subtle)] flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask Nova..."
                className="cosmic-input flex-1 py-2 text-sm"
              />
              <button type="submit" disabled={isLoading} className="bg-[var(--accent-glow)] w-10 h-10 rounded flex items-center justify-center text-white disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
