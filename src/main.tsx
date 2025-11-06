import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initResponsiveOptimizations } from "./utils/responsiveOptimization";

// Initialize responsive optimizations for mobile and tablet
initResponsiveOptimizations();

createRoot(document.getElementById("root")!).render(<App />);
