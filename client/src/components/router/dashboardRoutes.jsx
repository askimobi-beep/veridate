import PersonalInformation from "@/pages/user/PersonalInformation";
import PrivateRoute from "./PrivateRoute";
import Directory from "@/pages/directory/Directory";
import DetailPage from "@/pages/directory/DetailPage";




const dashboardRoutes = [
  

  {
    element: <PrivateRoute allowedRoles={["user"]}/>, // 🔒 protect everything below
    children: [
     { index:true, element: <PersonalInformation/>},
     { path: "directory", element: <Directory/>},
     { path: "profiles/:userId", element: <DetailPage/>},
    ],
  },
];

export default dashboardRoutes;
