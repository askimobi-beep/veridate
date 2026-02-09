// src/routes/adminRoutes.jsx
import AdminHome from "@/pages/admin/AdminHome";
import PrivateRoute from "./PrivateRoute";
import AdminLayout from "../layouts/AdminLayout";
import AllUsers from "@/pages/admin/AllUsers";
import Organizations from "@/pages/admin/Organizations";
import CompanyVerifications from "@/pages/admin/CompanyVerifications";

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
          { path: "organizations", element: <Organizations /> },
          { path: "company-verifications", element: <CompanyVerifications /> },
        ],
      },
    ],
  },
];

export default adminRoutes;
