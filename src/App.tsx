import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Clapperboard, 
  Sparkles, 
  Mic2, 
  Search, 
  History, 
  Settings,
  Send,
  User,
  Bot,
  Volume2,
  ChevronRight,
  BookOpen,
  Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn, playAudio } from './lib/utils';
import { 
  generateScript, 
  getRecommendations, 
  generateSpeech, 
  type Script, 
  type MovieRecommendation 
} from './services/gemini.ts';
import { preferenceService } from './services/preferences.ts';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  type: 'text' | 'recommendations' | 'script';
  data?: any;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'scripts' | 'prefs'>('chat');
  const [currentScript, setCurrentScript] = useState<Script | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Welcome message
    if (messages.length === 0) {
      addBotMessage("Welcome to **ScriptSage**. I am your cinematic adaptive assistant. Would you like to generate a new script, or shall I recommend some titles based on your current mood?");
    }
  }, []);

  const addBotMessage = (content: string, type: Message['type'] = 'text', data?: any) => {
    const id = Math.random().toString(36).substring(7);
    setMessages(prev => [...prev, { id, role: 'bot', content, type, data }]);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');
    const id = Math.random().toString(36).substring(7);
    setMessages(prev => [...prev, { id, role: 'user', content: userText, type: 'text' }]);
    
    setIsTyping(true);

    try {
      const lowered = userText.toLowerCase();
      
      if (lowered.includes('script') || lowered.includes('write')) {
        const script = await generateScript(userText);
        setCurrentScript(script);
        addBotMessage(`I've drafted a script for you: **${script.title}**. Check the Script Foundry tab for the full version.`, 'script', script);
      } else if (lowered.includes('recommend') || lowered.includes('suggest') || lowered.includes('movie')) {
        const topGenres = preferenceService.getTopGenres();
        const recs = await getRecommendations("curious", "various", topGenres);
        // Track preference
        if (topGenres.length > 0) preferenceService.updatePreference(topGenres[0], "curious");
        addBotMessage("Based on your preferences and the current vibe, here are some recommendations:", 'recommendations', recs);
      } else {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const chatResult = await ai.models.generateContent({
           model: 'gemini-3-flash-preview',
           contents: `You are ScriptSage, a cinematic AI advisor. The user says: ${userText}. Respond concisely and stay in character.`,
        });
        addBotMessage(chatResult.text);
      }
    } catch (err) {
      console.error(err);
      addBotMessage("I encountered a technical glitch in the projection booth. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpeech = async (text: string) => {
    const audioData = await generateSpeech(text);
    if (audioData) {
      playAudio(audioData);
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#080808] text-gray-300 font-sans selection:bg-white/20">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white/5 to-transparent shadow-2xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative flex h-screen max-w-[1700px] mx-auto overflow-hidden shadow-studio">
        
        {/* Sidebar Navigation: CineSync Style */}
        <nav className="w-20 md:w-64 bg-[#0A0A0B] border-r border-white/10 flex flex-col p-8 z-20">
          <div className="mb-12 shrink-0">
            <h1 className="hidden md:block font-black text-2xl tracking-tighter text-white uppercase italic leading-none">
              Script<span className="opacity-40">Sage</span>
            </h1>
            <p className="hidden md:block text-[10px] uppercase tracking-[0.4em] text-white/30 mt-2 font-mono">Studio Asst v.4</p>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            <NavButton 
              active={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')}
              icon={<MessageSquare className="w-5 h-5" />}
              label="Interactive Chat"
            />
            <NavButton 
              active={activeTab === 'scripts'} 
              onClick={() => setActiveTab('scripts')}
              icon={<BookOpen className="w-5 h-5" />}
              label="Script Foundry"
            />
            <NavButton 
              active={activeTab === 'prefs'} 
              onClick={() => setActiveTab('prefs')}
              icon={<History className="w-5 h-5" />}
              label="Rec Engine"
            />
          </div>

          <div className="pt-8 border-t border-white/5 space-y-6 shrink-0">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hidden md:block group">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold group-hover:text-white transition-colors">Aria Voice Engine</span>
              </div>
              <div className="flex gap-1 h-8 items-end justify-between px-1">
                {[0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 0.5].map((s, i) => (
                  <motion.div 
                    key={i} 
                    animate={{ height: [`${s*100}%`, "100%", `${s*100}%`] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-white/20 group-hover:bg-white/40 transition-colors" 
                  />
                ))}
              </div>
            </div>
            <NavButton 
              active={false} 
              onClick={() => {}} 
              icon={<Settings className="w-5 h-5" />}
              label="Preferences"
            />
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-[#080808] relative">
          <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
                {/* Chat Header: Artistic Flair Style */}
                <header className="p-8 flex justify-between items-end border-b border-white/5 z-10 shrink-0">
                  <div>
                    <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                      {currentScript ? currentScript.title : "Studio Sandbox"}
                    </h2>
                    <p className="font-serif italic text-white/40 mt-2 text-sm">
                      {currentScript ? `Sequence: ${currentScript.genre}` : "Interactive Broadcast Assistant"}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 block mb-1 font-bold">Recommendation Engine Active</span>
                    <span className="text-xs font-mono text-white/60">ADAPTIVE STATUS: 84% SYNC</span>
                  </div>
                </header>

                {/* Messages View */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.map((msg) => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-4 max-w-[85%]",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-xl",
                        msg.role === 'user' ? "bg-white text-black font-black italic text-xs uppercase" : "bg-white/5 text-white italic font-bold text-xs"
                      )}>
                        {msg.role === 'user' ? "DIR" : "CS"}
                      </div>
                      <div className="space-y-1">
                        <div className={cn(
                          "p-6 rounded-[2rem] text-sm leading-relaxed",
                          msg.role === 'user' 
                            ? "bg-white text-black rounded-tr-none shadow-2xl" 
                            : "bg-white/5 border border-white/10 text-gray-300 rounded-tl-none prose prose-invert max-w-full"
                        )}>
                          <Markdown>
                            {msg.content}
                          </Markdown>
                        </div>
                        
                        {msg.type === 'recommendations' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            {msg.data.map((rec: MovieRecommendation, idx: number) => (
                              <motion.div 
                                key={idx}
                                whileHover={{ y: -4 }}
                                className="p-6 bg-white/5 border border-white/5 rounded-3xl cursor-pointer group shadow-2xl relative overflow-hidden"
                              >
                                <div className="relative z-10">
                                  <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-black text-white group-hover:text-white transition-colors uppercase tracking-tight italic text-lg leading-none">{rec.title}</h4>
                                    <span className="text-[10px] font-mono text-white/30">{rec.year}</span>
                                  </div>
                                  <p className="text-xs text-white/50 line-clamp-2 italic font-serif leading-relaxed">{rec.reason}</p>
                                  <div className="mt-4 flex items-center gap-3">
                                    <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-white/40" style={{ width: `${rec.moodMatch}%` }} />
                                    </div>
                                    <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">{rec.moodMatch}% Match</span>
                                  </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {msg.type === 'script' && (
                          <button 
                            onClick={() => setActiveTab('scripts')}
                            className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-full text-[10px] uppercase tracking-widest font-black italic hover:bg-gray-200 transition-all mt-4 border border-white"
                          >
                            <Film className="w-3 h-3" />
                            Open Sequence
                          </button>
                        )}
                        
                        {msg.role === 'bot' && (
                          <div className="flex gap-4 pt-3 items-center">
                            <button 
                              onClick={() => handleSpeech(msg.content)}
                              className="text-[9px] uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors flex items-center gap-2 font-bold"
                            >
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              Voice Synthesis
                            </button>
                            <span className="text-[9px] uppercase tracking-[0.2em] text-white/10 font-mono">Archive-0{msg.id.charCodeAt(0)}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0 animate-pulse shadow-offset-orange">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex gap-1 items-center px-4 py-2 bg-[#16161A] rounded-2xl rounded-tl-none border border-white/5">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area: Studio Style */}
                <div className="p-8 shrink-0 relative bg-gradient-to-t from-[#080808] to-transparent">
                  <div className="max-w-4xl mx-auto relative">
                    <div className="relative flex items-center bg-[#111114] border border-white/10 rounded-full overflow-hidden focus-within:border-white/40 transition-all shadow-studio p-1">
                      <input 
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Voice or type script direction..."
                        className="flex-1 bg-transparent border-none outline-none px-8 py-4 text-sm text-white placeholder-white/20"
                      />
                      <div className="flex items-center gap-3 pr-4">
                        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                          <Mic2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={handleSend}
                          disabled={!inputValue.trim()}
                          className="bg-white px-6 py-2 rounded-full hover:bg-gray-200 transition-all disabled:opacity-30 text-black text-[10px] font-black uppercase tracking-widest italic"
                        >
                          Push
                        </button>
                      </div>
                    </div>
                  </div>
                  <footer className="mt-6 flex justify-between items-center max-w-4xl mx-auto text-[9px] uppercase tracking-[0.3em] text-white/20 font-bold px-2">
                    <div className="flex gap-6">
                       <span>Character Archetype: The Defiant Outsider</span>
                       <span className="hidden sm:inline">Pacing: 03:42</span>
                    </div>
                    <span>© 2026 ScriptSage Foundry</span>
                  </footer>
                </div>
              </motion.div>
            )}

            {activeTab === 'scripts' && (
              <motion.div 
                key="scripts"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 overflow-y-auto p-4 md:p-12 bg-[#0C0C0E]"
              >
                {!currentScript ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Clapperboard className="w-10 h-10 text-gray-700" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Forge an Original Script</h2>
                    <p className="text-gray-500 max-w-sm">Use the chat to prompt a scene or characters. My adaptive foundry will weave the narrative in real-time.</p>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-12 pb-24">
                    <header className="text-center space-y-4">
                      <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1 bg-white/5 text-white/40 text-[9px] rounded-full uppercase tracking-[0.4em] font-black border border-white/10"
                      >
                        Production Draft • Sequence {Math.floor(Math.random() * 9000) + 1000}
                      </motion.div>
                      <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase text-white leading-none">
                        {currentScript.title}
                      </h1>
                      <p className="text-lg md:text-xl text-white/50 italic font-serif leading-relaxed">
                        "{currentScript.logline}"
                      </p>
                      <div className="pt-8 flex justify-center gap-16 border-t border-white/5">
                         <div className="text-left">
                            <span className="block text-[9px] text-white/20 uppercase tracking-[0.3em] mb-2 font-black">Genre Profile</span>
                            <span className="text-sm font-mono text-white italic">{currentScript.genre}</span>
                         </div>
                         <div className="text-left">
                            <span className="block text-[9px] text-white/20 uppercase tracking-[0.3em] mb-2 font-black">Unit Index</span>
                            <span className="text-sm font-mono text-white">{currentScript.scenes.length} Blocks</span>
                         </div>
                      </div>
                    </header>

                    <section className="space-y-6 pt-16">
                      <div className="flex items-center gap-6 mb-10">
                         <div className="h-[1px] flex-1 bg-linear-to-r from-transparent to-white/10" />
                         <h3 className="text-[10px] uppercase tracking-[0.5em] font-black text-white/30 italic">Character Matrix</h3>
                         <div className="h-[1px] flex-1 bg-linear-to-l from-transparent to-white/10" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentScript.characters.map((char, i) => (
                           <motion.div 
                             key={i} 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: i * 0.1 }}
                             className="p-6 bg-white/2 border border-white/5 rounded-3xl group hover:border-white/20 transition-all"
                           >
                             <p className="font-black text-sm mb-2 uppercase tracking-tighter italic text-white group-hover:text-white/100">{char.name}</p>
                             <p className="text-xs text-white/40 leading-relaxed font-serif italic group-hover:text-white/60 transition-colors">{char.description}</p>
                           </motion.div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-32 py-24 relative">
                      {currentScript.scenes.map((scene, i) => (
                        <div key={i} className="space-y-12 relative">
                          <div className="flex items-center justify-center gap-6">
                             <div className="h-[1px] w-16 bg-white/10" />
                             <div className="text-center px-6 py-2 bg-white/5 border border-white/10 rounded-full shadow-2xl">
                               <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-white italic font-black">{scene.heading}</p>
                             </div>
                             <div className="h-[1px] w-16 bg-white/10" />
                          </div>
                          
                          <div className="text-sm text-white/50 max-w-xl mx-auto italic leading-relaxed text-center font-serif py-4">
                            {scene.action}
                          </div>

                          <div className="space-y-10 max-w-xl mx-auto">
                            {scene.dialogue.map((line, j) => (
                              <div key={j} className="text-center space-y-3">
                                <p className="text-[9px] uppercase tracking-[0.4em] font-black text-white/20">{line.character}</p>
                                <p className="text-xl text-white font-mono leading-snug px-6 tracking-tight uppercase italic">{line.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </section>

                    <footer className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-700 uppercase tracking-widest font-mono">
                       <span className="flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-green-500" />
                         Adaptive Intelligence Active
                       </span>
                       <span className="opacity-50">Authorized Personnel Only</span>
                       <span>© 2026 ScriptSage Foundry</span>
                    </footer>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'prefs' && (
              <motion.div 
                key="prefs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-6 md:p-12 overflow-y-auto"
              >
                <div className="max-w-4xl mx-auto">
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                      <div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-2 tracking-tighter text-white">Preference Matrix</h2>
                        <p className="text-gray-500 text-sm uppercase tracking-widest">Adaptive Recommendation Analytics</p>
                      </div>
                      <div className="flex gap-4">
                         <div className="text-right">
                           <div className="text-2xl font-black text-orange-500">1.2k</div>
                           <div className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">Data Points</div>
                         </div>
                         <div className="text-right">
                           <div className="text-2xl font-black text-white">98%</div>
                           <div className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">Accuracy</div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                      <div className="p-8 bg-[#111114] border border-white/5 rounded-3xl shadow-xl hover:border-orange-500/20 transition-all">
                         <h4 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-6">Cognitive Genre Profile</h4>
                         <div className="space-y-6">
                            {preferenceService.getTopGenres().length > 0 ? (
                              preferenceService.getTopGenres().map((g, i) => (
                                <div key={i} className="group">
                                  <div className="flex justify-between items-center mb-2">
                                     <span className="text-xs uppercase tracking-widest font-bold text-gray-400 group-hover:text-white transition-colors">{g}</span>
                                     <span className="text-[10px] font-mono text-orange-500">{95 - i * 15}%</span>
                                  </div>
                                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${95 - i * 15}%` }}
                                       className="h-full bg-orange-500/80" 
                                     />
                                  </div>
                                </div>
                              ))
                            ) : (
                               <div className="py-8 text-center">
                                  <p className="text-xs text-gray-600 italic">No interaction data available. Start chatting to build your profile.</p>
                               </div>
                            )}
                         </div>
                      </div>
                      <div className="p-8 bg-[#111114] border border-white/5 rounded-3xl col-span-2 shadow-xl">
                         <div className="flex justify-between items-center mb-8">
                           <h4 className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Rec-Engine Throughput</h4>
                           <div className="flex items-center gap-4 text-[10px] text-gray-700">
                              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> Hits</span>
                              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-700" /> Misses</span>
                           </div>
                         </div>
                         <div className="h-40 flex items-end gap-2 px-2">
                            {[40, 65, 30, 85, 55, 90, 70, 45, 60, 35, 75, 50, 80, 20, 95].map((h, i) => (
                              <motion.div 
                                key={i} 
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                  "flex-1 rounded-t-sm transition-all hover:bg-orange-400",
                                  i % 3 === 0 ? "bg-orange-500/80 shadow-[0_0_10px_rgba(249,115,22,0.2)]" : "bg-gray-800"
                                )} 
                              />
                            ))}
                         </div>
                         <div className="flex justify-between mt-4 text-[10px] text-gray-700 font-mono tracking-widest">
                            <span>SESSION_INIT</span>
                            <span>PEAK_ADAPTIVITY</span>
                            <span>RUNTIME_VECT</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 mb-10">
                      <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
                      <h3 className="text-xs uppercase tracking-[0.5em] font-black text-white">Dynamic Title Output</h3>
                      <div className="h-[1px] flex-1 bg-white/5" />
                   </div>

                   <div className="space-y-6">
                     {messages.filter(m => m.type === 'recommendations').slice(-1).map(m => (
                       m.data.map((rec: MovieRecommendation, i: number) => (
                         <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-8 bg-[#111114] border border-white/5 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center shadow-2xl hover:border-orange-500/30 transition-all hover:translate-y-[-4px] group"
                         >
                            <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:bg-orange-500 group-hover:border-orange-500 transition-all duration-500">
                               <Film className="w-10 h-10 text-orange-500 group-hover:text-white transition-all duration-500" />
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-2">
                               <div className="flex flex-col md:flex-row md:items-center gap-3">
                                  <h4 className="text-2xl font-black uppercase italic text-white tracking-tight">{rec.title}</h4>
                                  <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">{rec.year}</span>
                               </div>
                               <p className="text-sm text-gray-400 font-serif leading-relaxed line-clamp-2 italic opacity-80 group-hover:opacity-100 transition-opacity">"{rec.reason}"</p>
                            </div>
                            <div className="shrink-0 text-center bg-white/2 p-4 rounded-3xl border border-white/5 min-w-[100px]">
                               <div className="text-3xl font-black text-white italic tracking-tighter">{rec.moodMatch}%</div>
                               <div className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Match Index</div>
                            </div>
                         </motion.div>
                       ))
                     ))}
                     {messages.filter(m => m.type === 'recommendations').length === 0 && (
                        <div className="p-12 text-center bg-white/2 border border-white/5 rounded-[3rem] border-dashed">
                           <Search className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                           <p className="text-sm text-gray-600 uppercase tracking-widest">No recommendation batches compiled yet.</p>
                        </div>
                     )}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}

function NavButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group overflow-hidden relative border",
        active 
          ? "bg-white text-black border-white shadow-studio" 
          : "text-white/40 hover:text-white bg-transparent border-transparent"
      )}
    >
      <div className={cn(
        "shrink-0 transition-transform duration-500",
        active ? "scale-110" : "group-hover:scale-110"
      )}>
        {icon}
      </div>
      <span className={cn(
        "hidden md:block text-[10px] font-black uppercase tracking-[0.2em] transition-all",
        active ? "opacity-100" : "opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0"
      )}>
        {label}
      </span>
    </button>
  );
}
