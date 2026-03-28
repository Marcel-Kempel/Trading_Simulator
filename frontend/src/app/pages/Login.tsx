import { useState } from "react";
import { useNavigate } from "react-router";
import { TrendingUp, LogIn, UserPlus, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useAuth } from "../state/auth";

type AuthMode = "login" | "register";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async () => {
    setFeedback(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email, passwort }
        : { name, email, passwort };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        login({ id: data.user.id, name: data.user.name, email: data.user.email });
        navigate("/");
      } else {
        setFeedback({ kind: "error", text: data.message });
      }
    } catch {
      setFeedback({ kind: "error", text: "Server nicht erreichbar" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[28px] font-semibold text-foreground tracking-tight">TradeSimX</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-[22px] font-semibold text-foreground tracking-tight text-center mb-2">
            {mode === "login" ? "Hallo willkommen zurueck!" : "Jetzt Konto erstellen"}
          </h2>
          <p className="text-[14px] text-muted-foreground text-center mb-8">
            {mode === "login" ? "Melde dich an um dein Portfolio zu verwalten" : "Registriere dich fuer den Trading Simulator"}
          </p>

          <div className="grid grid-cols-2 gap-2 mb-8 bg-accent p-1 rounded-xl">
            <button
              onClick={() => { setMode("login"); setFeedback(null); }}
              className={`py-2.5 rounded-xl text-[14px] font-semibold transition-all flex items-center justify-center gap-2 ${
                mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button
              onClick={() => { setMode("register"); setFeedback(null); }}
              className={`py-2.5 rounded-xl text-[14px] font-semibold transition-all flex items-center justify-center gap-2 ${
                mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Registrieren
            </button>
          </div>

          <div className="space-y-4" onKeyDown={handleKeyDown}>
            {mode === "register" && (
              <div>
                <label className="block text-[13px] font-medium text-muted-foreground mb-2">Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dein Name"
                    className="w-full pl-11 pr-4 py-3 bg-accent border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-muted-foreground mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@beispiel.de"
                  className="w-full pl-11 pr-4 py-3 bg-accent border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-muted-foreground mb-2">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="password" value={passwort} onChange={(e) => setPasswort(e.target.value)} placeholder="Dein Passwort"
                  className="w-full pl-11 pr-4 py-3 bg-accent border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            </div>
          </div>

          {feedback && (
            <div className={`mt-5 p-3 rounded-xl text-[13px] font-medium flex items-start gap-2 ${
              feedback.kind === "success" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}

          <button onClick={handleSubmit}
            disabled={loading || !email || !passwort || (mode === "register" && !name)}
            className="w-full mt-6 py-3.5 rounded-xl font-semibold text-[15px] text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Laden..." : mode === "login" ? "Anmelden" : "Registrieren"}
          </button>
        </div>
      </div>
    </div>
  );
}
