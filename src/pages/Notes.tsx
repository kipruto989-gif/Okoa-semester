import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { FileText, Download, Copy, ChevronLeft, Calendar, Sparkles, Loader2, AlertCircle, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { summarizeDocument } from "../lib/gemini";

interface DocumentData {
  id: string;
  fileName: string;
  extractedText: string;
  createdAt: any;
}

interface SummaryData {
  id: string;
  content: string;
  mode: string;
  createdAt: any;
}

export default function Notes() {
  const { unitId, documentId } = useParams();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [mode, setMode] = useState<'beginner' | 'exam' | 'ultra-short'>('beginner');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!documentId) return;
      
      try {
        // 1. Fetch Document
        const docRef = doc(db, "documents", documentId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setDocument({ id: docSnap.id, ...docSnap.data() } as DocumentData);
          
          // 2. Fetch Summary
          const summariesRef = collection(db, "summaries");
          const q = query(summariesRef, where("documentId", "==", documentId));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const summaryDoc = querySnapshot.docs[0];
            setSummary({ id: summaryDoc.id, ...summaryDoc.data() } as SummaryData);
          }
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
        toast.error("Failed to load notes");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [documentId]);

  const handleSummarize = async () => {
    if (!document || !unitId || !auth.currentUser) return;

    setSummarizing(true);
    try {
      const summaryContent = await summarizeDocument(document.extractedText, mode);
      
      if (!summaryContent) throw new Error("Failed to generate summary");

      const summaryRef = await addDoc(collection(db, "summaries"), {
        userId: auth.currentUser.uid,
        unitId,
        documentId: document.id,
        content: summaryContent,
        mode,
        createdAt: serverTimestamp(),
      });

      setSummary({
        id: summaryRef.id,
        content: summaryContent,
        mode,
        createdAt: { toDate: () => new Date() },
      });
      
      toast.success("Study notes generated!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to generate summary");
    } finally {
      setSummarizing(false);
    }
  };

  const copyToClipboard = () => {
    if (summary) {
      navigator.clipboard.writeText(summary.content);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadNotes = () => {
    if (summary && document) {
      const element = window.document.createElement("a");
      const file = new Blob([summary.content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${document.fileName.replace(".pdf", "")}_summary.txt`;
      window.document.body.appendChild(element);
      element.click();
      window.document.body.removeChild(element);
      toast.success("Download started!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-900">Document not found</h2>
        <Link to={`/dashboard/units/${unitId}`} className="text-indigo-600 hover:underline mt-2 inline-block">
          Back to Unit
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link 
            to={`/dashboard/units/${unitId}`}
            className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Unit
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            {document.fileName}
          </h1>
          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {document.createdAt?.toDate?.() ? document.createdAt.toDate().toLocaleDateString() : "Just now"}
            </span>
            {summary && (
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                {summary.mode} Mode
              </span>
            )}
          </div>
        </div>

        {summary && (
          <div className="flex items-center gap-3">
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button 
              onClick={downloadNotes}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {summary ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12">
          <div className="markdown-body">
            <ReactMarkdown>{summary.content}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Summarize with AI</h2>
              <p className="text-slate-500 mt-2">
                This document hasn't been summarized yet. Choose a mode and let AI generate study notes for you.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ModeButton 
                active={mode === 'beginner'} 
                onClick={() => setMode('beginner')}
                title="Beginner"
                description="Simple terms"
              />
              <ModeButton 
                active={mode === 'exam'} 
                onClick={() => setMode('exam')}
                title="Exam Prep"
                description="Key points"
              />
              <ModeButton 
                active={mode === 'ultra-short'} 
                onClick={() => setMode('ultra-short')}
                title="Ultra Short"
                description="Quick scan"
              />
            </div>

            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-100"
            >
              {summarizing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Generating Notes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Study Notes
                </>
              )}
            </button>

            {summarizing && (
              <div className="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 text-sm animate-pulse">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>This may take a minute. Please don't close this page.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModeButton({ active, onClick, title, description }: { active: boolean, onClick: () => void, title: string, description: string }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        active ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-100 bg-slate-50 hover:border-slate-200"
      }`}
    >
      <div className={`font-bold text-sm ${active ? "text-indigo-700" : "text-slate-700"}`}>{title}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{description}</div>
    </button>
  );
}
