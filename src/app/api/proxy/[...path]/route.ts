import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, "POST");
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, "PUT");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, "PATCH");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path, "DELETE");
}

async function proxyRequest(
  request: NextRequest,
  pathParts: string[],
  method: string
): Promise<NextResponse> {
  const path = pathParts.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const originalPath = request.nextUrl.pathname;
  
  // ALWAYS add trailing slash for backend routes
  const finalPath = path.endsWith("/") ? path : `${path}/`;
  const url = `${BACKEND_URL}/${finalPath}${searchParams ? `?${searchParams}` : ""}`;

  console.log(`[Proxy] Original: ${originalPath}${searchParams ? `?${searchParams}` : ""}`);
  console.log(`[Proxy] Final URL: ${url}`);

  // Headers to forward
  const headers: Record<string, string> = {};
  
  // Get token from cookies
  const token = request.cookies.get("access_token")?.value;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  // Forward important headers
  const headersToForward = ["content-type", "accept", "user-agent"];
  headersToForward.forEach((headerName) => {
    const value = request.headers.get(headerName);
    if (value) headers[headerName] = value;
  });

  try {
    // Get body for POST, PUT, PATCH
    const body = ["POST", "PUT", "PATCH"].includes(method) 
      ? await request.text() 
      : undefined;

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    console.log(`[Proxy] ${method} ${finalPath} → ${response.status}`);

    // Forward response headers
    const responseHeaders = new Headers();
    ["content-type", "cache-control", "etag"].forEach((headerName) => {
      const value = response.headers.get(headerName);
      if (value) responseHeaders.set(headerName, value);
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[Proxy] ERROR ${method} ${url}:`, error);
    
    return NextResponse.json(
      { 
        detail: "Erro de conexão com o backend",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 502 }
    );
  }
}
