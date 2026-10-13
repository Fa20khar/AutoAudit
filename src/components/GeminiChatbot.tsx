import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  ChevronDown, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  HelpCircle, 
  Car, 
  FileText, 
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Wrench
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
  roleId?: string;
  error?: boolean;
}

export type RoleId = 'advisor' | 'fast-decoder' | 'damage-analyst';

export interface BotRole {
  id: RoleId;
  name: string;
  shortName: string;
  model: string;
  taskType: string;
  color: string;
  badgeBg: string;
  icon: React.ReactNode;
  tagline: string;
  systemSummary: string;
  quickPrompts: string[];
}

export const BOT_ROLES: Record<RoleId, BotRole> = {
  'advisor': {
    id: 'advisor',
    name: 'Vehicle History Advisor',
    shortName: 'Advisor',
    model: 'gemini-3.1-flash-lite',
    taskType: 'General Tasks',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: <Car className="w-4 h-4 text-emerald-400" />,
    tagline: 'General vehicle history, title brands, odometer checks & buyer advisory',
    systemSummary: 'Automotive advisory specialist for used-car buyers and vehicle owners.',
    quickPrompts: [
      'What is the difference between a Salvage and Rebuilt title?',
      'How do I detect an odometer rollback before buying?',
      'Which AutoAudit report package should I choose?',
      'What red flags should I look for in a vehicle maintenance history?'
    ]
  },
  'fast-decoder': {
    id: 'fast-decoder',
    name: 'Quick VIN Decoder',
    shortName: 'Fast VIN',
    model: 'gemini-3.1-flash-lite',
    taskType: 'Fast Tasks',
    color: 'amber',
    badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    tagline: 'High-speed 17-digit VIN breakdown, trim specs & assembly origins',
    systemSummary: 'Ultra-fast engine for instant VIN syntax, check-digits and specs.',
    quickPrompts: [
      'Decode this sample VIN: 1HGCR2F83HA029381',
      'How is the 10th digit of a VIN used to determine model year?',
      'How does the 9th check digit mathematical formula work?',
      'Where can I find the VIN stamp on my car?'
    ]
  },
  'damage-analyst': {
    id: 'damage-analyst',
    name: 'Damage & Forensics Analyst',
    shortName: 'Forensics',
    model: 'gemini-3.1-flash-lite',
    taskType: 'Forensics Tasks',
    color: 'purple',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    icon: <Cpu className="w-4 h-4 text-purple-400" />,
    tagline: 'Deep structural unibody forensics, salvage auction diagnostics & diminished value',
    systemSummary: 'Forensic diagnostics engine for frame deformation, total loss & post-accident value.',
    quickPrompts: [
      'How does structural unibody damage affect used car safety and resale value?',
      'What are the telltale signs of concealed flood damage in vehicle wiring?',
      'How do insurance adjusters calculate diminished value after a collision?',
      'What does "Frame Damage - Altered Rail" indicate on an inspection report?'
    ]
  }
};

const INITIAL_GREETINGS: Record<RoleId, string> = {
  'advisor': "Hello! I am your **AutoAudit Vehicle History & AI Assistant**.\n\nAsk me anything about understanding vehicle history reports, detecting title brands (salvage, flood, lemon), verifying odometer accuracy, decoding VINs, or deciding on the right report tier for a vehicle you're interested in.",
  'fast-decoder': "Ready for high-speed VIN decoding! I am the **Quick VIN Decoder**.\n\nEnter any 17-character VIN or ask about WMI country codes, model year characters, check digits, or assembly plant origins.",
  'damage-analyst': "Welcome to the **Deep Damage & Forensics Lab**.\n\nI specialize in structural frame forensics, collision energy load paths, salvage auction grading (Copart/IAAI), airbag deployment criteria, flood corrosion indicators, and diminished value disputes."
};

