import FileUpload from '@/components/file-upload';

export default function Home() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Tempat Penyimpanan Gambar Sementara</h1>
        <p className="mt-2">
          Unggah gambar Anda dan dapatkan URL sementara. Gambar akan dihapus otomatis setelah 1 jam.
        </p>
      </div>
      
      <FileUpload />
      
      <div className="mt-12 text-center text-sm">
        <p>Dibuat dengan Next.js, tailwindcss, dan Supabase</p>
      </div>
    </div>
  );
}