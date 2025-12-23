import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  TextField,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { motion } from "framer-motion";

import { api, analyzeDiary, getHistory } from "../api/client";
import { toDDMMYYYY, monthYear } from "../utils/date";
import { saveDay, loadDay } from "../utils/storage";
import { emojiFromName } from "../utils/emojiMap";

function renderEmoji(e) {
  if (!e) return "🙂";
  const s = String(e).trim();
  if (/[^\x00-\x7F]/.test(s)) return s;
  return emojiFromName(s);
}

function ddmmyyyyToDayjs(ddmmyyyy) {
  if (!ddmmyyyy) return dayjs();
  const parts = String(ddmmyyyy).split("/");
  if (parts.length !== 3) return dayjs();
  const [dd, mm, yyyy] = parts;
  const iso = `${yyyy}-${mm}-${dd}`;
  const d = dayjs(iso);
  return d.isValid() ? d : dayjs();
}

const MotionDiv = motion.div;

export default function Dashboard({ onAnalyzed }) {
  const [selected, setSelected] = useState(dayjs());
  const dateDD = useMemo(() => toDDMMYYYY(selected), [selected]);
  const { month, year } = useMemo(() => monthYear(selected), [selected]);

  const [entry, setEntry] = useState("");
  const [historyList, setHistoryList] = useState([]);

  const [fetchingDay, setFetchingDay] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- Load entry for selected date ---
  useEffect(() => {
    let alive = true;

    const cached = loadDay(dateDD);
    if (cached?.entry !== undefined) setEntry(cached.entry || "");

    async function loadFromBackend() {
      setFetchingDay(true);
      try {
        // expected backend: GET /entry?date=DD/MM/YYYY
        const res = await api.get("/entry", { params: { date: dateDD } });
        if (!alive) return;

        if (res?.data?.exists) {
          const full = res.data.entry || "";
          setEntry(full);

          saveDay(dateDD, {
            date: dateDD,
            entry: full,
            insights: res.data.insights || [],
            emojis: res.data.emojis || [],
          });
        } else {
          setEntry("");
        }
      } catch (e) {
        // keep cached value if endpoint missing / error
      } finally {
        if (alive) setFetchingDay(false);
      }
    }

    loadFromBackend();
    return () => {
      alive = false;
    };
  }, [dateDD]);

  // --- Load month history ---
  useEffect(() => {
    let alive = true;
    setFetchingHistory(true);

    getHistory(year, month)
      .then((data) => {
        if (!alive) return;
        setHistoryList(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!alive) return;
        setHistoryList([]);
      })
      .finally(() => {
        if (!alive) return;
        setFetchingHistory(false);
      });

    return () => {
      alive = false;
    };
  }, [year, month]);

  function handleViewSummary() {
    const cached = loadDay(dateDD);
    const hasSummary =
      (cached?.insights && cached.insights.length > 0) ||
      (cached?.emojis && cached.emojis.length > 0);

    if (!hasSummary) {
      alert("No summary for this date yet. Please Save & Analyze once.");
      return;
    }

    onAnalyzed?.({
      date: dateDD,
      entry: cached.entry || entry || "",
      insights: cached.insights || [],
      emojis: cached.emojis || [],
    });
  }

  async function handleAnalyze() {
    if (!entry.trim()) return;
    setSaving(true);
    try {
      const res = await analyzeDiary({ date: dateDD, entry });
      const payload = {
        date: dateDD,
        entry,
        insights: res?.insights || [],
        emojis: res?.emojis || [],
      };
      saveDay(dateDD, payload);
      onAnalyzed?.(payload);
    } catch (e) {
      console.error(e);
      alert("Analyze failed. Check backend logs / VITE_API_URL.");
    } finally {
      setSaving(false);
    }
  }

  const pageGridSx = {
    width: "100%",
    display: "grid",
    gridTemplateColumns: {
      xs: "minmax(0,1fr)",
      lg: "minmax(0,1fr) minmax(0,1fr)",
    },
    gap: { xs: 2.25, md: 3 },
    alignItems: "stretch",
  };

  const cardSx = {
    width: "100%",
    minWidth: 0,
    border: "1px solid rgba(229,231,235,0.9)",
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
    height: { lg: "calc(100vh - 170px)" },
    minHeight: { lg: 680 },
    maxHeight: { lg: 860 },
  };

  const cardInnerSx = {
    p: { xs: 2.25, sm: 3 },
    height: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  };

  const niceDateLabel = selected?.isValid?.()
    ? selected.format("dddd, MMMM D, YYYY")
    : dayjs().format("dddd, MMMM D, YYYY");

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={pageGridSx}>
        {/* LEFT */}
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <Card sx={cardSx}>
            <CardContent sx={cardInnerSx}>
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Typography
                  fontWeight={900}
                  fontSize={18}
                  sx={{ lineHeight: 1.2 }}
                >
                  Select a Date
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tap a date to view or write
                </Typography>
              </Stack>

              <Box
                sx={{
                  border: "1px solid rgba(229,231,235,0.9)",
                  bgcolor: "rgba(255,255,255,0.86)",
                  px: { xs: 1, sm: 1.5 },
                  py: 1.25,
                }}
              >
                <DateCalendar
                  value={selected}
                  onChange={(v) => v && setSelected(v)}
                  // enable year->month->day flow
                  views={["year", "month", "day"]}
                  openTo="day"
                  sx={{
                    width: "100%",
                    maxWidth: "100%",

                    "& .MuiPickersCalendarHeader-root": {
                      position: "relative",
                      px: 1,
                      mb: 0.75,
                    },

                    "& .MuiPickersCalendarHeader-labelContainer": {
                      position: "absolute",
                      left: "50%",
                      transform: "translateX(-50%)",
                      margin: 0,
                    },
                    "& .MuiPickersCalendarHeader-label": {
                      fontWeight: 900,
                      color: "#0F172A",
                      textAlign: "center",
                    },

                    "& .MuiPickersArrowSwitcher-root": {
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                    },

                    "& .MuiPickersCalendarHeader-switchViewButton": {
                      display: "none",
                    },

                    "& .MuiYearCalendar-root": {
                      margin: "0 auto",
                      width: "100%",
                      maxWidth: 330,
                    },

                    "& .MuiMonthCalendar-root": {
                      margin: "0 auto",
                      width: "100%",
                      maxWidth: 330,
                    },
                  }}
                />
              </Box>

              <Divider sx={{ my: 2.1 }} />

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.25 }}
              >
                <Typography fontWeight={900}>This Month</Typography>
                {fetchingHistory && <CircularProgress size={18} />}
              </Stack>

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflow: "auto",
                  pr: 0.25,
                  pb: 0.25,
                }}
              >
                {(!historyList || historyList.length === 0) &&
                  !fetchingHistory && (
                    <Typography variant="body2" color="text.secondary">
                      No entries yet this month.
                    </Typography>
                  )}

                <Stack spacing={1.1}>
                  {historyList.map((h) => (
                    <Box
                      key={h.date}
                      onClick={() => setSelected(ddmmyyyyToDayjs(h.date))}
                      sx={{
                        cursor: "pointer",
                        p: 1.5,
                        border: "1px solid rgba(238,240,246,0.95)",
                        bgcolor: "rgba(255,255,255,0.72)",
                        boxShadow: "0 10px 24px rgba(16,24,40,0.05)",
                        transition: "transform .15s ease, background .15s ease",
                        "&:hover": {
                          bgcolor: "rgba(250,250,255,0.95)",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ gap: 1, minWidth: 0 }}
                      >
                        <Typography fontWeight={900} sx={{ minWidth: 0 }}>
                          {h.date}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={0.6}
                          sx={{ flexShrink: 0 }}
                        >
                          {(h.emojis || []).slice(0, 3).map((e, i) => (
                            <Box
                              key={i}
                              component="span"
                              sx={{ fontSize: 18, lineHeight: 1 }}
                            >
                              {renderEmoji(e)}
                            </Box>
                          ))}
                        </Stack>
                      </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.7,
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {h.entry_preview || "—"}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </MotionDiv>

        {/* RIGHT */}
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.05 }}
        >
          <Card sx={cardSx}>
            <CardContent sx={cardInnerSx}>
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                sx={{ mb: 2, gap: 2 }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    fontWeight={900}
                    fontSize={18}
                    sx={{ lineHeight: 1.2 }}
                  >
                    Daily Entry
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.3 }}
                  >
                    {niceDateLabel}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flexShrink: 0 }}
                >
                  {fetchingDay && <CircularProgress size={18} />}
                  <Chip
                    label={dateDD}
                    sx={{
                      fontWeight: 900,
                      bgcolor: "rgba(243,244,246,0.95)",
                      border: "1px solid rgba(229,231,235,0.95)",
                    }}
                  />
                </Stack>
              </Stack>

              <Box sx={{ flex: 1, minHeight: 0 }}>
                <TextField
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder={
                    "Dear Diary...\n\nHow are you feeling today? What's on your mind?"
                  }
                  multiline
                  fullWidth
                  minRows={10}
                  maxRows={10}
                  sx={{
                    height: "100%",
                    "& .MuiOutlinedInput-root": {
                      height: "100%",
                      alignItems: "stretch",
                      bgcolor: "rgba(247,242,255,0.88)",
                      border: "2px solid rgba(201,182,255,0.55)",
                      padding: 0,
                      "& fieldset": { border: "none" },
                    },

                    "& textarea": {
                      height: "100% !important",
                      overflow: "auto !important",
                      resize: "none",
                    },

                    "& .MuiInputBase-inputMultiline": {
                      padding: "18px 18px",
                      lineHeight: 1.7,
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      boxSizing: "border-box",
                    },
                  }}
                />
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                sx={{ mt: 2.1, width: "100%", alignItems: "stretch" }}
              >
                <Button
                  fullWidth
                  disabled={saving || !entry.trim()}
                  onClick={handleAnalyze}
                  variant="contained"
                  sx={{
                    minWidth: 0,
                    py: 1.35,
                    fontWeight: 900,
                    background:
                      "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                    boxShadow: "0 10px 24px rgba(109,40,217,0.18)",
                    "&:hover": {
                      boxShadow: "0 16px 34px rgba(109,40,217,0.24)",
                    },
                  }}
                >
                  {saving ? "Analyzing..." : "✨ Save & Analyze"}
                </Button>

                <Button
                  fullWidth
                  onClick={handleViewSummary}
                  variant="outlined"
                  sx={{
                    minWidth: 0,
                    py: 1.35,
                    fontWeight: 900,
                    borderColor: "rgba(59,130,246,0.35)",
                    color: "#2563EB",
                    bgcolor: "rgba(59,130,246,0.06)",
                    "&:hover": { bgcolor: "rgba(59,130,246,0.10)" },
                  }}
                >
                  📄 View Summary
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setEntry("")}
                  sx={{
                    minWidth: 0,
                    py: 1.35,
                    fontWeight: 900,
                    borderColor: "rgba(201,182,255,0.9)",
                    color: "#6D28D9",
                    "&:hover": {
                      bgcolor: "rgba(167,139,250,0.10)",
                      borderColor: "#C4B5FD",
                    },
                  }}
                >
                  Clear
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </MotionDiv>
      </Box>
    </Box>
  );
}
