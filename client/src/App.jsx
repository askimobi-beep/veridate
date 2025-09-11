import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import BackgroundGlow from "./components/background/BackgroundGlow";

const App = () => {
  return (
    <>
      <BackgroundGlow />
      {/* <Navbar /> */}
      <Outlet />
    </>
  );
};

export default App;
