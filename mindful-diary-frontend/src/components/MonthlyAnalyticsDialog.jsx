import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

import { monthlyAssessment, getStats } from "../api/client";
import { monthLabel, monthYear } from "../utils/date";
import { MotionBox, fadeUp } from "./Motion";

// Nice deterministic colors (different color per emotion bar)
const BAR_COLORS = [
  "#7C3AED", // violet
  "#06B6D4", // cyan
  "#22C55E", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#3B82F6", // blue
  "#EC4899", // pink
  "#A855F7", // purple
  "#10B981", // emerald
  "#F97316", // orange
];

function getColorForIndex(i) {
  return BAR_COLORS[i % BAR_COLORS.length];
}

// Desktop tick (clean, slight tilt)
const CenteredTiltedTick = (props) => {
  const { x, y, payload } = props;
  const v = String(payload?.value ?? "");
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        dy={16}
        textAnchor="middle"
        fontSize={12}
        fill="rgba(71,85,105,1)"
        transform="rotate(-12)"
      >
        {v}
      </text>
    </g>
  );
};

//  Mobile tick (smaller, more tilt so it fits)
const MobileTick = (props) => {
  const { x, y, payload } = props;
  const v = String(payload?.value ?? "");
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        dy={18}
        textAnchor="middle"
        fontSize={11}
        fill="rgba(71,85,105,1)"
        transform="rotate(-18)"
      >
        {v}
      </text>
    </g>
  );
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;

  return (
    <Box
      sx={{
        px: 1.25,
        py: 1,
        border: "1px solid rgba(229,231,235,0.8)",
        bgcolor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.15)",
      }}
    >
      <Typography fontWeight={900} fontSize={13} sx={{ mb: 0.25 }}>
        {label}
      </Typography>
      <Typography fontSize={13} color="text.secondary">
        Score:{" "}
        <Box component="span" sx={{ fontWeight: 900, color: "#111827" }}>
          {val}
        </Box>{" "}
        / 10
      </Typography>
    </Box>
  );
}

