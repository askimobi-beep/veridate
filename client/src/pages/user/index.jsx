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
import { Outlet } from "react-router-dom";

export default function ProfilePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full bg-white shadow-md px-6 py-3 flex items-center justify-between sticky top-0 z-50">
       <Navbar/>
      </nav>

      {/* Page Content */}
      <main className="flex-1 p-6">
        <div className="text-gray-500 text-center rounded-lg">
          <Outlet />
        </div>
      </main>
      

      <Footer/>
    </div>
  );
}

