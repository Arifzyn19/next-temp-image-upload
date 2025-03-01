"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ResultCardProps {
  result: {
    success: boolean;
    fileUrl?: string;
    fileKey?: string;
    error?: string;
  };
}

export default function ResultCard({ result }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (result.fileUrl) {
      await navigator.clipboard.writeText(result.fileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!result.success) {
    return (
      <Card className="bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600">Gagal</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{result.error || "Terjadi kesalahan saat mengunggah gambar."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Berhasil Diunggah!</CardTitle>
        <CardDescription>
          Gambar akan dihapus otomatis setelah 1 jam
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.fileUrl && (
          <div>
            <img 
              src={result.fileUrl} 
              alt="Uploaded image" 
              className="w-full h-auto max-h-64 object-contain rounded-lg" 
            />
            <div className="mt-4 flex items-center">
              <input 
                type="text" 
                value={result.fileUrl} 
                readOnly 
                className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none"
              />
              <Button 
                onClick={handleCopy} 
                className="rounded-l-none"
              >
                {copied ? "Tersalin!" : "Salin"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}