import { connectDB } from "@/lib/db";
import GeneratedFile from "@/lib/models/generated-file";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return new NextResponse("File ID is required", { status: 400 });
    }

    await connectDB();
    const file = await GeneratedFile.findById(fileId);

    if (!file) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Create response with file data
    const headers = new Headers();
    headers.set("Content-Type", file.contentType);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`,
    );

    return new NextResponse(file.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
