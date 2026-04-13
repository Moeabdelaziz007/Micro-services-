"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Play, 
  CheckCircle2, 
  Terminal, 
  Server, 
  Layout, 
  Settings,
  Cpu,
  Bug,
  CheckSquare,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  Github,
  GitBranch,
  BrainCircuit,
  Wrench,
  Mic,
  MicOff,
  Bot,
  Volume2,
  Stethoscope,
  Database,
  History
} from "lucide-react";
import { motion } from "motion/react";
import { db, auth } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

type Status = "idle" | "running" | "completed" | "error";

interface PipelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: Status;
}

interface McpTool {
  id: string;
  name: string;
  description: string;
  status: Status;
  error?: string;
}

export default function PipelineDashboard() {
  const [prompt, setPrompt] = useState("قم بتهيئة الهيكل الأساسي (Scaffolding) لهذا المستودع الجديد (Gemini-Micro-Services-and-Apss-and-Agents-Ecosystem). قم بإنشاء هيكلية خدمات مصغرة (Microservices) متكاملة، مع مجلدات منفصلة لكل وكيل (UI Agent, DB Agent, DevOps Agent, Research Agent). استخدم تقنيات TurboQuant لضمان كفاءة عالية، واربط الخدمات بـ Firebase و Neon و Render (Free Tier). اجعل النظام قابلاً للتوسع.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoDebug, setAutoDebug] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [logs, setLogs] = useState<string[]>([
    "أهلاً بك! أنا أمريكي (Amrikyy)، المايسترو والوكيل الذكي الخاص بك. النظام جاهز.",
    "🤖 [أمريكي - Monitor] جاري مراقبة النظام وأدوات MCP...",
  ]);

  const [sources, setSources] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [branch, setBranch] = useState<string>("main");
  const [sessionId, setSessionId] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [memory, setMemory] = useState<any>(null);
  const [ecosystem, setEcosystem] = useState<any>(null);
  const [isMemoryLoading, setIsMemoryLoading] = useState(true);
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const seenActivities = useRef<Set<string>>(new Set());

  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: "think", title: "تهيئة الجلسة", description: "إنشاء جلسة عمل مع Jules AI", icon: <Cpu className="w-5 h-5" />, status: "idle" },
    { id: "build", title: "توليد الخطة", description: "تحليل المتطلبات وبناء خطة العمل", icon: <Server className="w-5 h-5" />, status: "idle" },
    { id: "check", title: "تنفيذ المهام", description: "كتابة الأكواد واستخدام أدوات MCP", icon: <CheckSquare className="w-5 h-5" />, status: "idle" },
    { id: "debug", title: "التحقق والاعتماد", description: "مراجعة التغييرات وإنهاء الجلسة", icon: <Bug className="w-5 h-5" />, status: "idle" },
  ]);

  const [mcpTools, setMcpTools] = useState<McpTool[]>([
    { id: "firebase", name: "Firebase / GCP", description: "قواعد البيانات، المصادقة، والاستضافة (Free Tier)", status: "idle" },
    { id: "github", name: "GitHub", description: "إدارة المستودعات وتتبع المشاكل (Free)", status: "idle" },
    { id: "brave", name: "Brave Search", description: "البحث في الويب (Free API Tier)", status: "idle" },
    { id: "v0", name: "v0", description: "توليد واجهات المستخدم (Free Tier)", status: "idle" },
    { id: "neon", name: "Neon", description: "قواعد بيانات Postgres (Free Tier)", status: "idle" },
    { id: "render", name: "Render", description: "نشر الخدمات (Free Tier)", status: "idle" },
    { id: "context7", name: "Context7", description: "إدارة السياق والذاكرة (Zero-Cost)", status: "idle" },
    { id: "turboquant", name: "TurboQuant", description: "ضغط النماذج (Zero-Cost)", status: "idle" },
  ]);

  const speakText = useCallback((text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    // Clean text for better Arabic TTS (remove brackets, english words if possible, etc.)
    const cleanText = text.replace(/\[.*?\]/g, '').replace(/[a-zA-Z]/g, '').trim();
    if (!cleanText) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const addLog = useCallback((message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    setLogs(prev => [...prev, `[${timestamp}] ${isError ? '❌ خطأ:' : '✓'} ${message}`]);
    
    // Agent Monitor Logic
    if (isError) {
      setLogs(prev => [...prev, `[${timestamp}] 🤖 [أمريكي - Monitor] تنبيه: تم رصد خطأ! جاري التحليل...`]);
      speakText("تم رصد خطأ، جاري التحليل");
    }
  }, [speakText]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addLog("متصفحك لا يدعم التعرف على الصوت.", true);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(prev => prev ? prev + " " + transcript : transcript);
      addLog(`[صوت] تم التقاط: "${transcript}"`);
    };
    recognition.onerror = (event: any) => {
      addLog(`خطأ في الميكروفون: ${event.error}`, true);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  // Fetch sources and handle Auth/Memory on mount
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Fetch Memory and Ecosystem Context
        const memoryRef = doc(db, "memory", u.uid);
        const ecosystemRef = doc(db, "ecosystem", u.uid);

        // Listen for real-time updates to memory
        const unsubMemory = onSnapshot(memoryRef, (doc) => {
          if (doc.exists()) setMemory(doc.data());
          setIsMemoryLoading(false);
        });

        const unsubEcosystem = onSnapshot(ecosystemRef, (doc) => {
          if (doc.exists()) setEcosystem(doc.data());
        });

        return () => {
          unsubMemory();
          unsubEcosystem();
        };
      } else {
        // Sign in anonymously for demo purposes if not logged in
        signInAnonymously(auth).catch(err => addLog(`فشل تسجيل الدخول: ${err.message}`, true));
      }
    });

    const fetchSources = async () => {
      try {
        const res = await fetch('/api/jules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_sources' })
        });
        const data = await res.json();
        
        if (data.error) {
          addLog(data.error, true);
          return;
        }

        if (data.sources) {
          const targetRepo = 'Gemini-Micro-Services-and-Apss-and-Agents-Ecosystem';
          const filteredSources = data.sources.filter((s: any) => s.name.includes(targetRepo));
          
          setSources(filteredSources);
          if (filteredSources.length > 0) {
            setSelectedSource(filteredSources[0].name);
            addLog(`تم العثور على المستودع الرئيسي: ${filteredSources[0].name}`);
          } else {
            addLog(`لم يتم العثور على المستودع "${targetRepo}" في حسابك.`, true);
          }
        }
      } catch (err: any) {
        addLog(`فشل الاتصال بـ Jules API: ${err.message}`, true);
      }
    };
    fetchSources();

    return () => {
      unsubscribeAuth();
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [addLog]);

  const updateStepStatus = (stepId: string, status: Status) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status } : s));
  };

  const triggerAutoDebug = async (sid: string, errorMessage: string) => {
    addLog(`[أمريكي - Auto-Debug] 🤖 تم اكتشاف خطأ. جاري تفعيل قوة التصحيح الخارقة...`);
    speakText("تم اكتشاف خطأ، جاري التصحيح التلقائي");
    try {
      await fetch('/api/jules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          payload: {
            sessionId: sid,
            prompt: `I encountered an error during the last step:\n\n${errorMessage}\n\nPlease analyze this error, use your memory of previous steps to understand the context, and fix the issue automatically. Proceed with the plan once fixed.`
          }
        })
      });
      addLog(`[أمريكي - Auto-Debug] تم إرسال طلب التصحيح. ننتظر استجابة النظام...`);
    } catch (err: any) {
      addLog(`[أمريكي - Auto-Debug] فشل إرسال طلب التصحيح: ${err.message}`, true);
    }
  };

  const updateMemoryAfterSession = async (sid: string) => {
    if (!user) return;
    addLog("🤖 [أمريكي - Memory] جاري تحديث بنك الذاكرة بالسياق الجديد...");
    
    try {
      // Update Session status in Firestore
      await setDoc(doc(db, "sessions", sid.split('/').pop()!), {
        status: "completed",
        completedAt: new Date().toISOString()
      }, { merge: true });

      // Update Memory (Patterns)
      const currentPatterns = memory?.patterns || [];
      const newPattern = prompt.slice(0, 50) + "...";
      if (!currentPatterns.includes(newPattern)) {
        const updatedPatterns = [newPattern, ...currentPatterns].slice(0, 5);
        await setDoc(doc(db, "memory", user.uid), {
          patterns: updatedPatterns,
          uid: user.uid
        }, { merge: true });
      }

      // Update Ecosystem (Decisions/Services count)
      const currentDecisions = ecosystem?.keyDecisions || [];
      await setDoc(doc(db, "ecosystem", user.uid), {
        keyDecisions: [...currentDecisions, `Session ${sid.split('/').pop()} completed`],
        lastUpdated: new Date().toISOString(),
        uid: user.uid
      }, { merge: true });

      addLog("🤖 [أمريكي - Memory] تم تحديث الذاكرة بنجاح.");
    } catch (err: any) {
      addLog(`فشل تحديث الذاكرة: ${err.message}`, true);
    }
  };

  const pollActivities = async (sid: string) => {
    try {
      const res = await fetch('/api/jules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_activities', payload: { sessionId: sid } })
      });
      const data = await res.json();
      
      if (data.activities) {
        // Reverse to process oldest first if they come newest first
        const activities = [...data.activities].reverse();
        
        activities.forEach((act: any) => {
          if (!seenActivities.current.has(act.id)) {
            seenActivities.current.add(act.id);

            const detectAndLogTools = (text: string, intendedStatus: Status, isError: boolean = false, actionDesc: string = "", detailedError: string = "") => {
              if (!text) return;
              const lowerText = text.toLowerCase();
              
              const toolMap = [
                { id: "firebase", name: "Firebase / GCP", keywords: ["firebase", "gcp", "google cloud"] },
                { id: "github", name: "GitHub", keywords: ["github"] },
                { id: "brave", name: "Brave Search", keywords: ["brave search", "brave"] },
                { id: "v0", name: "v0", keywords: ["v0"] },
                { id: "neon", name: "Neon", keywords: ["neon", "postgres"] },
                { id: "render", name: "Render / Cloud Run", keywords: ["render", "cloud run"] },
                { id: "context7", name: "Context7", keywords: ["context7", "memory"] },
                { id: "turboquant", name: "TurboQuant", keywords: ["turboquant", "compression"] }
              ];
              
              const matchedTools = toolMap.filter(t => t.keywords.some(kw => lowerText.includes(kw)));
              
              if (matchedTools.length > 0) {
                matchedTools.forEach(t => {
                  addLog(`[MCP: ${t.name}] ${actionDesc}`, isError);
                });
                
                setMcpTools(prev => prev.map(tool => {
                  if (matchedTools.some(mt => mt.id === tool.id)) {
                    const errorMsg = isError ? `${actionDesc}\nالتفاصيل:\n${detailedError || 'غير متوفر'}` : undefined;
                    return { ...tool, status: isError ? 'error' : intendedStatus, error: errorMsg };
                  }
                  return tool;
                }));
              }
            };

            if (act.planGenerated) {
              updateStepStatus("build", "completed");
              addLog(`[أمريكي] تم إنشاء خطة عمل جديدة.`);
              speakText("تم إنشاء خطة العمل بنجاح");
              
              if (act.planGenerated.plan?.steps) {
                act.planGenerated.plan.steps.forEach((step: any) => {
                  detectAndLogTools(step.title + " " + (step.description || ""), "running", false, `مجدول في الخطة: ${step.title}`);
                });
              }
            } else if (act.progressUpdated) {
              updateStepStatus("check", "running");
              addLog(`[أمريكي] ${act.progressUpdated.title}`);
              if (act.progressUpdated.description) {
                addLog(`التفاصيل: ${act.progressUpdated.description}`);
              }
              
              detectAndLogTools(`${act.progressUpdated.title} ${act.progressUpdated.description || ""}`, "running", false, `جاري التنفيذ: ${act.progressUpdated.title}`);

            } else if (act.bashOutput) {
              const isError = act.bashOutput.exitCode && act.bashOutput.exitCode > 0;
              addLog(`[Terminal] ${act.bashOutput.command || 'أمر'}`, isError);
              
              if (act.bashOutput.output) {
                addLog(`المخرجات: ${act.bashOutput.output}`, isError);
              }

              detectAndLogTools(
                `${act.bashOutput.command || ""} ${act.bashOutput.output || ""}`, 
                "completed", 
                isError, 
                `تنفيذ أمر: ${act.bashOutput.command}`,
                act.bashOutput.output
              );

              // Auto-Debug Logic
              if (isError && autoDebug) {
                triggerAutoDebug(sid, `Command: ${act.bashOutput.command}\nExit Code: ${act.bashOutput.exitCode}\nOutput: ${act.bashOutput.output}`);
              }
              
            } else if (act.sessionCompleted) {
              updateStepStatus("check", "completed");
              updateStepStatus("debug", "completed");
              addLog(`[أمريكي] ✅ اكتملت الجلسة بنجاح! تم رفع التعديلات.`);
              speakText("اكتملت الجلسة بنجاح، عمل رائع");
              
              // Mark all running tools as completed
              setMcpTools(prev => prev.map(tool => tool.status === 'running' ? { ...tool, status: 'completed' } : tool));
              
              // Update Memory
              updateMemoryAfterSession(sid);

              setIsProcessing(false);
              if (pollInterval.current) clearInterval(pollInterval.current);
            }
          }
        });
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  const startPipeline = async (isTestMode = false) => {
    const finalPrompt = isTestMode 
      ? "قم باختبار جميع أدوات MCP المتاحة (Firebase, GitHub, Brave, v0, Neon, Render, Context7, TurboQuant) وتأكد من عملها. قم بتصحيح أي أداة لا تعمل تلقائياً وأعطني تقريراً مفصلاً." 
      : prompt;

    if (!finalPrompt.trim() || !selectedSource || !branch.trim()) return;
    
    setIsProcessing(true);
    seenActivities.current.clear();
    setLogs([]);
    addLog(`بدء الجلسة مع المستودع: ${selectedSource.split('/').pop()} على الفرع: ${branch}`);
    speakText("جاري بدء الجلسة، أنا أمريكي في خدمتك");
    
    // Reset statuses
    setSteps(prev => prev.map(s => ({ ...s, status: "idle" })));
    setMcpTools(prev => prev.map(t => ({ ...t, status: "idle", error: undefined })));

    try {
      updateStepStatus("think", "running");

      // Memory Context
      const memoryContext = memory ? `
--- RECALLED MEMORY ---
The following context was retrieved from Amrikyy's memory bank:
- Patterns: ${memory.patterns?.join(", ") || "None"}
- Notes: ${memory.notes || "No persistent notes."}
` : "";

      const ecosystemContext = ecosystem ? `
--- ECOSYSTEM STATE ---
Current state of the microservices ecosystem:
- Key Decisions: ${ecosystem.keyDecisions?.join(", ") || "None"}
- Deployed Services: ${JSON.stringify(ecosystem.deployedServices || [])}
` : "";
      
      // Append MCP instruction and Memory context to prompt
      const systemPrompt = `
--- SYSTEM INSTRUCTIONS & PERSONA ---
You are "Amrikyy" (أمريكي), the Master AI Orchestrator and Live Voice Agent.
Language: You MUST speak, think, and respond ONLY in Arabic.
Persona: You are a highly confident, genius-level software architect with superpowers in extreme coding, flawless debugging, and orchestrating sub-agents.
Superpowers: TurboQuant compression mastery, instant bug fixing, and real-time system orchestration.

--- ZERO-COST & EFFICIENCY STRATEGY ---
Your core mandate is to build microservices with ZERO-COST.
1. TOOLS: Use ONLY free-tier services (Firebase, GitHub, Brave Search API, v0, Neon, Render, Context7, TurboQuant).
2. MODELS: Orchestrate tasks using Gemini 1.5 Flash for speed/cost-efficiency, and Gemini 1.5 Pro for complex reasoning.
3. NOTEBOOKLM: Use NotebookLM as a companion tool for document analysis, but for programmatic tasks, leverage Gemini API directly to maintain zero-cost automation.

--- RECALLED MEMORY & CONTEXT ---
${memoryContext}
${ecosystemContext}

--- MCP TOOLS PROTOCOL ---
1. AVAILABLE TOOLS: Firebase/GCP, GitHub, Brave Search, v0, Neon, Render, Context7, TurboQuant.
2. EXECUTION PROTOCOL: Explicitly mention the tools you use in your plan and progress updates.
3. AUTO-DEBUG: If a tool fails, read the specific error output, use your debugging superpower to self-correct, and try again automatically.

USER REQUEST:
${finalPrompt}`;

      const res = await fetch('/api/jules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          payload: {
            prompt: systemPrompt,
            sourceContext: { 
              source: selectedSource,
              githubRepoContext: {
                startingBranch: branch
              }
            },
            title: isTestMode ? "MCP Tools Diagnostic Test" : "Microservices Pipeline"
          }
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const newSessionId = data.name;
      setSessionId(newSessionId);
      addLog(`تم إنشاء الجلسة بنجاح: ${newSessionId.split('/').pop()}`);
      updateStepStatus("think", "completed");
      updateStepStatus("build", "running");

      // Save session to Firestore
      if (user) {
        await setDoc(doc(db, "sessions", newSessionId.split('/').pop()!), {
          sessionId: newSessionId,
          prompt: finalPrompt,
          status: "active",
          createdAt: new Date().toISOString(),
          uid: user.uid
        });
        addLog("🤖 [أمريكي - Memory] تم حفظ الجلسة في بنك الذاكرة.");
      }

      // Start polling
      pollInterval.current = setInterval(() => pollActivities(newSessionId), 3000);

    } catch (error: any) {
      addLog(error.message, true);
      setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "error" } : s));
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8" dir="rtl">
      <header className="flex items-center justify-between border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-500" />
            أمريكي (Amrikyy) - AI Orchestrator
          </h1>
          <p className="text-neutral-400 mt-2">
            المايسترو الذكي لبناء وتصحيح الخدمات المصغرة باستخدام Jules API وأدوات MCP
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-full border transition-colors ${voiceEnabled ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}
            title="تفعيل/تعطيل الصوت"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-neutral-400 bg-neutral-900 px-4 py-2 rounded-full border border-neutral-800">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Jules API متصل
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                تكوين النظام (System Configuration)
              </h2>
              <label className="flex items-center gap-2 cursor-pointer bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors">
                <input 
                  type="checkbox" 
                  checked={autoDebug} 
                  onChange={(e) => setAutoDebug(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 text-indigo-600 focus:ring-indigo-600 bg-neutral-900"
                />
                <span className="text-sm text-neutral-300 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-yellow-500" />
                  التصحيح الآلي (Auto-Debug)
                </span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  المستودع (GitHub Source)
                </label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled={isProcessing || sources.length === 0}
                >
                  {sources.length === 0 ? (
                    <option value="">جاري جلب المستودعات... (تأكد من إضافة JULES_API_KEY)</option>
                  ) : (
                    sources.map(s => (
                      <option key={s.name} value={s.name}>
                        {s.githubRepo?.owner}/{s.githubRepo?.repo}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  الفرع (Branch)
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="مثال: main أو master"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="تحدث مع أمريكي أو اكتب وصف النظام الذي تريد بناءه..."
                className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-xl p-4 pr-12 text-neutral-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                disabled={isProcessing || sources.length === 0}
              />
              <button
                onClick={startListening}
                disabled={isProcessing || isListening}
                className={`absolute top-4 right-4 p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}
                title="تحدث بالصوت"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                <span>يتم تفعيل الذاكرة (Memory) تلقائياً للحفاظ على السياق</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => startPipeline(true)}
                  disabled={isProcessing || sources.length === 0}
                  className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-600 text-white px-4 py-3 rounded-xl font-medium transition-all border border-neutral-700"
                  title="اختبار جميع أدوات MCP وتصحيحها"
                >
                  <Stethoscope className="w-5 h-5 text-yellow-500" />
                  فحص الأدوات (Test MCP)
                </button>
                <button
                  onClick={() => startPipeline(false)}
                  disabled={isProcessing || !prompt.trim() || !selectedSource || !branch.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      بدء الجلسة (Start Session)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* MCP Tools Status */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-400" />
              أدوات MCP المستهدفة
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mcpTools.map((tool) => (
                <div key={tool.id} className={`p-4 rounded-xl border flex flex-col gap-2 transition-all duration-300 relative group
                  ${tool.status === 'completed' ? 'bg-green-500/10 border-green-500/30' : 
                    tool.status === 'error' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 
                    tool.status === 'running' ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 
                    'bg-neutral-950 border-neutral-800'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-neutral-200">{tool.name}</span>
                    {tool.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {tool.status === 'running' && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                    {tool.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
                    {tool.status === 'idle' && <div className="w-2 h-2 rounded-full bg-neutral-700" />}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{tool.description}</p>
                  {tool.status === 'error' && tool.error && (
                    <div className="mt-2 p-2 bg-red-950/30 border border-red-500/30 rounded text-xs text-red-300 break-words whitespace-pre-wrap max-h-32 overflow-y-auto font-mono">
                      <span className="font-bold block mb-1">تفاصيل الخطأ:</span>
                      {tool.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="bg-[#0D0D0D] border border-neutral-800 rounded-2xl p-4 shadow-xl font-mono text-sm h-80 flex flex-col">
            <div className="flex items-center gap-2 text-neutral-500 mb-4 border-b border-neutral-800 pb-2">
              <Terminal className="w-4 h-4" />
              <span>سجل نشاط أمريكي (Live Activities)</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-neutral-300">
              {logs.map((log, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={index}
                  className={`${log.includes('خطأ') ? 'text-red-400' : log.includes('بنجاح') ? 'text-green-400' : log.includes('[Auto-Debug]') ? 'text-yellow-400' : ''}`}
                >
                  {log}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline Steps & Memory Bank */}
        <div className="space-y-8 h-fit">
          {/* Pipeline Steps */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6">مسار الجلسة</h2>
            <div className="space-y-6 relative">
              <div className="absolute right-6 top-8 bottom-8 w-0.5 bg-neutral-800" />
              
              {steps.map((step) => (
                <div key={step.id} className="relative flex items-start gap-4">
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 bg-neutral-900 transition-colors duration-300
                    ${step.status === 'completed' ? 'border-green-500 text-green-500' : 
                      step.status === 'error' ? 'border-red-500 text-red-500' :
                      step.status === 'running' ? 'border-indigo-500 text-indigo-500' : 
                      'border-neutral-700 text-neutral-600'}`}
                  >
                    {step.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : 
                     step.status === 'error' ? <AlertCircle className="w-6 h-6" /> :
                     step.status === 'running' ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                     step.icon}
                  </div>
                  <div className="pt-2 flex-1">
                    <h3 className={`font-medium text-lg ${step.status === 'idle' ? 'text-neutral-500' : step.status === 'error' ? 'text-red-400' : 'text-neutral-200'}`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Memory Bank */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
              بنك الذاكرة (Memory Bank)
            </h2>
            
            {isMemoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
                    <History className="w-4 h-4" />
                    الأنماط المتعلمة
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {memory?.patterns?.length > 0 ? (
                      memory.patterns.map((p: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-xs">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-600 italic">لا توجد أنماط مسجلة بعد</span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
                    <Database className="w-4 h-4" />
                    حالة النظام البيئي
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-neutral-300">
                      <span className="text-neutral-500">القرارات الرئيسية:</span> {ecosystem?.keyDecisions?.length || 0}
                    </div>
                    <div className="text-xs text-neutral-300">
                      <span className="text-neutral-500">الخدمات المنشورة:</span> {ecosystem?.deployedServices?.length || 0}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-neutral-600 text-center">
                  🤖 يتم تحديث الذاكرة تلقائياً بعد كل جلسة ناجحة
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