export interface GeminiChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onToggle?: () => void;
  onOpenOrder?: (planId?: string) => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onOpen: controlledOnOpen,
  onToggle: controlledOnToggle,
  onOpenOrder,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  // Synchronize internal state whenever controlled isOpen prop changes
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setInternalIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  const handleOpen = () => {
    if (controlledOnOpen) {
      controlledOnOpen();
    } else if (controlledOnToggle) {
      controlledOnToggle();
    }
    setInternalIsOpen(true);
  };

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    }
    setInternalIsOpen(false);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const [activeRole, setActiveRole] = useState<RoleId>('advisor');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Attempt to restore messages from local storage
    try {
      const saved = localStorage.getItem('autoaudit_gemini_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'init-1',
        role: 'model',
        content: INITIAL_GREETINGS['advisor'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.1-flash-lite',
        roleId: 'advisor'
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('autoaudit_gemini_chat_history', JSON.stringify(messages));
    } catch {
      // Ignore quota errors
    }
  }, [messages]);

  // Scroll to bottom whenever messages update or loading state changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleRoleChange = (newRole: RoleId) => {
    setActiveRole(newRole);
    setShowRoleSelector(false);
    // Add a role greeting banner in thread if switching
    const roleConfig = BOT_ROLES[newRole];
    const newGreeting: ChatMessage = {
      id: `switch-${Date.now()}`,
      role: 'model',
      content: `Switched role to **${roleConfig.name}** (${roleConfig.taskType} powered by \`${roleConfig.model}\`).\n\n${INITIAL_GREETINGS[newRole]}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: roleConfig.model,
      roleId: newRole
    };
    setMessages(prev => [...prev, newGreeting]);
  };

  const handleClearHistory = () => {
    const roleConfig = BOT_ROLES[activeRole];
    const fresh: ChatMessage[] = [
      {
        id: `clear-${Date.now()}`,
        role: 'model',
        content: INITIAL_GREETINGS[activeRole],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: roleConfig.model,
        roleId: activeRole
      }
    ];
    setMessages(fresh);
    localStorage.removeItem('autoaudit_gemini_chat_history');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text || isLoading) return;

    setInputText('');

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append user message immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Prepare history for multi-turn Gemini endpoint
      // Filter to relevant previous user & model messages
      const payloadMessages = updatedMessages
        .filter(m => !m.error)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: payloadMessages,
          roleId: activeRole
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || BOT_ROLES[activeRole].model,
        roleId: activeRole
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `**Error generating response:** ${err.message || 'Unable to communicate with the Gemini engine.'}\n\nYou can click **Retry** or switch to another specialized role.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: BOT_ROLES[activeRole].model,
        roleId: activeRole,
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentRoleConfig = BOT_ROLES[activeRole];

  // Helper to render basic markdown syntax smoothly
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Empty line -> break
      if (!line.trim()) {
        return <div key={index} className="h-2" />;
      }

      // Headers ###
      if (line.startsWith('### ')) {
        return (
          <h5 key={index} className="text-sm font-bold text-white mt-2 mb-1">
            {formatInline(line.replace('### ', ''))}
          </h5>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h4 key={index} className="text-sm font-bold text-emerald-400 mt-2 mb-1">
            {formatInline(line.replace('## ', ''))}
          </h4>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h3 key={index} className="text-base font-bold text-white mt-2 mb-1">
            {formatInline(line.replace('# ', ''))}
          </h3>
        );
      }

      // Bullet points (* or -)
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const clean = line.trim().substring(2);
        return (
          <li key={index} className="ml-4 list-disc text-slate-200 text-xs sm:text-sm my-0.5 leading-relaxed">
            {formatInline(clean)}
          </li>
        );
      }

      // Numbered lists (1. 2. etc.)
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        return (
          <div key={index} className="flex items-start gap-2 text-slate-200 text-xs sm:text-sm my-0.5 leading-relaxed">
            <span className="text-emerald-400 font-mono font-bold shrink-0">{numMatch[1]}.</span>
            <span>{formatInline(numMatch[2])}</span>
          </div>
        );
      }

      // Blockquotes (> )
      if (line.trim().startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-2 border-emerald-500/60 pl-2.5 my-1.5 text-xs text-slate-300 italic bg-emerald-950/20 py-1 rounded-r">
            {formatInline(line.trim().substring(2))}
          </blockquote>
        );
      }

      // Regular paragraph
      return (
        <p key={index} className="text-xs sm:text-sm text-slate-200 leading-relaxed my-0.5">
          {formatInline(line)}
        </p>
      );
    });
  };

  // Helper for bold, code tags, italics
  const formatInline = (str: string) => {
    // Split by code `code`
    const parts = str.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      
      // Parse **bold** within non-code parts
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return (
        <React.Fragment key={i}>
          {boldParts.map((bPart, bi) => {
            if (bPart.startsWith('**') && bPart.endsWith('**')) {
              return (
                <strong key={bi} className="font-semibold text-white">
                  {bPart.slice(2, -2)}
                </strong>
              );
            }
            return bPart;
          })}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 left-6 z-40 print:hidden font-sans">
          <button
            type="button"
            onClick={handleOpen}
            className="group relative flex items-center gap-2.5 px-4 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-xl hover:shadow-2xl hover:shadow-emerald-900/30 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
            aria-label="Ask AutoAudit AI Assistant"
            title="Open Gemini AI Automotive Assistant"
          >
            {/* Sparkle icon with subtle glow */}
            <div className="relative">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <Bot className="w-4 h-4 text-white absolute -top-1 -right-2 opacity-80" />
            </div>

            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-wide">AutoAudit AI</span>
                <span className="px-1 py-0.2 text-[9px] font-mono bg-white/20 rounded font-bold uppercase tracking-wider">
                  Gemini
                </span>
              </div>
              <p className="text-[10px] text-slate-200">VIN & History Expert</p>
            </div>

            <span className="sm:hidden text-xs font-bold">Ask AI</span>

            {/* Glowing online beacon */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900" />
            </span>
          </button>
        </div>
      )}

      {/* Main Chat Window */}
      {isOpen && (
        <div 
          className={`fixed z-50 print:hidden font-sans transition-all duration-300 ${
            isExpanded
              ? 'inset-3 sm:inset-6 flex flex-col'
              : 'bottom-4 left-4 right-4 sm:right-auto sm:left-6 sm:bottom-6 sm:w-[480px] h-[640px] max-h-[90vh] flex flex-col'
          }`}
          role="dialog"
          aria-label="AutoAudit Gemini AI Chatbot"
        >
          <div className="flex flex-col h-full bg-[#07111F] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
            
            {/* Window Header */}
            <div className="bg-[#0B1728] border-b border-slate-800 p-3 sm:p-4 text-white shrink-0">
              <div className="flex items-center justify-between gap-2">
                
                {/* Bot Profile & Role Indicator */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md border border-white/20">
                    <Sparkles className="w-5 h-5 text-amber-200" />
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0B1728]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">AutoAudit AI</h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${currentRoleConfig.badgeBg}`}>
                        {currentRoleConfig.model}
                      </span>
                    </div>

                    {/* Role dropdown trigger */}
                    <button
                      type="button"
                      onClick={() => setShowRoleSelector(!showRoleSelector)}
                      className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer group mt-0.5 truncate"
                      title="Switch AI Role & Model"
                    >
                      <span className="font-semibold text-emerald-400 group-hover:underline truncate">
                        {currentRoleConfig.name}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showRoleSelector ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Window Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Reset conversation"
                    aria-label="Clear chat history"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="hidden sm:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title={isExpanded ? 'Restore window size' : 'Maximize window'}
                    aria-label={isExpanded ? 'Restore' : 'Maximize'}
                  >
                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Close chat window"
                    aria-label="Close chat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Role Selection Drawer / Tabs */}
              {showRoleSelector && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                    <span>SELECT CHATBOT ROLE & MODEL</span>
                    <span className="text-[10px] text-emerald-400">Multi-Turn Engine</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {(Object.values(BOT_ROLES) as BotRole[]).map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleChange(role.id)}
                        className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          activeRole === role.id
                            ? 'bg-slate-800/90 border-emerald-500/60 shadow-xs'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 shrink-0 mt-0.5">
                          {role.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white truncate">{role.name}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${role.badgeBg}`}>
                              {role.model}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {role.tagline}
                          </p>
                        </div>
                        {activeRole === role.id && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 self-center" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Role Quick Description Pill */}
              {!showRoleSelector && (
                <div className="mt-2.5 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{currentRoleConfig.tagline}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {currentRoleConfig.taskType}
                  </span>
                </div>
              )}
            </div>

            {/* Scrollable Message Thread */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-gradient-to-b from-[#07111F] via-[#091526] to-[#07111F]">
              {messages.map((message) => {
                const isUser = message.role === 'user';

                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bot Avatar */}
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`relative group max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-md transition-all ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : message.error
                          ? 'bg-red-950/40 border border-red-700/60 text-red-200 rounded-tl-xs'
                          : 'bg-[#0E1C33] border border-slate-800 text-slate-200 rounded-tl-xs'
                      }`}
                    >
                      {/* Message Content */}
                      <div className="space-y-1">
                        {isUser ? (
                          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        ) : (
                          renderMarkdown(message.content)
                        )}
                      </div>

                      {/* Footer: Timestamp, Model, Actions */}
                      <div className={`mt-2 pt-1 flex items-center gap-2 text-[10px] border-t ${
                        isUser ? 'border-blue-500/40 text-blue-200 justify-end' : 'border-slate-800/80 text-slate-400 justify-between'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <span>{message.timestamp}</span>
                          {!isUser && message.modelUsed && (
                            <span className="font-mono text-[9px] text-slate-500 bg-slate-900 px-1 rounded">
                              {message.modelUsed}
                            </span>
                          )}
                        </div>

                        {!isUser && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Copy response"
                              aria-label="Copy response text"
                            >
                              {copiedId === message.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing / Generating Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  </div>
                  <div className="bg-[#0E1C33] border border-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-300 shadow-md space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-semibold">{currentRoleConfig.name} is thinking</span>
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Querying {currentRoleConfig.model}...
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Suggestions Carousel */}
            <div className="px-3.5 py-2 bg-[#091526] border-t border-slate-800/80 overflow-x-auto shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 whitespace-nowrap">
                <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  Suggested:
                </span>
                {currentRoleConfig.quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs truncate max-w-[280px]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Container */}
            <div className="p-3 sm:p-4 bg-[#0B1728] border-t border-slate-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-end gap-2"
              >
                <div className="relative flex-1 bg-slate-900 border border-slate-700 rounded-xl sm:rounded-2xl overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask ${currentRoleConfig.shortName} or enter a 17-digit VIN...`}
                    rows={1}
                    className="w-full bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-none max-h-32 leading-relaxed"
                  />
                  
                  {/* Subtle input helper */}
                  <div className="px-3 pb-1.5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    <span className="font-mono">{inputText.length > 0 ? `${inputText.length} chars` : currentRoleConfig.model}</span>
                  </div>
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-3 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold transition-all transform active:scale-95 cursor-pointer shadow-md disabled:cursor-not-allowed shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Order Report Shortcut if interested */}
              {onOpenOrder && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">Need verified official NMVTIS records?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenOrder();
                      handleClose();
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    <span>Order Official Report</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
