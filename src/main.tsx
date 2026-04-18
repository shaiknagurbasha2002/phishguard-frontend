
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/contrast-overrides.css";
  import { installAuthFetchInterceptor } from "./lib/api";

  installAuthFetchInterceptor("/");

  createRoot(document.getElementById("root")!).render(<App />);
  