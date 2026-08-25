import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      String(body?.email || "").trim();

    const password =
      String(body?.password || "");

    const adminEmail =
      process.env.ADMIN_EMAIL || "";

    const adminPassword =
      process.env.ADMIN_PASSWORD || "";

    if (!adminEmail || !adminPassword) {
      console.error(
        "ADMIN_EMAIL or ADMIN_PASSWORD is missing from .env.local"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Admin credentials are missing from .env.local",
        },
        { status: 500 }
      );
    }

    if (
      email.toLowerCase() !==
        adminEmail.toLowerCase() ||
      password !== adminPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid admin email or password.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: "ahn_admin",
      value: "authenticated",
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    console.error(
      "ADMIN LOGIN API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Server could not process the login request.",
      },
      { status: 500 }
    );
  }
}