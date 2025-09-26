import React from "react";

export default function CreditText({ label, available = 0, used = 0, total }) {
  const _total =
    typeof total === "number" ? total : (available || 0) + (used || 0);

  return (
    <div className="flex flex-col text-sm text-gray-600">
      
      <div>
        Credits: Total={_total}  Used={used} Available={available}
      </div>
    </div>
  );
}
