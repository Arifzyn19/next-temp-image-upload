import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateRandomId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validasi tipe file (hanya gambar)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Hanya file gambar yang diizinkan' },
        { status: 400 }
      );
    }

    // Validasi ukuran file (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file melebihi 5MB' },
        { status: 400 }
      );
    }

    // Generate nama file unik
    const fileExt = file.name.split('.').pop();
    const fileName = `${generateRandomId()}.${fileExt}`;
    const bucketName = 'temp-images';
    
    // Convert file to arrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Supabase storage error:', uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // Store metadata in database for cleanup
    const { error: dbError } = await supabaseAdmin
      .from('temp_files')
      .insert({
        file_key: fileName,
        file_path: uploadData.path,
        bucket_name: bucketName,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Still return success because the file was uploaded successfully
    }
    
    return NextResponse.json({ 
      success: true, 
      fileUrl: urlData.publicUrl,
      fileKey: fileName
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengunggah file' },
      { status: 500 }
    );
  }
}

// GET handler untuk testing atau health check
export async function GET() {
  return NextResponse.json({
    message: 'API upload berjalan, gunakan metode POST untuk mengunggah file',
  });
} 