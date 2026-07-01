'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, GitFork, ExternalLink, ShieldAlert, Cpu, Globe, Terminal, Code } from 'lucide-react';

interface Repository {
  rank: number;
  name: string;
  stars: number;
  forks: number;
  language: string | null;
  description: string | null;
  url: string;
}

const REPOS: Repository[] = [
  {
    "rank": 1,
    "name": "FULU-Foundation/OrcaSlicer-bambulab",
    "stars": 5196,
    "forks": 2865,
    "language": "C++",
    "description": null,
    "url": "https://github.com/FULU-Foundation/OrcaSlicer-bambulab"
  },
  {
    "rank": 2,
    "name": "Nightmare-Eclipse/YellowKey",
    "stars": 2743,
    "forks": 575,
    "language": null,
    "description": "YellowKey Bitlocker Bypass Vulnerability",
    "url": "https://github.com/Nightmare-Eclipse/YellowKey"
  },
  {
    "rank": 3,
    "name": "nexu-io/html-anything",
    "stars": 2417,
    "forks": 282,
    "language": "HTML",
    "description": "✨ The agentic HTML editor — your local AI agent writes the HTML, you ship it. 🚀 75 Skills × 9 Surfaces (magazine · deck · poster · XHS / tweet · prototype · data report · Hyperframes) 🛡️ Sandboxed preview · 📤 1-click to WeChat / X / Zhihu / HTML / PNG 🔑 Zero API key — Claude Code / Cursor / Codex / Gemini / Copilot / OpenCode / Qwen / Aider.",
    "url": "https://github.com/nexu-io/html-anything"
  },
  {
    "rank": 4,
    "name": "huangserva/3DCellForge",
    "stars": 2087,
    "forks": 351,
    "language": "JavaScript",
    "description": "AI-powered interactive 3D model generation, inspection, and presentation studio.",
    "url": "https://github.com/huangserva/3DCellForge"
  },
  {
    "rank": 5,
    "name": "yetone/native-feel-skill",
    "stars": 1217,
    "forks": 55,
    "language": null,
    "description": "An Agent Skill for designing cross-platform desktop apps that feel native — distilled from Raycast's 2.0 deep-dive and reverse engineering of Raycast Beta.app. Eight architectural tenets, four-layer architecture, WebKit/WebView2 survival guide, 75-item ship audit.",
    "url": "https://github.com/yetone/native-feel-skill"
  },
  {
    "rank": 6,
    "name": "HermannBjorgvin/Clawdmeter",
    "stars": 1069,
    "forks": 96,
    "language": "C",
    "description": "ESP32 desk dashboard that shows Claude Code usage",
    "url": "https://github.com/HermannBjorgvin/Clawdmeter"
  },
  {
    "rank": 7,
    "name": "simonlin1212/a-stock-data",
    "stars": 985,
    "forks": 229,
    "language": null,
    "description": "A 股全栈数据工具包 — 6层架构 · 15个端点 · 7个数据源 | AI Skill for China A-Share Market Data",
    "url": "https://github.com/simonlin1212/a-stock-data"
  },
  {
    "rank": 8,
    "name": "ywnd1144/Gopay_plus_automatic",
    "stars": 900,
    "forks": 534,
    "language": "Python",
    "description": null,
    "url": "https://github.com/ywnd1144/Gopay_plus_automatic"
  },
  {
    "rank": 9,
    "name": "vercel-labs/zero",
    "stars": 861,
    "forks": 44,
    "language": "C",
    "description": "The programming language for agents",
    "url": "https://github.com/vercel-labs/zero"
  },
  {
    "rank": 10,
    "name": "TencentARC/Pixal3D",
    "stars": 793,
    "forks": 63,
    "language": "Python",
    "description": "[SIGGRAPH 2026] Pixal3D: Pixel-Aligned 3D Generation from Images",
    "url": "https://github.com/TencentARC/Pixal3D"
  },
  {
    "rank": 11,
    "name": "DepthFirstDisclosures/Nginx-Rift",
    "stars": 644,
    "forks": 104,
    "language": "Python",
    "description": "exploit for CVE-2026-42945",
    "url": "https://github.com/DepthFirstDisclosures/Nginx-Rift"
  },
  {
    "rank": 12,
    "name": "cclank/cell-architecture-studio",
    "stars": 616,
    "forks": 140,
    "language": "TypeScript",
    "description": "Interactive 3D cell architecture gallery built with React and Three.js",
    "url": "https://github.com/cclank/cell-architecture-studio"
  },
  {
    "rank": 13,
    "name": "chrisbanes/skills",
    "stars": 572,
    "forks": 27,
    "language": null,
    "description": "Skills for Kotlin, Jetpack Compose, and Android development",
    "url": "https://github.com/chrisbanes/skills"
  },
  {
    "rank": 14,
    "name": "lillian039/ELF",
    "stars": 569,
    "forks": 34,
    "language": "Python",
    "description": null,
    "url": "https://github.com/lillian039/ELF"
  },
  {
    "rank": 15,
    "name": "jasonkneen/tiny-world-builder",
    "stars": 553,
    "forks": 78,
    "language": "HTML",
    "description": "tiny-world-builder",
    "url": "https://github.com/jasonkneen/tiny-world-builder"
  },
  {
    "rank": 16,
    "name": "DenisSergeevitch/agents-best-practices",
    "stars": 542,
    "forks": 44,
    "language": null,
    "description": "Provider-neutral Agent Skill for Codex, Claude Code, and agentic harness design.",
    "url": "https://github.com/DenisSergeevitch/agents-best-practices"
  },
  {
    "rank": 17,
    "name": "Rhythmplocutter/printer-offline-fix",
    "stars": 540,
    "forks": 0,
    "language": "PowerShell",
    "description": "printer offline fix || printer offline || printer offline driver || printer offline fix windows",
    "url": "https://github.com/Rhythmplocutter/printer-offline-fix"
  },
  {
    "rank": 18,
    "name": "thakur-works/DarkGPT",
    "stars": 534,
    "forks": 90,
    "language": null,
    "description": "Darkgpt mod free #chatgpt",
    "url": "https://github.com/thakur-works/DarkGPT"
  },
  {
    "rank": 19,
    "name": "patchfighterway90/cs2-external-overlay",
    "stars": 534,
    "forks": 104,
    "language": "Python",
    "description": "The cs2 external helper tool is a software utility designed for gamers and developers. It provides a set of features to enhance the gaming experience, including a customizable overlay. The tool is particularly useful for users who want to access additional information during gameplay.",
    "url": "https://github.com/patchfighterway90/cs2-external-overlay"
  },
  {
    "rank": 20,
    "name": "thakur-works/Velocity-Executor",
    "stars": 528,
    "forks": 90,
    "language": null,
    "description": "This repository contains Velocity Executor — a free Roblox script executor for PC built for fast injection, stable performance, and easy access. Includes Level 8 execution in 2026 with no ads, no key checkpoints, and no extra verification.",
    "url": "https://github.com/thakur-works/Velocity-Executor"
  },
  {
    "rank": 21,
    "name": "TrueGunsmithFence/Hentaihunter",
    "stars": 525,
    "forks": 0,
    "language": "Python",
    "description": "Hentaihunter - How to steal your Doujinshi easily",
    "url": "https://github.com/TrueGunsmithFence/Hentaihunter"
  },
  {
    "rank": 22,
    "name": "trong776/Roblox-Hub-2026",
    "stars": 522,
    "forks": 90,
    "language": null,
    "description": "Developer utilities for Roblox game testing — Lua tools for exploring game mechanics and performance. MIT License.",
    "url": "https://github.com/trong776/Roblox-Hub-2026"
  },
  {
    "rank": 23,
    "name": "Nightmare-Eclipse/GreenPlasma",
    "stars": 521,
    "forks": 152,
    "language": "C++",
    "description": "GreenPlasma Windows CTFMON Arbitrary Section Creation Elevation of Privileges Vulnerability",
    "url": "https://github.com/Nightmare-Eclipse/GreenPlasma"
  },
  {
    "rank": 24,
    "name": "grandeurcoredecoder/f95zone",
    "stars": 521,
    "forks": 1,
    "language": "PowerShell",
    "description": "Unofficial Game Updater for the F95Zone platform",
    "url": "https://github.com/grandeurcoredecoder/f95zone"
  },
  {
    "rank": 25,
    "name": "S4rdenz/gta-5-mod-menu",
    "stars": 516,
    "forks": 157,
    "language": null,
    "description": "🚀 Dominate GTA V servers with this free, reliable FiveM mod menu featuring ESP, aimbot, and more, designed for Steam and Epic Games versions.",
    "url": "https://github.com/S4rdenz/gta-5-mod-menu"
  },
  {
    "rank": 26,
    "name": "ltyzen/KMSAutoTool",
    "stars": 502,
    "forks": 0,
    "language": "C++",
    "description": "System license utility Windows product key manager Office license assistant Volume Licensing tool HWID management system deployment utility desktop OS setup enterprise license emulator digital license helper software repository installer package system verification tool.",
    "url": "https://github.com/ltyzen/KMSAutoTool"
  },
  {
    "rank": 27,
    "name": "JUk1-GH/gpt-promo-scanner",
    "stars": 501,
    "forks": 104,
    "language": "Python",
    "description": "ChatGPT Team(Business) 促销码自动扫描工具 — 批量发现/验证/价格收集，支持 17 国 34 个码，最高折扣 71% | ChatGPT Business promo code scanner — batch discovery, validation, price collection, 34 codes across 17 countries, up to 71% off",
    "url": "https://github.com/JUk1-GH/gpt-promo-scanner"
  },
  {
    "rank": 28,
    "name": "trong776/gta-5-mod-menu",
    "stars": 497,
    "forks": 200,
    "language": null,
    "description": "External game enhancement for GTA V single-player. ImGui overlay, no injection, minimal FPS impact. Windows x64, C++17.",
    "url": "https://github.com/trong776/gta-5-mod-menu"
  },
  {
    "rank": 29,
    "name": "SubamanojJ-2004/gta-5-mod-menu",
    "stars": 485,
    "forks": 62,
    "language": null,
    "description": "Ultimate Enhancement Toolkit for GTA V — powerful mod menu with ESP, vehicle spawner, recovery features, and clean UI",
    "url": "https://github.com/SubamanojJ-2004/gta-5-mod-menu"
  },
  {
    "rank": 30,
    "name": "iampedii/WhiteDNS",
    "stars": 467,
    "forks": 39,
    "language": "Kotlin",
    "description": "Source-available Android DNS tunneling client with VPN and proxy modes, backed by MasterDNS & StormDNS.",
    "url": "https://github.com/iampedii/WhiteDNS"
  },
  {
    "rank": 31,
    "name": "0xdeadbeefnetwork/ssh-keysign-pwn",
    "stars": 462,
    "forks": 57,
    "language": "C",
    "description": "Steal SSH host private keys and /etc/shadow via the ptrace_may_access mm-NULL bypass + pidfd_getfd. Pre-31e62c2ebbfd kernels.",
    "url": "https://github.com/0xdeadbeefnetwork/ssh-keysign-pwn"
  },
  {
    "rank": 32,
    "name": "v12-security/pocs",
    "stars": 462,
    "forks": 83,
    "language": "C",
    "description": "poc it like it's hot",
    "url": "https://github.com/v12-security/pocs"
  },
  {
    "rank": 33,
    "name": "B3hnamR/PsiphonOverMITM",
    "stars": 453,
    "forks": 73,
    "language": "PowerShell",
    "description": null,
    "url": "https://github.com/B3hnamR/PsiphonOverMITM"
  },
  {
    "rank": 34,
    "name": "lucasfrre/BongoCat-Desktop",
    "stars": 444,
    "forks": 0,
    "language": "C++",
    "description": "BongoCat: Interactive stream overlay. Mouse and keyboard tracker, tablet pen pressure, osu! playstyle mode. Custom skin editor, transparent background, OBS studio plugin, gamepad support. Keypress visualizer, RGB lighting sync, emote animations, desktop pet, live reaction tool, WASD mapping.",
    "url": "https://github.com/lucasfrre/BongoCat-Desktop"
  },
  {
    "rank": 35,
    "name": "PrimeKeeper58/blooket-hacks",
    "stars": 440,
    "forks": 3,
    "language": "JavaScript",
    "description": "blooket menu || blooket || blooket hacks",
    "url": "https://github.com/PrimeKeeper58/blooket-hacks"
  },
  {
    "rank": 36,
    "name": "jiaoyanming0-bot/OPAutoClicker",
    "stars": 437,
    "forks": 1,
    "language": "C#",
    "description": "OP Auto Clicker: Fast click interval, milliseconds, seconds. Left, right, middle button. keyboard auto clicker Single, double, triple click. Repeat until stopped, fixed count. Current location, pick coordinates. Hotkey trigger, start stop shortcut. Record playback, macro, Roblox AFK, Minecraft, mouse emulator, portable. ",
    "url": "https://github.com/jiaoyanming0-bot/OPAutoClicker"
  },
  {
    "rank": 37,
    "name": "EnsignKazekage/Prodigy-Hacks",
    "stars": 436,
    "forks": 0,
    "language": "Python",
    "description": "Prodigymathgamehacking || prodigy hacks || prodigymathgame",
    "url": "https://github.com/EnsignKazekage/Prodigy-Hacks"
  },
  {
    "rank": 38,
    "name": "alexaloneboy1-droid/Invincible-VS-Showdown-Desktop",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "Invincible VS Game 2026 PC Download Best Desktop Fighter 2026 New Release 🎮💥",
    "url": "https://github.com/alexaloneboy1-droid/Invincible-VS-Showdown-Desktop"
  },
  {
    "rank": 39,
    "name": "DaGortx/Neural-WA-Broadcaster",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "WhatsApp Auto Text Sender 2026 - Undetected Bulk Messaging Tool ❤️ 🔥",
    "url": "https://github.com/DaGortx/Neural-WA-Broadcaster"
  },
  {
    "rank": 40,
    "name": "Sunderpal18/printer-offline-revival",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🖨️ Ultimate Printer Offline Fix Guide 2026 – Step-by-Step for HP & Brother",
    "url": "https://github.com/Sunderpal18/printer-offline-revival"
  },
  {
    "rank": 41,
    "name": "NirmalKumar-77/R6S-Rainmaker-2027",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "R6 Siege Next-Gen Auto-Aim & Wallhack 2026 – Undetected Cheat Engine",
    "url": "https://github.com/NirmalKumar-77/R6S-Rainmaker-2027"
  },
  {
    "rank": 42,
    "name": "AriefCahyaSubagja/Subnautica-CSharp-Toolkit",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🔥 Subnautica Mods 2026 – Best New Mods & Tools for Below Zero",
    "url": "https://github.com/AriefCahyaSubagja/Subnautica-CSharp-Toolkit"
  },
  {
    "rank": 43,
    "name": "b23ee1027/hardware-masquerade-kit",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "Best Free Hardware ID Spoofer 2026 🛡️ Ultimate HWID & MAC Changer Tool",
    "url": "https://github.com/b23ee1027/hardware-masquerade-kit"
  },
  {
    "rank": 44,
    "name": "Amber82120/discord-webhook-orchestrator",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🚀 Discord Webhook Automator 2026 – Fast Server Modding Tool",
    "url": "https://github.com/Amber82120/discord-webhook-orchestrator"
  },
  {
    "rank": 45,
    "name": "BharathKumarSuresh/claude-design-system-hooks",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🚀 Ultimate Claude Code AI Design Skills & Hooks Bundle 2026 – Free Install",
    "url": "https://github.com/BharathKumarSuresh/claude-design-system-hooks"
  },
  {
    "rank": 46,
    "name": "mk7024490-glitch/aura-edge-optimizer",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "Best Free Minecraft Vape V4 Hacks 2026 - New Client Download",
    "url": "https://github.com/mk7024490-glitch/aura-edge-optimizer"
  },
  {
    "rank": 47,
    "name": "Pierre021/Shapez-2-Orchestrator-Overhaul",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🔧 Modular Factory Blueprints 2026 - Shapez 2 Logic & Automation Tool",
    "url": "https://github.com/Pierre021/Shapez-2-Orchestrator-Overhaul"
  },
  {
    "rank": 48,
    "name": "Justarandomguy2389417293/LEGO-Batman-Action-Adventure-Texure-Utility",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "Top LEGO Batman Legacy of the Dark Knight Mods & Texture Pack 2026 🦇⚡",
    "url": "https://github.com/Justarandomguy2389417293/LEGO-Batman-Action-Adventure-Texure-Utility"
  },
  {
    "rank": 49,
    "name": "pamireddyb230690ar-hue/StarCitizen-Community-Localization-Toolkit",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🚀 Star Citizen 2026 Localization Hub: Ultimate Modding Guide & Language Files",
    "url": "https://github.com/pamireddyb230690ar-hue/StarCitizen-Community-Localization-Toolkit"
  },
  {
    "rank": 50,
    "name": "pritankan/Wallpaper-Engine-Project-Launcher",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "Top Free Animated Wallpaper Engine Download 2026 – Live Wallpapers for PC",
    "url": "https://github.com/pritankan/Wallpaper-Engine-Project-Launcher"
  },
  {
    "rank": 51,
    "name": "kshreya1323/Acrobat-Esprit-Edition",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🚀 Acrobat Editor 2026 Pro DC — Ultimate PDF Breaker & Unleashed Utility Download",
    "url": "https://github.com/kshreya1323/Acrobat-Esprit-Edition"
  },
  {
    "rank": 52,
    "name": "25ds1000041-ship-it/yt-to-raw-audio",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "YT Downloader 2026: Fast MP4 & MKV Converter – Free & Simple",
    "url": "https://github.com/25ds1000041-ship-it/yt-to-raw-audio"
  },
  {
    "rank": 53,
    "name": "SoriaNicolas94/Auroral-MC-Mod",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🚀 Minecraft Vape V4 Hack 2026 – Free KillAura & ESP Client Download",
    "url": "https://github.com/SoriaNicolas94/Auroral-MC-Mod"
  },
  {
    "rank": 54,
    "name": "cyldz666/Arc-Raiders-Latency-Redux-Kit",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "Ultimate Arc Raiders FPS Booster 2026: Fix Packet Loss & Jitter ⚡ Free Network Optimizer",
    "url": "https://github.com/cyldz666/Arc-Raiders-Latency-Redux-Kit"
  },
  {
    "rank": 55,
    "name": "2508965-ship-it/harmonist-orchestral",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🚀 Multi-Agent Orchestration Engine 2026 – Build & Deploy AI Swarms with Claude Code",
    "url": "https://github.com/2508965-ship-it/harmonist-orchestral"
  },
  {
    "rank": 56,
    "name": "magnusenterprises/Jade-Jenny-Nexus-2026",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "Jenny Mod Minecraft 2026 🔥 Free Download For All Versions (1.12.2 + Forge)",
    "url": "https://github.com/magnusenterprises/Jade-Jenny-Nexus-2026"
  },
  {
    "rank": 57,
    "name": "OdgerSan/VoidStrap-Edge-Optimizer",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "The Ultimate Roblox Performance Mod 2026 ⚡ VoidStrap FPS Unlocker & Modding Toolkit",
    "url": "https://github.com/OdgerSan/VoidStrap-Edge-Optimizer"
  },
  {
    "rank": 58,
    "name": "habbouchzineb/delta-vault-toolkit",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "Ultimate Script Hub Roblox 2026 🔥 Instant Credits Hack Download",
    "url": "https://github.com/habbouchzineb/delta-vault-toolkit"
  },
  {
    "rank": 59,
    "name": "MardaRizkyPurwadi/Warzone-2026-Scan-Framework",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🛡️ Warzone 2026 DM-A – Ultimate Pixel Scan Bot & Mod Menu for COD Black Ops 6",
    "url": "https://github.com/MardaRizkyPurwadi/Warzone-2026-Scan-Framework"
  },
  {
    "rank": 60,
    "name": "Scratch-191/Canva-Pro-Toolkit",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🚀 Canva Pro Lifetime 2026 – Free Access & AI Design Suite by Mr. Craft",
    "url": "https://github.com/Scratch-191/Canva-Pro-Toolkit"
  },
  {
    "rank": 61,
    "name": "shimuljr54/Vortex-Configurator-2026",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "Best Fortnite Vortex 2026 Hacks 🚀 Aimbot, FOV, & Anti-Cheat Bypass",
    "url": "https://github.com/shimuljr54/Vortex-Configurator-2026"
  },
  {
    "rank": 62,
    "name": "JAGATHEESHVAR/blox-fruits-autofarm-evo-2026",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🚀 Free Blox Fruits Auto Farm Script 2026 – No Key Hack New",
    "url": "https://github.com/JAGATHEESHVAR/blox-fruits-autofarm-evo-2026"
  },
  {
    "rank": 63,
    "name": "SendoPnM/Subnautica-2-Nitrox-PS5-Port",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "Subnautica 2 Multiplayer Mod 2026 🔥 PS5 Xbox Steam Release Date & Porting Guide",
    "url": "https://github.com/SendoPnM/Subnautica-2-Nitrox-PS5-Port"
  },
  {
    "rank": 64,
    "name": "NguyenVietHoang1804/Aegis-Hardware-Anonymizer",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "Ultimate Hardware & MAC Spoofer 2026 🛡️ Game Spoof Suite – Instant System Anonymizer",
    "url": "https://github.com/NguyenVietHoang1804/Aegis-Hardware-Anonymizer"
  },
  {
    "rank": 65,
    "name": "San-0/Steam-Frame-Forecaster",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "⚡ Steam FPS Estimator 2026 – Ultimate PC Gaming Performance Benchmark Tool 🚀",
    "url": "https://github.com/San-0/Steam-Frame-Forecaster"
  },
  {
    "rank": 66,
    "name": "joyber/steam-dlc-architect-edition",
    "stars": 420,
    "forks": 0,
    "language": null,
    "description": "🔥 Free Steam DLC Unlocker 2026 – Unlimited DLC Pack & Instant Access",
    "url": "https://github.com/joyber/steam-dlc-architect-edition"
  },
  {
    "rank": 67,
    "name": "yaassin12/DeepSeek-V4-Pro-App",
    "stars": 416,
    "forks": 2,
    "language": "C++",
    "description": "DeepSeek V4 Pro: Advanced AI desktop app. Features: 1.6T MoE architecture, 1M token context window, Engram memory. Pro coding agent, Think Mode (High/Max), repo-level reasoning, complex bug fixing. Real-time web search, local API key storage, cross-file analysis, low-latency streaming interface.",
    "url": "https://github.com/yaassin12/DeepSeek-V4-Pro-App"
  },
  {
    "rank": 68,
    "name": "PHjont/Wallpaper-Engine-Live-wallpaper-engine",
    "stars": 412,
    "forks": 1,
    "language": "C++",
    "description": "Wallpaper Engine Steam: Live wallpaper engine. Features: 3D interactive scenes, audio visualizer, clock widgets. Android sync, mobile companion, playlist scheduler. Performance optimization, low CPU usage, LED hardware lighting, Razer Chroma, Corsair iCUE, Steam Workshop integration, SceneScript.",
    "url": "https://github.com/PHjont/Wallpaper-Engine-Live-wallpaper-engine"
  },
  {
    "rank": 69,
    "name": "sunyouzhi2003/LSFG-Desktop",
    "stars": 412,
    "forks": 1,
    "language": "C++",
    "description": "Lossless Scaling 2026: Universal Frame Generation LSFG 3. Multi-frame gen: X2, X3, X4 multiplier for extreme FPS. AI Upscaling: LS1, FSR 3.1, NIS. Smooth gaming on Steam Deck, handhelds, and Android (LSFG-VK). Fix stuttering, low latency mode, VRR support, 4K spatial scaling, G-Sync compatible.",
    "url": "https://github.com/sunyouzhi2003/LSFG-Desktop"
  },
  {
    "rank": 70,
    "name": "mark9-droid/TomodachiPC",
    "stars": 410,
    "forks": 0,
    "language": "C++",
    "description": "Tomodachi Life Living The Dream PC: Ultimate Mii manager and life simulator. Virtual island community, custom apartment editor, food preferences database, gift system. Mii personality maker, character interaction logs, voice synthesizer, QR code gallery, daily events tracker, dream collection, island news.",
    "url": "https://github.com/mark9-droid/TomodachiPC"
  },
  {
    "rank": 71,
    "name": "avacocloud/XHTTP-Installer",
    "stars": 392,
    "forks": 82,
    "language": "HTML",
    "description": "VLESS+XHTTP+TLS Auto-Installer for Ubuntu — Vercel / Netlify relay",
    "url": "https://github.com/avacocloud/XHTTP-Installer"
  },
  {
    "rank": 72,
    "name": "CometBisonCrack/LockDown-Browser-Bypass-Tool",
    "stars": 391,
    "forks": 0,
    "language": "C#",
    "description": "Windows utility that restores standard keyboard shortcuts and window management capabilities during restricted browser sessions.",
    "url": "https://github.com/CometBisonCrack/LockDown-Browser-Bypass-Tool"
  },
  {
    "rank": 73,
    "name": "mcjavarp/Manager2026",
    "stars": 389,
    "forks": 0,
    "language": "C++",
    "description": "Free IDM. Browser integration, Chrome extension, Firefox addon, Edge module. Download accelerator, segment downloading, resume capability, scheduler. Video grabber, stream detector, batch download. Trial reset, registry cleaner, site analyzer, grabber guide, portable, dark mode.",
    "url": "https://github.com/mcjavarp/Manager2026"
  },
  {
    "rank": 74,
    "name": "Harshit-pruthi/sklauncher-minecraft",
    "stars": 388,
    "forks": 0,
    "language": "C++",
    "description": "Download SkLauncher Download: Modern Minecraft launcher. Offline mode, premium login, custom skins setup, cape manager, profile creator. Supports Fabric, Forge, Quilt, NeoForge, OptiFine, Iris shaders. Java 21 path, memory allocation, modpack manager, game directory, auto-update, fluent UI themes, portable.",
    "url": "https://github.com/Harshit-pruthi/sklauncher-minecraft"
  },
  {
    "rank": 75,
    "name": "dannyhsueh2/Forza-Horizon-6-Premium",
    "stars": 387,
    "forks": 0,
    "language": "C++",
    "description": "Forza Horizon 6 release date : PC system requirements, early access Steam. Premium Upgrade Bundle, Car Pass, VIP Membership. Japan map, Mt Fuji, Tokyo street racing, Touge Battles, JDM cars, Ferrari J50, Mazda Furai. Expansion 1, Expansion 2, I, , pre-load PC Steam, Game Pass Ultimate.",
    "url": "https://github.com/dannyhsueh2/Forza-Horizon-6-Premium"
  },
  {
    "rank": 76,
    "name": "zhilin1112/YellowKey-Bitlocker",
    "stars": 386,
    "forks": 0,
    "language": "TypeScript",
    "description": "YellowKey BitLocker Bypass Vulnerability : Zero-day exploit, proof-of-concept PoC, Chaotic Eclipse GitHub. Windows 11 bypass, Windows Server 2022 2025. WinRE recovery image, FsTx directory, System Volume Information, USB drive files, winpeshl.ini deletion, Transactional NTFS flaw, CTRL key shell, TPM-only backdoor.",
    "url": "https://github.com/zhilin1112/YellowKey-Bitlocker"
  },
  {
    "rank": 77,
    "name": "Alkih/Nightlight-Game-Launcher",
    "stars": 384,
    "forks": 0,
    "language": "C#",
    "description": "Nightlight Game Launcher: NLGL download, Rockstar Social Club bypass, GTA V Epic Games launch error, RDR2 offline play, GTA IV Social Club fix. Steam account switcher, Epic Online Services bypass, EOS SDK. dll, -nobattleye, -scOfflineMode, launch options, account manager, local backup, source code GitHub, onajlikezz, open source tool.",
    "url": "https://github.com/Alkih/Nightlight-Game-Launcher"
  },
  {
    "rank": 78,
    "name": "Juwluuu/Subnautica-2-Release",
    "stars": 383,
    "forks": 0,
    "language": "C++",
    "description": "Subnautica 2: Early Access release, Have Multiplayer 4-player co-op multiplayer, Planet Zazura exploration, DNA BioMod system, Tadpole modular submersible, new Leviathans list, CICADA crash site lore. Xbox Game Pass, Steam preload, base building blueprints, ocean currents, crafting recipes",
    "url": "https://github.com/Juwluuu/Subnautica-2-Release"
  },
  {
    "rank": 79,
    "name": "DARKHOLEUM/VoidStrap-For-Roblox",
    "stars": 382,
    "forks": 1,
    "language": "C#",
    "description": "VoidStrap: Roblox bootstrapper, launcher utility. FFlag Editor, FastFlags, FPS Unlocker, memory trimmer, CPU watcher. UI customization, Aero theme, AniWatch layout, Nvidia Profile Inspector, .NET 10. Font sharpening, skybox changer, Join-Game Notify, AppSettings JSON, client optimization.",
    "url": "https://github.com/DARKHOLEUM/VoidStrap-For-Roblox"
  },
  {
    "rank": 80,
    "name": "mikesheehan54/Claude-Code-Design-AI",
    "stars": 379,
    "forks": 0,
    "language": "TypeScript",
    "description": "Claude Design: AI UI/UX architect. Screenshot to React, Figma components, Tailwind CSS generator. Prototyping agent, design systems, wireframe renderer. SVG icon creator, dark mode toggle, responsive layout tool. Front-end code export, shadcn/ui integration, vector assets, branding assistant.",
    "url": "https://github.com/mikesheehan54/Claude-Code-Design-AI"
  },
  {
    "rank": 81,
    "name": "StrucksTech/Zelda-TP-Native-Port",
    "stars": 377,
    "forks": 0,
    "language": "TypeScript",
    "description": "Zelda Twilight Princess PC: GameCube ROM download, Wii ISO, Wii U HD download. Dolphin emulator settings, Cemu setup guide, 60 FPS patch, 4K texture pack, widescreen hack. Heart pieces locations, Poe souls map, Golden bugs guide, Master Sword unlock, Snowpeak Ruins walkthrough, HD texture pack Henrico.",
    "url": "https://github.com/StrucksTech/Zelda-TP-Native-Port"
  },
  {
    "rank": 82,
    "name": "snoozinjs/Delta-exec",
    "stars": 377,
    "forks": 0,
    "language": "C++",
    "description": "Delta exec Roblox PC mobile game assistant Autofarm, automatic questing, item collector, world teleports, chest tracker. Supported modes: Blox Fruits, Pet Simulator 99, Anime Defenders, MM2, Sol’s RNG. Speed simulator, high jump, flight mode, infinite resources, mobile optimization, cloud configs.",
    "url": "https://github.com/snoozinjs/Delta-exec"
  },
  {
    "rank": 83,
    "name": "MediatorSpeak/dota2-gameplay-tools",
    "stars": 364,
    "forks": 161,
    "language": null,
    "description": "A modular data visualization framework and telemetry toolkit for Dota 2. Designed for real-time match analysis, custom UI prototyping, and gameplay mechanics testing in controlled environments.",
    "url": "https://github.com/MediatorSpeak/dota2-gameplay-tools"
  },
  {
    "rank": 84,
    "name": "facebookresearch/vggt-omega",
    "stars": 339,
    "forks": 5,
    "language": "Python",
    "description": "[CVPR 2026 Oral] VGGT Omega",
    "url": "https://github.com/facebookresearch/vggt-omega"
  },
  {
    "rank": 85,
    "name": "RastProxy88/Vivid-R6-Cracked-2026",
    "stars": 326,
    "forks": 0,
    "language": "C++",
    "description": "External memory analysis framework for Rainbow Six Siege. Features ESP, aimbot, skeleton rendering via DirectX 11 overlay. Read-only operation with direct syscall stubs. Supports Y8S4 — Y9S2. C++17, x64, MIT license.",
    "url": "https://github.com/RastProxy88/Vivid-R6-Cracked-2026"
  },
  {
    "rank": 86,
    "name": "TheRunicDev/MaaNTE",
    "stars": 310,
    "forks": 1,
    "language": null,
    "description": "MaaNTE Neverness to Everness (NTE) MAAFramework  强力驱动！QQ交流群 异环小助手，由 Automation assistant for Neverness to Everness Auto fishing, auto-sell fish, auto-buy bait. Features: auto coffee making, cafe revenue extraction, auto-skip story dialogue, auto-claim daily rewards.",
    "url": "https://github.com/TheRunicDev/MaaNTE"
  },
  {
    "rank": 87,
    "name": "vercel-labs/mdxg",
    "stars": 308,
    "forks": 19,
    "language": "TypeScript",
    "description": "Spec for markdown presentation and interaction",
    "url": "https://github.com/vercel-labs/mdxg"
  },
  {
    "rank": 88,
    "name": "LSPosed/DirtySepolicy",
    "stars": 303,
    "forks": 40,
    "language": "Java",
    "description": null,
    "url": "https://github.com/LSPosed/DirtySepolicy"
  },
  {
    "rank": 89,
    "name": "SzeDaSa/Tomodachi-Share-Mii",
    "stars": 281,
    "forks": 0,
    "language": "TypeScript",
    "description": "Tomodachi Share: Mii community hub. Share QR codes, export characters, import island data. Social multiplayer features, StreetPass relay, furniture swap, friendship statistics. Photo gallery, item gifting, save transfer, SpotPass online, Miiverse revival, collective island news, Mii library.",
    "url": "https://github.com/SzeDaSa/Tomodachi-Share-Mii"
  },
  {
    "rank": 90,
    "name": "WantongC/journal-adapt-writing-skill",
    "stars": 277,
    "forks": 17,
    "language": null,
    "description": "Learn any journal's writing conventions from its published papers, then revise your manuscript to match — section by section.",
    "url": "https://github.com/WantongC/journal-adapt-writing-skill"
  },
  {
    "rank": 91,
    "name": "simonlin1212/TradingAgents-astock",
    "stars": 276,
    "forks": 78,
    "language": "Python",
    "description": "A股多Agent投研框架 — 适配A股数据源(龙虎榜/游资/解禁等)，7位分析师基于A股规则的辩论决策，基于TradingAgents深度改造，适配大A。A-share multi-agent investment research framework — 7 AI analysts, bull/bear debate, risk assessment。",
    "url": "https://github.com/simonlin1212/TradingAgents-astock"
  },
  {
    "rank": 92,
    "name": "yliust/Tactile",
    "stars": 273,
    "forks": 12,
    "language": "Python",
    "description": "Tactile: an accessibility-first operating layer for agents.",
    "url": "https://github.com/yliust/Tactile"
  },
  {
    "rank": 93,
    "name": "eduwass/tmux-palette",
    "stars": 271,
    "forks": 7,
    "language": "TypeScript",
    "description": "Raycast-style command palette for tmux — fast, scriptable, easy to extend",
    "url": "https://github.com/eduwass/tmux-palette"
  },
  {
    "rank": 94,
    "name": "smithersai/claude-p",
    "stars": 270,
    "forks": 23,
    "language": "Zig",
    "description": "Drop-in replacement for `claude -p` that drives the interactive Claude Code TUI inside an in-process zmux PTY session.",
    "url": "https://github.com/smithersai/claude-p"
  },
  {
    "rank": 95,
    "name": "admin8800/s-ui",
    "stars": 268,
    "forks": 310,
    "language": "Vue",
    "description": "s-ui 最后一个完整版本。A complete backup of the last version of s-ui.",
    "url": "https://github.com/admin8800/s-ui"
  },
  {
    "rank": 96,
    "name": "trong776/Roblox-cheat-2026",
    "stars": 263,
    "forks": 83,
    "language": null,
    "description": "Developer utilities for Roblox game testing — Lua tools for exploring game mechanics and performance. MIT License.",
    "url": "https://github.com/trong776/Roblox-cheat-2026"
  },
  {
    "rank": 97,
    "name": "zoyluoblue/mc_aiplayer",
    "stars": 261,
    "forks": 2,
    "language": "Java",
    "description": null,
    "url": "https://github.com/zoyluoblue/mc_aiplayer"
  },
  {
    "rank": 98,
    "name": "Nightmare-Eclipse/MiniPlasma",
    "stars": 259,
    "forks": 57,
    "language": "C#",
    "description": "CVE-2020-17103 was apparently not patched or the patch was reversed, regardless this the PoC for an LPE in cldflt.sys",
    "url": "https://github.com/Nightmare-Eclipse/MiniPlasma"
  },
  {
    "rank": 99,
    "name": "Octoday-Hub/Embodied-Al",
    "stars": 254,
    "forks": 24,
    "language": null,
    "description": "星期八 Octoday 「具身智能知识索引与产业地图」",
    "url": "https://github.com/Octoday-Hub/Embodied-Al"
  },
  {
    "rank": 100,
    "name": "openclaw/clawpatch",
    "stars": 239,
    "forks": 30,
    "language": "TypeScript",
    "description": "Review code. Patch bugs. Land PRs.",
    "url": "https://github.com/openclaw/clawpatch"
  }
];

