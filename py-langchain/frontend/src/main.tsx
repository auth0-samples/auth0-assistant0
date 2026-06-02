import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import "./global.css";
import Layout from "./components/layout";
import { BrowserRouter } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/react";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NuqsAdapter>
          <Layout />
        </NuqsAdapter>
      </BrowserRouter>
    </QueryClientProvider>
    <Toaster richColors />
  </StrictMode>,
);
