import OAuthCallback from "@/pages/auth/OAuthCallback";
import Login from "../../pages/auth/Login";
import Register from "../../pages/auth/Register";
import PrivateRoute from "./PrivateRoute";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";


const authRoutes = [
  { index: true, element: <Login /> },
  { path: "register-user", element: <Register /> },
  { path: "forgot-password", element: <ForgotPasswordPage /> },
  { path: "reset-password", element: <ResetPasswordPage /> },
  { path: "oauth/callback", element: <OAuthCallback /> },

  {
    element: <PrivateRoute />, // 🔒 protect everything below
    children: [
     
    ],
  },
];

export default authRoutes;
