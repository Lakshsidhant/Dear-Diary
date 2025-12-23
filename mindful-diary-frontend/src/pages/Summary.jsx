import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { emojiFromName } from "../utils/emojiMap";
import { MotionBox, fadeUp, stagger } from "../components/Motion";

dayjs.extend(customParseFormat);

function renderEmoji(e) {
  if (!e) return "🙂";
  const s = String(e).trim();
  if (/[^\x00-\x7F]/.test(s)) return s;
  return emojiFromName(s);
}

function buildAnalysis(insights = []) {
  if (!insights.length)
    return "I couldn’t find enough insights for today yet—try analyzing your entry once.";
  const a = insights[0] || "";
  const b = insights[1] || "";
  return `Your entry shows mindful processing of your day. ${a}${
    b ? " Also, " + b.toLowerCase() : ""
  }`.trim();
}

function safeFullDate(d) {
  if (!d) return "—";

  // If later add dateISO, it will just work
  const parsed = dayjs(d, ["DD/MM/YYYY", "YYYY-MM-DD", dayjs.ISO_8601], true);

  return parsed.isValid() ? parsed.format("dddd, MMMM D, YYYY") : "—";
}

export default function Summary({ data, onBack }) {
  const analysis = useMemo(
    () => buildAnalysis(data?.insights),
    [data?.insights]
  );

  return (
    <MotionBox variants={stagger} initial="hidden" animate="show">
      <MotionBox variants={fadeUp}>
        <Button
          onClick={onBack}
          sx={{ mb: 2, fontWeight: 900 }}
          variant="outlined"
        >
          ← Back to Dashboard
        </Button>
      </MotionBox>

      <MotionBox variants={fadeUp}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Typography fontWeight={900} fontSize={18}>
                  Your Entry
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {safeFullDate(data?.dateISO || data?.date)}
                </Typography>

                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "#F4EFFF",
                    border: "1px solid #EADFFF",
                    minHeight: 220,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  {data?.entry || "—"}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Typography fontWeight={900} fontSize={18} sx={{ mb: 2 }}>
                  Daily Summary
                </Typography>

                <Stack
                  direction="row"
                  spacing={1.6}
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    p: 2,
                    bgcolor: "#EAFBEA",
                    border: "1px solid #D9F3DD",
                    minHeight: 76,
                    fontSize: 36,
                    overflow: "hidden",
                  }}
                >
                  {(data?.emojis || []).slice(0, 5).map((e, i) => (
                    <span key={i}>{renderEmoji(e)}</span>
                  ))}
                  {(!data?.emojis || data.emojis.length === 0) && (
                    <span>🙂</span>
                  )}
                </Stack>

                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "#DBEEFE",
                    border: "1px solid #CFE6FB",
                  }}
                >
                  <Typography fontWeight={900} sx={{ mb: 1 }}>
                    AI Analysis
                  </Typography>
                  <Typography
                    sx={{
                      color: "#2B3A52",
                      lineHeight: 1.55,
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {analysis}
                  </Typography>
                </Box>

                <Typography fontWeight={900} sx={{ mt: 2 }}>
                  Key Insights
                </Typography>

                <Box component="ul" sx={{ pl: 2.2, mt: 1, mb: 0 }}>
                  {(data?.insights || []).map((ins, i) => (
                    <Box
                      component="li"
                      key={i}
                      sx={{
                        mb: 1,
                        color: "#3A4150",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      }}
                    >
                      {ins}
                    </Box>
                  ))}
                  {(!data?.insights || data.insights.length === 0) && (
                    <Box component="li" sx={{ color: "#6B7280" }}>
                      No insights yet.
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </MotionBox>
    </MotionBox>
  );
}
