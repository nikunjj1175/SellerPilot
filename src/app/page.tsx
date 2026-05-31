import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingSections } from "@/components/landing/landing-sections";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <LandingSections />
      </main>
      <LandingFooter />
    </div>
  );
}
