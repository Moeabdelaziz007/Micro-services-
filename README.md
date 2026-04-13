# Amrikyy (أمريكي) - The Intelligent Maestro Dashboard

Amrikyy is a high-performance, AI-driven command center designed for managing microservices ecosystems, autonomous agents, and real-time data pipelines. Built with Next.js 15, Tailwind CSS 4, and powered by Google's Gemini API, it provides a "mission control" experience for modern software architecture.

## 🚀 Key Features

- **Autonomous Agent Orchestration**: Manage a fleet of specialized sub-agents (Frontend, Data, DevOps, Research, etc.) with real-time status monitoring.
- **AgentHub Communication Protocol**: A robust asynchronous messaging system featuring:
  - **Message Queueing**: Non-blocking inter-agent communication.
  - **Pub/Sub Mechanism**: Event-driven architecture for system-wide broadcasts.
- **Memory Bank & Performance Insights**: Real-time visualization of agent feedback and performance metrics using Recharts.
- **Ecosystem Visualization**: Dynamic D3.js force-directed graph showing the relationships between the "Brain" (Amrikyy), repositories, and active services.
- **Diagnostic Debug Console**: Enhanced logging with contextual information, including sub-agent IDs, function names, and memory snippets for rapid troubleshooting.
- **Jules AI Integration**: Deep integration with the Jules API for session management and activity tracking.
- **Voice-Enabled Interface**: Integrated Arabic Text-to-Speech (TTS) for system alerts and status updates.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4, Lucide Icons, Motion (Framer Motion)
- **AI**: Google Gemini API (@google/genai)
- **Database/Auth**: Firebase (Firestore & Auth)
- **Visualization**: D3.js, Recharts
- **Communication**: Custom Pub/Sub & Message Queue

## 📂 Project Structure

- `/app`: Next.js App Router pages and API routes.
- `/components`: Reusable UI components (Dashboard, Ecosystem Graph, etc.).
- `/lib`: Utility functions, Firebase configuration, and shared logic.
- `/agents`: (Legacy/Microservices) Standalone agent implementations.
- `/shared`: Shared types and constants.

## 🚦 Getting Started

1. **Environment Variables**:
   - `NEXT_PUBLIC_GEMINI_API_KEY`: Your Google Gemini API key.
   - `JULES_API_KEY`: API key for Jules AI integration.
   - Firebase configuration in `firebase-applet-config.json`.

2. **Installation**:
   ```bash
   npm install
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

## 🛡️ Security & Reliability

- **Firestore Security Rules**: Implemented with strict validation and least-privilege access.
- **Error Boundaries**: Robust error handling across the application to prevent cascading failures.
- **Zero-Cost Architecture**: Designed to leverage free-tier services and scale-to-zero capabilities.

---
*Built with ❤️ by the Amrikyy Team.*
