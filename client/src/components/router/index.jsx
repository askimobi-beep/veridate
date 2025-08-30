import { createBrowserRouter } from "react-router-dom";
import App from "../../App";
import { paths } from "../constants/paths";
import authRoutes from "./authRoutes";
import Userlanding from '@/pages/user/index'
import dashboardRoutes from "./dashboardRoutes";



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
    path: "/access-denied",
    element: <h1>Access Denied</h1>,
  },
]);

export default router;
