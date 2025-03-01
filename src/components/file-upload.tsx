"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadImage } from "@/actions";
import ResultCard from "@/components/result-card";
import { formatFileSize } from "@/lib/utils";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    fileUrl?: string;
    fileKey?: string;
    error?: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validasi tipe file (hanya gambar)
      if (!selectedFile.type.startsWith('image/')) {
        alert('Hanya file gambar yang diizinkan');
        return;
      }
      
      // Validasi ukuran file (maks 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('Ukuran file melebihi 5MB');
        return;
      }
      
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await uploadImage(formData);
      setUploadResult(result);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        error: 'Terjadi kesalahan saat mengunggah file'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Unggah Gambar Sementara</CardTitle>
          <CardDescription>
            Gambar akan dihapus secara otomatis setelah 1 jam
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label 
                htmlFor="file-upload" 
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300"
              >
                {file ? (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Preview" 
                      className="max-h-44 max-w-full object-contain mb-2" 
                    />
                    <p className="text-sm text-gray-500">
                      {file.name} ({formatFileSize(file.size)})
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg 
                      className="w-10 h-10 mb-3 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Klik untuk unggah</span> atau tarik gambar ke sini
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG atau GIF (Maks. 5MB)
                    </p>
                  </div>
                )}
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading} 
            className="w-full"
          >
            {isUploading ? 'Mengunggah...' : 'Unggah Gambar'}
          </Button>
        </CardFooter>
      </Card>

      {uploadResult && (
        <div className="mt-6">
          <ResultCard result={uploadResult} />
        </div>
      )}
    </div>
  );
}