import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminAccessToken } from "@/lib/media-service";
import fs from "fs";
import path from "path";
import sharp from "sharp";

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

    // 2. Check if local cached file exists
    if (photo.storagePath && fs.existsSync(photo.storagePath)) {
      let imageBuffer = fs.readFileSync(photo.storagePath);

      // Apply resizing if requested
      if (w || h) {
        const width = w ? parseInt(w) : undefined;
        const height = h ? parseInt(h) : undefined;
        imageBuffer = await sharp(imageBuffer)
          .resize(width, height, { fit: crop ? "cover" : "inside" })
          .toBuffer();
      }

      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": photo.mimeType || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // 3. Fallback: Check if baseUrl is expired or about to expire
    const now = new Date();
    if (photo.baseUrlExpiresAt <= now) {
      return expiredImageResponse();
    }

    // 4. Get admin token
    let token: string;
    try {
      token = await getAdminAccessToken();
    } catch (error) {
      return expiredImageResponse();
    }

    // 5. Fetch from Google
    const googleUrl = `${photo.baseUrl}${params}`;
    const res = await fetch(googleUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return expiredImageResponse();
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
