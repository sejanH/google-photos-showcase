import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminAccessToken, refreshBaseUrls } from "@/lib/media-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const GOOGLE_ONLY_MODE = process.env.GOOGLE_ONLY_MODE === "true";

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const searchParams = req.nextUrl.searchParams;
  
  // Define width/height/crop parameters (Google format: =w[width]-h[height]-c)
  const w = searchParams.get("w");
  const h = searchParams.get("h");
  const crop = searchParams.get("c") === "true";
  
  let params = "";
  if (w || h) {
    params = "=";
    if (w) params += `w${w}`;
    if (h) params += w ? `-h${h}` : `h${h}`;
    if (crop) params += "-c";
  }

  try {
    // 1. Get photo from DB
    let photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) return new NextResponse("Not Found", { status: 404 });

    // 2. Check if baseUrl is expired or about to expire
    const now = new Date();
    if (photo.baseUrlExpiresAt <= now) {
      try {
        await refreshBaseUrls([id]);
      } catch (error) {
        if (GOOGLE_ONLY_MODE) {
          console.warn("On-demand refresh failed in GOOGLE_ONLY_MODE:", error);
          return expiredImageResponse();
        }
        throw error;
      }
      photo = await prisma.photo.findUnique({ where: { id } });
      if (!photo) return new NextResponse("Refresh Failed", { status: 500 });
    }

    // 3. Get admin token
    let token: string;
    try {
      token = await getAdminAccessToken();
    } catch (error) {
      if (GOOGLE_ONLY_MODE) {
        return expiredImageResponse();
      }
      throw error;
    }

    // 4. Fetch from Google
    const googleUrl = `${photo.baseUrl}${params}`;
    const res = await fetch(googleUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      // Try on-demand refresh once for this specific photo
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        try {
          await refreshBaseUrls([id]);
          const updatedPhoto = await prisma.photo.findUnique({ where: { id } });
          if (updatedPhoto) {
            const retryToken = await getAdminAccessToken();
            const retryRes = await fetch(`${updatedPhoto.baseUrl}${params}`, {
              headers: { Authorization: `Bearer ${retryToken}` },
            });
            if (retryRes.ok) return pipeResponse(retryRes);
          }
        } catch (error) {
          if (GOOGLE_ONLY_MODE) {
            console.warn("Retry refresh failed in GOOGLE_ONLY_MODE:", error);
            return expiredImageResponse();
          }
        }
      }

      if (GOOGLE_ONLY_MODE && (res.status === 401 || res.status === 403 || res.status === 404)) {
        return expiredImageResponse();
      }
      // If it failed with 403, try one more refresh
      if (res.status === 403) {
        await refreshBaseUrls([id]);
        const updatedPhoto = await prisma.photo.findUnique({ where: { id } });
        if (updatedPhoto) {
          const retryRes = await fetch(`${updatedPhoto.baseUrl}${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (retryRes.ok) return pipeResponse(retryRes);
        }
      }
      return new NextResponse("Google API Error", { status: res.status });
    }

    return pipeResponse(res);
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

function pipeResponse(res: Response) {
  const contentType = res.headers.get("Content-Type") || "image/jpeg";
  
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function expiredImageResponse() {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <g fill="#e2e8f0" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" text-anchor="middle">
    <text x="600" y="410" font-size="46" font-weight="700">Photo Access Expired</text>
    <text x="600" y="470" font-size="28" fill="#cbd5e1">Please re-authenticate and re-pick this photo</text>
  </g>
</svg>`.trim();

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