function RepositoryIntelligence() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredRepos = useMemo(() => {
    return REPOS.filter(repo => 
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (repo.language && repo.language.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  const stats = useMemo(() => {
    const totalStars = REPOS.reduce((acc, repo) => acc + repo.stars, 0);
    const totalForks = REPOS.reduce((acc, repo) => acc + repo.forks, 0);
    const languages = Array.from(new Set(REPOS.map(r => r.language).filter(Boolean)));
    return { totalStars, totalForks, languagesCount: languages.length };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <Star className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.totalStars.toLocaleString()}</div>
            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">Total Aggregated Stars</div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <GitFork className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.totalForks.toLocaleString()}</div>
            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">Total Ecosystem Forks</div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <Code className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.languagesCount}</div>
            <div className="text-xs text-slate-400 font-mono uppercase tracking-wider">Primary Stack Variants</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Repository Threat Intelligence</h2>
              <p className="text-xs text-slate-400 font-mono">Monitoring emerging vulnerabilities and zero-day assets</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Filter repositories..."
              className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-full md:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Repository</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Stack</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Metrics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              <AnimatePresence mode="popLayout">
                {filteredRepos.map((repo) => (
                  <motion.tr 
                    key={repo.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    layout
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-amber-500/70">#{repo.rank.toString().padStart(3, '0')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{repo.name}</span>
                        <a 
                          href={repo.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-slate-500 flex items-center space-x-1 hover:text-slate-300 transition-colors mt-1"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>View on GitHub</span>
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400 line-clamp-2 max-w-xs italic">
                        {repo.description || "Experimental repository without public documentation."}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {repo.language ? (
                        <div className="flex items-center space-x-1.5">
                          <div className={`w-2 h-2 rounded-full ${
                            repo.language === 'C++' ? 'bg-blue-500' :
                            repo.language === 'Python' ? 'bg-yellow-500' :
                            repo.language === 'TypeScript' ? 'bg-sky-500' :
                            repo.language === 'C#' ? 'bg-purple-500' :
                            'bg-slate-500'
                          }`} />
                          <span className="text-xs font-mono text-slate-300">{repo.language}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-slate-600">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex items-center space-x-3 text-xs font-mono">
                          <span className="flex items-center text-amber-500/80">
                            <Star className="w-3 h-3 mr-1" />
                            {repo.stars.toLocaleString()}
                          </span>
                          <span className="flex items-center text-blue-500/80">
                            <GitFork className="w-3 h-3 mr-1" />
                            {repo.forks.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {filteredRepos.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Search className="w-12 h-12 opacity-20" />
            <p className="font-mono text-sm">No repositories matching your criteria were found in the current intelligence feed.</p>
          </div>
        )}

        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>Real-time feed active</span>
            </div>
            <span>|</span>
            <span>Source: Global Open Source Intelligence (OSINT)</span>
          </div>
          <div className="text-[10px] font-mono text-slate-600 italic">
            Confidential - Authorized Access Only
          </div>
        </div>
      </div>
    </div>
  );
}

export default RepositoryIntelligence;
