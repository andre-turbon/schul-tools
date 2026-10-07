/**
 * schul-tools – liefert statische Tools aus /public nur mit gültigem Schlüssel aus.
 *
 * URL-Schema:  https://<worker>/<ACCESS_KEY>/<tool>/[?parameter]
 * Beispiel:    https://schul-tools.xyz.workers.dev/Kx9...q2/buchstaben/?t=2
 *
 * Der Schlüssel steht im Pfad (nicht als ?key=), damit relative Verweise
 * eines Tools (z. B. style.css, bild.png) automatisch mit Schlüssel geladen werden.
 * Falscher oder fehlender Schlüssel -> 404 (verrät nicht, dass es etwas gibt).
 */

const SECURITY_HEADERS = {
  "Referrer-Policy": "no-referrer",          // Schlüssel nicht per Referer weitergeben
  "X-Robots-Tag": "noindex, nofollow",       // nicht in Suchmaschinen
  "Cache-Control": "private, no-store",      // keine Zwischenspeicherung in Proxies
  "X-Content-Type-Options": "nosniff",
};

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const url = new URL(request.url);
    const segments = url.pathname.split("/"); // ["", "<key>", "tool", ...]
    const key = decodeURIComponent(segments[1] || "");

    if (!env.ACCESS_KEY || !(await safeEqual(key, env.ACCESS_KEY))) {
      return notFound();
    }

    let rest = "/" + segments.slice(2).join("/");

    // /<key>/buchstaben  ->  /<key>/buchstaben/  (sonst funktionieren relative Pfade nicht)
    if (!rest.endsWith("/") && !/\.[A-Za-z0-9]+$/.test(rest)) {
      return new Response(null, {
        status: 302,
        headers: { Location: `/${segments[1]}${rest}/${url.search}`, ...SECURITY_HEADERS },
      });
    }
    if (rest.endsWith("/")) rest += "index.html";

    const asset = await env.ASSETS.fetch(new Request(new URL(rest, url.origin), { method: request.method }));
    if (!asset.ok) return notFound();

    const response = new Response(asset.body, asset);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
    if (env.FRAME_ANCESTORS) {
      // optional: nur Einbettung von bestimmten Seiten erlauben, z. B. Classroomscreen
      response.headers.set("Content-Security-Policy", `frame-ancestors ${env.FRAME_ANCESTORS}`);
    }
    return response;
  },
};

function notFound() {
  return new Response("Not Found", { status: 404, headers: SECURITY_HEADERS });
}

// Vergleich in konstanter Zeit (verhindert Timing-Angriffe auf den Schlüssel)
async function safeEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  return crypto.subtle.timingSafeEqual(ha, hb);
}