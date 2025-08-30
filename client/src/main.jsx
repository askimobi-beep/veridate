import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import router from "@/components/router/index";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SnackbarProvider } from "notistack";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={2500}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <RouterProvider router={router} />
    </SnackbarProvider>
  </AuthProvider>
);