export default function MonthlyAnalyticsDialog({ open, onClose, anchorDate }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const date = anchorDate || dayjs();
  const { month, year } = useMemo(() => monthYear(date), [date]);
  const title = useMemo(() => monthLabel(date), [date]);

  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [chart, setChart] = useState([]);
  const [noDataMsg, setNoDataMsg] = useState("");

  const [totalEntries, setTotalEntries] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStatsLoading(true);
    getStats({ month, year })
      .then((s) => {
        setTotalEntries(s?.total_entries_month ?? 0);
        setStreak(s?.streak ?? 0);
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [open, month, year]);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setNoDataMsg("");
    setChart([]);

    monthlyAssessment({ month, year })
      .then((res) => {
        if (res?.message) {
          setNoDataMsg(res.message);
          setChart([]);
          return;
        }

        const emotions = res?.emotions || [];
        const scores = res?.scores || [];

        setChart(
          emotions.map((e, i) => ({
            emotion: String(e ?? "").trim(),
            score: Number(scores[i] ?? 0),
            _i: i,
          }))
        );
      })
      .catch((e) => {
        console.error(e);
        setNoDataMsg("Could not load analytics.");
      })
      .finally(() => setLoading(false));
  }, [open, month, year]);

  const statCardSx = {
    flex: 1,
    border: "1px solid rgba(229,231,235,0.85)",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.75) 100%)",
    backdropFilter: "blur(14px)",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  };

  const chartMinWidth = useMemo(() => {
    const n = chart?.length || 0;
    return Math.max(520, n * 90);
  }, [chart]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          border: "1px solid rgba(229,231,235,0.8)",
          background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(124,58,237,0.10), transparent 60%), radial-gradient(1200px 600px at 90% 10%, rgba(6,182,212,0.10), transparent 60%), rgba(255,255,255,0.92)",
          backdropFilter: "blur(18px)",
          boxShadow: isMobile ? "none" : "0 26px 70px rgba(15, 23, 42, 0.22)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.25 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ gap: 2 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 0.25 }}
            >
              <Typography
                fontWeight={950}
                fontSize={18}
                sx={{ letterSpacing: -0.2 }}
              >
                📊 Monthly Analytics
              </Typography>
              <Chip
                size="small"
                label={`${title}`}
                sx={{
                  fontWeight: 900,
                  bgcolor: "rgba(124,58,237,0.10)",
                  border: "1px solid rgba(124,58,237,0.22)",
                }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Insights based on your entries for {month}/{year}
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            sx={{
              border: "1px solid rgba(229,231,235,0.9)",
              bgcolor: "rgba(255,255,255,0.75)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.92)" },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <MotionBox variants={fadeUp} initial="hidden" animate="show">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Card sx={statCardSx}>
              <CardContent sx={{ p: 2.2 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack spacing={0.5}>
                    <Typography
                      fontWeight={900}
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      Total Entries (this month)
                    </Typography>
                    <Typography
                      fontSize={32}
                      fontWeight={950}
                      sx={{ lineHeight: 1.05 }}
                    >
                      {statsLoading ? "…" : totalEntries}
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(59,130,246,0.10)",
                      border: "1px solid rgba(59,130,246,0.22)",
                    }}
                  >
                    <EditNoteRoundedIcon />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={statCardSx}>
              <CardContent sx={{ p: 2.2 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack spacing={0.5}>
                    <Typography
                      fontWeight={900}
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      Current Streak
                    </Typography>
                    <Typography
                      fontSize={32}
                      fontWeight={950}
                      sx={{ lineHeight: 1.05 }}
                    >
                      {statsLoading ? "…" : `${streak}`}
                      {!statsLoading && (
                        <Box
                          component="span"
                          sx={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: "text.secondary",
                            ml: 1,
                          }}
                        >
                          day{streak === 1 ? "" : "s"}
                        </Box>
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      computed from DB entries ending today
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(245,158,11,0.12)",
                      border: "1px solid rgba(245,158,11,0.24)",
                    }}
                  >
                    <LocalFireDepartmentRoundedIcon />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Card
            sx={{
              border: "1px solid rgba(229,231,235,0.85)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.78) 100%)",
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ p: { xs: 1.75, sm: 2.2 } }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.25 }}
              >
                <Box>
                  <Typography fontWeight={950} sx={{ letterSpacing: -0.2 }}>
                    Emotion Breakdown
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Scores are normalized from 0 to 10
                  </Typography>
                </Box>

                {!!chart?.length && (
                  <Chip
                    size="small"
                    label={`${chart.length} emotions`}
                    sx={{
                      fontWeight: 900,
                      bgcolor: "rgba(6,182,212,0.10)",
                      border: "1px solid rgba(6,182,212,0.22)",
                    }}
                  />
                )}
              </Stack>

              <Divider sx={{ mb: 1.75, opacity: 0.7 }} />

              {loading && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ py: 6, justifyContent: "center" }}
                >
                  <CircularProgress size={18} />
                  <Typography color="text.secondary">Loading…</Typography>
                </Stack>
              )}

              {!loading && noDataMsg && (
                <Typography color="text.secondary" sx={{ py: 3 }}>
                  {noDataMsg}
                </Typography>
              )}

              {!loading && !noDataMsg && chart.length > 0 && (
                <Box
                  sx={{
                    border: "1px solid rgba(229,231,235,0.75)",
                    bgcolor: "rgba(255,255,255,0.65)",
                    overflowX: { xs: "auto", sm: "hidden" },
                    overflowY: "hidden",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <Box
                    sx={{
                      height: { xs: 280, sm: 320, md: 360 },
                      minWidth: { xs: `${chartMinWidth}px`, sm: "100%" },
                      px: { xs: 1, sm: 0 },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chart}
                        margin={{
                          top: 18,
                          right: isMobile ? 10 : 18,
                          bottom: isMobile ? 36 : 28,
                          left: isMobile ? 0 : 8,
                        }}
                        barCategoryGap={isMobile ? "28%" : "22%"}
                      >
                        <CartesianGrid
                          strokeDasharray="4 6"
                          vertical={false}
                          opacity={0.45}
                        />

                        <XAxis
                          dataKey="emotion"
                          interval={0}
                          tickLine={false}
                          axisLine={false}
                          height={isMobile ? 62 : 55}
                          tick={
                            isMobile ? <MobileTick /> : <CenteredTiltedTick />
                          }
                        />

                        <YAxis
                          domain={[0, 10]}
                          ticks={[0, 2, 4, 6, 8, 10]}
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12 }}
                          width={isMobile ? 28 : 36}
                        />

                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: "rgba(15, 23, 42, 0.06)" }}
                        />

                        <Bar
                          dataKey="score"
                          radius={[10, 10, 6, 6]}
                          isAnimationActive
                          maxBarSize={isMobile ? 40 : 56}
                        >
                          {chart.map((_, idx) => (
                            <Cell
                              key={`cell-${idx}`}
                              fill={getColorForIndex(idx)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </MotionBox>
      </DialogContent>
    </Dialog>
  );
}
