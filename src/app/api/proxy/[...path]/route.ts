import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, "GET");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, "POST");
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, "PUT");
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return proxyRequest(request, params.path, "DELETE");
}

async function proxyRequest(
  request: NextRequest,
  pathParts: string[],
  method: string
) {
  const path = pathParts.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  
  const url = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;

  console.log(`[Proxy] ${method} ${url}`);

  // Headers to forward
  const headers: Record<string, string> = {};
  
  // Get token from cookies
  const token = request.cookies.get("access_token")?.value;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log(`[Proxy] Token from cookie: ${token.substring(0, 20)}...`);
  } else {
    console.log(`[Proxy] WARNING: No access_token cookie found`);
  }
  
  // Forward other important headers
  const headersToForward = [
    "content-type",
    "accept",
    "user-agent",
  ];

  headersToForward.forEach((headerName) => {
    const value = request.headers.get(headerName);
    if (value) {
      headers[headerName] = value;
    }
  });

  try {
    const body = ["POST", "PUT", "PATCH"].includes(method) ? await request.text() : undefined;

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    console.log(`[Proxy] Response ${method} ${path}: ${response.status}`);

    const responseHeaders = new Headers();
    
    // Forward response headers
    ["content-type", "cache-control", "etag"].forEach((headerName) => {
      const value = response.headers.get(headerName);
      if (value) {
        responseHeaders.set(headerName, value);
      }
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[Proxy] Error ${method} ${path}:`, error);
    return NextResponse.json(
      { detail: "Erro de conexão com o backend" },
      { status: 502 }
    );
  }
}
