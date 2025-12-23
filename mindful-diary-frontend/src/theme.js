import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#8B5CF6", light: "#A78BFA", dark: "#7C3AED" }, // Violet
    secondary: { main: "#10B981", light: "#34D399", dark: "#059669" }, // Emerald
    background: {
      default: "#F8FAFC",
      paper: "#ffffff",
    },
    text: {
      primary: "#1E293B",
      secondary: "#64748B",
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
    h4: { fontWeight: 800, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    button: { fontWeight: 700, textTransform: "none", borderRadius: 12 },
  },
  shape: { borderRadius: 24 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(at 0% 0%, hsla(253,16%,7%,0) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,0) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,0) 0, transparent 50%)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: "1px solid rgba(255, 255, 255, 0.8)",
          background: "rgba(255, 255, 255, 0.75)", // Glass effect
          backdropFilter: "blur(20px)",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 20px 40px -10px rgba(139, 92, 246, 0.15)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: "10px 24px",
          boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 12px rgba(139, 92, 246, 0.25)" },
        },
        contained: {
          background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
        },
      },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(10px)",
            transition: "all 0.2s",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
            "&.Mui-focused": {
              backgroundColor: "#fff",
              boxShadow: "0 4px 20px rgba(139, 92, 246, 0.1)",
            },
          },
        },
      },
    },
  },
});

export default theme;
