import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ShoppingCart, Users, Trophy, Upload, Loader2, Plus, Minus, Euro, BarChart2, QrCode } from "lucide-react";

/**
 * FundraisePlatform — Single-file MVP
 * -------------------------------------------------------
 * • Catalog + cart + checkout (simulation)
 * • Dynamic, progressive margins (group up, platform down)
 * • Mini dashboard (progress to goal, earnings split)
 * • Leaderboard (mock) + offline/paper order entry
 * • Clean Tailwind UI, responsive
 * -------------------------------------------------------
 * Drop this component into a React app (Vite/Next). Tailwind required.
 */

// ------- Mock data & helpers -------
const PRODUCTS = [
  {
    id: "coffret",
    name: "Coffret gourmand local",
    desc: "Biscuits artisanaux, confiture & chocolat. Étiquette personnalisée.",
    baseCost: 12,
    price: 25,
    img: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=1200&auto=format&fit=crop",
    tiers: [
      { min: 0, platform: 6, group: 7 },
      { min: 100, platform: 5, group: 8 },
      { min: 300, platform: 4, group: 9 },
    ],
  },
  {
    id: "gourde",
    name: "Gourde inox personnalisée",
    desc: "Acier 500ml, réutilisable. Gravure logo du groupe.",
    baseCost: 6,
    price: 15,
    img: "https://images.unsplash.com/photo-1561214078-f3247647fc5e?q=80&w=1200&auto=format&fit=crop",
    tiers: [
      { min: 0, platform: 3, group: 6 },
      { min: 150, platform: 2.5, group: 6.5 },
      { min: 400, platform: 2, group: 7 },
    ],
  },
  {
    id: "bougie",
    name: "Bougie naturelle (cire soja)",
    desc: "Parfum lin propre. Étiquette \"Voyage 2025\".",
    baseCost: 4,
    price: 12,
    img: "https://images.unsplash.com/photo-1533777324565-a040eb52fac1?q=80&w=1200&auto=format&fit=crop",
    tiers: [
      { min: 0, platform: 2, group: 6 },
      { min: 200, platform: 1.6, group: 6.4 },
      { min: 500, platform: 1.3, group: 6.7 },
    ],
  },
];

