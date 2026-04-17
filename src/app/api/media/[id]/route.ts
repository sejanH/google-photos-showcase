import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminAccessToken, refreshBaseUrls } from "@/lib/media-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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
      await refreshBaseUrls([id]);
      photo = await prisma.photo.findUnique({ where: { id } });
      if (!photo) return new NextResponse("Refresh Failed", { status: 500 });
    }

    // 3. Get admin token
    const token = await getAdminAccessToken();

    // 4. Fetch from Google
    const googleUrl = `${photo.baseUrl}${params}`;
    const res = await fetch(googleUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
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
