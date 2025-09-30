import React, { useMemo, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, Trash2, TrendingUp, Download } from "lucide-react";

/**
 * SUPER-SIMPLE PORTFOLIO FORECASTER (Pure JS / JSX version)
 * - Only Ticker dropdown + Amount per row.
 * - Projection horizon is user-editable (Years input).
 * - Uses built-in average annual returns (illustrative; edit RETURN_LOOKUP to customize).
 * - Ready for Vercel deployment (see vercel.json below).
 */

// ---- Catalog for dropdown (starter list; extend freely) ----
const CATALOG = [
  { symbol: "SPY", label: "SPDR S&P 500 ETF" },
  { symbol: "VOO", label: "Vanguard S&P 500" },
  { symbol: "QQQ", label: "Invesco QQQ" },
  { symbol: "DIA", label: "SPDR Dow Jones" },
  { symbol: "IWM", label: "iShares Russell 2000" },
  { symbol: "VT", label: "Vanguard Total World" },
  { symbol: "VTI", label: "Vanguard Total US" },
  { symbol: "AAPL" }, { symbol: "MSFT" }, { symbol: "GOOGL" }, { symbol: "AMZN" },
  { symbol: "META" }, { symbol: "NVDA" }, { symbol: "TSLA" }, { symbol: "BRK.B" },
  { symbol: "UNH" }, { symbol: "JPM" }, { symbol: "V" }, { symbol: "MA" },
  { symbol: "BABA" }, { symbol: "JD" }, { symbol: "PDD" },
  { symbol: "BTC-USD", label: "Bitcoin" }, { symbol: "ETH-USD", label: "Ethereum" },
];

// ---- Average annual returns (illustrative defaults) ----
const RETURN_LOOKUP = {
  SPY:{avg:10}, VOO:{avg:10}, QQQ:{avg:13}, DIA:{avg:7}, IWM:{avg:9}, VT:{avg:8}, VTI:{avg:10},
  AAPL:{avg:25}, MSFT:{avg:20}, GOOGL:{avg:18}, AMZN:{avg:27}, META:{avg:22}, NVDA:{avg:35}, TSLA:{avg:35}, "BRK.B":{avg:19}, UNH:{avg:15}, JPM:{avg:12}, V:{avg:18}, MA:{avg:18},
  BABA:{avg:12}, JD:{avg:10}, PDD:{avg:40},
  "BTC-USD":{avg:120}, "ETH-USD":{avg:90},
};

// ---- Helpers ----
const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const fmt2 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
function uuid() { return Math.random().toString(36).slice(2, 9); }
function getAvgReturn(name) { const k = (name || "").trim().toUpperCase(); return (RETURN_LOOKUP[k] && RETURN_LOOKUP[k].avg) || 0; }

function project(assets, years) {
  const rows = [];
  let amounts = assets.map(a => a.amount || 0);
  for (let y = 0; y <= years; y++) {
    const total = amounts.reduce((s, v) => s + v, 0);
    const row = { Year: y, Total: total };
    assets.forEach((a, i) => { row[a.name] = amounts[i]; });
    rows.push(row);
    if (y === years) break;
    amounts = amounts.map((v, i) => v * (1 + getAvgReturn(assets[i].name) / 100));
  }
  return rows;
}

function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map(h => JSON.stringify(r[h] ?? "")).join(","));
  return lines.join("\n");
}

export default function App() {
  const [assets, setAssets] = useState([{ id: uuid(), name: "SPY", amount: 100000 }]);
  const [years, setYears] = useState(5);

  const rows = useMemo(() => project(assets, years), [assets, years]);
  const totalNow = useMemo(() => assets.reduce((s, a) => s + (a.amount || 0), 0), [assets]);
  const endValue = rows.length ? rows[rows.length - 1].Total : 0;
  const cagr = useMemo(() => {
    if (totalNow <= 0) return 0;
    return (Math.pow(endValue / totalNow, 1 / years) - 1) * 100;
  }, [endValue, totalNow, years]);

  const addAsset = () => setAssets(prev => [...prev, { id: uuid(), name: CATALOG[0] ? CATALOG[0].symbol : "SPY", amount: 10000 }]);
  const removeAsset = (id) => setAssets(prev => prev.filter(a => a.id !== id));

  const downloadCSV = () => {
    const csv = toCSV(rows);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `projection_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <TrendingUp className="w-6 h-6" />
          <h1 className="text-xl font-semibold">Portfolio Forecast (Minimal)</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Assets</h2>
              <button onClick={addAsset} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-900 text-white text-sm hover:opacity-90"><Plus className="w-4 h-4"/>Add</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="text-sm">Years
                <input type="number" min={1} max={50} value={years}
                  onChange={e => setYears(Math.max(1, Math.min(50, parseInt(e.target.value || '0', 10))))}
                  className="w-full border rounded-lg px-2 py-1 mt-1"/>
              </label>
            </div>
            <div className="overflow-auto max-h-[360px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">Ticker</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="py-2 pr-2">
                        <select
                          value={a.name}
                          onChange={e => setAssets(prev => prev.map(x => x.id === a.id ? { ...x, name: e.target.value } : x))}
                          className="w-44 border rounded-lg px-2 py-1"
                        >
                          {CATALOG.map(opt => (
                            <option key={opt.symbol} value={opt.symbol}>
                              {opt.symbol}{opt.label ? ` – ${opt.label}` : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input type="number" value={a.amount} onChange={e => setAssets(prev => prev.map(x => x.id === a.id ? { ...x, amount: parseFloat(e.target.value) || 0 } : x))} className="w-28 border rounded-lg px-2 py-1"/>
                      </td>
                      <td className="text-right">
                        <button onClick={() => removeAsset(a.id)} className="p-1 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              <p>Uses built-in average annual return per ticker. Adjust years with the control above.</p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-2 space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="text-sm text-gray-500">Current Portfolio</div>
              <div className="text-2xl font-semibold mt-1">${fmt.format(totalNow)}</div>
            </div>
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="text-sm text-gray-500">Projected (End of Year {new Date().getFullYear() + years})</div>
              <div className="text-2xl font-semibold mt-1">${fmt.format(endValue)}</div>
            </div>
            <div className="bg-white rounded-2xl shadow p-4">
              <div className="text-sm text-gray-500">Approx CAGR</div>
              <div className="text-2xl font-semibold mt-1">{fmt2.format(cagr)}%</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{years}-Year Projection</h2>
              <button onClick={downloadCSV} className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl border hover:bg-gray-50">
                <Download className="w-4 h-4"/> CSV
              </button>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ left: 8, right: 16, top: 16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Year" />
                  <YAxis tickFormatter={(v) => "$" + fmt.format(v)} />
                  <Tooltip formatter={(v) => "$" + fmt.format(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="Total" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto p-4 text-center text-xs text-gray-500">
        Built for quick estimates. Not financial advice. Extend the catalog/returns for broader coverage.
      </footer>
    </div>
  );
}

/* -------------------------------
vercel.json (place at project root)
-------------------------------
{
  "builds": [{ "src": "package.json", "use": "@vercel/static-build" }],
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
*/
