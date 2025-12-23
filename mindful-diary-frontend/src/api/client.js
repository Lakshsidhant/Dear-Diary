import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// 1. Analyze Day (POST /analyze_day)
export async function analyzeDiary({ date, entry }) {
  const res = await api.post("/analyze_day", { date, user_input: entry });
  return res.data;
}

// 2. Chat Response (POST /chat)
export async function chatResponse(payload) {
  const res = await api.post("/chat", payload);
  return res.data;
}

// 3. Monthly Report (POST /monthly_report)
export async function monthlyAssessment({ month, year }) {
  const res = await api.post("/monthly_report", { month, year });
  return res.data;
}

// 4. Get History (GET /get_entries/{year}/{month})
export async function getHistory(year, month) {
  const res = await api.get(`/get_entries/${year}/${month}`);
  return res.data;
}

// NEW: Get one entry for a date (GET /entry?date=DD/MM/YYYY)
export async function getEntry(dateDDMMYYYY) {
  const res = await api.get("/entry", { params: { date: dateDDMMYYYY } });
  return res.data;
}

// NEW: DB stats (GET /stats?month=MM&year=YYYY)
export async function getStats({ month, year } = {}) {
  const res = await api.get("/stats", { params: { month, year } });
  return res.data;
}
