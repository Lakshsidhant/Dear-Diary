import React, { useMemo, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  Stack,
  Container,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Dashboard from "./pages/Dashboard";
import Summary from "./pages/Summary";
import MonthlyAnalyticsDialog from "./components/MonthlyAnalyticsDialog";
import AICompanionDrawer from "./components/AICompanionDrawer";
import dayjs from "dayjs";

export default function App() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [summaryData, setSummaryData] = useState(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [anchorDate, setAnchorDate] = useState(dayjs());
  const activeDate = useMemo(
    () => summaryData?.date || dayjs().format("DD/MM/YYYY"),
    [summaryData]
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(at 0% 0%, hsla(253,16%,7%,0) 0, transparent 50%), 
          radial-gradient(at 50% 0%, hsla(225,39%,30%,0) 0, transparent 50%), 
          radial-gradient(at 100% 0%, hsla(339,49%,30%,0) 0, transparent 50%),
          radial-gradient(circle at 15% 50%, rgba(139, 92, 246, 0.08), transparent 25%), 
          radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.08), transparent 25%)
        `,
        backgroundColor: "#f8fafc",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.3)",
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 6 } }}>
          <Toolbar
            disableGutters
            sx={{ py: 1, justifyContent: "space-between" }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/")}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background:
                    "linear-gradient(135deg, #E9DDFF 0%, #FFFFFF 100%)",
                  boxShadow: "0 4px 12px rgba(139,92,246,0.15)",
                  fontSize: "20px",
                }}
              >
                ✨
              </Box>

              <Box>
                <Typography
                  fontWeight={800}
                  fontSize={20}
                  color="text.primary"
                  lineHeight={1.1}
                >
                  Mindful Diary
                </Typography>
                {!isMobile && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    Reflect & Grow
                  </Typography>
                )}
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <Button
                onClick={() => setAnalyticsOpen(true)}
                variant="text"
                sx={{
                  bgcolor: "rgba(239, 246, 255, 0.8)",
                  color: "#1D4ED8",
                  "&:hover": { bgcolor: "#DBEAFE" },
                }}
              >
                {isMobile ? "📊" : "📊 Analytics"}
              </Button>

              <Button
                onClick={() => setDrawerOpen(true)}
                variant="contained"
                sx={{
                  bgcolor: "#10B981",
                  background:
                    "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                }}
              >
                {isMobile ? "💬" : "💬 AI Friend"}
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 2, md: 6 }, py: { xs: 3, md: 4 } }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                onAnalyzed={(payload) => {
                  setSummaryData(payload);
                  setAnchorDate(dayjs());
                  navigate("/summary");
                }}
              />
            }
          />
          <Route
            path="/summary"
            element={
              <Summary data={summaryData} onBack={() => navigate("/")} />
            }
          />
        </Routes>
      </Container>

      <MonthlyAnalyticsDialog
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        anchorDate={anchorDate}
      />
      <AICompanionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        dateDDMMYYYY={activeDate}
      />
    </Box>
  );
}
