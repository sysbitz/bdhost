import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: { "@": path.resolve(__dirname, "./src") },
	},
	server: {
		port: 5173,
		proxy: {
			// The backend's routers are mounted at the root (e.g. /auth, /apps),
			// not under /api, so strip the /api prefix when forwarding.
			"/api": {
				target: "http://localhost:8000",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
});
