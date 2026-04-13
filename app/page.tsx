import PipelineDashboard from '@/components/PipelineDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-blue-500/30">
      <PipelineDashboard />
    </main>
  );
}
