import PersonalInformation from "@/pages/user/PersonalInformation";
import PrivateRoute from "./PrivateRoute";
import Directory from "@/pages/directory/Directory";
import DetailPage from "@/pages/directory/DetailPage";
import CompanyProfile from "@/pages/company/CompanyProfile";




const dashboardRoutes = [
  

  {
    element: <PrivateRoute allowedRoles={["user"]}/>, // 🔒 protect everything below
    children: [
     { index:true, element: <PersonalInformation/>},
     { path: "directory", element: <Directory/>},
     { path: "profiles/:userId", element: <DetailPage/>},
     { path: "companies/:id", element: <CompanyProfile/>},
    ],
  },
];

export default dashboardRoutes;
