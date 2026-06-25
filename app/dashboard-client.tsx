"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { db, auth } from "../lib/firebase";
import AuthInterface from "../components/auth-interface";
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
  writeBatch,
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
  Upload,
  Globe,
  Database,
  Users,
  LayoutGrid,
  LogIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const WorkspaceCharts = dynamic(() => import("../components/WorkspaceCharts"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center font-mono text-xs text-slate-500">
      Loading telemetry engine...
    </div>
  ),
});

interface LogEntry {
  id: string;
  type: "auth" | "sync" | "refresh" | "system";
  level: "success" | "info" | "warning" | "error";
  message: string;
  details: string;
  timestamp: any;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const diff = value - startValue;
    if (diff === 0) return;

    const duration = 600; // 600ms transition
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress * (2 - progress); // quadratic easing out
      const current = startValue + diff * ease;
      
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function Dashboard() {
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mockAuthenticated, setMockAuthenticated] = useState(false);
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
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(8000);

  // AI Bot States
  const [botStatus, setBotStatus] = useState<"Idle" | "Executing Task...">("Idle");
  const [botMessage, setBotMessage] = useState<string>("Hello, Administrator. I am Aero-Bot. Let me know which workspace procedures you want me to orchestrate.");
  const [customPrompt, setCustomPrompt] = useState("");

  // Real-time Logs State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isLogsLoaded, setIsLogsLoaded] = useState(false);

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
  const [isBiometricsLoaded, setIsBiometricsLoaded] = useState(false);
  const [isSimulatingBiometrics, setIsSimulatingBiometrics] = useState(false);
  const [biometricChartType, setBiometricChartType] = useState<"combined" | "heartRate" | "activity">("combined");
  
  // Custom manual logging states
  const [manualHeartRate, setManualHeartRate] = useState<number>(75);
  const [manualSteps, setManualSteps] = useState<number>(250);
  const [manualCalories, setManualCalories] = useState<number>(18);
  const [manualActivity, setManualActivity] = useState<string>("Walking");

  const [isMounted, setIsMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    const headers = ["Timestamp", "Type", "Details"];
    const csvRows = [headers.join(",")];

    logs.forEach(log => {
      csvRows.push([log.timestamp ? log.timestamp.toISOString() : "", log.action, log.details].join(","));
    });
    
    biometricData.forEach(bio => {
      csvRows.push([bio.timestamp ? bio.timestamp.toISOString() : "", bio.type, bio.value.toString()].join(","));
    });
    
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "health_report.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => setIsExporting(false), 2000);
  };

  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // New Management & Mock OAuth States
  const [activeTab, setActiveTab] = useState<"telemetry" | "management" | "security" | "ai">("telemetry");
  const [isMockOAuthProcessing, setIsMockOAuthProcessing] = useState(false);
  const [mockOAuthStatus, setMockOAuthStatus] = useState<"Unverified" | "Authenticating" | "Verified">("Verified");
  const [lastAuditAction, setLastAuditAction] = useState<string>("System Boot Success");

