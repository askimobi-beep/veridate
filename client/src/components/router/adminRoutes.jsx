// src/routes/adminRoutes.jsx
import AdminHome from "@/pages/admin/AdminHome";
import PrivateRoute from "./PrivateRoute";
import AdminLayout from "../layouts/AdminLayout";
import AllUsers from "@/pages/admin/AllUsers";

const adminRoutes = [
  {
    // admin-only gate
    element: <PrivateRoute allowedRoles={["admin"]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminHome /> },
          { path: "users", element: <AllUsers/> },
        ],
      },
    ],
  },
];

export default adminRoutes;
