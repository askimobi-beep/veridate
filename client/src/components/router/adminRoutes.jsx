// src/routes/adminRoutes.jsx
import AdminHome from "@/pages/admin/AdminHome";
import PrivateRoute from "./PrivateRoute";
import AdminLayout from "../layouts/AdminLayout";

const adminRoutes = [
  {
    // admin-only gate
    element: <PrivateRoute allowedRoles={["admin"]} />,
    children: [
      // render the admin shell only after the gate passes
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminHome /> },
          { path: "hi", element: <h1>HELLOW ADMIN</h1> },
        ],
      },
    ],
  },
];

export default adminRoutes;
