import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { Users, UserCheck, Clock, ShieldCheck, Trash2, GraduationCap, BookOpen, Loader2, TrendingUp, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: any;
}

interface Semester {
  id: string;
  name: string;
  userId: string;
  createdAt: any;
}

interface Unit {
  id: string;
  name: string;
  code: string;
  userId: string;
  semesterId: string;
}

export default function Admin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'analytics'>('users');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [chartData, setChartData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersQ = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const usersSnap = await getDocs(usersQ);
      setUsers(usersSnap.docs.map(doc => doc.data() as UserProfile));

      const semestersQ = query(collection(db, "semesters"), orderBy("createdAt", "desc"));
      const semestersSnap = await getDocs(semestersQ);
      setSemesters(semestersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Semester)));

      const unitsSnap = await getDocs(collection(db, "units"));
      const unitsData = unitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
      setUnits(unitsData);

      // Process Chart Data
      const allData = [
        ...usersSnap.docs.map(d => ({ date: d.data().createdAt?.toDate(), type: 'user' })),
        ...semestersSnap.docs.map(d => ({ date: d.data().createdAt?.toDate(), type: 'semester' })),
        ...unitsSnap.docs.map(d => ({ date: d.data().createdAt?.toDate(), type: 'unit' }))
      ].filter(d => d.date);

      // Group by date
      const grouped = allData.reduce((acc: any, curr) => {
        const dateStr = curr.date.toLocaleDateString();
        if (!acc[dateStr]) {
          acc[dateStr] = { date: dateStr, users: 0, semesters: 0, units: 0 };
        }
        if (curr.type === 'user') acc[dateStr].users++;
        if (curr.type === 'semester') acc[dateStr].semesters++;
        if (curr.type === 'unit') acc[dateStr].units++;
        return acc;
      }, {});

      const sortedData = Object.values(grouped).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Cumulative growth
      let cumulativeUsers = 0;
      let cumulativeSemesters = 0;
      let cumulativeUnits = 0;
      
      const trendData = sortedData.map((d: any) => {
        cumulativeUsers += d.users;
        cumulativeSemesters += d.semesters;
        cumulativeUnits += d.units;
        return {
          ...d,
          totalUsers: cumulativeUsers,
          totalSemesters: cumulativeSemesters,
          totalUnits: cumulativeUnits
        };
      });

      setChartData(trendData);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    setDeletingId(userId);
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter(u => u.uid !== userId));
      toast.success("User profile deleted");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSemester = async (semesterId: string) => {
    setDeletingId(semesterId);
    try {
      await deleteDoc(doc(db, "semesters", semesterId));
      setSemesters(semesters.filter(s => s.id !== semesterId));
      toast.success("Semester deleted");
    } catch (error) {
      console.error("Error deleting semester:", error);
      toast.error("Failed to delete semester");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    setDeletingId(unitId);
    try {
      await deleteDoc(doc(db, "units", unitId));
      setUnits(units.filter(u => u.id !== unitId));
      toast.success("Unit deleted");
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast.error("Failed to delete unit");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Platform overview and user statistics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Users</p>
          <h3 className="text-3xl font-bold text-slate-900">{users.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Semesters</p>
          <h3 className="text-3xl font-bold text-slate-900">{semesters.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Units</p>
          <h3 className="text-3xl font-bold text-slate-900">{units.length}</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-bold text-sm transition-colors relative ${
            activeTab === 'users' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Users
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 font-bold text-sm transition-colors relative ${
            activeTab === 'content' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Semesters & Units
          {activeTab === 'content' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-bold text-sm transition-colors relative ${
            activeTab === 'analytics' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Analytics
          {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Registered Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 w-8 h-8 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {user.displayName?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{user.displayName || "Anonymous"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {user.createdAt?.toDate?.() ? user.createdAt.toDate().toLocaleDateString() : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(user.uid)}
                        disabled={deletingId === user.uid}
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete User Profile"
                      >
                        {deletingId === user.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'content' ? (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Semesters List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Semesters</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {semesters.map((sem) => (
                <div key={sem.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900">{sem.name}</h3>
                    <p className="text-xs text-slate-500">User ID: {sem.userId}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSemester(sem.id)}
                    disabled={deletingId === sem.id}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === sem.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Units List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Units</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {units.map((unit) => (
                <div key={unit.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900">{unit.name}</h3>
                    <p className="text-xs text-slate-500">{unit.code} • User ID: {unit.userId}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteUnit(unit.id)}
                    disabled={deletingId === unit.id}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === unit.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-indigo-50 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Platform Growth</h2>
                <p className="text-slate-500 text-sm">Cumulative growth of users and content over time</p>
              </div>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '16px', 
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalUsers" 
                    name="Total Users" 
                    stroke="#4f46e5" 
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                    strokeWidth={3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalUnits" 
                    name="Total Units" 
                    stroke="#0ea5e9" 
                    fillOpacity={0} 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-50 p-3 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900">Daily Activity</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" name="New Users" stroke="#4f46e5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="units" name="New Units" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