function euro(n) {
  return n.toLocaleString("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

function getTierForVolume(product, cumulativeQty) {
  const tiers = [...product.tiers].sort((a, b) => a.min - b.min);
  let current = tiers[0];
  for (const t of tiers) {
    if (cumulativeQty >= t.min) current = t;
  }
  return current; // {platform, group}
}

function calcSplit(product, cumulativeQty, qty = 1) {
  const tier = getTierForVolume(product, cumulativeQty);
  const platformMargin = tier.platform * qty;
  const groupMargin = tier.group * qty;
  const cost = product.baseCost * qty;
  const revenue = product.price * qty;
  const totalMargin = revenue - cost; // sanity check
  return { tier, platformMargin, groupMargin, cost, revenue, totalMargin };
}

// ------- UI primitives -------
function Card({ children }) {
  return (
    <div className="bg-white/80 backdrop-blur shadow-sm rounded-2xl p-4 border border-gray-100">{children}</div>
  );
}

function Pill({ children, icon: Icon }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-gray-700 bg-white">
      {Icon && <Icon className="h-3 w-3" />} {children}
    </span>
  );
}

// ------- Main component -------
export default function FundraisePlatform() {
  const [tab, setTab] = useState("shop");
  const [groupName, setGroupName] = useState("Scouts de Namur");
  const [goal, setGoal] = useState(3000); // €
  const [cart, setCart] = useState({}); // {productId: qty}
  const [volume, setVolume] = useState({ coffret: 0, gourde: 0, bougie: 0 });
  const [offlineOrders, setOfflineOrders] = useState([]); // bon papier encodé

  const totals = useMemo(() => {
    let revenue = 0,
      platform = 0,
      group = 0,
      cost = 0,
      units = 0;
    for (const pid of Object.keys(volume)) {
      const product = PRODUCTS.find((p) => p.id === pid);
      const v = volume[pid];
      if (!product || v <= 0) continue;
      const split = calcSplit(product, v, v);
      revenue += split.revenue;
      platform += split.platformMargin;
      group += split.groupMargin;
      cost += split.cost;
      units += v;
    }
    const progress = Math.min(1, group / goal);
    return { revenue, platform, group, cost, units, progress };
  }, [volume, goal]);

  function addToCart(pid) {
    setCart((c) => ({ ...c, [pid]: (c[pid] || 0) + 1 }));
  }
  function updateQty(pid, delta) {
    setCart((c) => {
      const next = { ...c, [pid]: Math.max(0, (c[pid] || 0) + delta) };
      if (next[pid] === 0) delete next[pid];
      return next;
    });
  }
  function checkout() {
    // Simulate order: commit cart to volume
    const newVolume = { ...volume };
    Object.entries(cart).forEach(([pid, q]) => {
      newVolume[pid] = (newVolume[pid] || 0) + q;
    });
    setVolume(newVolume);
    setCart({});
  }

  function encodeOfflineOrder(order) {
    // order: { buyer, items: [{pid, qty}] }
    const newVolume = { ...volume };
    order.items.forEach(({ pid, qty }) => {
      newVolume[pid] = (newVolume[pid] || 0) + qty;
    });
    setVolume(newVolume);
    setOfflineOrders((arr) => [...arr, { ...order, id: crypto.randomUUID(), at: new Date().toISOString() }]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-9 w-9 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold">F</motion.div>
            <div>
              <div className="font-semibold">Fundraise</div>
              <div className="text-xs text-gray-500">Plateforme de ventes solidaires</div>
            </div>
          </div>
          <nav className="flex gap-2">
            {[
              { id: "shop", label: "Boutique", icon: ShoppingCart },
              { id: "dashboard", label: "Tableau de bord", icon: BarChart2 },
              { id: "leaderboard", label: "Classements", icon: Trophy },
              { id: "admin", label: "Admin groupe", icon: Users },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
                  tab === t.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-gray-50"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {tab === "shop" && <Shop cart={cart} addToCart={addToCart} updateQty={updateQty} checkout={checkout} volume={volume} />}
        {tab === "dashboard" && <Dashboard groupName={groupName} setGroupName={setGroupName} goal={goal} setGoal={setGoal} totals={totals} volume={volume} />}
        {tab === "leaderboard" && <Leaderboard />}
        {tab === "admin" && <Admin encodeOfflineOrder={encodeOfflineOrder} />}
      </main>

      <footer className="border-t bg-white/60">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex flex-wrap items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Fundraise — MVP</div>
          <div className="flex gap-2">
            <Pill icon={Check}>Marge progressive automatisée</Pill>
            <Pill icon={QrCode}>QR pour mini-shop</Pill>
            <Pill icon={Users}>Compatible bons papier</Pill>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ------- Sections -------
function Shop({ cart, addToCart, updateQty, checkout, volume }) {
  const cartTotal = Object.entries(cart).reduce((sum, [pid, q]) => {
    const p = PRODUCTS.find((x) => x.id === pid);
    return sum + (p ? p.price * q : 0);
  }, 0);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Catalogue</h2>
            <span className="text-xs text-gray-500">Marge dynamique par volume</span>
          </div>
        </Card>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} addToCart={addToCart} currentVolume={volume[p.id] || 0} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <h3 className="font-semibold mb-3">Panier</h3>
          {Object.keys(cart).length === 0 ? (
            <p className="text-sm text-gray-500">Votre panier est vide.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(cart).map(([pid, q]) => {
                const p = PRODUCTS.find((x) => x.id === pid)!;
                return (
                  <div key={pid} className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">{euro(p.price)} × {q}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(pid, -1)} className="p-1 rounded-lg border"><Minus className="h-4 w-4" /></button>
                      <span className="w-8 text-center">{q}</span>
                      <button onClick={() => updateQty(pid, 1)} className="p-1 rounded-lg border"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t pt-3 mt-2">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-semibold">{euro(cartTotal)}</span>
              </div>
              <button onClick={checkout} className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2">
                <ShoppingCart className="h-4 w-4" /> Payer (simulation)
              </button>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">FAQ rapide</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
            <li>Les marges se recalculent automatiquement selon le volume total par produit.</li>
            <li>Les bons papier peuvent être encodés dans l'onglet Admin.</li>
            <li>Le paiement ici est une simulation pour le MVP.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function ProductCard({ product, addToCart, currentVolume }) {
  const tier = getTierForVolume(product, currentVolume);
  const unitPlatform = tier.platform;
  const unitGroup = tier.group;

  return (
    <Card>
      <div className="space-y-3">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <img src={product.img} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold leading-tight">{product.name}</div>
            <div className="text-sm text-gray-600">{product.desc}</div>
          </div>
          <div className="text-right">
            <div className="text-emerald-700 font-semibold">{euro(product.price)}</div>
            <div className="text-xs text-gray-500">Coût: {euro(product.baseCost)}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 text-center text-xs">
          <div className="p-2 border rounded-l-xl">
            <div className="text-gray-500">Marge plateforme</div>
            <div className="font-medium">{euro(unitPlatform)}</div>
          </div>
          <div className="p-2 border">
            <div className="text-gray-500">Marge groupe</div>
            <div className="font-medium">{euro(unitGroup)}</div>
          </div>
          <div className="p-2 border rounded-r-xl">
            <div className="text-gray-500">Volume</div>
            <div className="font-medium">{currentVolume}</div>
          </div>
        </div>
        <button onClick={() => addToCart(product.id)} className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white rounded-xl px-4 py-2">
          <Plus className="h-4 w-4" /> Ajouter au panier
        </button>
      </div>
    </Card>
  );
}

function Dashboard({ groupName, setGroupName, goal, setGoal, totals, volume }) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tableau de bord</h2>
            <Pill icon={Euro}>Objectif: {euro(goal)}</Pill>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <Stat label="Chiffre d'affaires" value={euro(totals.revenue)} />
            <Stat label="Gain du groupe" value={euro(totals.group)} accent />
            <Stat label="Marge plateforme" value={euro(totals.platform)} />
          </div>
          <Progress label={`Avancement vers l'objectif (${Math.round(totals.progress * 100)}%)`} value={totals.progress} />
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">Volumes par produit</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {Object.entries(volume).map(([pid, qty]) => {
              const p = PRODUCTS.find((x) => x.id === pid)!;
              const tier = getTierForVolume(p, qty);
              return (
                <div key={pid} className="p-3 rounded-xl border text-sm">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-gray-600">Ventes: {qty}</div>
                  <div className="text-gray-600">Marge groupe/u: {euro(tier.group)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <h3 className="font-semibold mb-2">Paramètres du groupe</h3>
          <label className="text-sm text-gray-600">Nom</label>
          <input value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full mt-1 mb-3 rounded-xl border px-3 py-2" />
          <label className="text-sm text-gray-600">Objectif (€)</label>
          <input type="number" value={goal} onChange={(e) => setGoal(Number(e.target.value || 0))} className="w-full mt-1 rounded-xl border px-3 py-2" />
        </Card>

        <Card>
          <h3 className="font-semibold mb-2">Lien du mini-shop</h3>
          <div className="text-sm text-gray-600">Partagez ce lien/QR avec vos acheteurs.</div>
          <div className="mt-2 p-3 rounded-xl border bg-white">https://fundraise.app/{groupName.toLowerCase().replace(/\s+/g, "-")}</div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "bg-emerald-50 border-emerald-100" : "bg-white"}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}

function Progress({ label, value }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, value * 100)}%` }} />
      </div>
    </div>
  );
}

function Leaderboard() {
  const mock = [
    { name: "Classe de 6e A", amount: 1520 },
    { name: "Scouts de Namur", amount: 1210 },
    { name: "Club de volley U14", amount: 980 },
  ];
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <h2 className="text-lg font-semibold mb-3">Top groupes (mois)</h2>
        <div className="divide-y">
          {mock.map((g, i) => (
            <div key={g.name} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full grid place-items-center bg-indigo-600 text-white font-semibold">{i + 1}</div>
                <div>
                  <div className="font-medium">{g.name}</div>
                  <div className="text-xs text-gray-500">Total collecté</div>
                </div>
              </div>
              <div className="font-semibold">{euro(g.amount)}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-3">Récompenses & paliers</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
          <li>100 ventes (tous produits) → livraison gratuite</li>
          <li>300 ventes → 50 stickers personnalisés offerts</li>
          <li>500 ventes → +0,20€ marge bonus sur le prochain palier</li>
        </ul>
      </Card>
    </div>
  );
}

function Admin({ encodeOfflineOrder }) {
  const [buyer, setBuyer] = useState("");
  const [items, setItems] = useState([{ pid: "coffret", qty: 1 }]);
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <h2 className="text-lg font-semibold">Encodage d'un bon papier</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="text-sm text-gray-600">Acheteur (nom)</label>
              <input value={buyer} onChange={(e) => setBuyer(e.target.value)} className="w-full mt-1 rounded-xl border px-3 py-2" />
            </div>
            <div className="text-sm text-gray-600">Téléversement du bon (photo) <span className="text-gray-400">(optionnel)</span>
              <div className="mt-1 flex items-center gap-2">
                <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2"><Upload className="h-4 w-4" /> Importer</button>
                <Pill icon={Loader2}>OCR bientôt</Pill>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7">
                  <select value={it.pid} onChange={(e) => {
                    const pid = e.target.value; const next = [...items]; next[idx] = { ...next[idx], pid }; setItems(next);
                  }} className="w-full rounded-xl border px-3 py-2">
                    {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <input type="number" min={1} value={it.qty} onChange={(e) => {
                    const qty = Math.max(1, Number(e.target.value || 1)); const next = [...items]; next[idx] = { ...next[idx], qty }; setItems(next);
                  }} className="w-full rounded-xl border px-3 py-2" />
                </div>
                <div className="col-span-2 text-right">
                  <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-sm text-red-600">Supprimer</button>
                </div>
              </div>
            ))}
            <button onClick={() => setItems([...items, { pid: "coffret", qty: 1 }])} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2"><Plus className="h-4 w-4" /> Ajouter une ligne</button>
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                encodeOfflineOrder({ buyer: buyer || "Sans nom", items });
                setBuyer("");
                setItems([{ pid: "coffret", qty: 1 }]);
              }}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2"
            >
              <Check className="h-4 w-4" /> Enregistrer le bon papier
            </button>
          </div>
        </Card>
      </div>
      <div>
        <Card>
          <h3 className="font-semibold mb-2">Bonnes pratiques</h3>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>Encoder les commandes papier en fin de journée.</li>
            <li>Conserver les originaux 30 jours pour contrôle.</li>
            <li>Vérifier les paliers atteints chaque semaine.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
