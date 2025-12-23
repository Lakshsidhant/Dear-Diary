import React, { useEffect, useRef, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  TextField,
  Button,
  CircularProgress,
  Avatar,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { chatResponse } from "../api/client";
import { loadChat, saveChat } from "../utils/storage";
import { MotionBox, fadeUp, stagger } from "./Motion";

function Bubble({ role, text }) {
  const isUser = role === "user";
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <Box
        sx={{
          maxWidth: isUser ? "520px" : "560px",
          px: 2.4,
          py: 1.6,
          borderRadius: isUser ? "22px 22px 6px 22px" : "22px 22px 22px 6px",
          bgcolor: isUser ? theme.palette.primary.main : "#fff",
          color: isUser ? "#fff" : theme.palette.text.primary,
          boxShadow: isUser
            ? "0 10px 24px rgba(139, 92, 246, 0.25)"
            : "0 6px 18px rgba(15, 23, 42, 0.06)",
          border: isUser ? "none" : "1px solid rgba(15, 23, 42, 0.06)",
          lineHeight: 1.6,
          fontSize: "0.98rem",

          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

export default function AICompanionDrawer({ open, onClose, dateDDMMYYYY }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setMessages(loadChat(dateDDMMYYYY));
  }, [open, dateDDMMYYYY]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { role: "user", text, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    saveChat(dateDDMMYYYY, next);
    setInput("");
    setSending(true);

    try {
      const payloadHistory = next.map((m) => ({
        role: m.role,
        content: m.text,
      }));
      const res = await chatResponse({
        user_input: text,
        date: dateDDMMYYYY,
        chat_history: payloadHistory,
        user_name: "Friend",
      });

      const botText =
        res?.response || "I’m blanking a little — try again in a sec 😅";
      const next2 = [...next, { role: "ai", text: botText, ts: Date.now() }];
      setMessages(next2);
      saveChat(dateDDMMYYYY, next2);
    } catch (e) {
      const next2 = [
        ...next,
        {
          role: "ai",
          text: "Oops — I couldn’t reach the server. 😵",
          ts: Date.now(),
        },
      ];
      setMessages(next2);
      saveChat(dateDDMMYYYY, next2);
    } finally {
      setSending(false);
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 450 },
          bgcolor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
        },
      }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            bgcolor: "#fff",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ bgcolor: "#E0F2FE", color: "#0284C7" }}>
                <AutoAwesomeIcon />
              </Avatar>
              <Box>
                <Typography fontWeight={800} fontSize={17}>
                  AI Friend
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Chatting about {dateDDMMYYYY}
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={onClose} sx={{ bgcolor: "#f3f4f6" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Chat Area */}
        <Box
          ref={listRef}
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 3,
            py: 3,
            bgcolor: "#F8FAFC",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          {messages.length === 0 && (
            <Box
              sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: "#fff",
                border: "1px dashed #cbd5e1",
                textAlign: "center",
              }}
            >
              <Typography fontWeight={700} color="text.primary" gutterBottom>
                👋 No messages yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start by asking: "What does my day say about my mood?"
              </Typography>
            </Box>
          )}

          <MotionBox
            variants={stagger}
            initial="hidden"
            animate="show"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {messages.map((m) => (
              <MotionBox key={m.ts} variants={fadeUp}>
                <Bubble role={m.role} text={m.text} />
              </MotionBox>
            ))}
          </MotionBox>

          {sending && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ pl: 1, opacity: 0.7 }}
            >
              <CircularProgress size={14} />
              <Typography variant="caption">AI is thinking...</Typography>
            </Stack>
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, bgcolor: "#fff", borderTop: "1px solid #f0f0f0" }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-end">
            <TextField
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              multiline
              maxRows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#F1F5F9",
                },
                "& fieldset": { border: "none" },
              }}
            />
            <Button
              onClick={send}
              disabled={sending || !input.trim()}
              variant="contained"
              sx={{ minWidth: 52, height: 52, borderRadius: 3, px: 0 }}
            >
              <SendRoundedIcon fontSize="small" />
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
