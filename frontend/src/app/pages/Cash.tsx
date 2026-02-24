import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, Wallet } from "lucide-react";
import { usePortfolio } from "../state/portfolio";
import { formatEur } from "../lib/currency";

type CashAction = "receive" | "send";

export function Cash() {
  const { cash, cashTransactions, receiveCash, sendCash } = usePortfolio();
  const [action, setAction] = useState<CashAction>("receive");
  const [amount, setAmount] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const onSubmit = () => {
    const numericAmount = Number(amount);
    const result =
      action === "receive"
        ? receiveCash(numericAmount, counterparty)
        : sendCash(numericAmount, counterparty);

    setFeedback({ kind: result.ok ? "success" : "error", text: result.message });
    if (result.ok) {
      setAmount("");
      setCounterparty("");
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] text-muted-foreground">Cash Balance</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[32px] font-semibold tracking-tight text-foreground">
            {formatEur(cash)}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] text-muted-foreground">Transactions</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[32px] font-semibold tracking-tight text-foreground">{cashTransactions.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 lg:col-span-1">
          <h2 className="text-[18px] font-semibold text-foreground mb-5 tracking-tight">Bank Transfer</h2>

          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              onClick={() => setAction("receive")}
              className={`py-2.5 rounded-xl text-[14px] font-semibold transition-all ${
                action === "receive" ? "bg-emerald-500 text-white" : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              Receive
            </button>
            <button
              onClick={() => setAction("send")}
              className={`py-2.5 rounded-xl text-[14px] font-semibold transition-all ${
                action === "send" ? "bg-red-500 text-white" : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              Send
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-muted-foreground mb-2">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-muted-foreground mb-2">{action === "receive" ? "From" : "To"}</label>
              <input
                type="text"
                value={counterparty}
                onChange={(event) => setCounterparty(event.target.value)}
                placeholder={action === "receive" ? "e.g. Main Bank Account" : "e.g. Savings Account"}
                className="w-full px-4 py-3 bg-accent border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`mt-4 p-3 rounded-xl text-[13px] font-medium ${
                feedback.kind === "success"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <button
            onClick={onSubmit}
            className={`w-full mt-5 py-3 rounded-xl text-[14px] font-semibold text-white ${
              action === "receive" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
            } transition-colors`}
          >
            {action === "receive" ? "Receive Money" : "Send Money"}
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden lg:col-span-2">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="text-[18px] font-semibold text-foreground tracking-tight">Cash Transactions</h2>
            <p className="text-[14px] text-muted-foreground mt-0.5">Incoming and outgoing bank movements</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">Counterparty</th>
                  <th className="px-6 py-4 text-right text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cashTransactions.map((transaction) => {
                  const isIncoming = transaction.type === "receive";
                  return (
                    <tr key={transaction.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-[14px] text-foreground font-medium">{transaction.date}</div>
                        <div className="text-[12px] text-muted-foreground">{transaction.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${
                            isIncoming ? "text-emerald-500" : "text-red-500"
                          }`}
                        >
                          {isIncoming ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          {isIncoming ? "RECEIVE" : "SEND"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-foreground">{transaction.counterparty}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-[14px] font-semibold ${isIncoming ? "text-emerald-500" : "text-red-500"}`}>
                          {isIncoming ? "+" : "-"}
                          {formatEur(transaction.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
