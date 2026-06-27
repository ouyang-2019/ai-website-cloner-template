export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiRouteContext = {
  params: Promise<{ path: string[] }>;
};

const REQUEST_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "x-requested-with",
];

const RESPONSE_HEADERS_TO_SKIP = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
]);

function backendBaseUrl(): string | null {
  const value = process.env.AUBEAU_BACKEND_URL?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

function copyRequestHeaders(request: Request): Headers {
  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-forwarded-host", request.headers.get("host") ?? "localhost");
  headers.set("x-forwarded-proto", new URL(request.url).protocol.replace(":", ""));
  return headers;
}

function copyResponseHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers();
  for (const [name, value] of upstreamHeaders) {
    if (!RESPONSE_HEADERS_TO_SKIP.has(name.toLowerCase())) {
      headers.set(name, value);
    }
  }
  return headers;
}

async function proxy(request: Request, context: ApiRouteContext) {
  const backend = backendBaseUrl();
  if (!backend) {
    return Response.json({ detail: "Backend API is not configured." }, { status: 503 });
  }

  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const targetUrl = `${backend}/api/${path.map(encodeURIComponent).join("/")}${incomingUrl.search}`;
  const hasBody = !["GET", "HEAD"].includes(request.method);

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: copyRequestHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: copyResponseHeaders(upstream.headers),
    });
  } catch {
    return Response.json({ detail: "Backend API is temporarily unavailable." }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
