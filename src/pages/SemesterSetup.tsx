import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Plus, Trash2, GraduationCap, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface UnitInput {
  name: string;
  code: string;
  lecturer: string;
}

export default function SemesterSetup() {
  const [semesterName, setSemesterName] = useState("");
  const [units, setUnits] = useState<UnitInput[]>([{ name: "", code: "", lecturer: "" }]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addUnitField = () => {
    setUnits([...units, { name: "", code: "", lecturer: "" }]);
  };

  const removeUnitField = (index: number) => {
    if (units.length === 1) return;
    setUnits(units.filter((_, i) => i !== index));
  };

  const updateUnit = (index: number, field: keyof UnitInput, value: string) => {
    const newUnits = [...units];
    newUnits[index][field] = value;
    setUnits(newUnits);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!semesterName) {
      toast.error("Please enter a semester name");
      return;
    }

    setLoading(true);
    try {
      // Create Semester
      const semesterRef = await addDoc(collection(db, "semesters"), {
        userId: auth.currentUser.uid,
        name: semesterName,
        createdAt: serverTimestamp(),
      });

      // Create Units
      const unitPromises = units.map((unit) => {
        if (!unit.name || !unit.code) return Promise.resolve();
        return addDoc(collection(db, "units"), {
          userId: auth.currentUser!.uid,
          semesterId: semesterRef.id,
          name: unit.name,
          code: unit.code,
          lecturer: unit.lecturer,
          createdAt: serverTimestamp(),
        });
      });

      await Promise.all(unitPromises);
      toast.success("Semester setup complete!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to save semester");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Semester Setup</h1>
        <p className="text-slate-500 mt-1">Define your current semester and the units you're taking.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Semester Name</label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              required
              value={semesterName}
              onChange={(e) => setSemesterName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="e.g. Year 2 Semester 1"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Units</h2>
            <button
              type="button"
              onClick={addUnitField}
              className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:text-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Add Another Unit
            </button>
          </div>

          {units.map((unit, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unit Name</label>
                  <input
                    type="text"
                    required
                    value={unit.name}
                    onChange={(e) => updateUnit(index, "name", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. Data Structures"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unit Code</label>
                  <input
                    type="text"
                    required
                    value={unit.code}
                    onChange={(e) => updateUnit(index, "code", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. CS201"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lecturer (Optional)</label>
                  <input
                    type="text"
                    value={unit.lecturer}
                    onChange={(e) => updateUnit(index, "lecturer", e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. Dr. Jane Smith"
                  />
                </div>
              </div>

              {units.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUnitField(index)}
                  className="absolute -right-3 -top-3 bg-red-100 text-red-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <>
              <Save className="w-5 h-5" />
              Save Semester & Units
            </>
          )}
        </button>
      </form>
    </div>
  );
}
