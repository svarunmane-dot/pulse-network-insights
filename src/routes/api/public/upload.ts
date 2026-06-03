import { createFileRoute } from "@tanstack/react-router";

async function drainRequestBody(request: Request) {
  if (!request.body) return;
  const reader = request.body.getReader();
  while (true) {
    const { done } = await reader.read();
    if (done) break;
  }
}

export const Route = createFileRoute("/api/public/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await drainRequestBody(request);
        return new Response(null, {
          status: 204,
          headers: {
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});