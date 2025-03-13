"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Link, Download, Share2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResultCardProps {
  result: {
    success: boolean;
    fileUrl?: string;
    fileKey?: string;
    fileType?: string;
    fileName?: string;
    error?: string;
  };
}

export default function ResultCard({ result }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const fileType = result.fileType || detectFileType(result.fileUrl || "");
  
  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  
  useEffect(() => {
    // Set up countdown timer
    if (result.success) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [result.success]);
  
  // Format time left as hh:mm:ss
  const formatTimeLeft = () => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCopy = async () => {
    if (result.fileUrl) {
      try {
        await navigator.clipboard.writeText(result.fileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy: ", error);
      }
    }
  };
  
  const handleDownload = () => {
    if (result.fileUrl) {
      const link = document.createElement('a');
      link.href = result.fileUrl;
      link.download = result.fileName || `downloaded-file.${getFileExtension(fileType)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const handleShare = async () => {
    if (result.fileUrl && navigator.share) {
      try {
        await navigator.share({
          title: 'File yang saya bagikan',
          text: 'Lihat file yang saya unggah',
          url: result.fileUrl
        });
      } catch (error) {
        console.error("Error sharing: ", error);
      }
    } else {
      handleCopy();
    }
  };
  
  function detectFileType(url: string): string {
    if (!url) return "image";
    
    const extension = url.split('.').pop()?.toLowerCase() || "";
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return "image";
    } else if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) {
      return "video";
    } else if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension)) {
      return "audio";
    }
    
    return "image"; // default to image
  }
  
  function getFileExtension(type: string): string {
    switch (type) {
      case "image": return "jpg";
      case "video": return "mp4";
      case "audio": return "mp3";
      default: return "file";
    }
  }

  if (!result.success) {
    return (
      <Alert variant="destructive" className="animate-fade-in">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Gagal Mengunggah File</AlertTitle>
        <AlertDescription>
          {result.error || "Terjadi kesalahan saat mengunggah file."}
        </AlertDescription>
      </Alert>
    );
  }

  const renderPreview = () => {
    if (!result.fileUrl) return null;
    
    switch (fileType) {
      case "image":
        return (
          <div className="flex justify-center bg-gray-100 rounded-lg p-2">
            <img 
              src={result.fileUrl} 
              alt="File yang diunggah" 
              className="max-w-full h-auto max-h-64 object-contain rounded-lg shadow-sm" 
            />
          </div>
        );
      case "video":
        return (
          <div className="bg-gray-100 rounded-lg p-2">
            <video 
              src={result.fileUrl} 
              controls 
              className="w-full h-auto max-h-64 rounded-lg shadow-sm" 
            />
          </div>
        );
      case "audio":
        return (
          <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
            <audio 
              src={result.fileUrl} 
              controls 
              className="w-full" 
            />
          </div>
        );
      default:
        return (
          <div className="flex justify-center items-center h-32 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Preview tidak tersedia</p>
          </div>
        );
    }
  };

  return (
    <Card className="border-2 border-green-100 shadow-md animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle>Berhasil Diunggah!</CardTitle>
          </div>
          <Badge variant="outline" className="bg-white text-gray-700 flex items-center gap-1">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
            Tersisa: {formatTimeLeft()}
          </Badge>
        </div>
        <CardDescription>
          File {fileType === "image" ? "gambar" : fileType === "video" ? "video" : "audio"} akan dihapus otomatis setelah 1 jam
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="link">Link</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="py-4">
            {renderPreview()}
          </TabsContent>
          <TabsContent value="link" className="py-4">
            {result.fileUrl && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-1 border rounded-l-md overflow-hidden">
                    <input 
                      type="text" 
                      value={result.fileUrl} 
                      readOnly 
                      className="w-full px-3 py-2 focus:outline-none bg-gray-50 text-gray-800"
                    />
                  </div>
                  <Button 
                    onClick={handleCopy} 
                    className="rounded-l-none flex items-center"
                    variant={copied ? "secondary" : "default"}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" /> Salin
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Link ini hanya aktif selama 1 jam
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between gap-2 pt-0">
        <Button 
          onClick={handleDownload}
          variant="outline"
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button 
          onClick={handleShare}
          variant="secondary"
          className="flex-1"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Bagikan
        </Button>
      </CardFooter>
    </Card>
  );
}