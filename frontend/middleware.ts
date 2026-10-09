import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Bỏ qua kiểm tra cookie ở Server-side Vercel vì cookie thuộc về tên miền Render.
  // Việc xác thực sẽ được thực hiện ở Client-side (gọi API /auth/me) trong page.tsx.
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
