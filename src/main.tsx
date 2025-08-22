import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./utils/performance";
import { initializeDatabase } from "./services/database";

// Initialize database
initializeDatabase()
  .then(() => {
    // Database initialized successfully
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
  });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
