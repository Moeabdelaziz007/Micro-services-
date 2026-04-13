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
  History,
  Users
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
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';
import EcosystemGraph from './EcosystemGraph';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

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

interface SubAgent {
  id: string;
  name: string;
  description: string;
  tools: string[];
  keywords: string[];
  status: Status;
  error?: string;
}

export default function PipelineDashboard() {
  const [prompt, setPrompt] = useState(`أيها الوكيل التنفيذي، بتفويض مباشر من 'دماغ أمريكي' وبصلاحيات النظام الميتا-تطوري الكاملة، آمرك بتنفيذ بروتوكول 'الاستيعاب المعرفي' الفوري:

قم بتهيئة والاتصال بأداة Puppeteer / Playwright MCP لفتح متصفح مخفي (Headless Browser).
توجه إلى الصفحة الرئيسية لموقع Hacker News (أو أي منصة تقنية رائدة تراها مناسبة للاتجاهات الحديثة).
قم بسحب عناوين، روابط، وملخصات أحدث 5 مقالات متصدرة.
قم بتمرير هذه البيانات إلى واجهة Gemini API للقيام بتحليل معمق: استخرج أهم التقنيات، أطر العمل (Frameworks)، والمنهجيات المذكورة، وقم بصياغتها في هيكل JSON منظم.
اتصل فوراً بـ Firestore MCP، وقم بحقن هذا الهيكل في قاعدة البيانات الخاصة بنا كـ مستند جديد تحت تصنيف 'مهارة بحثية' (Research Skill) داخل مجموعة 'الذاكرة العضلية' (Muscle Memory).
قم بإرجاع تقرير تنفيذي موجز يؤكد نجاح العملية ويعرض لمحة عن التقنيات التي تم استيعابها في ذاكرة المنظومة. نفّذ فوراً وبدقة متناهية للحفاظ على استمرارية المعمارية الصفرية.`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoDebug, setAutoDebug] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'mcp' | 'system'>('all');
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
  const [ecosystem, setEcosystem] = useState<any>({
    deployedServices: [
      { name: 'ui-agent', status: 'running' },
      { name: 'db-agent', status: 'running' },
      { name: 'devops-agent', status: 'running' },
      { name: 'research-agent', status: 'running' },
      { name: 'meta-agent', status: 'running' },
      { name: 'pulse-monitor', status: 'stopped' },
      { name: 'tool-forge', status: 'stopped' },
      { name: 'zero-cost-enforcer', status: 'stopped' }
    ]
  });
  const [isMemoryLoading, setIsMemoryLoading] = useState(true);
  const [commits, setCommits] = useState<any[]>([]);
  const [isCommitsLoading, setIsCommitsLoading] = useState(false);
  const [commitsError, setCommitsError] = useState<string | null>(null);
  const [brainstorming, setBrainstorming] = useState<string>("");
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const seenActivities = useRef<Set<string>>(new Set());

  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: "think", title: "تهيئة الجلسة", description: "إنشاء جلسة عمل مع Jules AI", icon: <Cpu className="w-5 h-5" />, status: "idle" },
    { id: "build", title: "توليد الخطة", description: "تحليل المتطلبات وبناء خطة العمل", icon: <Server className="w-5 h-5" />, status: "idle" },
    { id: "check", title: "تنفيذ المهام", description: "كتابة الأكواد واستخدام أدوات MCP", icon: <CheckSquare className="w-5 h-5" />, status: "idle" },
    { id: "debug", title: "التحقق والاعتماد", description: "مراجعة التغييرات وإنهاء الجلسة", icon: <Bug className="w-5 h-5" />, status: "idle" },
  ]);

  const [subAgents, setSubAgents] = useState<SubAgent[]>([
    { 
      id: "frontend-agent", 
      name: "UI & Frontend Agent", 
      description: "تصميم واجهات، اختبار E2E، واستضافة", 
      tools: ["v0", "Puppeteer", "Firebase"],
      keywords: ["v0", "puppeteer", "playwright", "headless", "firebase", "ui", "frontend"],
      status: "idle" 
    },
    { 
      id: "data-agent", 
      name: "Data & Memory Agent", 
      description: "إدارة قواعد البيانات والذاكرة العضلية", 
      tools: ["Neon Postgres", "Firestore", "Context7"],
      keywords: ["neon", "postgres", "firestore", "context7", "memory", "database"],
      status: "idle" 
    },
    { 
      id: "devops-agent", 
      name: "DevOps & Infra Agent", 
      description: "إدارة الكود والنشر التلقائي", 
      tools: ["GitHub", "Render", "Cloudflare"],
      keywords: ["github", "git", "render", "cloudflare", "deploy", "devops"],
      status: "idle" 
    },
    { 
      id: "research-agent", 
      name: "Research & AI Agent", 
      description: "بحث وتحليل فائق السرعة", 
      tools: ["Brave Search", "Groq Cloud", "TurboQuant"],
      keywords: ["brave", "search", "groq", "turboquant", "research", "ai"],
      status: "idle" 
    },
    { 
      id: "pulse-monitor", 
      name: "Pulse-Monitor Agent", 
      description: "مراقبة GitHub Trending وتحليل التقنيات الصاعدة", 
      tools: ["GitHub", "Gemini", "Cron"],
      keywords: ["github", "trending", "pulse", "monitor"],
      status: "idle" 
    },
    { 
      id: "tool-forge", 
      name: "Dynamic-Tool Forge", 
      description: "توليد أدوات MCP برمجياً وحقنها في الذاكرة", 
      tools: ["Gemini", "Firestore", "Context7"],
      keywords: ["forge", "dynamic", "tool", "generate"],
      status: "idle" 
    },
    { 
      id: "zero-cost-enforcer", 
      name: "Zero-Cost Enforcer", 
      description: "مراقبة الاستهلاك وضمان تكلفة صفرية", 
      tools: ["GCP Operations", "Render", "Firebase"],
      keywords: ["zero-cost", "enforcer", "gcp", "billing"],
      status: "idle" 
    }
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

    const fetchGithubCommits = async () => {
      if (!selectedSource) return;
      setIsCommitsLoading(true);
      setCommitsError(null);
      try {
        let owner = "";
        let repo = "";
        
        const githubUrlMatch = selectedSource.match(/github\.com\/([^/]+)\/([^/.]+)/);
        const sourceNameMatch = selectedSource.match(/sources\/github\/([^/]+)\/([^/.]+)/);
        const simpleMatch = selectedSource.match(/^([^/]+)\/([^/.]+)$/);

        if (githubUrlMatch) {
          owner = githubUrlMatch[1];
          repo = githubUrlMatch[2];
        } else if (sourceNameMatch) {
          owner = sourceNameMatch[1];
          repo = sourceNameMatch[2];
        } else if (simpleMatch) {
          owner = simpleMatch[1];
          repo = simpleMatch[2];
        }

        if (owner && repo) {
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`);
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const data = await res.json();
          if (Array.isArray(data)) {
            setCommits(data);
          } else {
            throw new Error("Invalid data format received from GitHub");
          }
        } else {
           throw new Error(`Could not parse GitHub URL from source: ${selectedSource}`);
        }
      } catch (err) {
        console.error("GitHub fetch error:", err);
        setCommitsError("فشل جلب التحديثات. تأكد من صحة المستودع أو تحقق من اتصالك بالإنترنت.");
      } finally {
        setIsCommitsLoading(false);
      }
    };

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
          const targetRepo = 'Micro-services-';
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
    fetchGithubCommits();

    const githubInterval = setInterval(fetchGithubCommits, 60000); // Update every minute

    return () => {
      unsubscribeAuth();
      clearInterval(githubInterval);
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [addLog, selectedSource]);

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

      // Generate meaningful patterns and decisions based on the session
      const usedAgents = subAgents.filter(a => a.status === 'completed').map(a => a.name);
      const agentsString = usedAgents.length > 0 ? usedAgents.join(' و ') : 'الوكلاء الأساسيين';
      
      const newPattern = `تم تنفيذ مهمة معقدة بتعاون ${agentsString}: ${prompt.slice(0, 40)}...`;
      const newDecision = `تم تفعيل ${agentsString} لحل مشكلة مركبة في ${new Date().toLocaleTimeString('ar-EG')}`;

      // Update Memory (Patterns)
      const currentPatterns = memory?.patterns || [];
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
        keyDecisions: [newDecision, ...currentDecisions].slice(0, 5),
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
              
              const matchedAgents = subAgents.filter(agent => agent.keywords.some(kw => lowerText.includes(kw)));
              
              if (matchedAgents.length > 0) {
                matchedAgents.forEach(agent => {
                  addLog(`[Sub-Agent: ${agent.name}] ${actionDesc}`, isError);
                });
                
                setSubAgents(prev => prev.map(agent => {
                  if (matchedAgents.some(ma => ma.id === agent.id)) {
                    const errorMsg = isError ? `${actionDesc}\nالتفاصيل:\n${detailedError || 'غير متوفر'}` : undefined;
                    return { ...agent, status: isError ? 'error' : intendedStatus, error: errorMsg };
                  }
                  return agent;
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
              
              // Mark all running agents as completed
              setSubAgents(prev => prev.map(agent => agent.status === 'running' ? { ...agent, status: 'completed' } : agent));
              
              // Update Memory
              updateMemoryAfterSession(sid);

              setIsProcessing(false);
              if (pollInterval.current) clearInterval(pollInterval.current);
            }
          }
        });
      }
    } catch (err: any) {
      if (err.message !== 'Failed to fetch' && !err.message.includes('fetch')) {
        console.error("Polling error:", err);
      }
    }
  };

  const runBrainstorming = async () => {
    setIsBrainstorming(true);
    setBrainstorming("");
    addLog("🤖 [أمريكي - Brain] جاري التفكير والتحليل باستخدام Gemini 3.1 Pro...");
    speakText("جاري التفكير والتحليل العميق");

    try {
      const promptContext = `
        You are Amrikyy's Brain (دماغ أمريكي), the core intelligence of a self-improving, self-evolving microservices ecosystem.
        Your ultimate goal is to create a "Meta Loop" of continuous self-improvement, building a massive ecosystem of microservices, Gemini tools, Google Apps integrations, APIs, and MCPs all in one place, using ZERO-COST architecture.

        Current Ecosystem State: ${JSON.stringify(ecosystem || {})}
        Memory Patterns: ${memory?.patterns?.join(", ") || "None"}
        Current User Goal: ${prompt}
        Target Repo: ${selectedSource}
        
        Task:
        1. SEARCH & ANALYZE: Use Google Search to find the latest best practices for Gemini APIs, MCPs, and zero-cost serverless architectures if needed. Analyze our current ecosystem state and codebase direction.
        2. META-LOOP EVOLUTION: How should the system evolve itself in this current cycle? What self-improvement step is needed?
        3. BRAINSTORM: Suggest 3 innovative, zero-cost microservices or agents we should build NEXT to expand the Google/Gemini ecosystem.
        4. IMMEDIATE ACTION: Decide on the absolute best next task to implement right now.
        5. EXECUTION PROMPT: Provide the exact, detailed prompt that should be sent to the execution agent for the next session.
        
        Respond ONLY in Arabic, using a highly intelligent, confident, and visionary tone.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: promptContext,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      const result = response.text;
      setBrainstorming(result);
      addLog("🤖 [أمريكي - Brain] اكتملت عملية التفكير والتحليل.");
      speakText("اكتملت عملية التحليل، لدي بعض الأفكار الجديدة");
    } catch (err: any) {
      addLog(`فشل عملية التفكير: ${err.message}`, true);
    } finally {
      setIsBrainstorming(false);
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
Your core mandate is to build a self-sustaining microservices ecosystem that works on ITSELF.
1. TOOLS: Use ONLY free-tier services (Firebase, GitHub, Brave Search API, v0, Neon, Render, Context7, TurboQuant).
2. MODELS: Orchestrate tasks using Gemini 1.5 Flash for speed/cost-efficiency, and Gemini 1.5 Pro for complex reasoning.
3. NOTEBOOKLM: Use NotebookLM as a companion tool for document analysis, but for programmatic tasks, leverage Gemini API directly to maintain zero-cost automation.
4. SELF-BUILDING: The project must be able to deploy, manage, and extend its own microservices ecosystem smartly.

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

          {/* Sub-Agents Status */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                الوكلاء الفرعيين (Sub-Agents & Mini Apps)
              </h2>
              <span className="text-xs text-neutral-500 bg-neutral-950 px-2 py-1 rounded-md border border-neutral-800">
                دمج ذكي للأدوات (MCPs + APIs)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subAgents.map((agent) => (
                <div key={agent.id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 relative group
                  ${agent.status === 'completed' ? 'bg-green-500/10 border-green-500/30' : 
                    agent.status === 'error' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 
                    agent.status === 'running' ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 
                    'bg-neutral-950 border-neutral-800'}`}
                >
                  <div className="flex items-center justify-between border-b border-neutral-800/50 pb-2">
                    <span className="font-bold text-sm text-neutral-200">{agent.name}</span>
                    {agent.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {agent.status === 'running' && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
                    {agent.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />}
                    {agent.status === 'idle' && <div className="w-2 h-2 rounded-full bg-neutral-700" />}
                  </div>
                  
                  <p className="text-xs text-neutral-400">{agent.description}</p>
                  
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {agent.tools.map((tool, idx) => (
                      <span key={idx} className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-700">
                        {tool}
                      </span>
                    ))}
                  </div>

                  {agent.status === 'error' && agent.error && (
                    <div className="mt-2 p-2 bg-red-950/30 border border-red-500/30 rounded text-xs text-red-300 break-words whitespace-pre-wrap max-h-32 overflow-y-auto font-mono">
                      <span className="font-bold block mb-1">تفاصيل الخطأ:</span>
                      {agent.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Debug Console */}
          <div className="bg-[#0D0D0D] border border-neutral-800 rounded-2xl p-4 shadow-xl font-mono text-sm h-80 flex flex-col">
            <div className="flex items-center justify-between text-neutral-500 mb-4 border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>وحدة تصحيح الأخطاء (Debug Console)</span>
              </div>
              <div className="flex gap-2 text-xs bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                <button 
                  onClick={() => setLogFilter('all')} 
                  className={`px-2 py-1 rounded transition-colors ${logFilter === 'all' ? 'bg-neutral-800 text-white' : 'hover:text-neutral-300'}`}
                >الكل</button>
                <button 
                  onClick={() => setLogFilter('error')} 
                  className={`px-2 py-1 rounded transition-colors ${logFilter === 'error' ? 'bg-red-500/20 text-red-400' : 'hover:text-red-400/70'}`}
                >الأخطاء</button>
                <button 
                  onClick={() => setLogFilter('mcp')} 
                  className={`px-2 py-1 rounded transition-colors ${logFilter === 'mcp' ? 'bg-blue-500/20 text-blue-400' : 'hover:text-blue-400/70'}`}
                >MCP</button>
                <button 
                  onClick={() => setLogFilter('system')} 
                  className={`px-2 py-1 rounded transition-colors ${logFilter === 'system' ? 'bg-purple-500/20 text-purple-400' : 'hover:text-purple-400/70'}`}
                >النظام</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-neutral-300">
              {logs.filter(log => {
                if (logFilter === 'all') return true;
                if (logFilter === 'error') return log.includes('خطأ');
                if (logFilter === 'mcp') return log.includes('[Sub-Agent:');
                if (logFilter === 'system') return log.includes('[أمريكي') && !log.includes('خطأ');
                return true;
              }).map((log, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={index}
                  className={`${log.includes('خطأ') ? 'text-red-400' : log.includes('بنجاح') ? 'text-green-400' : log.includes('[Auto-Debug]') ? 'text-yellow-400' : log.includes('[أمريكي - Brain]') ? 'text-purple-400' : log.includes('[Sub-Agent:') ? 'text-blue-300' : ''}`}
                >
                  {log}
                </motion.div>
              ))}
            </div>
          </div>

          {/* GitHub Live Status */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Github className="w-5 h-5 text-neutral-400" />
              حالة المستودع المباشرة (Live Repo)
            </h2>
            <div className="space-y-4">
              {isCommitsLoading && commits.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                </div>
              ) : commitsError ? (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{commitsError}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {commits.map((commit, i) => (
                    <a 
                      key={i} 
                      href={commit.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex flex-col gap-1 hover:bg-neutral-800 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 truncate max-w-[150px] group-hover:text-blue-300 transition-colors">
                          {commit.commit.author.name}
                        </span>
                        <span className="text-[10px] text-neutral-600">
                          {new Date(commit.commit.author.date).toLocaleString('ar-EG')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 line-clamp-2">{commit.commit.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <GitBranch className="w-3 h-3 text-neutral-600" />
                        <span className="text-[10px] text-neutral-500 font-mono">{commit.sha.substring(0, 7)}</span>
                      </div>
                    </a>
                  ))}
                  {commits.length === 0 && !commitsError && (
                    <div className="text-center py-4 text-neutral-600 text-sm">
                      لا توجد بيانات متاحة حالياً
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline Steps & Memory Bank */}
        <div className="space-y-8 h-fit">
          {/* Ecosystem Graph */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-emerald-400" />
              التمثيل المرئي للنظام البيئي (Ecosystem Graph)
            </h2>
            <EcosystemGraph services={ecosystem?.deployedServices || []} />
          </div>

          {/* Amrikyy's Brain (Brainstorming) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BrainCircuit className="w-6 h-6 text-purple-400" />
                دماغ أمريكي (Amrikyy&apos;s Brain)
              </h2>
              <button
                onClick={runBrainstorming}
                disabled={isBrainstorming || isProcessing}
                className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-all disabled:opacity-50"
                title="تفكير وعصف ذهني"
              >
                {isBrainstorming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cpu className="w-5 h-5" />}
              </button>
            </div>

            {brainstorming ? (
              <div className="prose prose-invert prose-sm max-w-none bg-neutral-950/50 p-4 rounded-xl border border-purple-500/20 max-h-[400px] overflow-y-auto">
                <Markdown>{brainstorming}</Markdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-neutral-950 rounded-full flex items-center justify-center border border-neutral-800">
                  <BrainCircuit className="w-8 h-8 text-neutral-700" />
                </div>
                <p className="text-sm text-neutral-500 max-w-[200px]">
                  اضغط على الأيقونة لتفعيل التفكير العميق والعصف الذهني للخطوات القادمة
                </p>
              </div>
            )}
          </div>
          {/* Memory Bank UI */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              الذاكرة العضلية (Memory Bank)
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  الأنماط والمهارات المكتسبة
                </h3>
                <div className="space-y-2">
                  {memory?.patterns && memory.patterns.length > 0 ? (
                    memory.patterns.map((pattern: string, idx: number) => (
                      <div key={idx} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-sm text-neutral-300">
                        {pattern}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-neutral-600 italic">لا توجد أنماط مسجلة بعد. سيتم التحديث بعد الجلسة.</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  القرارات المعمارية الرئيسية
                </h3>
                <div className="space-y-2">
                  {ecosystem?.keyDecisions && ecosystem.keyDecisions.length > 0 ? (
                    ecosystem.keyDecisions.map((decision: string, idx: number) => (
                      <div key={idx} className="bg-neutral-950 p-3 rounded-lg border border-emerald-500/20 text-sm text-emerald-400/90">
                        {decision}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-neutral-600 italic">لا توجد قرارات مسجلة بعد.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
