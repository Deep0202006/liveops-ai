import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles/index.css";
import "./styles/product.css";
import "./styles/accessibility.css";
import "./styles/command-center.css";
import "./styles/comparison.css";
import App from "./app/App";
import { PinsProvider } from "./comparison/pins";
import { SimulationProvider } from "./simulation/controller";

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnReconnect: true }, mutations: { retry: false } } });

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter><SimulationProvider><PinsProvider><App /></PinsProvider></SimulationProvider></BrowserRouter></QueryClientProvider></React.StrictMode>);
