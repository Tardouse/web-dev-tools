export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "web-dev-tools",
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
