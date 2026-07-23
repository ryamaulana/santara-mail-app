import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt, COOKIE_NAME } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];
const ADMIN_PATH_PREFIXES = ["/admin", "/api/admin"];
// Reachable by every authenticated role regardless of the admin/non-admin
// split below — a super admin forced to change their temp password must be
// able to land here instead of being bounced straight back to /admin/users.
const SHARED_AUTH_PATHS = ["/change-password"];

function isAdminPath(path: string) {
  return ADMIN_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

// Optimistic, cookie-only check — UX-level redirect convenience only.
// Every route handler independently re-verifies the session (see lib/auth.ts).
export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api/");
  const isPublic = PUBLIC_PATHS.includes(path);

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (!isPublic && !session) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path === "/login" && session) {
    const destination = session.role === "SUPER_ADMIN" ? "/admin/users" : "/";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isAdminPath(path) && session?.role !== "SUPER_ADMIN") {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Super admin only manages accounts — bounce it away from the rest of the
  // app's pages. API-level enforcement for surat/profil lives in each route
  // handler so read-only shared endpoints (e.g. GET /api/profil) can stay open.
  if (!isApi && !isPublic && !isAdminPath(path) && !SHARED_AUTH_PATHS.includes(path) && session?.role === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin/users", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Selain _next/static, _next/image, favicon.ico, dan uploads/, sekarang
  // juga mengecualikan berkas gambar statis apa pun di public/ (mis.
  // santara-mail-logo.png) — sebelumnya file-file itu ikut kena cek sesi,
  // jadi redirect ke /login begitu diakses TANPA login (mis. logo di
  // halaman /login itu sendiri), padahal harusnya selalu bisa diakses bebas.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
};
