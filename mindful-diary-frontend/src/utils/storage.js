// We store per-date day summary + chat history locally (nice UX)
const dayKey = (dateDDMMYYYY) => `mindful:day:${dateDDMMYYYY}`;
const chatKey = (dateDDMMYYYY) => `mindful:chat:${dateDDMMYYYY}`;

export function saveDay(dateDDMMYYYY, data) {
  localStorage.setItem(dayKey(dateDDMMYYYY), JSON.stringify(data));
}
export function loadDay(dateDDMMYYYY) {
  const raw = localStorage.getItem(dayKey(dateDDMMYYYY));
  return raw ? JSON.parse(raw) : null;
}

export function saveChat(dateDDMMYYYY, data) {
  localStorage.setItem(chatKey(dateDDMMYYYY), JSON.stringify(data));
}
export function loadChat(dateDDMMYYYY) {
  const raw = localStorage.getItem(chatKey(dateDDMMYYYY));
  return raw ? JSON.parse(raw) : [];
}

// Used for stats (entries count + streak)
export function listSavedDays() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith("mindful:day:"));
  return keys.map((k) => k.replace("mindful:day:", ""));
}
