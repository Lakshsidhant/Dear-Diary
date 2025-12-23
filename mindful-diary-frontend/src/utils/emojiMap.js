// backend returns emoji *names* (not actual emojis). We map common ones.
const MAP = {
  smile: "😊",
  smiling: "😊",
  happy: "😊",
  joy: "🌟",
  star: "🌟",
  sparkles: "✨",
  cloud: "☁️",
  rainbow: "🌈",
  heart: "💜",
  love: "💜",
  calm: "🌿",
  tired: "😴",
  sad: "😔",
  angry: "😠",
  anxious: "😟",
  grateful: "🙏",
  gratitude: "🙏",
  focus: "🎯",
  energy: "⚡",
};

export function emojiFromName(name) {
  if (!name) return "🙂";
  const key = String(name)
    .toLowerCase()
    .replace(/[\s:_-]+/g, "");
  return MAP[key] || "🙂";
}
