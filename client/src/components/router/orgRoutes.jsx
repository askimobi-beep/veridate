import OrganizationDashboard from "@/pages/org/OrganizationDashboard";
import PrivateRoute from "./PrivateRoute";

const orgRoutes = [
  {
    element: <PrivateRoute allowedRoles={["company", "university"]} />,
    children: [{ index: true, element: <OrganizationDashboard /> }],
  },
];

export default orgRoutes;
