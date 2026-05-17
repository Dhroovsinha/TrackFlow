import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      
      const protectedRoutes = [
        "/dashboard",
        "/goals",
        "/admin",
        "/approvals",
        "/quarterly",
        "/team",
        "/audit",
        "/reports"
      ];
      
      const isProtectedRoute = protectedRoutes.some(route => nextUrl.pathname.startsWith(route));
      
      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect to /login
      } else if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
        token.managerId = user.managerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as string;
        session.user.departmentName = token.departmentName as string;
        session.user.managerId = token.managerId as string | null;
      }
      return session;
    },
  },
  providers: [], // Empty array, to be populated in auth.ts
} satisfies NextAuthConfig;
