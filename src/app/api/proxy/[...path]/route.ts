import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

console.log("[Proxy Route] Inicializado com BACKEND_URL:", BACKEND_URL);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  console.log("[Proxy Route] GET handler chamado");
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  console.log("[Proxy Route] POST handler chamado");
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  console.log("[Proxy Route] PUT handler chamado");
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, "PUT");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  console.log("[Proxy Route] PATCH handler chamado");
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  console.log("[Proxy Route] DELETE handler chamado");
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, "DELETE");
}

async function proxyRequest(
  request: NextRequest,
  pathParts: string[],
  method: string
) {
  const path = pathParts.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  
  // Preserve trailing slash from original URL
  const hasTrailingSlash = request.nextUrl.pathname.endsWith("/");
  const finalPath = hasTrailingSlash ? `${path}/` : path;
  const url = `${BACKEND_URL}/${finalPath}${searchParams ? `?${searchParams}` : ""}`;

  console.log(`[Proxy] ===== INÍCIO REQUEST =====`);
  console.log(`[Proxy] Método: ${method}`);
  console.log(`[Proxy] Path original: ${request.nextUrl.pathname}`);
  console.log(`[Proxy] Path parts: ${pathParts.join(", ")}`);
  console.log(`[Proxy] URL final: ${url}`);
  console.log(`[Proxy] Backend URL base: ${BACKEND_URL}`);

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
    
    if (body) {
      console.log(`[Proxy] Body enviado (${body.length} bytes):`, body.substring(0, 200));
    }

    console.log(`[Proxy] Executando fetch para: ${url}`);
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    console.log(`[Proxy] Response ${method} ${path}: ${response.status} ${response.statusText}`);

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
    console.error(`[Proxy] ===== ERRO =====`);
    console.error(`[Proxy] Método: ${method}`);
    console.error(`[Proxy] Path: ${path}`);
    console.error(`[Proxy] URL tentada: ${url}`);
    console.error(`[Proxy] Tipo de erro:`, error instanceof Error ? error.constructor.name : typeof error);
    console.error(`[Proxy] Mensagem de erro:`, error);
    console.error(`[Proxy] Stack:`, error instanceof Error ? error.stack : "N/A");
    
    return NextResponse.json(
      { 
        detail: "Erro de conexão com o backend",
        debug: {
          url,
          method,
          path,
          error: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 502 }
    );
  }
}
