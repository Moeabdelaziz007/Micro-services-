import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Jules AI Microservices Pipeline',
  description: 'Automated pipeline for generating full-stack microservices using Gemini and Jules AI MCP tools.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl">
      <body suppressHydrationWarning className="bg-neutral-950">{children}</body>
    </html>
  );
}
