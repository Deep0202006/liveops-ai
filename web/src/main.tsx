import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles/index.css";
import "./styles/product.css";
import "./styles/accessibility.css";
import App from "./app/App";

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnReconnect: true }, mutations: { retry: false } } });

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><App /></BrowserRouter></QueryClientProvider></React.StrictMode>);
