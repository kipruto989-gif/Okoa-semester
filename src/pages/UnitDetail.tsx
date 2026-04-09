import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, orderBy, onSnapshot, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { BookOpen, FileText, Plus, ChevronRight, Loader2, Sparkles, Clock, File, User, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface UnitData {
  id: string;
  name: string;
  code: string;
  lecturer?: string;
}

interface DocumentData {
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: any;
  hasSummary?: boolean;
}

export default function UnitDetail() {
  const { unitId } = useParams();
  const [unit, setUnit] = useState<UnitData | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteDocument = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setDeletingId(docId);
    try {
      // Delete document
      await deleteDoc(doc(db, "documents", docId));
      
      // Delete associated summary if it exists
      const summariesRef = collection(db, "summaries");
      const q = query(
        summariesRef, 
        where("documentId", "==", docId),
        where("userId", "==", auth.currentUser?.uid)
      );
      const summarySnap = await getDocs(q);
      
      const deletePromises = summarySnap.docs.map(s => deleteDoc(doc(db, "summaries", s.id)));
      await Promise.all(deletePromises);

      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!unitId) return;

    const fetchUnit = async () => {
      const unitRef = doc(db, "units", unitId);
      const unitSnap = await getDoc(unitRef);
      if (unitSnap.exists()) {
        setUnit({ id: unitSnap.id, ...unitSnap.data() } as UnitData);
      }
    };

    const q = query(
      collection(db, "documents"),
      where("unitId", "==", unitId),
      where("userId", "==", auth.currentUser?.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeDocs = onSnapshot(q, async (snapshot) => {
      const docsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DocumentData[];

      // Check for summaries for each document
      try {
        const summariesRef = collection(db, "summaries");
        const summariesSnapshot = await getDocs(query(
          summariesRef, 
          where("unitId", "==", unitId),
          where("userId", "==", auth.currentUser?.uid)
        ));
        const summaryDocIds = new Set(summariesSnapshot.docs.map(s => s.data().documentId));

        const docsWithSummaryStatus = docsData.map(d => ({
          ...d,
          hasSummary: summaryDocIds.has(d.id)
        }));

        setDocuments(docsWithSummaryStatus);
      } catch (error) {
        console.error("Error checking summaries:", error);
        setDocuments(docsData);
      }
      setLoading(false);
    });

    fetchUnit();
    return () => unsubscribeDocs();
  }, [unitId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-32 bg-slate-100 rounded-2xl"></div>
        <div className="h-64 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-900">Unit not found</h2>
        <Link to="/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Unit Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-100">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                {unit.code}
              </span>
              <h1 className="text-3xl font-bold text-slate-900">{unit.name}</h1>
            </div>
            {unit.lecturer && (
              <p className="text-slate-500 font-medium flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Lecturer: {unit.lecturer}
              </p>
            )}
          </div>
        </div>
        <Link
          to={`/dashboard/units/${unitId}/upload`}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap"
        >
          <Upload className="w-5 h-5" />
          Upload Material
        </Link>
      </div>

      {/* Materials Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Study Materials
          </h2>
          <span className="text-slate-500 text-sm font-medium">{documents.length} Documents</span>
        </div>

        {documents.length > 0 ? (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                to={`/dashboard/units/${unitId}/notes/${doc.id}`}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-colors ${doc.hasSummary ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"}`}>
                    {doc.hasSummary ? <Sparkles className="w-6 h-6" /> : <File className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {doc.fileName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {doc.createdAt?.toDate?.() ? doc.createdAt.toDate().toLocaleDateString() : "Just now"}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                      {doc.hasSummary && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          Summarized
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    <span>{doc.hasSummary ? "View Notes" : "Summarize"}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <button
                    onClick={(e) => handleDeleteDocument(e, doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                    title="Delete Document"
                  >
                    {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No materials yet</h3>
            <p className="text-slate-500 mt-1 mb-6">Upload your first lecture PDF to get started.</p>
            <Link
              to={`/dashboard/units/${unitId}/upload`}
              className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline"
            >
              <Upload className="w-4 h-4" />
              Upload now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
