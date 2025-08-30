import Sidebar from "@/components/sidebar/Sidebar";
import { Outlet } from "react-router-dom";



export default function ProfilePage() {
  return (
    <div className="flex">
      <Sidebar />

      {/* Right content placeholder */}
      <main className="flex-1 p-4">
       

        {/* Add form or other profile content here later */}
        <div className=" text-gray-500 text-center border border-dashed  rounded-lg">
          <Outlet/>
        </div>
      </main>
    </div>
  );
}
