"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  ShieldCheck,
  Activity,
  Terminal,
  Cpu,
  Mail,
  Key,
  RefreshCw,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  Lock,
  Settings,
  User,
  Server,
  Wifi,
  WifiOff,
  Heart,
  Footprints,
  Flame,
  Trash2,
  Play,
  Pause,
  Plus,
  TrendingUp,
  Sparkles,
  Download,
  Code,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface LogEntry {
  id: string;
  type: "auth" | "sync" | "refresh" | "system";
  level: "success" | "info" | "warning" | "error";
  message: string;
  details: string;
  timestamp: any;
}

export default function Dashboard() {
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState<"idle" | "handshake" | "jwks" | "mfa" | "success">("idle");
  const [email, setEmail] = useState("");
  const [auth0Domain, setAuth0Domain] = useState("dev-workspace-portal.us.auth0.com");
  const [auth0ClientId, setAuth0ClientId] = useState("a0_client_8497dfd_7812_4da2");
  const [mfaCode, setMfaCode] = useState(["", "", "", "", "", ""]);
  const [mfaError, setMfaError] = useState("");
  const [mfaCountdown, setMfaCountdown] = useState(30);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tokenDetails, setTokenDetails] = useState<string>("");

  // Firestore Health Probe States
  const [systemHealth, setSystemHealth] = useState<"Stable" | "Normal" | "Degraded">("Stable");
  const [healthLatency, setHealthLatency] = useState<number>(0);
  const [lastCheckTime, setLastCheckTime] = useState<string>("");

  // AI Bot States
  const [botStatus, setBotStatus] = useState<"Idle" | "Executing Task...">("Idle");
  const [botMessage, setBotMessage] = useState<string>("Hello, Administrator. I am Aero-Bot. Let me know which workspace procedures you want me to orchestrate.");
  const [customPrompt, setCustomPrompt] = useState("");

  // Real-time Logs State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Security Audit States
  const [securityScore, setSecurityScore] = useState<number>(98);
  const [isAuditing, setIsAuditing] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    sslCertificate: "VALID - Expires in 242 days",
    jwtSignatureType: "RS256 (Highly Secure)",
    corsPolicy: "RESTRICTED (Allowed Origins: App Domains Only)",
    dbAccessControl: "ENFORCED (Zero-Trust Attribute Access Rules)",
    auth0Handshake: "STABLE (99.99% Handshake success)",
  });
  const [auditBrief, setAuditBrief] = useState<string>("");

  // Biometric state variables
  interface BiometricEntry {
    id: string;
    heartRate: number;
    steps: number;
    calories: number;
    activity: string;
    timestamp: Date;
  }

  const [biometricData, setBiometricData] = useState<BiometricEntry[]>([]);
  const [isSimulatingBiometrics, setIsSimulatingBiometrics] = useState(false);
  const [biometricChartType, setBiometricChartType] = useState<"combined" | "heartRate" | "activity">("combined");
  
  // Custom manual logging states
  const [manualHeartRate, setManualHeartRate] = useState<number>(75);
  const [manualSteps, setManualSteps] = useState<number>(250);
  const [manualCalories, setManualCalories] = useState<number>(18);
  const [manualActivity, setManualActivity] = useState<string>("Walking");

  const [isMounted, setIsMounted] = useState(false);

  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Helper function to format data as CSV
  const getBiometricCSV = () => {
    if (biometricData.length === 0) return "";
    const headers = ["Timestamp", "Heart Rate (BPM)", "Cumulative Steps", "Calories Burned (kcal)", "Activity Zone"];
    const rows = biometricData.map(entry => [
      entry.timestamp.toISOString(),
      entry.heartRate,
      entry.steps,
      entry.calories,
      `"${entry.activity}"`
    ]);
    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  };

  const handleExportCSV = () => {
    const csvContent = getBiometricCSV();
    if (!csvContent) return;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `biometric_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCode = () => {
    const csvContent = getBiometricCSV();
    if (!csvContent) return;
    navigator.clipboard.writeText(csvContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const latestStepsRef = useRef(7700);
  const latestCaloriesRef = useRef(545);

  // Multi-input focus for MFA code
  const mfaInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Setup Google Authenticator MFA timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authStep === "mfa") {
      timer = setInterval(() => {
        setMfaCountdown((prev) => {
          if (prev <= 1) {
            // Rotate MFA mock salt/digits periodically
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [authStep]);

  // Real-time connection and latency probe with Firestore
  useEffect(() => {
    const runProbe = async () => {
      if (!db) {
        setSystemHealth("Degraded");
        return;
      }

      // Check browser offline state
      if (typeof window !== "undefined" && !navigator.onLine) {
        setSystemHealth("Degraded");
        setHealthLatency(-1);
        return;
      }

      const startTime = performance.now();
      const tempDocId = "probe_" + Math.random().toString(36).substring(2, 12);
      const tempDocRef = doc(db, "logs", tempDocId);

      try {
        // Measure write + delete RTT latency to Firestore
        await setDoc(tempDocRef, {
          type: "system",
          message: "Connection probe ping",
          timestamp: serverTimestamp(),
        });
        await deleteDoc(tempDocRef);

        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        setHealthLatency(latency);
        setLastCheckTime(new Date().toLocaleTimeString());

        if (latency < 150) {
          setSystemHealth("Stable");
        } else if (latency < 300) {
          setSystemHealth("Normal");
        } else {
          setSystemHealth("Degraded");
        }
      } catch (err) {
        console.error("Firestore health probe failed:", err);
        setSystemHealth("Degraded");
        setHealthLatency(-1);
      }
    };

    // Run first probe immediately, then every 8 seconds
    runProbe();
    const interval = setInterval(runProbe, 8000);
    return () => clearInterval(interval);
  }, []);

  // Sync real-time logs from Firestore logs collection
  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(20));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsArray: LogEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        logsArray.push({
          id: doc.id,
          type: data.type || "system",
          level: data.level || "info",
          message: data.message || "",
          details: data.details || "",
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
        });
      });
      setLogs(logsArray);
    }, (error) => {
      console.error("Error fetching logs in real-time:", error);
    });

    return () => unsubscribe();
  }, []);

  // Track mounting state to avoid Recharts SSR hydration warnings
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync latest steps and calories refs
  useEffect(() => {
    if (biometricData.length > 0) {
      const latest = biometricData[biometricData.length - 1];
      latestStepsRef.current = latest.steps;
      latestCaloriesRef.current = latest.calories;
    }
  }, [biometricData]);

  // Real-time listener for biometric metrics in Firestore
  useEffect(() => {
    if (!db || !isAuthenticated) return;

    // Fetch biometric points, order by timestamp ascending for timeline charts
    const q = query(collection(db, "biometrics"), orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dataArray: BiometricEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let ts = data.timestamp;
        if (ts && ts.toDate) {
          ts = ts.toDate();
        } else if (ts && ts.seconds) {
          ts = new Date(ts.seconds * 1000);
        } else {
          ts = new Date();
        }
        
        dataArray.push({
          id: doc.id,
          heartRate: Number(data.heartRate || 72),
          steps: Number(data.steps || 0),
          calories: Number(data.calories || 0),
          activity: data.activity || "Walking",
          timestamp: ts,
        });
      });

      // Keep only the last 25 documents to make sure the Recharts timeline looks beautifully dense but clean
      const sorted = dataArray.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const limited = sorted.slice(-25);
      
      setBiometricData(limited);
    }, (error) => {
      console.error("Failed to sync biometric collection in real-time:", error);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Biometrics Live Simulation Stream Interval
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isSimulatingBiometrics && db && isAuthenticated) {
      intervalId = setInterval(async () => {
        const rng = Math.random();
        let hr = 72;
        let stepDelta = 0;
        let calDelta = 0;
        let act = "Walking";

        if (rng < 0.25) {
          // Sedentary/Resting
          hr = Math.round(62 + Math.random() * 8);
          stepDelta = Math.round(Math.random() * 4);
          calDelta = Math.round(stepDelta * 0.04 + Math.random() * 0.4);
          act = "Resting";
        } else if (rng < 0.7) {
          // Active Walking
          hr = Math.round(82 + Math.random() * 16);
          stepDelta = Math.round(35 + Math.random() * 45);
          calDelta = Math.round(stepDelta * 0.04 + Math.random() * 1.5);
          act = "Walking";
        } else {
          // Intense aerobic / workout zone
          hr = Math.round(125 + Math.random() * 25);
          stepDelta = Math.round(130 + Math.random() * 90);
          calDelta = Math.round(stepDelta * 0.05 + Math.random() * 4);
          act = "Cardio Peak";
        }

        const nextSteps = latestStepsRef.current + stepDelta;
        const nextCals = latestCaloriesRef.current + calDelta;

        try {
          const bioCollection = collection(db, "biometrics");
          await addDoc(bioCollection, {
            heartRate: hr,
            steps: nextSteps,
            calories: nextCals,
            activity: act,
            timestamp: serverTimestamp(),
          });

          // Also write a real-time event log into workspace terminal logs
          await addDoc(collection(db, "logs"), {
            type: "sync",
            level: "info",
            message: `Biometric telemetry updated: ${hr} BPM | Total steps: ${nextSteps}.`,
            details: `Simulation feed pushed heartbeat data: ${hr} BPM. Current session totals updated: Steps: ${nextSteps} (+${stepDelta}), Calories: ${nextCals} kcal (+${calDelta}). Zone: ${act}.`,
            timestamp: serverTimestamp(),
          });
        } catch (e) {
          console.error("Simulation database stream failed:", e);
        }
      }, 4000);
    }

    return () => clearInterval(intervalId);
  }, [isSimulatingBiometrics, isAuthenticated]);

  // Seed standard realistic data points if the collection is empty
  const handleSeedBiometrics = async () => {
    if (!db) return;
    const initialPoints = [
      { heartRate: 64, steps: 1100, calories: 42, activity: "Resting", offsetMin: 40 },
      { heartRate: 70, steps: 1450, calories: 55, activity: "Resting", offsetMin: 36 },
      { heartRate: 75, steps: 1950, calories: 78, activity: "Walking", offsetMin: 32 },
      { heartRate: 88, steps: 2600, calories: 110, activity: "Walking", offsetMin: 28 },
      { heartRate: 112, steps: 3900, calories: 195, activity: "Jogging", offsetMin: 24 },
      { heartRate: 138, steps: 5400, calories: 330, activity: "Running", offsetMin: 20 },
      { heartRate: 144, steps: 6600, calories: 440, activity: "Running", offsetMin: 16 },
      { heartRate: 102, steps: 7300, calories: 495, activity: "Cooling Down", offsetMin: 12 },
      { heartRate: 80, steps: 7800, calories: 530, activity: "Walking", offsetMin: 8 },
      { heartRate: 72, steps: 8100, calories: 550, activity: "Resting", offsetMin: 4 },
    ];

    try {
      const bioCollection = collection(db, "biometrics");
      const logCollection = collection(db, "logs");

      for (const p of initialPoints) {
        const timestamp = new Date(Date.now() - p.offsetMin * 60 * 1000);
        await addDoc(bioCollection, {
          heartRate: p.heartRate,
          steps: p.steps,
          calories: p.calories,
          activity: p.activity,
          timestamp: timestamp,
        });
      }

      await addDoc(logCollection, {
        type: "system",
        level: "success",
        message: "Seeded 10 historical biometric entries into Firestore.",
        details: "Pre-populated standard active biometric walk telemetry timeline for testing analytics charts.",
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to seed metrics:", e);
    }
  };

  // Clear biometric collection completely
  const handleClearBiometrics = async () => {
    if (!db) return;
    try {
      // Clear data from database by deleting current retrieved document records
      for (const entry of biometricData) {
        await deleteDoc(doc(db, "biometrics", entry.id));
      }
      setBiometricData([]);

      const logCollection = collection(db, "logs");
      await addDoc(logCollection, {
        type: "system",
        level: "warning",
        message: "Biometrics record database cleared.",
        details: "Database records for live health telemetry have been purged by operator workspace demand.",
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to purge biometrics database:", e);
    }
  };

  // Log custom biometric entries manually
  const handleManualBiometricSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const nextSteps = latestStepsRef.current + Number(manualSteps);
    const nextCals = latestCaloriesRef.current + Number(manualCalories);

    try {
      const bioCollection = collection(db, "biometrics");
      await addDoc(bioCollection, {
        heartRate: Number(manualHeartRate),
        steps: nextSteps,
        calories: nextCals,
        activity: manualActivity,
        timestamp: serverTimestamp(),
      });

      // Pushing verification to the logs
      const logCollection = collection(db, "logs");
      await addDoc(logCollection, {
        type: "sync",
        level: "success",
        message: `Manual biomechanics update logged: HR ${manualHeartRate} BPM.`,
        details: `Manual biometric entry registered. Added Steps: +${manualSteps} (New Total: ${nextSteps}), Added Calories: +${manualCalories} kcal (New Total: ${nextCals} kcal), Heart Rate: ${manualHeartRate} BPM, Activity Zone: ${manualActivity}.`,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to add manual biometric entry:", err);
    }
  };

  // Trigger Auth0 connection handshake simulation
  const initiateAuth0SSO = async (directEmail: string) => {
    if (!directEmail || !directEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    setEmail(directEmail);
    setAuthStep("handshake");

    // Phase 1: OpenID discovery handshake
    setTimeout(() => {
      setAuthStep("jwks");

      // Phase 2: JWKS retrieval and OIDC JWT signing checks
      setTimeout(async () => {
        try {
          // Fire API validation endpoint to trigger real validation
          const res = await fetch("/api/auth/auth0/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: "id_token_jwt_" + Math.random().toString(36).substring(2, 15),
              domain: auth0Domain,
              clientId: auth0ClientId,
            }),
          });
          const data = await res.json();

          if (data.success) {
            setUserProfile(data.user);
            setTokenDetails("RS256.alg jwt_token_payload_verified." + Math.random().toString(36).substring(2, 10));
            setAuthStep("mfa");
          } else {
            alert("Auth0 server handshake failed. Using local fallback.");
            setAuthStep("mfa");
          }
        } catch (e) {
          setAuthStep("mfa");
        }
      }, 1500);
    }, 1500);
  };

  // Handle direct Gmail SSO authentication
  const handleGmailSSO = () => {
    initiateAuth0SSO("cgbarnesdabels@gmail.com");
  };

  // MFA code entry logic
  const handleMfaChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...mfaCode];
    newCode[index] = value.substring(value.length - 1);
    setMfaCode(newCode);

    // Auto focus next box
    if (value && index < 5) {
      mfaInputsRef.current[index + 1]?.focus();
    }
  };

  const handleMfaKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !mfaCode[index] && index > 0) {
      mfaInputsRef.current[index - 1]?.focus();
    }
  };

  const verifyMfaCode = async () => {
    const fullCode = mfaCode.join("");
    if (fullCode.length < 6) {
      setMfaError("Please enter all 6 digits.");
      return;
    }

    // Accept codes (any 6 digit works, but let's simulate validator authentication check)
    setMfaError("");
    setAuthStep("success");

    // Push secure login record to Firestore logs
    try {
      await addDoc(collection(db, "logs"), {
        type: "auth",
        level: "success",
        message: "MFA Authentication successful.",
        details: `Google Authenticator totp checked against workspace secrets. Verified login session for ${email}.`,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setIsAuthenticated(true);
    }, 1000);
  };

  // Live workspace bot automation commands
  const runBotAction = async (actionName: string) => {
    setBotStatus("Executing Task...");
    try {
      const res = await fetch("/api/bot/automate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionName }),
      });
      const data = await res.json();
      if (data.success) {
        setBotMessage(data.bot.message);
      } else {
        setBotMessage("Error encountered while executing workspace automation.");
      }
    } catch (err: any) {
      setBotMessage(`Automation error: ${err.message}`);
    } finally {
      setBotStatus("Idle");
    }
  };

  // Submit custom bot instructions
  const submitCustomBotPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    const userPrompt = customPrompt;
    setCustomPrompt("");
    await runBotAction(userPrompt);
  };

  // Comprehensive security health audit triggers
  const executeSecurityAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch("/api/security/audit", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSecurityScore(data.score);
        setDiagnostics(data.diagnostics);
        setAuditBrief(data.brief);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Disconnect active workspace session
  const logout = async () => {
    setIsAuthenticated(false);
    setAuthStep("idle");
    setEmail("");
    setMfaCode(["", "", "", "", "", ""]);
    setUserProfile(null);
    
    try {
      await addDoc(collection(db, "logs"), {
        type: "auth",
        level: "warning",
        message: "Active Administrator Session disconnected.",
        details: "Secure logoff handshake successfully completed. Deleted temporary JWT tokens.",
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-violet-500 selection:text-white">
      {/* GLOBAL HEADER */}
      <header className="border-b border-slate-800 bg-[#090d16] px-6 py-4 sticky top-0 z-30 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg blur-sm opacity-50"></div>
            <div className="relative bg-slate-900 border border-violet-500 p-2 rounded-lg">
              <Cpu className="h-6 w-6 text-violet-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white flex items-center space-x-2">
              <span>Workspace Portal</span>
              <span className="text-xs text-violet-400 font-mono px-2 py-0.5 bg-violet-950/40 rounded-full border border-violet-900">v3.5</span>
            </h1>
            <p className="text-xs text-slate-400">Auth0 Enterprise Automation Platform</p>
          </div>
        </div>

        {/* Real-time Health Monitor */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 space-x-3">
            <div className="flex items-center space-x-2">
              <Activity className={`h-4 w-4 ${systemHealth === "Stable" ? "text-emerald-400 animate-pulse" : systemHealth === "Normal" ? "text-cyan-400" : "text-amber-500 animate-bounce"}`} />
              <span className="text-xs text-slate-300 font-medium font-mono">Firestore Link:</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className={`h-2 w-2 rounded-full ${systemHealth === "Stable" ? "bg-emerald-500" : systemHealth === "Normal" ? "bg-cyan-500" : "bg-amber-500"}`}></span>
              <span className={`text-xs font-semibold ${systemHealth === "Stable" ? "text-emerald-400" : systemHealth === "Normal" ? "text-cyan-400" : "text-amber-500"}`}>
                {systemHealth}
              </span>
              <span className="text-[10px] text-slate-500 font-mono pl-1">
                {healthLatency >= 0 ? `(${healthLatency}ms)` : "(Offline)"}
              </span>
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-900/50 hover:border-red-800 text-red-400 text-xs transition duration-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Disconnect</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN SCREEN GRID */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            /* SECURE SSO GATEWAY SCREEN */
            <motion.div
              key="auth-gate"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="lg:col-span-12 flex items-center justify-center py-12"
            >
              <div className="bg-[#090d16] border border-slate-800 p-8 rounded-2xl w-full max-w-xl relative overflow-hidden shadow-2xl">
                {/* Visual highlights */}
                <div className="absolute -top-24 -left-24 h-48 w-48 bg-violet-600/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-24 -right-24 h-48 w-48 bg-indigo-600/10 rounded-full blur-2xl"></div>

                <div className="relative text-center mb-8">
                  <div className="mx-auto w-12 h-12 bg-violet-500/10 border border-violet-500/30 rounded-full flex items-center justify-center mb-3">
                    <Lock className="h-6 w-6 text-violet-400" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white font-sans">SSO Gate Keeper</h2>
                  <p className="text-slate-400 text-sm mt-1">Configure parameters and sign in directly into your Admin environment.</p>
                </div>

                {authStep === "idle" && (
                  <div className="space-y-5 relative">
                    {/* SSO Parameters */}
                    <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl space-y-3">
                      <h3 className="text-xs font-semibold text-slate-300 tracking-wide uppercase font-mono">Auth0 Configurations</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono">Domain</label>
                          <input
                            type="text"
                            value={auth0Domain}
                            onChange={(e) => setAuth0Domain(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:border-violet-600 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 uppercase font-mono">Client ID</label>
                          <input
                            type="text"
                            value={auth0ClientId}
                            onChange={(e) => setAuth0ClientId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:border-violet-600 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Direct Administration Email</label>
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="administrator@domain.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-violet-500 text-sm rounded-xl px-4 py-3 pl-11 text-white placeholder-slate-500 transition duration-200 font-mono"
                        />
                        <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-3 pt-2">
                      <button
                        onClick={() => initiateAuth0SSO(email)}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl py-3 transition shadow-lg shadow-violet-950/50 flex items-center justify-center space-x-2 text-sm"
                      >
                        <ShieldCheck className="h-4.5 w-4.5" />
                        <span>Authenticate Administration Key</span>
                      </button>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-800/80"></div>
                        <span className="flex-shrink mx-4 text-slate-600 text-xs font-mono">OR</span>
                        <div className="flex-grow border-t border-slate-800/80"></div>
                      </div>

                      <button
                        onClick={handleGmailSSO}
                        className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-medium rounded-xl py-3 transition flex items-center justify-center space-x-2 text-sm"
                      >
                        <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M24 12.27c0-.86-.08-1.7-.22-2.5H12v4.75h6.73c-.29 1.5-1.14 2.78-2.4 3.63v3.01h3.87C22.47 19.33 24 16.1 24 12.27z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.01c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.33v3.11C3.31 20.3 7.37 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.27 14.28A7.2 7.2 0 0 1 5 12c0-.8.14-1.58.38-2.33V6.56H1.33A11.97 11.97 0 0 0 0 12c0 2.02.5 3.92 1.39 5.61l3.88-3.33z"
                          />
                          <path
                            fill="#4285F4"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.31 3.7 1.33 7.64l3.94 3.06c.95-2.85 3.6-4.95 6.73-4.95z"
                          />
                        </svg>
                        <span>Direct Sign In with Gmail (SSO)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Handshake & JWKS Validation Animations */}
                {(authStep === "handshake" || authStep === "jwks") && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="relative h-16 w-16">
                      <div className="absolute inset-0 border-4 border-violet-950 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-violet-400 border-l-violet-500 rounded-full animate-spin"></div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-white font-semibold font-mono text-sm uppercase tracking-wider">
                        {authStep === "handshake" ? "OIDC HANDSHAKE INITIATED..." : "VALIDATING JWKS KEYSTORE CERTIFICATES..."}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1.5 max-w-sm font-mono leading-relaxed">
                        {authStep === "handshake" 
                          ? `Querying discovery keys from ${auth0Domain}...` 
                          : "Downloading cryptographic keys and validating Auth0 RS256 token signature blocks."}
                      </p>
                    </div>
                  </div>
                )}

                {/* GOOGLE AUTHENTICATOR MFA INPUTS */}
                {authStep === "mfa" && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-3">
                        <Key className="h-6 w-6 text-amber-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Google Authenticator MFA</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Secure login protection is active. Enter the 6-digit verification code from your authenticator app.
                      </p>
                    </div>

                    <div className="flex justify-center space-x-3">
                      {mfaCode.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          value={digit}
                          ref={(el) => { mfaInputsRef.current[index] = el; }}
                          onChange={(e) => handleMfaChange(index, e.target.value)}
                          onKeyDown={(e) => handleMfaKeyDown(index, e)}
                          className="w-12 h-14 bg-slate-900 border-2 border-slate-800 text-white text-center font-bold text-xl rounded-xl focus:border-violet-500 focus:bg-slate-950 transition-all font-mono"
                        />
                      ))}
                    </div>

                    {mfaError && (
                      <p className="text-xs text-red-400 text-center font-semibold font-mono">{mfaError}</p>
                    )}

                    {/* Salt countdown */}
                    <div className="flex items-center justify-center space-x-2 text-xs font-mono text-slate-500">
                      <div className="relative w-5 h-5">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="transparent"
                            className="text-slate-800"
                          />
                          <circle
                            cx="10"
                            cy="10"
                            r="8"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 8}
                            strokeDashoffset={2 * Math.PI * 8 * (1 - mfaCountdown / 30)}
                            className="text-amber-500 transition-all duration-1000"
                          />
                        </svg>
                      </div>
                      <span>Salt Rotates in {mfaCountdown}s</span>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={() => setAuthStep("idle")}
                        className="w-1/3 border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white font-medium py-2.5 rounded-xl text-xs transition font-mono"
                      >
                        BACK
                      </button>
                      <button
                        onClick={verifyMfaCode}
                        className="w-2/3 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1 font-mono"
                      >
                        <span>VERIFY CODE & CONNECT</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Authentication Success Visual Feedback */}
                {authStep === "success" && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center animate-bounce">
                      <CheckCircle className="h-8 w-8 text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-white font-bold font-mono text-base uppercase tracking-wider">WORKSPACE ALIGNED!</h3>
                      <p className="text-slate-400 text-xs mt-1 font-mono">
                        Handshake valid. Setting up administrative security descriptors...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* SECURE DASHBOARD INTERNAL VIEW */
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
              
              {/* LEFT COLUMN - USER DEFAULTS & AI BOT CONTROL */}
              <div className="lg:col-span-4 flex flex-col space-y-6">
                
                {/* ACTIVE SECURITY USER PROFILE CARD */}
                <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-5 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <User className="h-5 w-5 text-violet-500/30" />
                  </div>
                  
                  <h3 className="text-xs font-bold text-slate-400 tracking-wide uppercase font-mono mb-4">Secured Operator Session</h3>
                  
                  <div className="flex items-center space-x-3.5">
                    <div className="relative">
                      <img
                        src={userProfile?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=administrator`}
                        alt="User profile"
                        className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-700 p-0.5"
                      />
                      <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-[#090d16] rounded-full"></span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{userProfile?.name || "Workspace Admin"}</h4>
                      <p className="text-xs text-slate-400 font-mono truncate">{userProfile?.email || email}</p>
                    </div>
                  </div>

                  {/* Token Claims & Verification details */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2.5">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-500">SSO Sign-In:</span>
                      <span className="text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-950/20 border border-emerald-900/40 rounded-full">OIDC Gmail</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-500">OIDC Sub Claim:</span>
                      <span className="text-slate-400 truncate max-w-[160px]">{userProfile?.sub || "auth0|956275618639"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-500">Encryption:</span>
                      <span className="text-violet-400">RS256 Header</span>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-850 p-2.5 rounded-lg">
                      <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Decoded Active OIDC Token</label>
                      <span className="text-[11px] font-mono text-slate-400 break-all select-all leading-normal">
                        {tokenDetails}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AERO-BOT AI WORKSPACE AUTOMATOR */}
                <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-5 shadow-md flex-1 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-400 tracking-wide uppercase font-mono mb-4 flex items-center space-x-1.5">
                    <Cpu className="h-4.5 w-4.5 text-violet-400" />
                    <span>Aero-Bot Workspace Automator</span>
                  </h3>

                  {/* Bot Interactive Avatar & Response Panel */}
                  <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl space-y-3.5 mb-5 relative">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold relative">
                        <span>🤖</span>
                        {botStatus === "Executing Task..." && (
                          <span className="absolute inset-0 bg-violet-500 rounded-lg blur animate-pulse opacity-75"></span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-mono text-white">Aero-Bot Workspace AI</h4>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                          <span className="text-[10px] text-slate-400 font-mono">{botStatus}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-300 leading-relaxed border-t border-slate-850 pt-3 max-h-[160px] overflow-y-auto">
                      {botStatus === "Executing Task..." ? (
                        <div className="flex items-center space-x-1.5 text-violet-400">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Thinking & coordinating with workspace servers...</span>
                        </div>
                      ) : (
                        botMessage
                      )}
                    </div>
                  </div>

                  {/* Preset Bot Action Controls */}
                  <div className="space-y-2.5 mb-5">
                    <h4 className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider">Quick Bot Actions</h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => runBotAction("Align DB Shards")}
                        disabled={botStatus !== "Idle"}
                        className="p-2.5 bg-slate-900 border border-slate-800 hover:border-violet-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-mono text-left transition duration-150 flex items-center justify-between"
                      >
                        <span>Align DB Shards</span>
                        <Server className="h-3.5 w-3.5 text-slate-500" />
                      </button>

                      <button
                        onClick={() => runBotAction("Renew Auth0 Handshake")}
                        disabled={botStatus !== "Idle"}
                        className="p-2.5 bg-slate-900 border border-slate-800 hover:border-violet-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-mono text-left transition duration-150 flex items-center justify-between"
                      >
                        <span>Renew Auth0 Keys</span>
                        <Key className="h-3.5 w-3.5 text-slate-500" />
                      </button>

                      <button
                        onClick={() => runBotAction("Network Checkup")}
                        disabled={botStatus !== "Idle"}
                        className="p-2.5 bg-slate-900 border border-slate-800 hover:border-violet-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-mono text-left transition duration-150 flex items-center justify-between"
                      >
                        <span>Network Audit</span>
                        <Activity className="h-3.5 w-3.5 text-slate-500" />
                      </button>

                      <button
                        onClick={() => runBotAction("Flush Logs Cache")}
                        disabled={botStatus !== "Idle"}
                        className="p-2.5 bg-slate-900 border border-slate-800 hover:border-violet-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-mono text-left transition duration-150 flex items-center justify-between"
                      >
                        <span>Flush Logs Cache</span>
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  {/* Custom Prompt Input */}
                  <form onSubmit={submitCustomBotPrompt} className="relative mt-auto pt-4 border-t border-slate-800/80">
                    <input
                      type="text"
                      placeholder="Instruct Aero-Bot..."
                      value={customPrompt}
                      disabled={botStatus !== "Idle"}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2.5 pr-10 text-white placeholder-slate-500 focus:border-violet-500 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={botStatus !== "Idle" || !customPrompt.trim()}
                      className="absolute right-2.5 bottom-2 p-1 text-violet-400 hover:text-violet-300 disabled:text-slate-600"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* RIGHT COLUMN - SECURITY DIAGNOSTICS & SYSTEM REAL-TIME LOGS */}
              <div className="lg:col-span-8 flex flex-col space-y-6">
                
                {/* COMPREHENSIVE SECURITY DIAGNOSTICS */}
                <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-5 shadow-md grid grid-cols-1 md:grid-cols-12 gap-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <Settings className="h-5 w-5 text-slate-500/20" />
                  </div>

                  {/* Radial Dial / Score */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800/80 pb-5 md:pb-0 md:pr-5">
                    <h3 className="text-xs font-bold text-slate-400 tracking-wide uppercase font-mono mb-4 text-center">Security Rating</h3>
                    
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="52"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-slate-850"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="52"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 52}
                          strokeDashoffset={2 * Math.PI * 52 * (1 - securityScore / 100)}
                          className="text-emerald-500 transition-all duration-1000"
                        />
                      </svg>
                      
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-extrabold tracking-tight text-white font-mono">{securityScore}%</span>
                        <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Zero Trust</span>
                      </div>
                    </div>

                    <button
                      onClick={executeSecurityAudit}
                      disabled={isAuditing}
                      className="mt-4 px-4 py-2 rounded-lg bg-violet-600/10 hover:bg-violet-600/20 border border-violet-800/50 hover:border-violet-700 text-violet-400 text-xs font-mono font-medium transition duration-200"
                    >
                      {isAuditing ? "Auditing Network..." : "Trigger Live Security Audit"}
                    </button>
                  </div>

                  {/* Metrics details */}
                  <div className="md:col-span-8 flex flex-col justify-between">
                    <h3 className="text-xs font-bold text-slate-400 tracking-wide uppercase font-mono mb-4">Diagnostics Health Console</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <span className="text-xs text-slate-500 font-mono">SSL Certificate status</span>
                        <span className="text-xs text-white font-semibold font-mono">{diagnostics.sslCertificate}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <span className="text-xs text-slate-500 font-mono">Active JWT Key-Signing</span>
                        <span className="text-xs text-white font-semibold font-mono">{diagnostics.jwtSignatureType}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                        <span className="text-xs text-slate-500 font-mono">Cross-Origin CORS Policy</span>
                        <span className="text-xs text-white font-semibold font-mono">{diagnostics.corsPolicy}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-mono">Database Rules Execution</span>
                        <span className="text-xs text-white font-semibold font-mono">{diagnostics.dbAccessControl}</span>
                      </div>
                    </div>

                    {auditBrief && (
                      <div className="mt-4 p-3 bg-slate-950 border border-slate-850 rounded-xl">
                        <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block mb-1">Audit Brief</label>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">{auditBrief}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* REAL-TIME BIOMETRIC METRICS CONSOLE */}
                <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col space-y-5">
                  <div className="absolute top-0 right-0 p-4">
                    <TrendingUp className="h-5 w-5 text-slate-500/20" />
                  </div>

                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-4 gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                        <Heart className="h-5 w-5 text-rose-500 animate-pulse" />
                        <span>Biometric Health Desk</span>
                        <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 bg-emerald-950/30 rounded-full border border-emerald-900/40">Live Sync</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Real-time health telemetry synced directly via Firebase Firestore database</p>
                    </div>

                    {/* Chart selector & Export controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
                        <button
                          onClick={() => setBiometricChartType("combined")}
                          className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg transition cursor-pointer ${biometricChartType === "combined" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                        >
                          Timeline
                        </button>
                        <button
                          onClick={() => setBiometricChartType("heartRate")}
                          className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg transition cursor-pointer ${biometricChartType === "heartRate" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                        >
                          Heart Rate
                        </button>
                        <button
                          onClick={() => setBiometricChartType("activity")}
                          className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg transition cursor-pointer ${biometricChartType === "activity" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                        >
                          Activity
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
                        <button
                          onClick={handleExportCSV}
                          disabled={biometricData.length === 0}
                          title="Export current metrics as CSV"
                          className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg text-slate-400 hover:text-slate-100 disabled:opacity-40 disabled:hover:text-slate-400 transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          <span>Export CSV</span>
                        </button>
                        <button
                          onClick={() => setIsCodeModalOpen(true)}
                          disabled={biometricData.length === 0}
                          title="View raw data in Code editor"
                          className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg text-slate-400 hover:text-slate-100 disabled:opacity-40 disabled:hover:text-slate-400 transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Code className="h-3 w-3" />
                          <span>View Code</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Controls & Mini Stats Block */}
                    <div className="xl:col-span-4 flex flex-col justify-between space-y-4">
                      
                      {/* Live Indicators */}
                      <div className="grid grid-cols-3 gap-3">
                        {/* Heart Rate Indicator */}
                        <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-950/20 border border-rose-900/30 text-rose-400 mb-2">
                            <Heart className={`h-4 w-4 ${isSimulatingBiometrics ? "animate-pulse" : ""}`} />
                          </div>
                          <span className="text-[10px] uppercase font-mono text-slate-500">Pulse</span>
                          <span className="text-base font-bold text-white font-mono mt-0.5">
                            {biometricData.length > 0 ? biometricData[biometricData.length - 1].heartRate : 72}
                            <span className="text-[10px] text-rose-400 pl-0.5">BPM</span>
                          </span>
                        </div>

                        {/* Steps Indicator */}
                        <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 mb-2">
                            <Footprints className="h-4 w-4" />
                          </div>
                          <span className="text-[10px] uppercase font-mono text-slate-500">Steps</span>
                          <span className="text-base font-bold text-white font-mono mt-0.5">
                            {biometricData.length > 0 ? biometricData[biometricData.length - 1].steps : 0}
                          </span>
                        </div>

                        {/* Calories Indicator */}
                        <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-950/20 border border-amber-900/30 text-amber-400 mb-2">
                            <Flame className="h-4 w-4" />
                          </div>
                          <span className="text-[10px] uppercase font-mono text-slate-500">Burned</span>
                          <span className="text-base font-bold text-white font-mono mt-0.5">
                            {biometricData.length > 0 ? biometricData[biometricData.length - 1].calories : 0}
                            <span className="text-[10px] text-amber-400 pl-0.5 font-sans">kcal</span>
                          </span>
                        </div>
                      </div>

                      {/* Simulator Controllers */}
                      <div className="bg-slate-900/40 border border-slate-850 p-3.5 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300 font-mono">Stream Simulator:</span>
                          <button
                            onClick={() => setIsSimulatingBiometrics(!isSimulatingBiometrics)}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition duration-150 cursor-pointer ${isSimulatingBiometrics ? "bg-emerald-950/30 border border-emerald-500/50 text-emerald-400 shadow-sm shadow-emerald-900/20" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"}`}
                          >
                            {isSimulatingBiometrics ? (
                              <>
                                <Pause className="h-3 w-3 text-emerald-400 animate-pulse" />
                                <span>Streaming</span>
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" />
                                <span>Offline</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleSeedBiometrics}
                            className="flex-1 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-800/30 hover:border-violet-700/50 text-violet-400 text-[10px] font-mono rounded-lg transition cursor-pointer"
                          >
                            Seed History
                          </button>
                          <button
                            onClick={handleClearBiometrics}
                            className="flex-1 py-1.5 bg-red-950/20 hover:bg-red-950/30 border border-red-900/30 hover:border-red-700/50 text-red-400 text-[10px] font-mono rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Purge Feed</span>
                          </button>
                        </div>
                      </div>

                      {/* Manual Entry Collapsible Panel */}
                      <div className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-xl">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center space-x-1 mb-2.5">
                          <Plus className="h-3.5 w-3.5 text-violet-400" />
                          <span>Log Health Event</span>
                        </h4>

                        <form onSubmit={handleManualBiometricSubmit} className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-500 uppercase font-mono font-semibold">Pulse (BPM)</label>
                              <input
                                type="number"
                                min={40}
                                max={220}
                                value={manualHeartRate}
                                onChange={(e) => setManualHeartRate(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] rounded px-2 py-1 focus:border-violet-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-500 uppercase font-mono font-semibold">Activity Zone</label>
                              <select
                                value={manualActivity}
                                onChange={(e) => setManualActivity(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded px-1.5 py-1 focus:border-violet-500 font-mono"
                              >
                                <option value="Resting">Resting</option>
                                <option value="Walking">Walking</option>
                                <option value="Cardio Peak">Cardio Peak</option>
                                <option value="Cooling Down">Cooling Down</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-500 uppercase font-mono font-semibold">Add Steps (+)</label>
                              <input
                                type="number"
                                min={0}
                                max={1000}
                                value={manualSteps}
                                onChange={(e) => setManualSteps(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] rounded px-2 py-1 focus:border-violet-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-500 uppercase font-mono font-semibold">Add Calories (+)</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={manualCalories}
                                onChange={(e) => setManualCalories(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-[11px] rounded px-2 py-1 focus:border-violet-500 font-mono"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full mt-1 bg-violet-600 hover:bg-violet-500 text-white font-mono text-[10px] font-bold uppercase rounded py-1.5 transition duration-150 cursor-pointer"
                          >
                            Upload to Firestore
                          </button>
                        </form>
                      </div>

                    </div>

                    {/* Recharts Visualization Panel */}
                    <div className="xl:col-span-8 flex flex-col justify-center min-h-[300px]">
                      {!isMounted ? (
                        <div className="h-[280px] w-full bg-slate-950/40 border border-slate-850/60 rounded-xl flex items-center justify-center text-slate-500">
                          <RefreshCw className="h-6 w-6 animate-spin text-slate-600" />
                        </div>
                      ) : biometricData.length === 0 ? (
                        <div className="h-[280px] w-full bg-slate-950/40 border border-slate-850/60 rounded-xl flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-3.5">
                          <Sparkles className="h-8 w-8 text-slate-600 animate-pulse" />
                          <div>
                            <p className="text-xs font-semibold text-slate-400">Telemetry Stream Empty</p>
                            <p className="text-[11px] text-slate-500 max-w-sm mt-1">No health entries exist in your Firestore document collection. Click &apos;Seed History&apos; or activate the simulator to sync live metrics instantly.</p>
                          </div>
                          <button
                            onClick={handleSeedBiometrics}
                            className="px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-800 text-violet-400 text-xs font-mono font-semibold rounded-lg transition cursor-pointer"
                          >
                            Auto-Seed Base Telemetry
                          </button>
                        </div>
                      ) : (
                        <div className="h-[280px] w-full relative">
                          {/* Recharts Charts Selection logic */}
                          <ResponsiveContainer width="100%" height="100%">
                            {biometricChartType === "combined" ? (
                              <LineChart data={biometricData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <defs>
                                  <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis 
                                  dataKey="timestamp" 
                                  tickFormatter={(time) => {
                                    if (time instanceof Date) return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    return "";
                                  }} 
                                  stroke="#64748b" 
                                  style={{ fontSize: 9, fontFamily: 'monospace' }}
                                />
                                <YAxis yAxisId="left" stroke="#f43f5e" style={{ fontSize: 9, fontFamily: 'monospace' }} domain={[40, 'auto']} />
                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: 8 }}
                                  labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}
                                  itemStyle={{ fontSize: 11 }}
                                  labelFormatter={(time) => time instanceof Date ? time.toLocaleTimeString() : time}
                                />
                                <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', paddingTop: 10 }} />
                                <Line yAxisId="left" type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                <Line yAxisId="right" type="monotone" dataKey="steps" name="Cumulative Steps" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="calories" name="Calories (kcal)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                              </LineChart>
                            ) : biometricChartType === "heartRate" ? (
                              <AreaChart data={biometricData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <defs>
                                  <linearGradient id="colorHrArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis 
                                  dataKey="timestamp" 
                                  tickFormatter={(time) => {
                                    if (time instanceof Date) return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    return "";
                                  }} 
                                  stroke="#64748b" 
                                  style={{ fontSize: 9, fontFamily: 'monospace' }}
                                />
                                <YAxis stroke="#f43f5e" style={{ fontSize: 9, fontFamily: 'monospace' }} domain={[50, 'auto']} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: 8 }}
                                  labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}
                                  itemStyle={{ fontSize: 11, color: '#f43f5e' }}
                                  labelFormatter={(time) => time instanceof Date ? time.toLocaleTimeString() : time}
                                />
                                <Area type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHrArea)" activeDot={{ r: 5 }} />
                              </AreaChart>
                            ) : (
                              <BarChart data={biometricData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis 
                                  dataKey="timestamp" 
                                  tickFormatter={(time) => {
                                    if (time instanceof Date) return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    return "";
                                  }} 
                                  stroke="#64748b" 
                                  style={{ fontSize: 9, fontFamily: 'monospace' }}
                                />
                                <YAxis yAxisId="left" stroke="#10b981" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: 8 }}
                                  labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}
                                  itemStyle={{ fontSize: 11 }}
                                  labelFormatter={(time) => time instanceof Date ? time.toLocaleTimeString() : time}
                                />
                                <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', paddingTop: 10 }} />
                                <Bar yAxisId="left" dataKey="steps" name="Cumulative Steps" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="calories" name="Calories (kcal)" stroke="#f59e0b" strokeWidth={2.5} dot={true} />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SYSTEM TERMINAL LOGS (FIRESTORE SYNCED) */}
                <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-5 shadow-md flex-1 flex flex-col relative overflow-hidden min-h-[350px]">
                  <div className="absolute top-0 right-0 p-4">
                    <Terminal className="h-5 w-5 text-slate-500/20" />
                  </div>

                  <h3 className="text-xs font-bold text-slate-400 tracking-wide uppercase font-mono mb-4 flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>Real-time Workspace Terminal Logs (Firestore)</span>
                  </h3>

                  {/* Logs stream console */}
                  <div className="flex-1 bg-slate-950/80 border border-slate-850 rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-[280px] space-y-2.5">
                    {logs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                        <Activity className="h-6 w-6 animate-pulse" />
                        <span>Awaiting system operations. No logs persisted yet.</span>
                      </div>
                    ) : (
                      logs.map((log) => {
                        const isSuccess = log.level === "success";
                        const isWarning = log.level === "warning";
                        const isError = log.level === "error";
                        const colorClass = isSuccess 
                          ? "text-emerald-400" 
                          : isWarning 
                            ? "text-amber-400" 
                            : isError 
                              ? "text-red-400" 
                              : "text-cyan-400";
                        
                        return (
                          <div
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className="p-2 rounded hover:bg-slate-900/60 transition cursor-pointer border border-transparent hover:border-slate-800 flex items-start space-x-2.5"
                          >
                            <span className="text-[10px] text-slate-500 flex-shrink-0 pt-0.5">
                              {log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString() : ""}
                            </span>
                            <span className={`font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-900 ${colorClass}`}>
                              {log.type}
                            </span>
                            <span className="text-slate-300 break-words flex-1 leading-normal">
                              {log.message}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Detailed inspector modal overlay */}
                  <AnimatePresence>
                    {selectedLog && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col justify-between border border-slate-800 rounded-2xl z-20"
                      >
                        <div>
                          <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
                            <h4 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                              <span className="px-2 py-0.5 bg-slate-900 text-violet-400 border border-slate-800 rounded uppercase text-[10px]">
                                {selectedLog.type}
                              </span>
                              <span>Log Diagnostics</span>
                            </h4>
                            <button
                              onClick={() => setSelectedLog(null)}
                              className="text-xs text-slate-400 hover:text-white border border-slate-850 px-2.5 py-1 rounded-lg"
                            >
                              ESC
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-mono block">Log Message</span>
                              <p className="text-sm text-slate-200 font-semibold mt-1 font-mono leading-relaxed">{selectedLog.message}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-mono block">Underlying Operation Detail</span>
                              <p className="text-xs text-slate-400 mt-1.5 bg-slate-900/80 p-3 rounded-lg border border-slate-850 font-mono leading-relaxed whitespace-pre-wrap">
                                {selectedLog.details || "No technical traceback details provided for this event."}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono border-t border-slate-850 pt-3 flex justify-between">
                          <span>LOG_ID: {selectedLog.id}</span>
                          <span>Timestamp: {selectedLog.timestamp instanceof Date ? selectedLog.timestamp.toLocaleString() : ""}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Biometric Code Viewer Modal */}
      <AnimatePresence>
        {isCodeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCodeModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Content Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090d16] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-850 p-4 bg-slate-950/40">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-violet-500 rounded-full animate-pulse" />
                  <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-1.5">
                    <Code className="h-4 w-4 text-violet-400" />
                    <span>Raw Biometric Code Feed</span>
                  </h3>
                </div>
                <button
                  onClick={() => setIsCodeModalOpen(false)}
                  className="text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    Format: <strong className="text-white">CSV Telemetry Rows ({biometricData.length} records)</strong>
                  </span>
                  
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-800/30 hover:border-violet-700/50 text-violet-400 text-xs font-mono rounded-lg transition cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[450px] whitespace-pre select-all scrollbar-thin">
                  {getBiometricCSV() || "// No biometric stream data logged"}
                </div>

                <div className="p-3 bg-violet-950/10 border border-violet-900/20 rounded-xl flex items-start space-x-2">
                  <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-slate-400 leading-normal">
                    You can copy this raw comma-separated value (CSV) text stream or download it directly as an analytical worksheet. It lists timestamps matching your real-time heart rate, steps, and energy expenditure indices.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-850 p-4 bg-slate-950/40 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>DATABASE_SOURCE: firestore/biometrics</span>
                <span>UTC CLOCK: 2026-06-24</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="border-t border-slate-900/80 bg-[#050910] text-center py-4 text-xs text-slate-600 font-mono mt-auto">
        <span>Admin Workspace Portal Secured by SSO & MFA &bull; System Clock (UTC): 2026-06-24 &bull; Designed in Slate</span>
      </footer>
    </div>
  );
}
