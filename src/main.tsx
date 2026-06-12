import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initYSDK, cloudRestoreAll, cloudSaveAll } from "./utils/ysdk";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

initYSDK().then(async () => {
    const restored = await cloudRestoreAll();
    if (restored) window.location.reload();

    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') cloudSaveAll();
    });
});
