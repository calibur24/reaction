# 🧠 NeuralTiming — Cognitive Suite

> A sub-millisecond reaction time and decision-making measurement platform built with React, Tailwind CSS, and Supabase.

---

## 🌐 Live Production Link

* **Vercel Web App:** [https://neuraltiming.vercel.app/](https://neuraltiming.vercel.app/)

---

## ⚡ Project Overview

NeuralTiming is a high-precision cognitive assessment tool featuring:
* **Dual Benchmarks:** Reaction Time (RT Median) and Decision Making Time (DMT Mean) challenges.
* **User Dashboard:** Real-time session history graphs and test launchers.
* **Admin Portal:** Decrypted demographic views (`pgcrypto`), user metrics, and one-click **CSV / Excel** exports.
* **Mobile Ready:** Fully responsive touch-friendly UI.

---

## 🚀 How to Clone & Run Locally

### 1. Clone the Repository
```bash
git clone [https://github.com/calibur24/neuraltiming.git](https://github.com/calibur24/neuraltiming.git)
cd neuraltiming
npm install

Create a .env file in the root folder and add your Supabase credentials:
VITE_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

Run the app by using
npm run dev

Open http://localhost:5173 in your browser.