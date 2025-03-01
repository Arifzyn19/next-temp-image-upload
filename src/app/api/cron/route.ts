import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredFiles } from '@/app/actions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Jika dibutuhkan, tambahkan autentikasi untuk API cron
  // Contoh: cek secret key di header
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET_KEY || authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await cleanupExpiredFiles();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}