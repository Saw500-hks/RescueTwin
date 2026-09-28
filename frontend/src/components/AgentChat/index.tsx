/**
 * AgentChat Component — AI Rescue Commander Chat Interface
 *
 * Provides a conversational interface to the RescueTwin AI agent.
 * Uses the real /api/v1/ai/explain and /api/v1/agent/* endpoints.
 *
 * Data integrity rules:
 * - Every AI response is labeled with its data status
 * - Never presents output as final command — always "DECISION SUPPORT"
 * - Missing evidence is stated explicitly, not fabricated
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Loader2, ShieldAlert, Bot, User, AlertTriangle,
  CheckCircle2, Sparkles, Info, Cpu
} from 'lucide-react';
import clsx from 'clsx';
import { aiExplain, aiPrioritize, aiAnalyze, queryInspectionPriorities } from '../../api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  dataStatus?: string;
  timestamp: string;
  isError?: boolean;
  metadata?: Record<string, any>;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Welcome to RescueTwin AI Commander. I provide decision support for disaster response operations.

I can help with:
• **Which buildings should be inspected first?**
• **Explain why a building is high priority**
• **Analyze available disaster intelligence**
• **Generate inspection priorities based on evidence**

⚠ All outputs are DECISION SUPPORT. Verify with qualified field teams before taking operational action. I will never fabricate damage assessments or evidence.`,
  dataStatus: 'SYSTEM',
  timestamp: new Date().toISOString(),
};

const QUICK_PROMPTS = [
  { label: 'Inspection Priorities', prompt: 'Which buildings should we inspect first?' },
  { label: 'Bihar Flood Analysis', prompt: 'Analyze the Bihar Patna flood situation' },
  { label: 'Mission Plan', prompt: 'Generate a mission plan for the active disaster event' },
  { label: 'Evidence Status', prompt: 'What evidence is available for the current scenario?' },
];

const DataStatusPill = ({ status }: { status?: string }) => {
  if (!status) return null;
  const config: Record<string, string> = {
    'MODEL OUTPUT': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    'DEMO DATA': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    'UNAVAILABLE': 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    'VERIFIED DATA': 'bg-green-500/15 text-green-400 border-green-500/30',
    'RULE-BASED': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'SYSTEM': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'ERROR': 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  const cls = config[status] || config['UNAVAILABLE'];
  return (
    <span className={clsx('inline-flex items-center text-[8.5px] font-bold px-1.5 py-0.5 rounded border tracking-wider', cls)}>
      {status}
    </span>
  );
};

const AgentChat: React.FC<{
  eventId?: string;
  scenarioId?: string;
  buildingId?: string;
  className?: string;
}> = ({
  eventId,
  scenarioId = 'scenario_earthquake_74',
  buildingId,
  className,
}) => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;
    setInput('');

    addMessage({ role: 'user', content: text });
    setLoading(true);

    try {
      let response: any;
      const lower = text.toLowerCase();

      // Route to appropriate API endpoint
      if (lower.includes('priorit') || lower.includes('first') || lower.includes('inspect')) {
        // Prioritization query
        if (lower.includes('bihar') || lower.includes('flood') || lower.includes('patna')) {
          response = await aiPrioritize({
            event_id: 'EVT-BIHAR-FLOOD-2024',
          });
          const priorities = response.priorities || [];
          const content = priorities.length > 0
            ? `**Inspection Priorities** (${response.data_status})\n\n${
                priorities.map((p: any, i: number) =>
                  `${i + 1}. **${p.name || p.building_id}**\n   Priority: ${p.inspection_priority}\n   Reason: ${p.reason}`
                ).join('\n\n')
              }\n\n${response.disclaimer}`
            : `**Evidence Unavailable**\n\n${response.unavailable_note || 'No building data available for prioritization.'}\n\n${response.disclaimer}`;

          addMessage({
            role: 'assistant',
            content,
            dataStatus: response.data_status,
            metadata: response,
          });
        } else {
          // General scenario prioritization
          response = await queryInspectionPriorities(text, scenarioId);
          addMessage({
            role: 'assistant',
            content: response.response || response.answer || JSON.stringify(response, null, 2),
            dataStatus: 'MODEL OUTPUT',
            metadata: response,
          });
        }
      } else if (lower.includes('analyze') || lower.includes('analysis') || lower.includes('situation') || lower.includes('bihar')) {
        // Analysis query
        const evt = lower.includes('bihar') || lower.includes('flood') || lower.includes('patna')
          ? 'EVT-BIHAR-FLOOD-2024' : eventId;
        response = await aiAnalyze({ event_id: evt, scenario_id: scenarioId, context: text });
        const analysis = response.analysis;
        const content = analysis?.note
          ? `**Disaster Intelligence Analysis** (${response.data_status})\n\n${analysis.note}${
              analysis.damage_summary
                ? `\n\nDamage Summary:\n${Object.entries(analysis.damage_summary).map(([k, v]) => `• ${k}: ${v} buildings`).join('\n')}`
                : ''
            }\n\n${response.disclaimer}`
          : `**Analysis** (${response.data_status})\n\n${JSON.stringify(analysis, null, 2)}`;
        addMessage({
          role: 'assistant',
          content,
          dataStatus: response.data_status,
          metadata: response,
        });
      } else if (lower.includes('explain') || lower.includes('why') || (lower.includes('building') && buildingId)) {
        // Explain query
        response = await aiExplain({
          building_id: buildingId,
          event_id: eventId,
          scenario_id: scenarioId,
          question: text,
        });
        addMessage({
          role: 'assistant',
          content: `**AI Explanation** (${response.data_status})\n\n${response.explanation}\n\n${response.disclaimer}`,
          dataStatus: response.data_status,
          metadata: response,
        });
      } else if (lower.includes('mission') || lower.includes('plan') || lower.includes('rescue')) {
        // Mission planning — use existing agent endpoint
        response = await queryInspectionPriorities(text, scenarioId);
        addMessage({
          role: 'assistant',
          content: response.response || response.answer || `Mission planning requires active scenario data.\n\nCurrent scenario: ${scenarioId}\nNote: Full mission planning is available in the AI Commander page.`,
          dataStatus: 'MODEL OUTPUT',
          metadata: response,
        });
      } else {
        // General AI explain
        response = await aiExplain({
          building_id: buildingId,
          event_id: eventId,
          scenario_id: scenarioId,
          question: text,
        });
        addMessage({
          role: 'assistant',
          content: `${response.explanation}\n\n${response.disclaimer}`,
          dataStatus: response.data_status || 'UNAVAILABLE',
          metadata: response,
        });
      }
    } catch (err: any) {
      addMessage({
        role: 'assistant',
        content: `Unable to process request. API error: ${err?.message || 'Unknown error'}.\n\nPlease check that the backend server is running at localhost:8000.`,
        dataStatus: 'ERROR',
        isError: true,
      });
    }

    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2.5 flex-shrink-0">
        <div className="w-6 h-6 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <Cpu className="w-3.5 h-3.5 text-green-400" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-200">RescueTwin AI Commander</div>
          <div className="text-[9px] text-slate-500">Decision support · Powered by Nemotron</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] text-green-400 font-medium">Online</span>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="px-3 py-2 border-b border-white/[0.04] flex gap-1.5 overflow-x-auto flex-shrink-0">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => handleSend(qp.prompt)}
            disabled={loading}
            className="whitespace-nowrap text-[9px] font-semibold px-2 py-1 rounded-lg bg-black/30 border border-white/[0.08] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-all disabled:opacity-40 flex-shrink-0"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={clsx('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            {/* Avatar */}
            <div className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              msg.role === 'user'
                ? 'bg-blue-500/20 border border-blue-500/30'
                : msg.isError
                ? 'bg-red-500/20 border border-red-500/30'
                : 'bg-cyan-500/20 border border-cyan-500/30'
            )}>
              {msg.role === 'user'
                ? <User className="w-3 h-3 text-blue-400" />
                : msg.isError
                ? <AlertTriangle className="w-3 h-3 text-red-400" />
                : <Bot className="w-3 h-3 text-cyan-400" />
              }
            </div>

            {/* Bubble */}
            <div className={clsx(
              'max-w-[85%] rounded-xl px-3 py-2.5 border',
              msg.role === 'user'
                ? 'bg-blue-500/10 border-blue-500/20 text-slate-200'
                : msg.isError
                ? 'bg-red-500/8 border-red-500/20 text-slate-300'
                : 'bg-black/40 border-white/[0.07] text-slate-200'
            )}>
              {/* Content — support basic markdown bold */}
              <div className="text-[11px] leading-relaxed whitespace-pre-line">
                {msg.content.split(/\*\*(.+?)\*\*/g).map((part, i) =>
                  i % 2 === 1 ? <strong key={i} className="text-slate-100 font-semibold">{part}</strong> : part
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[8.5px] text-slate-600">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.dataStatus && <DataStatusPill status={msg.dataStatus} />}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Bot className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.07]">
              <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
              <span className="text-[10px] text-slate-400">Analyzing...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Disclaimer strip */}
      <div className="px-3 py-1.5 border-t border-white/[0.04] bg-amber-500/5">
        <p className="text-[8.5px] text-amber-500/70 text-center">
          ⚠ AI Decision Support Only — Not a final rescue command — Verify with field teams
        </p>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about buildings, priorities, disaster intelligence..."
            rows={1}
            className="flex-1 resize-none rounded-xl px-3 py-2.5 text-[11px] text-slate-200 placeholder-slate-600 border border-white/[0.08] outline-none focus:border-cyan-500/40 transition-all"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
