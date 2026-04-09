import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Upload as UploadIcon, File, Loader2, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Upload() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
      
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith(".docx")) {
        toast.error("Please upload a PDF or Word (.docx) file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !unitId || !auth.currentUser) return;

    setLoading(true);
    setStatus("Extracting text from document...");
    
    try {
      // 1. Send file to backend for text extraction
      const formData = new FormData();
      formData.append("file", file);

      const extractRes = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!extractRes.ok) {
        const error = await extractRes.json();
        throw new Error(error.error || "Failed to extract text");
      }

      const { text } = await extractRes.json();

      setStatus("Saving document...");

      // 2. Save metadata + extracted text to Firestore
      const docRef = await addDoc(collection(db, "documents"), {
        userId: auth.currentUser.uid,
        unitId,
        fileName: file.name,
        fileSize: file.size,
        extractedText: text,
        createdAt: serverTimestamp(),
      });

      toast.success("Document uploaded successfully!");
      navigate(`/dashboard/units/${unitId}/notes/${docRef.id}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred during processing");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Upload Material</h1>
        <p className="text-slate-500 mt-1">Upload a lecture PDF or Word document to start generating study notes.</p>
      </div>

      <div className="space-y-6">
        {/* File Dropzone */}
        <div 
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
            file ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-300"
          }`}
        >
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={loading}
          />
          
          {file ? (
            <div className="flex flex-col items-center">
              <div className="bg-indigo-600 p-4 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
                <File className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{file.name}</h3>
              <p className="text-slate-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button 
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="mt-4 text-red-600 text-sm font-bold hover:underline"
              >
                Remove File
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="bg-slate-100 p-4 rounded-2xl mb-4">
                <UploadIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Click or drag PDF/Word here</h3>
              <p className="text-slate-500 text-sm mt-1">Maximum file size: 10MB</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-100"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{status}</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Upload & Continue
            </>
          )}
        </button>

        {loading && (
          <div className="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 text-sm animate-pulse">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>Processing your document. Please don't close this page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
