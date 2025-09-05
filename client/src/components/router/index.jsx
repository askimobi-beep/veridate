import { createBrowserRouter } from "react-router-dom";
import App from "../../App";
import { paths } from "../constants/paths";
import authRoutes from "./authRoutes";
import adminRoutes from "./adminRoutes";
import Userlanding from '@/pages/user/index'
import dashboardRoutes from "./dashboardRoutes";
import LoginPage from "@/pages/auth/Login";
import AdminLayout from "../layouts/AdminLayout";



const router = createBrowserRouter([
  {
    path: paths.HOME,
    element: <App />,
    children: [...authRoutes],
  },
  {
    path: '/dashboard',
    element: <Userlanding/>,
    children: [...dashboardRoutes],
  },
  { 
    path: '/admin',
    children: [...adminRoutes],
  },
  {
    path: "/access-denied",
    element: <h1>Access Denied</h1>,
  },
]);

export default router;
