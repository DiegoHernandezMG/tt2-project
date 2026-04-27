import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/app"; // 👈 OJO AQUÍ
import { AuthProvider } from "./hooks/use-auth";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
