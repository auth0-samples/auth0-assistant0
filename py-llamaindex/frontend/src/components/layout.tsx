import { Routes, Route } from "react-router";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserButton from "@/components/auth0/user-button";
import { ActiveLink } from "@/components/navbar";

import ChatPage from "@/pages/ChatPage";
import useAuth, { getLogoutUrl } from "@/lib/use-auth";
import ClosePage from "@/pages/ClosePage";
import DocumentsPage from "@/pages/DocumentsPage";

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="bg-secondary grid grid-rows-[auto_1fr] h-[100dvh]">
      <div className="grid grid-cols-[1fr_auto] gap-2 p-4 bg-black/25">
        <div className="flex gap-4 flex-col md:flex-row md:items-center">
          <a
            href="https://a0.to/ai-event"
            rel="noopener noreferrer"
            target="_blank"
            className="flex items-center gap-2 px-4"
          >
            <img
              src="/images/auth0-logo.svg"
              alt="Auth0 AI Logo"
              className="h-8"
              width={143}
              height={32}
            />
          </a>
          <span className="text-white text-2xl">Assistant0</span>
          <nav className="flex gap-1 flex-col md:flex-row">
            <ActiveLink href="/">Chat</ActiveLink>
            <ActiveLink href="/documents">Documents</ActiveLink>
          </nav>
        </div>
        <div className="flex justify-center">
          {user && (
            <div className="flex items-center gap-2 px-4 text-white">
              <UserButton user={user} logoutUrl={getLogoutUrl()} />
            </div>
          )}
          <Button asChild variant="header" size="default">
            <a
              href="https://github.com/auth0-samples/auth0-assistant0-python"
              target="_blank"
            >
              <Github className="size-3" />
              <span>Open in GitHub</span>
            </a>
          </Button>
        </div>
      </div>
      <div className="gradient-up bg-gradient-to-b from-white/10 to-white/0 relative grid border-input border-b-0">
        <div className="absolute inset-0">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/close" element={<ClosePage />} />
            <Route path="/documents" element={<DocumentsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
