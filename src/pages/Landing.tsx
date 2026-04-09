import { Link } from "react-router-dom";
import { BookOpen, Sparkles, FileText, LayoutDashboard, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-2xl text-indigo-600">
          <BookOpen className="w-8 h-8" />
          <span>Smart study</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium hover:text-indigo-600 transition-colors">Login</Link>
          <Link to="/register" className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-700 transition-shadow hover:shadow-lg transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Master Your Units with <br /> AI-Powered Notes
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your lecture PDFs and get structured, clear, and concise study notes in seconds. 
            Built for university students who want to study smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2 group transition-all">
              Start Summarizing Now
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-slate-100 text-slate-900 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-200 transition-colors">
              View Demo
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<FileText className="w-10 h-10 text-indigo-600" />}
              title="PDF Extraction"
              description="Upload any academic PDF. Our system extracts the text accurately, even from complex layouts."
            />
            <FeatureCard 
              icon={<Sparkles className="w-10 h-10 text-violet-600" />}
              title="AI Summarization"
              description="Powered by Gemini, get notes that highlight key concepts, definitions, and exam revision points."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="w-10 h-10 text-blue-600" />}
              title="Unit Management"
              description="Organize your notes by semester and unit. Keep everything in one place for easy access."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 text-center text-slate-500 text-sm">
        <p>&copy; 2026 StudyNotes AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
