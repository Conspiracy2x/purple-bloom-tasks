// Public endpoint: returns Turnstile site key for the client widget.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const siteKey = Deno.env.get("TURNSTILE_SITE_KEY") ?? "";
  return new Response(JSON.stringify({ siteKey }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});