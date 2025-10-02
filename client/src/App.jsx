import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import BackgroundGlow from "./components/background/BackgroundGlow";
import Footer from "./components/footer/Footer";

const App = () => {
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
