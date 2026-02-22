import PersonalInformation from "@/pages/user/PersonalInformation";
import PrivateRoute from "./PrivateRoute";
import Directory from "@/pages/directory/Directory";
import DetailPage from "@/pages/directory/DetailPage";
import CompanyProfile from "@/pages/company/CompanyProfile";
import JobsDirectory from "@/pages/directory/JobsDirectory";
import HomeFeed from "@/pages/HomeFeed";

const dashboardRoutes = [
  {
    element: <PrivateRoute allowedRoles={["user"]} />,
    children: [
      { index: true, element: <HomeFeed /> },
      { path: "profile", element: <PersonalInformation /> },
      { path: "directory", element: <Directory /> },
      { path: "jobs", element: <JobsDirectory /> },
      { path: "profiles/:userId", element: <DetailPage /> },
      { path: "companies/:id", element: <CompanyProfile /> },
    ],
  },
];

export default dashboardRoutes;
