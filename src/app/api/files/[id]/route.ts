import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * Streams an uploaded document by id. File bytes live in Postgres (bytea), so
 * this works on any host including Vercel.
 *  - Published documents are public.
 *  - Unpublished documents require an authenticated admin session.
 *  - `?download=1` forces a download; otherwise PDFs/images render inline.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  // Pull only what we need (including the bytes) here.
  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    select: {
      fileName: true,
      mimeType: true,
      published: true,
      fileData: true,
    },
  });

  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!doc.published) {
    const session = await getSession();
    if (!session?.user) {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  const data = Buffer.from(doc.fileData);

  const url = new URL(request.url);
  const forceDownload = url.searchParams.get("download") === "1";
  // Inline for PDFs/images so they preview in the browser; attachment otherwise.
  const inlineable =
    doc.mimeType === "application/pdf" || doc.mimeType.startsWith("image/");
  const disposition = forceDownload || !inlineable ? "attachment" : "inline";

  // Encode the filename for the header (RFC 5987) to handle non-ASCII names.
  const asciiName = doc.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  const encodedName = encodeURIComponent(doc.fileName);

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Length": String(data.length),
      "Content-Disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
