interface ComingSoonProps {
  module: string;
  description: string;
  icon: React.ReactNode;
}

export default function ComingSoon({ module, description, icon }: ComingSoonProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
      {/* Icon ring */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-accent-500/20 blur-xl scale-150" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-accent shadow-glow-accent text-white">
          {icon}
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{module}</h1>
      <p className="text-slate-400 text-base max-w-sm mb-8">{description}</p>

      {/* Badge */}
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
        Coming soon
      </span>
    </div>
  );
}
