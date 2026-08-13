import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@stolpi/ui/src/industry.css";
import { App } from "./App.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1 },
    // Every useCreate/useUpdate/useRemove call in api.ts relies on this default — individual
    // mutations only need their own onError when they want extra behavior beyond a plain alert.
    mutations: { onError: (err) => alert((err as Error).message || "Óvænt villa kom upp.") },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
