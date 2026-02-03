// import Sidebar from "@/components/sidebar/Sidebar";
// import { Outlet } from "react-router-dom";



// export default function ProfilePage() {
//   return (
//     <div className="flex">
//       <Sidebar />

//       {/* Right content placeholder */}
//       <main className="flex-1 p-4">
       

//         {/* Add form or other profile content here later */}
//         <div className=" text-gray-500 text-center border border-dashed  rounded-lg">
//           <Outlet/>
//         </div>
//       </main>
//     </div>
//   );
// }


import Footer from "@/components/footer/Footer";
import Navbar from "@/components/navbar/Navbar";
import { Outlet, useLocation } from "react-router-dom";

export default function ProfilePage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search || "");
  const isEmbed = params.get("embed") === "1";

  return (
    <div className="min-h-screen flex flex-col">
      {!isEmbed ? (
        <nav className="w-full bg-white shadow-md px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <Navbar />
        </nav>
      ) : null}

      <main className={isEmbed ? "flex-1 p-0" : "flex-1 p-6"}>
        <div className={isEmbed ? "text-gray-500 text-center" : "text-gray-500 text-center rounded-lg"}>
          <Outlet />
        </div>
      </main>

      {!isEmbed ? <Footer /> : null}
    </div>
  );
}

