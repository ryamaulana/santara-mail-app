import Link from "next/link";
import { MailOpen, AlertCircle, User, Lock } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Ornaments */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <img src="/santara-mail-logo.png" alt="Santara Mail Logo" className="h-16 object-contain" />
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white">SIPEDIG 110</h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          Sistem Informasi Persuratan Digital Modern
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800/80">
          
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  name="username" 
                  defaultValue="kasubag"
                  required 
                  placeholder="Masukkan nama pengguna..."
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type="password" 
                  name="password" 
                  defaultValue="Kasubag110"
                  required 
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <Link 
                href="/"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150"
              >
                Masuk ke Aplikasi
              </Link>
            </div>
          </form>

          {/* Test Credentials Info */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2 text-xs">
            <p className="text-slate-400 font-bold mb-1">Pusdatin110 (Go SMAN@110):</p>
            <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-slate-200 font-bold">SANTARA Co. (Developer)</p>
                <p className="text-slate-500 font-mono">***: <strong className="text-indigo-400">kasubag</strong> | ***: <strong className="text-indigo-400">Kasubag110</strong></p>
              </div>
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-bold rounded text-[10px]">Admin</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
