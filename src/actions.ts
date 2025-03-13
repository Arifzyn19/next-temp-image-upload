'use server';

import { supabaseAdmin } from "@/lib/supabase";
import { generateRandomId } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;
    
    if (!file) {
      return { success: false, error: 'Tidak ada file yang diunggah' };
    }

    // Generate a unique file name
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
      return { success: false, error: uploadError.message };
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
        file_type: fileType, // Store file type for reference
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Still return success because the file was uploaded successfully
    }

    revalidatePath('/');
    
    return { 
      success: true, 
      fileUrl: urlData.publicUrl,
      fileKey: fileName
    };
  } catch (error: any) {
    console.error('Server action error:', error);
    return { 
      success: false, 
      error: error.message || 'Terjadi kesalahan saat mengunggah file' 
    };
  }
}

// For larger files, consider using direct upload to Supabase
export async function getDirectUploadUrl(fileName: string, fileType: string, contentType: string) {
  try {
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${generateRandomId()}.${fileExt}`;
    const bucketName = 'temp-images';
    
    // Get a signed URL for direct upload
    const { data, error } = await supabaseAdmin
      .storage
      .from(bucketName)
      .createSignedUploadUrl(uniqueFileName);
    if (error) {
      console.error('Signed URL error:', error);
      return { success: false, error: error.message };
    }

    // Pre-create database entry
    await supabaseAdmin
      .from('temp_files')
      .insert({
        file_key: uniqueFileName,
        file_path: uniqueFileName,
        bucket_name: bucketName,
        file_type: fileType,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
      });

    return { 
      success: true, 
      signedUrl: data.signedUrl,
      fileKey: uniqueFileName,
      path: data.path
    };
  } catch (error: any) {
    console.error('Get upload URL error:', error);
    return { 
      success: false, 
      error: error.message || 'Terjadi kesalahan saat mempersiapkan unggahan' 
    };
  }
}

export async function completeDirectUpload(fileKey: string) {
  try {
    const bucketName = 'temp-images';
    
    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from(bucketName)
      .getPublicUrl(fileKey);
    
    revalidatePath('/');
    
    return { 
      success: true, 
      fileUrl: urlData.publicUrl,
      fileKey: fileKey
    };
  } catch (error: any) {
    console.error('Complete upload error:', error);
    return { 
      success: false, 
      error: error.message || 'Terjadi kesalahan saat menyelesaikan unggahan' 
    };
  }
}

export async function cleanupExpiredFiles() {
  try {
    // Get all expired files
    const { data: expiredFiles, error: queryError } = await supabaseAdmin
      .from('temp_files')
      .select('*')
      .lt('expires_at', new Date().toISOString());

    if (queryError) {
      console.error('Query error:', queryError);
      return { success: false, error: queryError.message };
    }

    if (!expiredFiles || expiredFiles.length === 0) {
      return { success: true, message: 'No expired files to clean up' };
    }

    // Group files by bucket
    const filesByBucket: Record<string, string[]> = {};
    expiredFiles.forEach((file) => {
      if (!filesByBucket[file.bucket_name]) {
        filesByBucket[file.bucket_name] = [];
      }
      if (typeof file.file_key === 'string') {
        filesByBucket[file.bucket_name].push(file.file_key);
      }
    });

    // Delete files from storage
    for (const [bucket, files] of Object.entries(filesByBucket)) {
      const { error: deleteError } = await supabaseAdmin
        .storage
        .from(bucket)
        .remove(files);

      if (deleteError) {
        console.error(`Error deleting files from ${bucket}:`, deleteError);
      }
    }

    // Delete records from database
    const fileIds = expiredFiles.map(file => file.id);
    const { error: dbDeleteError } = await supabaseAdmin
      .from('temp_files')
      .delete()
      .in('id', fileIds);

    if (dbDeleteError) {
      console.error('Database delete error:', dbDeleteError);
      return { success: false, error: dbDeleteError.message };
    }

    return { 
      success: true, 
      message: `Berhasil menghapus ${expiredFiles.length} file yang kadaluarsa`
    };
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return { success: false, error: error.message || 'Error during cleanup' };
  }
}