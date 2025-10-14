import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import BackgroundGlow from "./components/background/BackgroundGlow";
import Footer from "./components/footer/Footer";
import ProfilePdfDownload from "./components/profile/ProfilePdf";
import { useAuth } from "./context/AuthContext";



const App = () => {
  const { user} = useAuth();
  console.log(user , 'user')
  return (
    <>
      <BackgroundGlow />
      {/* <Navbar /> */}
      <Outlet />
      
      <Footer/>
    </>
  );
};

export default App;