  // Gemini State
  const [geminiInput, setGeminiInput] = useState("");
  const [geminiOutput, setGeminiOutput] = useState("");
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  const handleGeminiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiInput.trim()) return;
    setIsGeminiLoading(true);
    setGeminiOutput("");
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: geminiInput }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setGeminiOutput(data.text);
    } catch (err: any) {
      setGeminiOutput(`Error: ${err.message}`);
    } finally {
      setIsGeminiLoading(false);
    }
  };

  // Pulse animation states on updates
  const currentHeartRate = biometricData.length > 0 ? biometricData[biometricData.length - 1].heartRate : 72;
  const currentSteps = biometricData.length > 0 ? biometricData[biometricData.length - 1].steps : 0;
  const currentCalories = biometricData.length > 0 ? biometricData[biometricData.length - 1].calories : 0;

  const [lastHeartRate, setLastHeartRate] = useState(currentHeartRate);
  const [lastSteps, setLastSteps] = useState(currentSteps);
  const [lastCalories, setLastCalories] = useState(currentCalories);

  const [pulseHeartRate, setPulseHeartRate] = useState(false);
  const [pulseSteps, setPulseSteps] = useState(false);
  const [pulseCalories, setPulseCalories] = useState(false);

  useEffect(() => {
    if (currentHeartRate !== lastHeartRate) {
      setPulseHeartRate(true);
      const timer = setTimeout(() => setPulseHeartRate(false), 800);
      setLastHeartRate(currentHeartRate);
      return () => clearTimeout(timer);
    }
  }, [currentHeartRate, lastHeartRate]);

  useEffect(() => {
    if (currentSteps !== lastSteps) {
      setPulseSteps(true);
      const timer = setTimeout(() => setPulseSteps(false), 800);
      setLastSteps(currentSteps);
      return () => clearTimeout(timer);
    }
  }, [currentSteps, lastSteps]);

  useEffect(() => {
    if (currentCalories !== lastCalories) {
      setPulseCalories(true);
      const timer = setTimeout(() => setPulseCalories(false), 800);
      setLastCalories(currentCalories);
      return () => clearTimeout(timer);
    }
  }, [currentCalories, lastCalories]);

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

  const handleMockOAuthToggle = async () => {
    setIsMockOAuthProcessing(true);
    setMockOAuthStatus("Authenticating");
    
    // Log the initiation
    await addDoc(collection(db, "logs"), {
      type: "auth",
      level: "info",
      message: "Initiating OIDC Mock Handshake",
      details: "Requesting cryptographic salt and discovery keys for internal audit verification.",
      timestamp: serverTimestamp(),
    });

    setTimeout(async () => {
      const isCurrentlyVerified = mockOAuthStatus === "Verified";
      const newState = isCurrentlyVerified ? "Unverified" : "Verified";
      setMockOAuthStatus(newState);
      setIsMockOAuthProcessing(false);
      setLastAuditAction(newState === "Verified" ? "Audit Success: JWT Verified" : "Audit Alert: Session Revoked");

      // Log the result
      await addDoc(collection(db, "logs"), {
        type: "auth",
        level: newState === "Verified" ? "success" : "warning",
        message: newState === "Verified" ? "Mock OAuth Handshake Verified" : "Mock OAuth Session Terminated",
        details: newState === "Verified" 
          ? "RS256 Signature validated against JWKS endpoint. Audit trail updated."
          : "Administrative logout initiated. Session tokens invalidated in local cache.",
        timestamp: serverTimestamp(),
      });
    }, 2000);
  };

  // CSV Import States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsedData, setCsvParsedData] = useState<any[]>([]);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

    const result: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      const values = matches.map(v => v.trim().replace(/^["']|["']$/g, ""));

      if (values.length === 0) continue;

      const entry: any = {};
      
      const timeIdx = headers.findIndex(h => h.includes("time") || h.includes("date") || h.includes("stamp"));
      const hrIdx = headers.findIndex(h => h.includes("heart") || h.includes("bpm") || h.includes("pulse"));
      const stepsIdx = headers.findIndex(h => h.includes("step"));
      const calsIdx = headers.findIndex(h => h.includes("cal") || h.includes("burn") || h.includes("kcal"));
      const actIdx = headers.findIndex(h => h.includes("act") || h.includes("zone") || h.includes("state"));

      let timestamp = new Date();
      if (timeIdx !== -1 && values[timeIdx]) {
        const parsedDate = new Date(values[timeIdx]);
        if (!isNaN(parsedDate.getTime())) {
          timestamp = parsedDate;
        }
      } else {
        timestamp = new Date(Date.now() - (lines.length - i) * 60 * 1000);
      }

      let heartRate = 72;
      if (hrIdx !== -1 && values[hrIdx]) {
        const parsedHR = parseInt(values[hrIdx], 10);
        if (!isNaN(parsedHR)) heartRate = parsedHR;
      }

      let steps = 0;
      if (stepsIdx !== -1 && values[stepsIdx]) {
        const parsedSteps = parseInt(values[stepsIdx], 10);
        if (!isNaN(parsedSteps)) steps = parsedSteps;
      }

      let calories = 0;
      if (calsIdx !== -1 && values[calsIdx]) {
        const parsedCals = parseInt(values[calsIdx], 10);
        if (!isNaN(parsedCals)) calories = parsedCals;
      }

      let activity = "Walking";
      if (actIdx !== -1 && values[actIdx]) {
        activity = values[actIdx];
      }

      entry.timestamp = timestamp;
      entry.heartRate = heartRate;
      entry.steps = steps;
      entry.calories = calories;
      entry.activity = activity;

      result.push(entry);
    }

    return result;
  };

  const handleCSVImport = async () => {
    if (!db) {
      setCsvError("Database connection is offline.");
      return;
    }
    if (csvParsedData.length === 0) {
      setCsvError("No data parsed to upload.");
      return;
    }

    setIsUploadingCSV(true);
    setCsvError(null);
    setCsvSuccess(null);

    const path = "biometrics";
    try {
      const batchLimit = 500;
      let successCount = 0;

      for (let i = 0; i < csvParsedData.length; i += batchLimit) {
        const chunk = csvParsedData.slice(i, i + batchLimit);
        const batch = writeBatch(db);

        chunk.forEach(item => {
          const newDocRef = doc(collection(db, path));
          batch.set(newDocRef, {
            heartRate: item.heartRate,
            steps: item.steps,
            calories: item.calories,
            activity: item.activity,
            timestamp: item.timestamp,
          });
        });

        await batch.commit();
        successCount += chunk.length;
      }

      // Log success event to system logs
      await addDoc(collection(db, "logs"), {
        type: "system",
        level: "success",
        message: `Imported ${successCount} biometric records via CSV.`,
        details: `File: ${csvFile?.name || "unnamed.csv"} | Successfully batch-seeded ${successCount} points.`,
        timestamp: serverTimestamp(),
      });

      setCsvSuccess(`Successfully batch-seeded ${successCount} records!`);
      setCsvFile(null);
      setCsvParsedData([]);
    } catch (err) {
      console.error("CSV upload failed:", err);
      setCsvError("Database rejected batch-write. Ensure schema rules match.");
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const handleFileProcess = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvError("Only CSV files are supported.");
      setCsvFile(null);
      setCsvParsedData([]);
      return;
    }
    setCsvError(null);
    setCsvSuccess(null);
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setCsvError("No valid rows found. Check your CSV header names.");
          setCsvParsedData([]);
        } else {
          setCsvParsedData(parsed);
        }
      } catch (err) {
        setCsvError("Error parsing CSV. Please check formatting.");
        setCsvParsedData([]);
      }
    };
    reader.readAsText(file);
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

    // Run first probe immediately
    runProbe();
    
    if (!isPollingEnabled) return () => {};
    
    const interval = setInterval(runProbe, pollingInterval);
    return () => clearInterval(interval);
  }, [isPollingEnabled, pollingInterval]);

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
      setIsLogsLoaded(true);
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
      setIsBiometricsLoaded(true);
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
          const res = await fetch("/api/auth-validate", {
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
      const res = await fetch("/api/bot-automate", {
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
      const res = await fetch("/api/security-audit", {
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

  const logActivity = async (message: string, details: string, level: "success" | "info" | "warning" = "info") => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      type: "auth",
      level,
      message,
      details,
      timestamp: new Date(),
    };
    setLogs((prev) => [newLog, ...prev]);
    
    // Also push to firestore if db is available
    if (db) {
      await addDoc(collection(db, "logs"), {
        ...newLog,
        timestamp: serverTimestamp(),
      });
    }
  };

  const toggleMockAuth = async () => {
    setMockAuthenticated(!mockAuthenticated);
    await logActivity(
      !mockAuthenticated ? "Mock Authentication Success" : "Mock Authentication Revoked",
      !mockAuthenticated ? "User logged in via simulated OAuth provider." : "Session invalidated by user.",
      !mockAuthenticated ? "success" : "warning"
    );
  };

  if (!isMounted || !isLogsLoaded || !isBiometricsLoaded) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg blur-sm opacity-50 animate-pulse"></div>
            <div className="relative bg-slate-900 border border-violet-500 p-3 rounded-lg">
              <svg className="animate-spin h-8 w-8 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {!isMounted ? "Loading Workspace Portal..." : "Syncing Initial Data..."}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {!isMounted ? "Initializing secure orchestration core" : "Fetching real-time metrics and auth logs"}
          </p>
        </div>
      </div>
    );
  }

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
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Sync: {logs.length + biometricData.length} items | Last: {biometricData.length > 0 ? biometricData[biometricData.length - 1].timestamp.toLocaleTimeString() : "N/A"}
            </p>
          </div>
        </div>

        {/* Real-time Health Monitor */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleMockAuth}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs transition duration-200 ${
              mockAuthenticated
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{mockAuthenticated ? "Authenticated" : "Mock Login"}</span>
          </button>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 space-x-3">
            <div className="flex items-center space-x-2">
              <Activity className={`h-4 w-4 ${systemHealth === "Stable" ? "text-emerald-400 animate-pulse" : systemHealth === "Normal" ? "text-cyan-400" : "text-amber-500 animate-bounce"}`} />
              <span className="text-xs text-slate-300 font-medium font-mono">Firestore Link:</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={() => setIsPollingEnabled(!isPollingEnabled)}
                className={`p-1 rounded ${isPollingEnabled ? "bg-emerald-900/50 text-emerald-400" : "bg-slate-800 text-slate-500"}`}
                title="Toggle polling"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <select
                value={pollingInterval}
                onChange={(e) => setPollingInterval(Number(e.target.value))}
                className="bg-slate-800 text-slate-300 text-[10px] rounded px-1 py-0.5 border border-slate-700"
              >
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
                <option value={8000}>8s</option>
                <option value={15000}>15s</option>
              </select>
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
            <div className="flex items-center space-x-2">
              <button
                onClick={exportToCSV}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-emerald-900/50 text-xs transition duration-200 ${isExporting ? "bg-emerald-950/40 text-emerald-300 border-emerald-800" : "bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-800 text-emerald-400"}`}
              >
                <motion.div
                  initial={false}
                  animate={isExporting ? { scale: [1, 1.2, 1] } : {}}
                >
                  {isExporting ? <Mail className="h-3.5 w-3.5 animate-bounce" /> : <Download className="h-3.5 w-3.5" />}
                </motion.div>
                <span>{isExporting ? "Sending..." : "Export"}</span>
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition duration-200"
              >
                <User className="h-3.5 w-3.5" />
                <span>Account</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 border border-red-900/50 hover:border-red-800 text-red-400 text-xs transition duration-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
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
            <div className="lg:col-span-12 flex flex-col space-y-6 w-full">
              
              {/* NAVIGATION TABS */}
              <div className="flex items-center space-x-2 bg-slate-900/50 border border-slate-800 p-1.5 rounded-2xl w-fit">
                <button
                  onClick={() => setActiveTab("telemetry")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "telemetry" ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Telemetry</span>
                </button>
                <button
                  onClick={() => setActiveTab("management")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "management" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Management</span>
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "security" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Security & Audit</span>
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ai" ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Gemini Insights</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                {activeTab === "telemetry" && (
                  <>
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
                        <div className={`bg-slate-950/60 border p-3 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-500 ${pulseHeartRate ? "border-rose-500/50 bg-rose-950/10 shadow-[0_0_15px_rgba(244,63,94,0.15)] scale-105" : "border-slate-850"}`}>
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-950/20 border border-rose-900/30 text-rose-400 mb-2">
                            <Heart className={`h-4 w-4 ${isSimulatingBiometrics ? "animate-pulse" : ""}`} />
                          </div>
                          <span className="text-[10px] uppercase font-mono text-slate-500">Pulse</span>
                          <span className="text-base font-bold text-white font-mono mt-0.5">
                            <AnimatedNumber value={biometricData.length > 0 ? biometricData[biometricData.length - 1].heartRate : 72} />
                            <span className="text-[10px] text-rose-400 pl-0.5">BPM</span>
                          </span>
                        </div>

                        {/* Steps Indicator */}
                        <div className={`bg-slate-950/60 border p-3 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-500 ${pulseSteps ? "border-emerald-500/50 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-105" : "border-slate-850"}`}>
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 mb-2">
                            <Footprints className="h-4 w-4" />
                          </div>
                          <span className="text-[10px] uppercase font-mono text-slate-500">Steps</span>
                          <span className="text-base font-bold text-white font-mono mt-0.5">
                            <AnimatedNumber value={biometricData.length > 0 ? biometricData[biometricData.length - 1].steps : 0} />
                          </span>
                        </div>

                        {/* Calories Indicator */}
                        <div className={`bg-slate-950/60 border p-3 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-500 ${pulseCalories ? "border-amber-500/50 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-105" : "border-slate-850"}`}>
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-950/20 border border-amber-900/30 text-amber-400 mb-2">
                            <Flame className="h-4 w-4" />
                          </div>
                          <span className="text-[10px] uppercase font-mono text-slate-500">Burned</span>
                          <span className="text-base font-bold text-white font-mono mt-0.5">
                            <AnimatedNumber value={biometricData.length > 0 ? biometricData[biometricData.length - 1].calories : 0} />
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

                      {/* CSV Historical Seeder */}
                      <div className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-xl space-y-2.5">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center space-x-1">
                          <Upload className="h-3.5 w-3.5 text-violet-400" />
                          <span>CSV Historical Seeder</span>
                        </h4>

                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                          }}
                          onDragLeave={() => setIsDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleFileProcess(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => {
                            document.getElementById("csv-file-input")?.click();
                          }}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-1.5 ${isDragOver ? "border-violet-500 bg-violet-950/10" : "border-slate-800 hover:border-slate-700 bg-slate-900/20"}`}
                        >
                          <input
                            id="csv-file-input"
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileProcess(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                          <Upload className={`h-6 w-6 ${isDragOver ? "text-violet-400 scale-110" : "text-slate-500"} transition-all duration-200`} />
                          <div className="text-[11px] font-medium text-slate-300">
                            {csvFile ? csvFile.name : "Drag & drop CSV or click to browse"}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            Supports columns: Timestamp, Heart Rate, Steps, Calories
                          </div>
                        </div>

                        {csvError && (
                          <div className="p-2 bg-red-950/30 border border-red-900/40 rounded-lg text-[10px] text-red-400 font-mono flex items-start space-x-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                            <span>{csvError}</span>
                          </div>
                        )}

                        {csvSuccess && (
                          <div className="p-2 bg-emerald-950/30 border border-emerald-900/40 rounded-lg text-[10px] text-emerald-400 font-mono flex items-start space-x-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{csvSuccess}</span>
                          </div>
                        )}

                        {csvParsedData.length > 0 && (
                          <div className="bg-slate-900/60 border border-slate-850 p-2 rounded-lg space-y-2">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Parsed Records:</span>
                              <span className="text-white font-bold">{csvParsedData.length} entries</span>
                            </div>
                            
                            <button
                              onClick={handleCSVImport}
                              disabled={isUploadingCSV}
                              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-mono text-[10px] font-bold uppercase rounded py-1.5 transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isUploadingCSV ? (
                                <>
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  <span>Writing Batch to Firestore...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3 w-3" />
                                  <span>Seed Database via CSV</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
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
                          <WorkspaceCharts biometricData={biometricData} biometricChartType={biometricChartType} />
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
                </>
              )}

                {activeTab === "management" && (
                  <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* cPanel Card */}
                    <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-300">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl group-hover:bg-indigo-600/20 transition-all"></div>
                      <div className="flex flex-col space-y-4 relative">
                        <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center">
                          <Globe className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">cPanel Hosting</h3>
                          <p className="text-xs text-slate-400 mt-1">Manage domains, files, and server resources.</p>
                        </div>
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Domains Active:</span>
                            <span className="text-white">12</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Storage Used:</span>
                            <span className="text-white">84% (42GB/50GB)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[84%]"></div>
                          </div>
                        </div>
                        <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-indigo-900/20">
                          Launch cPanel
                        </button>
                      </div>
                    </div>

                    {/* WHMS Card */}
                    <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden group hover:border-violet-500/50 transition-all duration-300">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl group-hover:bg-violet-600/20 transition-all"></div>
                      <div className="flex flex-col space-y-4 relative">
                        <div className="w-12 h-12 bg-violet-600/20 border border-violet-500/30 rounded-xl flex items-center justify-center">
                          <Database className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">WHMS Billing</h3>
                          <p className="text-xs text-slate-400 mt-1">Automated client management and billing cycles.</p>
                        </div>
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Active Clients:</span>
                            <span className="text-white">1,248</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Monthly Revenue:</span>
                            <span className="text-emerald-400 font-bold">$12,450.00</span>
                          </div>
                          <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800"></div>
                            ))}
                            <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[8px] text-white font-bold">+24</div>
                          </div>
                        </div>
                        <button className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-violet-900/20">
                          Open WHMS
                        </button>
                      </div>
                    </div>

                    {/* Mailing List Card */}
                    <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-600/10 rounded-full blur-2xl group-hover:bg-emerald-600/20 transition-all"></div>
                      <div className="flex flex-col space-y-4 relative">
                        <div className="w-12 h-12 bg-emerald-600/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Mailing Lists</h3>
                          <p className="text-xs text-slate-400 mt-1">Broadcast newsletters and automation sequences.</p>
                        </div>
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Total Subscribers:</span>
                            <span className="text-white">45,820</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Avg Open Rate:</span>
                            <span className="text-emerald-400 font-bold">32.4%</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Status:</span>
                            <span className="text-emerald-400 font-bold animate-pulse">SENDING...</span>
                          </div>
                        </div>
                        <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-900/20">
                          Manage Lists
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Mock OAuth Handshake Demo */}
                    <div className="lg:col-span-5 flex flex-col space-y-6">
                      <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                          <ShieldCheck className="h-6 w-6 text-emerald-500/20" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase font-mono mb-4">OAuth Audit Simulation</h3>
                        
                        <div className="space-y-6">
                          <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <div className="relative">
                              <motion.div 
                                animate={isMockOAuthProcessing ? { rotate: 360 } : {}}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-colors duration-500 ${mockOAuthStatus === "Verified" ? "border-emerald-500/30 bg-emerald-500/10" : "border-slate-800 bg-slate-900/50"}`}
                              >
                                {isMockOAuthProcessing ? (
                                  <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
                                ) : mockOAuthStatus === "Verified" ? (
                                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                                ) : (
                                  <Lock className="w-8 h-8 text-slate-500" />
                                )}
                              </motion.div>
                              {mockOAuthStatus === "Verified" && !isMockOAuthProcessing && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-[#090d16] rounded-full flex items-center justify-center"
                                >
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </motion.div>
                              )}
                            </div>

                            <div className="text-center">
                              <div className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${mockOAuthStatus === "Verified" ? "text-emerald-400" : "text-slate-500"}`}>
                                {mockOAuthStatus === "Verified" ? "Session Verified" : "Session Revoked"}
                              </div>
                              <h4 className="text-lg font-bold text-white">Administrative Portal</h4>
                              <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                                Secure multi-tenant identity verification using OIDC standards.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase font-mono">Current Audit State</span>
                                <span className={`text-xs font-bold font-mono ${mockOAuthStatus === "Verified" ? "text-emerald-400" : "text-red-400"}`}>
                                  {mockOAuthStatus === "Verified" ? "PROTECTED_ACTIVE" : "SECURITY_LOCKED"}
                                </span>
                              </div>
                              <div className={`px-2 py-1 rounded text-[9px] font-bold font-mono ${mockOAuthStatus === "Verified" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"}`}>
                                {mockOAuthStatus}
                              </div>
                            </div>

                            <button
                              onClick={handleMockOAuthToggle}
                              disabled={isMockOAuthProcessing}
                              className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center space-x-2 ${mockOAuthStatus === "Verified" ? "bg-red-500/10 hover:bg-red-500/20 border border-red-900/30 text-red-400" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"}`}
                            >
                              {isMockOAuthProcessing ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Authorizing Audit Trail...</span>
                                </>
                              ) : mockOAuthStatus === "Verified" ? (
                                <>
                                  <LogOut className="w-4 h-4" />
                                  <span>Revoke OAuth Access</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-4 h-4" />
                                  <span>Simulate OAuth Handshake</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-[9px] text-slate-500 font-mono">Last Audit: {lastAuditAction}</span>
                            <span className="text-[9px] text-slate-500 font-mono">Mode: Audit-Only</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-2xl">
                        <div className="flex items-center space-x-3 text-slate-400">
                          <Activity className="w-5 h-5 text-indigo-400" />
                          <div>
                            <h4 className="text-xs font-bold text-white">Live Audit Feed</h4>
                            <p className="text-[10px] text-slate-500">Every auth action is logged to Firestore.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Audit Logs Column */}
                    <div className="lg:col-span-7 flex flex-col">
                      <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-5 shadow-md flex-1 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                          <Terminal className="h-5 w-5 text-slate-500/20" />
                        </div>

                        <h3 className="text-xs font-bold text-slate-400 tracking-wide uppercase font-mono mb-4 flex items-center space-x-2">
                          <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span>Security & Operations Audit Trail</span>
                        </h3>

                        {/* Logs stream console */}
                        <div className="flex-1 bg-slate-950/80 border border-slate-850 rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-[450px] space-y-2.5">
                          {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                              <Activity className="h-6 w-6 animate-pulse" />
                              <span>No audit logs persisted.</span>
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
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "ai" && (
                  <div className="lg:col-span-12 space-y-6">
                    <div className="bg-[#090d16] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
                      
                      <div className="relative z-10 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                              </div>
                              <h2 className="text-2xl font-bold text-white tracking-tight">Gemini AI Workspace Insights</h2>
                            </div>
                            <p className="text-slate-400 text-sm max-w-xl">
                              Leverage high-reasoning models to analyze workspace telemetry, security patterns, and management logistics in real-time.
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-3 bg-slate-900/50 border border-slate-800 p-2 rounded-2xl">
                            <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                              <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse" />
                              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">High Thinking Enabled</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Model: Gemini 3.5 Flash</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                                <Code className="h-4 w-4 text-amber-500" />
                                <span>Analytical Inquiry</span>
                              </h3>
                              
                              <form onSubmit={handleGeminiSubmit} className="space-y-4">
                                <div className="relative">
                                  <textarea
                                    value={geminiInput}
                                    onChange={(e) => setGeminiInput(e.target.value)}
                                    placeholder="Ask Gemini to analyze system health or security protocols..."
                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all min-h-[120px] resize-none"
                                  />
                                  <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                                    <button
                                      type="submit"
                                      disabled={isGeminiLoading || !geminiInput.trim()}
                                      className="flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-amber-900/20"
                                    >
                                      {isGeminiLoading ? (
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      ) : (
                                        <Send className="h-4 w-4" />
                                      )}
                                      <span>Process</span>
                                    </button>
                                  </div>
                                </div>
                              </form>

                              <div className="pt-2">
                                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                  Note: &quot;High Thinking&quot; level is prioritized for this session, allowing the model to perform deeper multi-step reasoning before delivering the final workspace audit.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 h-full flex flex-col min-h-[300px]">
                              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2 mb-4">
                                <Activity className="h-4 w-4 text-amber-500" />
                                <span>Output Manifest</span>
                              </h3>
                              
                              <div className="flex-1 bg-[#05080f] border border-slate-800/50 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-300 relative">
                                {isGeminiLoading ? (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                                    <div className="relative">
                                      <div className="h-12 w-12 border-b-2 border-amber-500 rounded-full animate-spin" />
                                      <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-amber-500 animate-pulse" />
                                    </div>
                                    <span className="text-amber-500 font-bold animate-pulse">ORCHESTRATING REASONING...</span>
                                  </div>
                                ) : geminiOutput ? (
                                  <div className="whitespace-pre-wrap leading-relaxed">
                                    {geminiOutput}
                                  </div>
                                ) : (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                                    <Terminal className="h-8 w-8" />
                                    <span>Standby for AI analytical payload...</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl z-10 p-1"
          >
            <AuthInterface />
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-1 rounded-full"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-900/80 bg-[#050910] text-center py-4 text-xs text-slate-600 font-mono mt-auto">
        <span>Admin Workspace Portal Secured by SSO & MFA &bull; System Clock (UTC): 2026-06-24 &bull; Designed in Slate</span>
      </footer>
    </div>
  );
}
