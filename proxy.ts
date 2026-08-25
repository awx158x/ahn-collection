import {
  NextResponse,
  type NextRequest,
} from "next/server";

export function proxy(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;

  const isAdminRoute =
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login";

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const adminCookie =
    request.cookies.get(
      "ahn_admin"
    )?.value;

  if (
    adminCookie !==
    "authenticated"
  ) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname =
      "/admin/login";

    loginUrl.searchParams.set(
      "next",
      pathname
    );

    return NextResponse.redirect(
      loginUrl
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};