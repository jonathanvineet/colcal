import { NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';
import { getEffectiveAuth } from '@/lib/authHelper';

const utapi = new UTApi();

export async function POST(request) {
  const authData = await getEffectiveAuth(request.url);
  if (!authData.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { fileKey } = await request.json();
    if (!fileKey) return NextResponse.json({ error: 'fileKey is required' }, { status: 400 });

    await utapi.deleteFiles(fileKey);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete file error:', err);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
