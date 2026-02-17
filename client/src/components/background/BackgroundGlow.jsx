// components/ui/BackgroundGlow.jsx
export default function BackgroundGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#fff9f5_0%,#fff6ef_35%,#ffffff_70%,#fff8f2_100%)]" />
      <div className="absolute -top-36 -left-24 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(251,119,59,0.22),transparent_72%)] blur-3xl" />
      <div className="absolute -bottom-44 right-[-8%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(251,119,59,0.16),transparent_74%)] blur-3xl" />
    </div>
  );
}
