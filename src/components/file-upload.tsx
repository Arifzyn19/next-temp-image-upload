"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadImage, getDirectUploadUrl, completeDirectUpload } from "@/actions";
import ResultCard from "@/components/result-card";
import { formatFileSize } from "@/lib/utils";
import { Camera, Video, Music, Image, Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const DIRECT_UPLOAD_THRESHOLD = 5 * 1024 * 1024; // 5MB

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    fileUrl?: string;
    fileKey?: string;
    error?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("image");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileTypeConfig = {
    image: {
      accept: "image/*",
      maxSize: 5 * 1024 * 1024, // 5MB
      icon: <Image className="w-10 h-10 mb-3 text-primary" />,
      extensions: "PNG, JPG atau GIF",
      title: "Unggah Gambar"
    },
    video: {
      accept: "video/*",
      maxSize: 50 * 1024 * 1024, // 100MB
      icon: <Video className="w-10 h-10 mb-3 text-primary" />,
      extensions: "MP4, MOV atau WebM",
      title: "Unggah Video"
    },
    audio: {
      accept: "audio/*",
      maxSize: 20 * 1024 * 1024, // 20MB
      icon: <Music className="w-10 h-10 mb-3 text-primary" />,
      extensions: "MP3, WAV atau OGG",
      title: "Unggah Audio"
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setFile(null);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const validateFile = (selectedFile: File) => {
    const config = fileTypeConfig[activeTab as keyof typeof fileTypeConfig];
    
    // Validasi tipe file
    if (!selectedFile.type.startsWith(`${activeTab}/`)) {
      alert(`Hanya file ${activeTab} yang diizinkan`);
      return false;
    }
    
    // Validasi ukuran file
    if (selectedFile.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      alert(`Ukuran file melebihi ${maxSizeMB}MB`);
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setUploadResult(null);
        setUploadProgress(0);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setUploadResult(null);
        setUploadProgress(0);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Standard upload for smaller files
  const performStandardUpload = async (selectedFile: File) => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('fileType', activeTab);
    
    const result = await uploadImage(formData);
    setUploadResult(result);
  };

  // Direct upload with progress for larger files
  const performDirectUpload = async (selectedFile: File) => {
    // Step 1: Get signed URL for direct upload
    const signedUrlResult = await getDirectUploadUrl(
      selectedFile.name, 
      activeTab, 
      selectedFile.type
    );
    
    if (!signedUrlResult.success || !signedUrlResult.signedUrl) {
      setUploadResult({
        success: false,
        error: signedUrlResult.error || 'Gagal mendapatkan URL unggahan'
      });
      return;
    }
    
    // Step 2: Upload directly to storage with progress tracking
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    });
    
    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Step 3: Complete the upload process
        const completionResult = await completeDirectUpload(signedUrlResult.fileKey!);
        setUploadResult(completionResult);
      } else {
        setUploadResult({
          success: false,
          error: `Kesalahan unggahan: ${xhr.status} ${xhr.statusText}`
        });
      }
    });
    
    xhr.addEventListener('error', () => {
      setUploadResult({
        success: false,
        error: 'Koneksi gagal saat mengunggah file'
      });
    });
    
    xhr.open('PUT', signedUrlResult.signedUrl);
    xhr.setRequestHeader('Content-Type', selectedFile.type);
    xhr.send(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Choose upload method based on file size
      if (file.size > DIRECT_UPLOAD_THRESHOLD) {
        await performDirectUpload(file);
      } else {
        await performStandardUpload(file);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        error: error.message || 'Terjadi kesalahan saat mengunggah file'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const renderPreview = () => {
    if (!file) return null;
    
    if (activeTab === "image") {
      return (
        <img 
          src={URL.createObjectURL(file)} 
          alt="Preview" 
          className="max-h-44 max-w-full object-contain mb-2 rounded" 
        />
      );
    } else if (activeTab === "video") {
      return (
        <video 
          src={URL.createObjectURL(file)} 
          controls 
          className="max-h-44 max-w-full object-contain mb-2 rounded" 
        />
      );
    } else if (activeTab === "audio") {
      return (
        <audio 
          src={URL.createObjectURL(file)} 
          controls 
          className="w-full mb-2" 
        />
      );
    }
    
    return null;
  };

  const config = fileTypeConfig[activeTab as keyof typeof fileTypeConfig];

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg border-opacity-50">
        <CardHeader className="rounded-t-lg">
          <CardTitle className="text-center text-xl font-bold text-gray-800">
            {config.title} Sementara
          </CardTitle>
          <CardDescription className="text-center">
            File akan dihapus secara otomatis setelah 1 jam
          </CardDescription>
          <Tabs defaultValue="image" value={activeTab} onValueChange={handleTabChange} className="w-full mt-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                <span>Gambar</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span>Video</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>Audio</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div 
              className="flex items-center justify-center w-full"
              onDragEnter={handleDrag}
            >
              <label 
                htmlFor="file-upload" 
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 
                ${dragActive ? "bg-blue-50 border-blue-400" : "bg-gray-50 hover:bg-gray-100 border-gray-300"}`}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="flex flex-col items-center justify-center py-4 px-6 w-full">
                    <div className="relative w-full">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute -right-2 -top-2 bg-white shadow-sm rounded-full border h-8 w-8 z-10"
                        onClick={handleRemoveFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {renderPreview()}
                    
                    <p className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {file.name} ({formatFileSize(file.size)})
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                    {config.icon}
                    <p className="mb-2 text-sm text-center font-semibold text-gray-700">
                      <span className="text-primary">Klik untuk unggah</span> atau tarik file ke sini
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      {config.extensions} (Maks. {config.maxSize / (1024 * 1024)}MB)
                    </p>
                  </div>
                )}
                <input 
                  id="file-upload" 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept={config.accept} 
                  onChange={handleFileChange} 
                />
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {isUploading && uploadProgress > 0 && (
            <div className="w-full">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center mt-1 text-gray-500">{uploadProgress}% selesai</p>
            </div>
          )}
          
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading} 
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Mengunggah...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Unggah {activeTab === "image" ? "Gambar" : activeTab === "video" ? "Video" : "Audio"}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {uploadResult && (
        <div className="mt-6 animate-fade-in">
          <ResultCard result={uploadResult} />
        </div>
      )}
    </div>
  );
}