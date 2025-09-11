// components/ui/BackgroundGlow.jsx
export default function BackgroundGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-[#f7f9fc] to-orange-200" />
      <div className="absolute -top-40 left-1/3 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_70%)] blur-3xl" />
      <div className="absolute -bottom-48 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.12),transparent_70%)] blur-3xl" />
    </div>
  );
}
