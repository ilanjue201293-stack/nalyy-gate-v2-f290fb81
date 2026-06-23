import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bot, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { PublicAuthButton } from "@/components/public-auth-button";

const BOT_INVITE_URL =
  "https://discord.com/oauth2/authorize?client_id=1518955268774559764&permissions=2415971328&integration_type=0&scope=bot+applications.commands";

export const Route = createFileRoute("/bot")({
  head: () => ({
    meta: [
      { title: "Nalyy Gate Bot - Discord companion" },
      {
        name: "description",
        content: "Add the official Nalyy Gate Discord bot to your server to manage keys and whitelists.",
      },
      { property: "og:title", content: "Nalyy Gate Bot" },
      {
        property: "og:description",
        content: "The official Discord companion for Nalyy Gate.",
      },
    ],
  }),
  component: BotPage,
});

function BotPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-9 w-9" />
            <span className="font-display text-lg font-bold text-gradient">Nalyy Gate</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/how-it-works" className="hover:text-foreground">How it works</Link>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/bot" className="text-foreground">Bot</Link>
          </nav>
          <PublicAuthButton variant="hero" size="sm" />
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.62_0.26_295/0.25),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          <div className="mt-10 flex flex-col items-center text-center">
            <div className="inline-grid h-24 w-24 place-items-center rounded-3xl border border-primary/30 bg-primary/10 backdrop-blur">
              <Logo className="h-16 w-16" />
            </div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-widest text-primary">
              <Bot className="h-3 w-3" /> Discord Bot
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold sm:text-5xl">
              Nalyy Gate <span className="text-gradient">Bot</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              The official Discord companion for Nalyy Gate. Bring your key system, panels and roles right inside your community.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-primary/30 bg-card/50 p-8 text-center backdrop-blur">
            <h2 className="font-display text-xl font-semibold">Add the bot to your server</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Click below to invite Nalyy Gate Bot with the right permissions.
            </p>

            <div className="mt-6 flex justify-center">
              <Button asChild variant="hero" size="lg">
                <a href={BOT_INVITE_URL} target="_blank" rel="noreferrer">
                  Invite to Discord <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Made with care for the Nalyy Gate community.
          </p>
        </div>
      </section>
    </div>
  );
}
