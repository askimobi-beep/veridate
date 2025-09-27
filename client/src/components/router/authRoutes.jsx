import OAuthCallback from "@/pages/auth/OAuthCallback";
import Login from "../../pages/auth/Login";
import Register from "../../pages/auth/Register";
import PrivateRoute from "./PrivateRoute";


const authRoutes = [
  { index: true, element: <Login /> },
  { path: "register-user", element: <Register /> },
  { path: "oauth/callback", element: <OAuthCallback /> },

  {
    element: <PrivateRoute />, // 🔒 protect everything below
    children: [
     
    ],
  },
];

export default authRoutes;
