import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const GET = async (request: NextRequest) => {
  const secret = request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.MY_SECRET_KEY) {
    return new NextResponse(JSON.stringify({ message: "Invalid Token!" }), {
      status: 401,
      statusText: "Unauthorized",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const path = request.nextUrl.searchParams.get("path") || "/";

  revalidatePath(path);

  return new NextResponse(JSON.stringify({ revalidated: true }));
};
