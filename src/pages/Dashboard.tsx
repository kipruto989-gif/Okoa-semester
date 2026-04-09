import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Plus, Book, FileText, ChevronRight, GraduationCap, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Unit {
  id: string;
  name: string;
  code: string;
  lecturer?: string;
}

export default function Dashboard() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteUnit = async (e: React.MouseEvent, unitId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDeletingId(unitId);
    try {
      await deleteDoc(doc(db, "units", unitId));
      toast.success("Unit deleted successfully");
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast.error("Failed to delete unit");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "units"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const unitsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Unit[];
        setUnits(unitsData);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error in Dashboard:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Study Units</h1>
          <p className="text-slate-500 mt-1">Manage your units and study materials</p>
        </div>
        <Link
          to="/dashboard/semester"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Units
        </Link>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : units.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <Link
              key={unit.id}
              to={`/dashboard/units/${unit.id}`}
              className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all"
            >
              <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <Book className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{unit.name}</h3>
              <p className="text-slate-500 text-sm font-medium mb-4">{unit.code}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
                  <span>View Materials</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <button
                  onClick={(e) => handleDeleteUnit(e, unit.id)}
                  disabled={deletingId === unit.id}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                  title="Delete Unit"
                >
                  {deletingId === unit.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No units found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mb-8">
            Start by setting up your semester and adding the units you're taking.
          </p>
          <Link
            to="/dashboard/semester"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Setup Semester
          </Link>
        </div>
      )}
    </div>
  );
}
