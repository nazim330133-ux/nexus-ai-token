import { useEffect, useRef, useState, useCallback } from "react";

const TOKEN = "0x3371f6F00B3ee5Cc6D7E5d8BbEc27961B772001E";
const STAKING = "0x6409896461688E0a25cF8Ee5DD3f3CC0a9ba0c3c";
const POOL = "0xBcFe9a8498c4b702c739BE67012D18c48d220F28";
const FAUCET = "0x0df7EDA329C21B3eaC17B2BF3Cc21a7eEe2B2b19";
const OWNER = "0x7bd3dB1509372c6343eA973b7070c9289d96455b";
const E = "https://testnet.bscscan.com";

const TAX = [
  { l: "Likidite", p: 40, c: "#6366f1", d: "PancakeSwap LP" },
  { l: "Ekosistem", p: 30, c: "#10b981", d: "Topluluk & Ortaklıklar" },
  { l: "Geliştirme", p: 15, c: "#f59e0b", d: "Sürekli İyileştirme" },
  { l: "Ekip Vesting", p: 10, c: "#ef4444", d: "4 Yıl Vesting" },
  { l: "Airdrop", p: 5, c: "#ec4899", d: "Test Kullanıcıları" },
];

const MAP = [
  { p: "Q2 2026", t: "Doğum", i: ["Token Deploy", "PancakeSwap LP", "Staking Pool"], d: true, cur: false },
  { p: "Q3 2026", t: "Topluluk", i: ["Website", "Sosyal Ağlar", "Airdrop", "Testnet"], d: true, cur: false },
  { p: "Q4 2026", t: "Mainnet", i: ["BSC Mainnet", "PancakeSwap Listing", "Audit", "CEX Başvuru"], d: false, cur: true },
  { p: "2027", t: "Ekosistem", i: ["NexusAI DApp", "Cross-chain", "DAO", "NFT"], d: false, cur: false },
];

const WALLETS = [
  { n: "Ekosistem Fonu", a: "0xFF2d63bF34Ff4fC40573699D2eb4A113504FC194" },
  { n: "Geliştirme Fonu", a: "0xE64FAD751A7A47Ed87c33a33fEc96983d470BcDF" },
  { n: "Ekip Vesting", a: "0x3842F08a7dD1D9534D6086C98B6C24782357c088" },
];

function useIO(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { e.target.classList.add("v"); o.unobserve(e.target); } }, { threshold });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [threshold]);
  return ref;
}

function R({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useIO();
  return <div ref={ref} className={`r ${className}`}>{children}</div>;
}

export default function Home() {
  const [acct, setAcct] = useState("");
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState("");
  const [dark, setDark] = useState(true);
  const [txStatus, setTxStatus] = useState("");
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [data, setData] = useState({
    supply: "100,000,000", staked: "0", nxi: "0", bnb: "0",
    price: "—", myBal: "—", myStake: "—", myRewards: "—",
  });
  const [stakers, setStakers] = useState<{ n: string; a: string; v: string }[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = new Date("2026-10-01T00:00:00Z");
    const tick = () => { const n = Date.now(); const d = target.getTime() - n; if (d <= 0) return; setCountdown({ d: Math.floor(d / 86400000), h: Math.floor((d % 86400000) / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) }); };
    tick(); setInterval(tick, 1000);
  }, []);

  useEffect(() => { document.documentElement.setAttribute("data-theme", dark ? "dark" : "light"); }, [dark]);

  useEffect(() => {
    const init = async () => {
      const { ethers } = await import("ethers");
      const p = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
      const t = new ethers.Contract(TOKEN, ["function totalSupply() view returns (uint256)", "function balanceOf(address) view returns (uint256)"], p);
      const s = new ethers.Contract(STAKING, ["function totalStaked() view returns (uint256)", "function earned(address) view returns (uint256)", "function stakedBalance(address) view returns (uint256)"], p);
      const l = new ethers.Contract(POOL, ["function getReserves() view returns (uint112,uint112,uint32)", "function token0() view returns (address)"], p);

      const f = async () => {
        try {
          const [sup, st, rs, t0a] = await Promise.all([
            t.totalSupply(), s.totalStaked(),
            l.getReserves().catch(() => [0, 0, 0]),
            l.token0().catch(() => TOKEN),
          ]);
          const n0 = t0a.toLowerCase() === TOKEN.toLowerCase();
          const n = ethers.formatEther(String(n0 ? rs[0] : rs[1]));
          const b = ethers.formatEther(String(n0 ? rs[1] : rs[0]));
          const pv = Number(b) / Number(n) || 0;
          setData(d => ({
            ...d,
            supply: Number(ethers.formatEther(sup)).toLocaleString(),
            staked: Number(ethers.formatEther(st)).toLocaleString(),
            nxi: Number(n).toLocaleString(),
            bnb: Number(b).toFixed(5),
            price: pv > 0 ? pv.toFixed(10) : "—",
          }));
        } catch {}
      };
      f();
      setInterval(f, 20000);

      Promise.all(WALLETS.map(w => s.stakedBalance(w.a).then(v => ({ n: w.n, a: w.a.slice(0, 6) + "..." + w.a.slice(-4), v: Number(ethers.formatEther(v)).toLocaleString() })))).then(setStakers);
    };
    init();
  }, []);

  useEffect(() => {
    if (!acct) return;
    (async () => {
      const { ethers } = await import("ethers");
      const p = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
      const t = new ethers.Contract(TOKEN, ["function balanceOf(address) view returns (uint256)"], p);
      const s = new ethers.Contract(STAKING, ["function earned(address) view returns (uint256)", "function stakedBalance(address) view returns (uint256)"], p);
      const f = async () => {
        try { const [b, st, e] = await Promise.all([t.balanceOf(acct), s.stakedBalance(acct), s.earned(acct)]); setData(d => ({ ...d, myBal: Number(ethers.formatEther(b)).toLocaleString(), myStake: Number(ethers.formatEther(st)).toLocaleString(), myRewards: Number(ethers.formatEther(e)).toFixed(2) })); } catch {}
      };
      f(); setInterval(f, 15000);
    })();
  }, [acct]);

  useEffect(() => {
    const h = heroRef.current;
    if (!h) return;
    const onMove = (e: MouseEvent) => {
      const r = h.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      h.style.setProperty("--mx", x + "%");
      h.style.setProperty("--my", y + "%");
    };
    h.addEventListener("mousemove", onMove);
    return () => h.removeEventListener("mousemove", onMove);
  }, []);

  const copy = useCallback((a: string) => { navigator.clipboard.writeText(a); setCopied(a); setTimeout(() => setCopied(""), 2000); }, []);

  const connect = async () => {
    try { const e = (window as any).ethereum; if (!e) return; setAcct((await e.request({ method: "eth_requestAccounts" }))[0]); } catch {}
  };

  const sendTx = async (fn: () => Promise<any>, msg: string) => {
    try {
      setTxStatus(`⏳ ${msg}...`);
      const tx = await fn();
      setTxStatus(`⏳ Bekleniyor... ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      setTxStatus(`✅ Basarili!`);
      setTimeout(() => setTxStatus(""), 3000);
    } catch (e: any) {
      setTxStatus(`❌ ${e?.message?.slice(0, 60) || "Hata"}`);
      setTimeout(() => setTxStatus(""), 5000);
    }
  };

  const doStake = async () => {
    const { ethers } = await import("ethers");
    const e = (window as any).ethereum;
    if (!e) return setTxStatus("❌ MetaMask gerekli");
    const p = new ethers.BrowserProvider(e);
    const s = await p.getSigner();
    const c = new ethers.Contract(STAKING, ["function stake(uint256 amount) external"], s);
    const amt = prompt("Stake miktari (NXI):");
    if (!amt) return;
    sendTx(() => c.stake(ethers.parseEther(amt)), `${amt} NXI stake ediliyor`);
  };

  const doUnstake = async () => {
    const { ethers } = await import("ethers");
    const e = (window as any).ethereum;
    if (!e) return setTxStatus("❌ MetaMask gerekli");
    const p = new ethers.BrowserProvider(e);
    const s = await p.getSigner();
    const c = new ethers.Contract(STAKING, ["function unstake(uint256 amount) external"], s);
    const amt = prompt("Unstake miktari (NXI):");
    if (!amt) return;
    sendTx(() => c.unstake(ethers.parseEther(amt)), `${amt} NXI unstake ediliyor`);
  };

  const doClaim = async () => {
    const { ethers } = await import("ethers");
    const e = (window as any).ethereum;
    if (!e) return setTxStatus("❌ MetaMask gerekli");
    const p = new ethers.BrowserProvider(e);
    const s = await p.getSigner();
    const c = new ethers.Contract(STAKING, ["function claimReward() external"], s);
    sendTx(() => c.claimReward(), "Oduller talep ediliyor");
  };

  const nav = [
    { l: "Dashboard", h: "#stats" },
    { l: "Tokenomics", h: "#tokenomics" },
    { l: "Staking", h: "#staking" },
    { l: "Services", h: "#services" },
    { l: "News", h: "#news" },
    { l: "Roadmap", h: "#roadmap" },
    { l: "Audit", h: "#audit" },
    { l: "Contracts", h: "#contracts" },
  ];

  return (
    <div className="root">
      <canvas id="bg" />

      <nav>
        <div className="nav-inner">
          <div className="nav-l">
            <div className="logo">
              <div className="logo-icon">
                <svg width="16" height="16" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="6"/>
                  <text x="50" y="58" textAnchor="middle" fill="white" fontSize="44" fontWeight="700" fontFamily="system-ui">N</text>
                </svg>
              </div>
              <span>Nexus AI</span>
              <span className="badge">$NXI</span>
            </div>
          </div>
          <div className="nav-c">
            {nav.map(n => (
              <a key={n.h} href={n.h} className="nav-link" data-text={n.l}>{n.l}</a>
            ))}
          </div>
          <div className="nav-r">
            {acct ? (
              <div className="acct-badge">
                <span className="dot" />
                {acct.slice(0, 4)}...{acct.slice(-3)}
              </div>
            ) : (
              <button onClick={connect} className="btn-primary btn-sm">Connect</button>
            )}
            <button onClick={() => setDark(!dark)} className="theme-btn" title="Tema">
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              )}
            </button>
            <button className="hamburger" onClick={() => setMenu(!menu)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
        {menu && (
          <div className="mobile-nav">
            {nav.map(n => (
              <a key={n.h} href={n.h} className="mobile-link" onClick={() => setMenu(false)}>{n.l}</a>
            ))}
          </div>
        )}
      </nav>

      <section ref={heroRef} className="hero" id="hero">
        <div className="hero-grad" />
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-tag">
            <span className="dot" />
            BSC Testnet • Chain ID 97
          </div>
          <h1 className="hero-title">
            <span className="grad-text">Nexus AI</span>
            <br />
            <span className="hero-sub">Ecosystem</span>
          </h1>
          <p className="hero-desc">
            A next-generation BEP-20 token powering decentralized community economy on BNB Smart Chain.
          </p>
          <div className="hero-meta">
            <span>$NXI</span>
            <span className="sep" />
            <span>100M Fixed Supply</span>
            <span className="sep" />
            <span>50% APY Staking</span>
          </div>
          <div className="hero-actions">
            <a href={`${E}/address/${TOKEN}`} target="_blank" className="btn-primary btn-lg">
              BscScan
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
            </a>
            <a href={`${E}/address/${STAKING}`} target="_blank" className="btn-secondary btn-lg">Staking Pool</a>
            <a href={`${E}/address/${POOL}`} target="_blank" className="btn-secondary btn-lg">LP Pool</a>
          </div>
        </div>
        <div className="hero-scroll">
          <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
            <rect x="1" y="1" width="18" height="26" rx="9" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="8" r="3" fill="currentColor" className="scroll-dot" />
          </svg>
        </div>
      </section>

      <section className="stats" id="stats">
        <R>
          <div className="stats-grid">
            {[
              { l: "Total Supply", v: data.supply, s: "NXI", ic: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { l: "Staked", v: data.staked, s: "NXI", ic: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
              { l: "Liquidity", v: data.nxi, s: "NXI", ic: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
              { l: "Price", v: data.price, s: "BNB", ic: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
            ].map((c, i) => (
              <div key={i} className="stat-card">
                <div className="stat-h">
                  <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d={c.ic} />
                  </svg>
                  {c.l}
                </div>
                <div className="stat-v">{c.v} <span className="stat-s">{c.s}</span></div>
              </div>
            ))}
          </div>
        </R>
      </section>

      {acct && (
        <section>
          <R>
            <div className="wallet-dash">
              <div className="wallet-h">
                <span className="dot" />
                {acct}
                <span className="connected">Connected</span>
              </div>
              <div className="wallet-grid">
                {[
                  { l: "Balance", v: data.myBal, c: "white" },
                  { l: "Staked", v: data.myStake, c: "#10b981" },
                  { l: "Rewards", v: data.myRewards, c: "#f59e0b" },
                ].map((w, i) => (
                  <div key={i} className="wallet-item" style={{ "--accent": w.c } as React.CSSProperties}>
                    <div className="wallet-l">{w.l}</div>
                    <div className="wallet-v">{w.v}</div>
                    <div className="wallet-unit">NXI</div>
                  </div>
                ))}
              </div>
              <div className="wallet-actions">
                <button onClick={() => doStake()} className="btn-primary">
                  Stake NXI
                </button>
                <button onClick={() => doUnstake()} className="btn-secondary">
                  Unstake
                </button>
                <button onClick={() => doClaim()} className="btn-secondary">
                  Claim
                </button>
                <a href={`${E}/address/${FAUCET}#writeContract`} target="_blank" className="btn-secondary">
                  Faucet
                </a>
              </div>
              {txStatus && <div className="tx-status">{txStatus}</div>}
            </div>
          </R>
        </section>
      )}

      <section className="section">
        <R>
          <div className="section-h">
            <div className="section-tag" style={{ borderColor: "rgba(41,141,255,0.2)" }}>Market</div>
            <h2>BNB/USDT Piyasasi</h2>
            <p>Canli fiyat grafigi — NXI yakinda listelenecek</p>
          </div>
          <div className="tv-wrap">
            <div className="tv-chart" id="tv-chart" />
          </div>
        </R>
      </section>

      <section className="section" id="tokenomics">
        <R>
          <div className="section-h">
            <div className="section-tag">Tokenomics</div>
            <h2>Token Distribution</h2>
            <p>A fair allocation of 100M NXI ensuring long-term growth.</p>
          </div>
        </R>
        <div className="tok-grid">
          <R>
            <div className="chart-wrap">
              <svg viewBox="0 0 100 100" className="chart">
                {(() => { let s = 0; return TAX.map((t, i) => {
                  const e = s + (t.p / 100) * 360;
                  const r = 38, cx = 50, cy = 50;
                  const x1 = cx + r * Math.cos(((s - 90) * Math.PI) / 180);
                  const y1 = cy + r * Math.sin(((s - 90) * Math.PI) / 180);
                  const x2 = cx + r * Math.cos(((e - 90) * Math.PI) / 180);
                  const y2 = cy + r * Math.sin(((e - 90) * Math.PI) / 180);
                  const la = e - s > 180 ? 1 : 0;
                  const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2} Z`;
                  const mid = s + (e - s) / 2;
                  const mx = cx + 22 * Math.cos(((mid - 90) * Math.PI) / 180);
                  const my = cy + 22 * Math.sin(((mid - 90) * Math.PI) / 180);
                  s = e;
                  return (
                    <g key={i}>
                      <path d={d} fill={t.c} opacity="0.9" />
                      {t.p >= 8 && <text x={mx} y={my} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="4.5" fontWeight="bold">{t.p}%</text>}
                    </g>
                  );
                })})()}
                <circle cx={50} cy={50} r={28} fill="#0a0a0f" opacity="0.95" />
                <text x={50} y={46} textAnchor="middle" fill="white" fontSize="6.5" fontWeight="bold">NXI</text>
                <text x={50} y={56} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="4">100M</text>
              </svg>
            </div>
          </R>
          <R>
            <div className="tok-list">
              {TAX.map((t, i) => (
                <div key={i} className="tok-item">
                  <div className="tok-dot" style={{ backgroundColor: t.c }} />
                  <div className="tok-info">
                    <div className="tok-h">
                      <span>{t.l}</span>
                      <span className="tok-pct" style={{ color: t.c }}>{t.p}%</span>
                    </div>
                    <div className="tok-bar"><div className="tok-fill" style={{ width: t.p + "%", backgroundColor: t.c }} /></div>
                    <div className="tok-d">{t.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </R>
        </div>
      </section>

      <section className="section" id="staking">
        <R>
          <div className="section-h">
            <div className="section-tag" style={{ borderColor: "rgba(16,185,129,0.2)", color: "#10b981" }}>Staking</div>
            <h2>Staking Pool</h2>
            <p>Earn 50% APY. Rewards accrue every second.</p>
          </div>
        </R>
        <div className="stake-grid">
          <R>
            <div className="card">
              <div className="card-h">
                <div className="card-icon" style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <div className="card-t">Pool Overview</div>
                  <div className="card-st">Staking Contract</div>
                </div>
              </div>
              <div className="card-rows">
                {[
                  { l: "Total Staked", v: data.staked + " NXI", c: "#10b981" },
                  { l: "Annual Yield", v: "50% APY", c: "#f59e0b" },
                  { l: "Rewards", v: "Continuous", c: "white" },
                  { l: "Min. Stake", v: "1 NXI", c: "white" },
                  { l: "Unstake", v: "Instant", c: "white" },
                ].map((r, i) => (
                  <div key={i} className="card-row">
                    <span className="card-ll">{r.l}</span>
                    <span className="card-lv" style={{ color: r.c }}>{r.v}</span>
                  </div>
                ))}
              </div>
              <a href={`${E}/address/${STAKING}`} target="_blank" className="card-link">View Contract →</a>
            </div>
          </R>
          <R>
            <div className="card">
              <div className="card-h">
                <div className="card-icon" style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><path d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                </div>
                <div>
                  <div className="card-t">Leaderboard</div>
                  <div className="card-st">Top Stakers</div>
                </div>
              </div>
              {stakers.length > 0 ? (
                <div className="lb">
                  {stakers.map((s, i) => (
                    <div key={i} className="lb-row">
                      <div className={`lb-rank ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>{i + 1}</div>
                      <span className="lb-addr">{s.a}</span>
                      <span className="lb-val">{s.v} NXI</span>
                      <span className="lb-name">{s.n}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                  <p>No stakers yet</p>
                  <span>Be the first to stake!</span>
                </div>
              )}
              <p className="lb-cta">Connect &amp; stake to join leaderboard</p>
            </div>
          </R>
        </div>
      </section>

      <section className="section" id="services">
        <R>
          <div className="section-h">
            <div className="section-tag" style={{ borderColor: "rgba(99,102,241,0.2)", color: "#818cf8" }}>Hizmetler</div>
            <h2>Token Paketleri</h2>
            <p>Size ozel BEP-20 token ekosistemi. 24 saatte teslim, profesyonel kod.</p>
          </div>
        </R>
        <R>
          <div className="how-grid">
            {[
              { n: "1", t: "Iletisim", d: "Telegram'da @Nxiaibot'a yazin, ihtiyaclarinizi anlatin." },
              { n: "2", t: "Teslimat", d: "24-48 saat icinde token, site ve bot hazir, yayina alinir." },
              { n: "3", t: "Yayin", d: "Token BscScan'de, siteniz Vercel'de, botunuz Telegram'da canli." },
            ].map((s, i) => (
              <div key={i} className="how-card">
                <div className="how-n">{s.n}</div>
                <div className="how-t">{s.t}</div>
                <div className="how-d">{s.d}</div>
              </div>
            ))}
          </div>
        </R>
        <div className="pkg-grid">
          {[
            { n: "Temel", p: "$200", desc: "Kendi tokeninizi baslatin", f: ["BEP-20 Token Kontrati", "Akilli Kontrat Denetimi", "100M Sabit Arz", "BscScan Dogrulama", "Kaynak Kod Teslimi"] },
            { n: "Standart", p: "$350", best: true, desc: "Token + Staking Ekosistemi", f: ["Temel Paketteki Her Sey", "%50 APY Staking Pool", "PancakeSwap Likidite", "Token Distribusyonu", "Web Sitesi (Dashboard)", "Telegram Bot"] },
            { n: "Premium", p: "$500", desc: "Tam Ekosistem Cozumu", f: ["Standart Paketteki Her Sey", "Faucet Kontrati", "Airdrop Sistemi", "Otomatik Yonetici Bot", "Twitter/X Tanitimi", "1 Ay Destek"] },
          ].map((pkg, i) => (
            <div key={i} className={`pkg-card ${pkg.best ? "pkg-best" : ""}`}>
              {pkg.best && <div className="pkg-badge">Populer</div>}
              <div className="pkg-header">
                <div className="pkg-name">{pkg.n}</div>
                <div className="pkg-price">{pkg.p}</div>
                <div className="pkg-desc">{pkg.desc}</div>
              </div>
              <div className="pkg-features">
                {pkg.f.map((feat, j) => (
                  <div key={j} className="pkg-feat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
                    {feat}
                  </div>
                ))}
              </div>
              <a href="https://t.me/Nxiaibot" target="_blank" className={`btn-primary btn-lg pkg-btn ${pkg.best ? "" : "btn-secondary"}`}>
                Satin Al — /satinal
              </a>
            </div>
          ))}
        </div>
        <R>
          <div className="ref-section">
            <h3>Referans Projemiz</h3>
            <div className="ref-card">
              <div className="ref-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#298dff" strokeWidth="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div className="ref-info">
                <div className="ref-name">Nexus AI ($NXI)</div>
                <div className="ref-p">Canli ve calisiyor — Standart paket ornegi</div>
                <a href="https://nexusai-ecosystem.vercel.app" target="_blank" className="ref-link">siteyi gor →</a>
              </div>
            </div>
          </div>
        </R>
      </section>

      <section className="section" id="faucet">
        <R>
          <div className="faucet">
            <div className="faucet-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
            </div>
            <h2>Testnet Faucet</h2>
            <p>Get 100 free NXI every 24 hours for testing.</p>
            <div className="faucet-balance">10,000 NXI available</div>
            <div className="faucet-actions">
              <a href={`${E}/address/${FAUCET}#writeContract`} target="_blank" className="btn-primary btn-lg">
                Claim 100 NXI
              </a>
              <a href={`${E}/address/${FAUCET}`} target="_blank" className="btn-secondary btn-lg">View Faucet</a>
            </div>
            {!acct && <p className="faucet-note">Connect wallet to claim</p>}
          </div>
        </R>
      </section>

      <section className="section" id="roadmap">
        <R>
          <div className="section-h">
            <div className="section-tag" style={{ borderColor: "rgba(168,85,247,0.2)", color: "#a855f7" }}>Roadmap</div>
            <h2>Journey Ahead</h2>
            <p>The path to a full-featured decentralized ecosystem.</p>
          </div>
        </R>
        <div className="rm">
          {MAP.map((r, i) => (
            <R key={i}>
              <div className={`rm-card ${r.d ? "done" : ""} ${r.cur ? "current" : ""}`}>
                <div className="rm-side">
                  <div className={`rm-dot ${r.d ? "done" : ""} ${r.cur ? "cur" : ""}`}>
                    {r.d ? "✓" : r.cur ? "●" : i + 1}
                  </div>
                  {i < MAP.length - 1 && <div className="rm-line" />}
                </div>
                <div className="rm-body">
                  <div className="rm-h">
                    <span className="rm-p">{r.p}</span>
                    {r.d && <span className="rm-badge done-badge">✓ Done</span>}
                    {r.cur && <span className="rm-badge cur-badge">In Progress</span>}
                  </div>
                  <h3 className="rm-t">{r.t}</h3>
                  <ul className="rm-items">
                    {r.i.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </R>
          ))}
        </div>
      </section>

      <section className="section" id="countdown">
        <R>
          <div className="section-h">
            <div className="section-tag" style={{ borderColor: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>Mainnet</div>
            <h2>Mainnet Lansmani</h2>
            <p>Nexus AI ana aga cikiyor. Geri sayim basladi.</p>
          </div>
          <div className="cd">
            {[
              { v: countdown.d, l: "Gun" },
              { v: countdown.h, l: "Saat" },
              { v: countdown.m, l: "Dakika" },
              { v: countdown.s, l: "Saniye" },
            ].map((c, i) => (
              <div key={i} className="cd-item">
                <div className="cd-v">{String(c.v).padStart(2, "0")}</div>
                <div className="cd-l">{c.l}</div>
              </div>
            ))}
          </div>
        </R>
      </section>

      <section className="section" id="news">
        <R>
          <div className="section-h">
            <div className="section-tag" style={{ borderColor: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>News</div>
            <h2>Project Updates</h2>
            <p>Latest developments and announcements about Nexus AI.</p>
          </div>
        </R>
        <R>
          <div className="news-grid">
            {[
              { d: "20 Jun 2026", t: "Testnet Canli!", c: "success", p: "Nexus AI token basariyla BSC Testnet'te yayinda. Staking, faucet ve PancakeSwap likiditesi aktif." },
              { d: "19 Jun 2026", t: "Web Sitesi Yayinda", c: "info", p: "Proje web sitesi nexusai-ecosystem.vercel.app adresinde canli. TradingView grafigi, leaderboard ve audit raporu eklendi." },
              { d: "18 Jun 2026", t: "Telegram Bot Aktif", c: "info", p: "@Nxiaibot kullanima hazir. /price, /staking, /airdrop gibi komutlarla token bilgisine aninda erisim." },
              { d: "15 Jun 2026", t: "Akilli Kontratlar Yazildi", c: "info", p: "NexusAI Token, StakingPool ve Faucet kontratlari yazildi, test edildi ve audit edildi." },
              { d: "1 Oct 2026", t: "Mainnet Lansmani", c: "pending", p: "Ana ag gecisi planlandi. Gercek BNB likiditesi, CoinGecko/CMC basvurusu ve airdrop kampanyasi baslayacak." },
            ].map((n, i) => (
              <div key={i} className={`news-card ${n.c}`}>
                <div className="news-meta">
                  <span className={`news-badge ${n.c}`}>{n.c === "success" ? "Canli" : n.c === "pending" ? "Plan" : "Guncelleme"}</span>
                  <span className="news-date">{n.d}</span>
                </div>
                <h3 className="news-t">{n.t}</h3>
                <p className="news-p">{n.p}</p>
              </div>
            ))}
          </div>
        </R>
      </section>

      <section className="section" id="audit">
        <R>
          <div className="section-h">
            <div className="section-tag" style={{ borderColor: "rgba(16,185,129,0.2)", color: "#10b981" }}>Audit</div>
            <h2>Guvenlik Denetimi</h2>
            <p>Akilli kontratlar statik analizden gecirildi.</p>
          </div>
          <div className="audit-cards">
            <div className="audit-card passed">
              <div className="audit-icon">✓</div>
              <div className="audit-name">NexusAI Token</div>
              <div className="audit-findings">7/7 guvenlik kontrolunden gecti</div>
              <div className="audit-status">✓ Guvenli</div>
            </div>
            <div className="audit-card passed">
              <div className="audit-icon">✓</div>
              <div className="audit-name">StakingPool</div>
              <div className="audit-findings">9/9 guvenlik kontrolunden gecti</div>
              <div className="audit-status">✓ Guvenli</div>
            </div>
            <div className="audit-card passed">
              <div className="audit-icon">✓</div>
              <div className="audit-name">NexusFaucet</div>
              <div className="audit-findings">5/5 guvenlik kontrolunden gecti</div>
              <div className="audit-status">✓ Guvenli</div>
            </div>
          </div>
          <details className="audit-details">
            <summary>Detayli Audit Raporu</summary>
            <div className="audit-report">
              <h4>1. NexusAI Token</h4>
              <table><thead><tr><th>Kontrol</th><th>Durum</th><th>Aciklama</th></tr></thead><tbody>
                <tr className="pass"><td>Reentrancy</td><td>✓</td><td>ERC20 transfer, reentrancy saldirisina karsi dayanikli</td></tr>
                <tr className="pass"><td>Overflow/Underflow</td><td>✓</td><td>Solidity 0.8.x built-in kontroller</td></tr>
                <tr className="pass"><td>Access Control</td><td>✓</td><td>Ownable ile dogru yetkilendirme</td></tr>
                <tr className="pass"><td>Supply Limit</td><td>✓</td><td>MAX_SUPPLY=100M, baska mint yok</td></tr>
                <tr className="pass"><td>Pause Mechanism</td><td>✓</td><td>Sadece owner pauselayabilir</td></tr>
                <tr className="pass"><td>OpenZeppelin</td><td>✓</td><td>Guvenli, denetlenmis kutuphane</td></tr>
                <tr className="pass"><td>Burn</td><td>✓</td><td>Standart ERC20Burnable, risksiz</td></tr>
              </tbody></table>

              <h4>2. StakingPool</h4>
              <table><thead><tr><th>Kontrol</th><th>Durum</th><th>Aciklama</th></tr></thead><tbody>
                <tr className="pass"><td>Reentrancy</td><td>✓</td><td>ReentrancyGuard kullaniliyor</td></tr>
                <tr className="pass"><td>SafeERC20</td><td>✓</td><td>safeTransfer/safeTransferFrom</td></tr>
                <tr className="pass"><td>Reward Hesaplama</td><td>✓</td><td>Dogru rewardPerToken formulu</td></tr>
                <tr className="pass"><td>Overflow/Underflow</td><td>✓</td><td>Solidity 0.8.x + SafeMath</td></tr>
                <tr className="pass"><td>Access Control</td><td>✓</td><td>Owner sadece rewardRate ayarlar</td></tr>
                <tr className="pass"><td>Pause</td><td>✓</td><td>Acil durumda stake durdurulabilir</td></tr>
                <tr className="pass"><td>Claim Guvenligi</td><td>✓</td><td>updateReward modifier dogru siralamada</td></tr>
                <tr className="pass"><td>Zero Amount</td><td>✓</td><td>require(amount &gt; 0) kontrolleri</td></tr>
                <tr className="pass"><td>TotalStaked Sync</td><td>✓</td><td>Stake/withdraw eslesiyor</td></tr>
              </tbody></table>

              <h4>3. NexusFaucet</h4>
              <table><thead><tr><th>Kontrol</th><th>Durum</th><th>Aciklama</th></tr></thead><tbody>
                <tr className="pass"><td>Reentrancy</td><td>✓</td><td>ReentrancyGuard kullaniliyor</td></tr>
                <tr className="pass"><td>Cooldown Kontrolu</td><td>✓</td><td>block.timestamp kontrolu dogru</td></tr>
                <tr className="pass"><td>Bakiye Kontrolu</td><td>✓</td><td>balanceOf ile yeterlilik kontrolu</td></tr>
                <tr className="pass"><td>Access Control</td><td>✓</td><td>onlyOwner dogru kullanilmis</td></tr>
                <tr className="pass"><td>Event Logging</td><td>✓</td><td>Claimed event i dogru</td></tr>
              </tbody></table>

              <h4>Genel Degerlendirme</h4>
              <p>Uc kontrat da OpenZeppelin kutuphanelerine dayanmaktadir. Standart guvenlik kontrolleri mevcuttur. Kritik bir guvenlik acigi bulunamadi. Proje mainnet'e gecmeden once profesyonel bir firmadan (CertiK, Hacken) ek audit alinmasi onerilir.</p>
            </div>
          </details>
        </R>
      </section>

      <section className="section" id="contracts">
        <R>
          <div className="section-h">
            <div className="section-tag">Contracts</div>
            <h2>Smart Contracts</h2>
          </div>
        </R>
        <R>
          <div className="ctr">
            {[
              ["Nexus AI Token", TOKEN],
              ["Staking Pool", STAKING],
              ["NXI / WBNB LP", POOL],
              ["Nexus Faucet", FAUCET],
              ["Owner Wallet", OWNER],
            ].map(([n, a], i) => (
              <div key={i} className="ctr-row">
                <div className="ctr-info">
                  <div className="ctr-icon">{String(n).charAt(0)}</div>
                  <div>
                    <div className="ctr-n">{n}</div>
                    <div className="ctr-a">{a}</div>
                  </div>
                </div>
                <div className="ctr-actions">
                  <button onClick={() => copy(a)} className="ctr-btn" title="Copy">
                    {copied === a ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                    )}
                  </button>
                  <a href={`${E}/address/${a}`} target="_blank" className="ctr-btn" title="BscScan">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </R>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-main">
            <div>
              <div className="footer-logo">
                <div className="logo-icon">N</div>
                <span>Nexus AI</span>
              </div>
              <p>Building the next-generation community-driven blockchain economy on BNB Smart Chain.</p>
              <div className="footer-social">
                {[
                  ["X", "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z", "https://x.com/nexusai2026"],
                  ["TG", "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z", "https://t.me/Nxiaibot"],
                  ["GH", "M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z", "#"],
                ].map(([name, path, url], i) => (
                  <a key={i} href={url} className="social-btn" title={name} target="_blank" rel="noopener noreferrer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d={path}/></svg>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4>Quick Links</h4>
              {nav.map(n => (
                <a key={n.h} href={n.h} className="footer-link">{n.l}</a>
              ))}
            </div>
            <div>
              <h4>Network</h4>
              <div className="footer-info">
                <span>BNB Smart Chain (Testnet)</span>
                <span>Chain ID: 97</span>
                <span>Token: $NXI</span>
                <span>Standard: BEP-20</span>
              </div>
            </div>
          </div>
          <div className="footer-bot">
            <span>© 2026 Nexus AI — Community Project</span>
            <div className="footer-links">
              <a href={`${E}/address/${TOKEN}`} target="_blank">Token</a>
              <a href={`${E}/address/${STAKING}`} target="_blank">Staking</a>
              <a href={`${E}/address/${POOL}`} target="_blank">LP</a>
              <a href={`${E}/address/${FAUCET}`} target="_blank">Faucet</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--bg:#06060a;--fg:#ededed;--accent:#298dff;--accent2:#6366f1;--border:rgba(255,255,255,0.06);--card:rgba(255,255,255,0.02);--muted:rgba(255,255,255,0.3);--font:"Inter",-apple-system,BlinkMacSystemFont,sans-serif;--mono:"JetBrains Mono","SF Mono",monospace}
        html{scroll-behavior:smooth}
        body{background:var(--bg);color:var(--fg);font-family:var(--font);-webkit-font-smoothing:antialiased;overflow-x:hidden}
        a{color:inherit;text-decoration:none}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:var(--bg)}
        ::-webkit-scrollbar-thumb{background:#1a1a2e;border-radius:3px}
        ::selection{background:#298dff;color:#fff}
        .dot{width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block;animation:pulse 2s ease-in-out infinite;flex-shrink:0}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .r{opacity:0;transform:translateY(24px);transition:opacity 0.7s ease,transform 0.7s ease}
        .r.v{opacity:1;transform:translateY(0)}

        #bg{position:fixed;inset:0;pointer-events:none;z-index:0}
        @keyframes particle{0%,100%{transform:translateY(0) translateX(0)}50%{transform:translateY(-30px) translateX(10px)}}

        nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(6,6,10,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border)}
        .nav-inner{max-width:1280px;margin:0 auto;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between}
        .nav-l{display:flex;align-items:center}
        .logo{display:flex;align-items:center;gap:10px}
        .logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#298dff,#6366f1);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;box-shadow:0 0 20px rgba(41,141,255,0.3)}
        .logo span{font-size:14px;font-weight:600}
        .badge{font-size:10px;background:rgba(41,141,255,0.1);color:#298dff;border:1px solid rgba(41,141,255,0.2);padding:2px 8px;border-radius:100px;font-family:var(--mono)}
        .nav-c{display:none;align-items:center;gap:32px}
        @media(min-width:768px){.nav-c{display:flex}}
        .nav-link{font-size:13px;color:rgba(255,255,255,0.4);position:relative;transition:color 0.3s}
        .nav-link:hover{color:#fff}
        .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1.5px;background:linear-gradient(90deg,#298dff,#6366f1);transition:width 0.3s}
        .nav-link:hover::after{width:100%}
        .nav-r{display:flex;align-items:center;gap:12px}
        .btn-primary{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#298dff,#6366f1);color:#fff;border:none;cursor:pointer;font-family:var(--font);font-weight:500;border-radius:10px;transition:opacity 0.3s,transform 0.3s}
        .btn-primary:hover{opacity:0.9;transform:translateY(-1px)}
        .btn-secondary{display:inline-flex;align-items:center;gap:8px;background:transparent;color:rgba(255,255,255,0.7);border:1px solid var(--border);cursor:pointer;font-family:var(--font);font-weight:500;border-radius:10px;transition:all 0.3s}
        .btn-secondary:hover{background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.12);color:#fff}
        .btn-sm{padding:8px 18px;font-size:12px}
        .btn-lg{padding:14px 28px;font-size:14px}
        .acct-badge{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid var(--border);padding:6px 14px;border-radius:8px;font-size:12px;font-family:var(--mono);color:rgba(255,255,255,0.6)}
        .hamburger{display:flex;flex-direction:column;gap:4px;background:none;border:none;cursor:pointer;padding:4px}
        @media(min-width:768px){.hamburger{display:none}}
        .hamburger span{width:18px;height:2px;background:rgba(255,255,255,0.4);border-radius:2px;transition:0.3s}
        .mobile-nav{display:flex;flex-direction:column;padding:12px 24px 20px;gap:8px;border-top:1px solid var(--border)}
        .mobile-link{padding:10px 12px;font-size:14px;color:rgba(255,255,255,0.6);border-radius:8px;transition:all 0.2s}
        .mobile-link:hover{background:rgba(255,255,255,0.04);color:#fff}

        .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden;padding:120px 24px 60px}
        .hero-grad{position:absolute;inset:0;background:radial-gradient(600px circle at var(--mx,50%) var(--my,50%),rgba(41,141,255,0.08),transparent 50%);pointer-events:none;z-index:1;transition:background 0.1s}
        .hero-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(41,141,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(41,141,255,0.03) 1px,transparent 1px);background-size:48px 48px;z-index:0}
        .hero-content{position:relative;z-index:2;max-width:800px}
        .hero-tag{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.04);border:1px solid var(--border);padding:6px 16px;border-radius:100px;margin-bottom:32px}
        .hero-title{font-size:clamp(48px,10vw,96px);font-weight:800;line-height:1;letter-spacing:-0.03em;margin-bottom:16px}
        .grad-text{background:linear-gradient(135deg,#298dff,#6366f1,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .hero-sub{color:rgba(255,255,255,0.5)}
        .hero-desc{font-size:clamp(16px,2vw,20px);color:rgba(255,255,255,0.4);max-width:560px;margin:0 auto 20px;line-height:1.6}
        .hero-meta{display:flex;align-items:center;justify-content:center;gap:12px;font-size:13px;color:rgba(255,255,255,0.3);font-family:var(--mono);margin-bottom:36px}
        .sep{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.15)}
        .hero-actions{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
        @media(max-width:480px){.hero-title{font-size:36px}.hero-actions{flex-direction:column;align-items:center}}
        .hero-scroll{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.15);z-index:2}
        .scroll-dot{animation:scrollDot 2s ease-in-out infinite}
        @keyframes scrollDot{0%,100%{opacity:1;transform:translateY(0)}50%{opacity:0.3;transform:translateY(6px)}}

        section{padding:80px 24px;position:relative;z-index:1}
        @media(min-width:768px){section{padding:100px 24px}}
        .section-h{text-align:center;margin-bottom:48px;max-width:600px;margin-left:auto;margin-right:auto}
        .section-tag{display:inline-block;font-size:11px;font-family:var(--mono);letter-spacing:0.1em;text-transform:uppercase;color:#298dff;border:1px solid rgba(41,141,255,0.2);padding:4px 14px;border-radius:100px;margin-bottom:16px;background:rgba(41,141,255,0.05)}
        .section-h h2{font-size:clamp(28px,4vw,44px);font-weight:700;letter-spacing:-0.02em;margin-bottom:12px}
        .section-h p{color:rgba(255,255,255,0.35);font-size:15px;line-height:1.6}

        .stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;max-width:900px;margin:0 auto}
        @media(min-width:768px){.stats-grid{grid-template-columns:repeat(4,1fr)}}
        .stat-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;transition:all 0.3s}
        .stat-card:hover{background:rgba(255,255,255,0.04);border-color:rgba(41,141,255,0.15);transform:translateY(-2px)}
        .stat-h{display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:10px}
        .stat-icon{width:16px;height:16px}
        .stat-v{font-size:clamp(18px,2.5vw,24px);font-weight:700;font-family:var(--mono);color:#fff}
        .stat-s{font-size:12px;color:rgba(255,255,255,0.3);font-weight:400}

        .wallet-dash{max-width:800px;margin:0 auto;padding:32px;border-radius:16px;border:1px solid rgba(41,141,255,0.15);background:linear-gradient(135deg,rgba(41,141,255,0.06),rgba(99,102,241,0.06));position:relative;overflow:hidden}
        .wallet-dash::before{content:'';position:absolute;top:-50%;right:-50%;width:100%;height:100%;background:radial-gradient(circle,rgba(41,141,255,0.06),transparent 70%);pointer-events:none}
        .wallet-h{display:flex;align-items:center;gap:10px;font-size:12px;font-family:var(--mono);color:rgba(255,255,255,0.4);margin-bottom:20px}
        .connected{font-size:10px;background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.2);padding:2px 10px;border-radius:100px}
        .wallet-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
        .wallet-item{padding:16px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid var(--border)}
        .wallet-l{font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:4px}
        .wallet-v{font-size:clamp(20px,3vw,28px);font-weight:700;font-family:var(--mono);color:var(--accent,white)}
        @media(max-width:480px){.wallet-grid{grid-template-columns:1fr}}
        .wallet-unit{font-size:11px;color:rgba(255,255,255,0.25)}
        .wallet-actions{display:flex;gap:12px;flex-wrap:wrap}
        .tx-status{text-align:center;font-size:12px;padding:8px 16px;border-radius:8px;margin-top:12px;font-family:var(--mono);background:rgba(41,141,255,0.1);color:#298dff;border:1px solid rgba(41,141,255,0.2)}
        .theme-btn{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:none;border:1px solid var(--border);color:rgba(255,255,255,0.4);cursor:pointer;transition:all 0.2s;flex-shrink:0}
        .theme-btn:hover{background:var(--card);color:#fff}
        .tv-wrap{max-width:700px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid var(--border);background:var(--card)}
        .tv-chart{height:400px;width:100%}
        .cd{display:flex;gap:12px;justify-content:center;max-width:500px;margin:0 auto}
        .cd-item{flex:1;text-align:center;padding:20px 12px;border-radius:14px;background:var(--card);border:1px solid var(--border)}
        .cd-v{font-size:clamp(28px,5vw,44px);font-weight:800;font-family:var(--mono);letter-spacing:-0.03em}
        .cd-l{font-size:11px;color:rgba(255,255,255,0.35);margin-top:4px;text-transform:uppercase;letter-spacing:0.1em}
        [data-theme="light"]{--bg:#f5f5f7;--fg:#1a1a2e;--border:rgba(0,0,0,0.08);--card:rgba(0,0,0,0.02)}
        [data-theme="light"] body{background:#f5f5f7;color:#1a1a2e}
        [data-theme="light"] .stat-v{color:#1a1a2e}
        [data-theme="light"] .cd-v{color:#1a1a2e}
        [data-theme="light"] .nav-link{color:rgba(0,0,0,0.4)}
        [data-theme="light"] .nav-link:hover{color:#000}
        [data-theme="light"] .social-btn{color:rgba(0,0,0,0.3)}
        [data-theme="light"] .acct-badge{color:rgba(0,0,0,0.5)}
        [data-theme="light"] .badge{color:#298dff}

        .tok-grid{display:grid;grid-template-columns:1fr;gap:40px;max-width:900px;margin:0 auto;align-items:center}
        @media(min-width:768px){.tok-grid{grid-template-columns:1fr 1fr}}
        .chart-wrap{max-width:320px;margin:0 auto}
        .chart{width:100%;height:auto;filter:drop-shadow(0 0 30px rgba(41,141,255,0.1))}
        .tok-list{display:flex;flex-direction:column;gap:12px}
        .tok-item{display:flex;gap:14px;padding:14px;border-radius:12px;background:var(--card);border:1px solid var(--border);transition:all 0.3s}
        .tok-item:hover{background:rgba(255,255,255,0.04);border-color:rgba(41,141,255,0.12)}
        .tok-dot{width:14px;height:14px;border-radius:50%;margin-top:2px;flex-shrink:0}
        .tok-info{flex:1}
        .tok-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .tok-h span:first-child{font-size:14px;font-weight:600}
        .tok-pct{font-size:13px;font-weight:700;font-family:var(--mono)}
        .tok-bar{height:6px;background:rgba(255,255,255,0.05);border-radius:10px;overflow:hidden;margin-bottom:4px}
        .tok-fill{height:100%;border-radius:10px;transition:width 1s ease}
        .tok-d{font-size:11px;color:rgba(255,255,255,0.3)}

        .stake-grid{display:grid;grid-template-columns:1fr;gap:16px;max-width:900px;margin:0 auto}
        @media(min-width:768px){.stake-grid{grid-template-columns:1fr 1fr}}
        .card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;transition:all 0.3s}
        .card:hover{border-color:rgba(255,255,255,0.1);background:rgba(255,255,255,0.03)}
        .card-h{display:flex;align-items:center;gap:14px;margin-bottom:20px}
        .card-icon{width:40px;height:40px;border-radius:12px;border:1px solid rgba(16,185,129,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .card-t{font-size:15px;font-weight:600}
        .card-st{font-size:11px;color:rgba(255,255,255,0.3)}
        .card-rows{display:flex;flex-direction:column;gap:0}
        .card-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)}
        .card-row:last-child{border-bottom:none}
        .card-ll{font-size:13px;color:rgba(255,255,255,0.4)}
        .card-lv{font-size:13px;font-weight:600;font-family:var(--mono)}
        .card-link{display:inline-flex;align-items:center;gap:4px;margin-top:16px;font-size:12px;color:#298dff;transition:color 0.3s}
        .card-link:hover{color:#fff}
        .lb{display:flex;flex-direction:column;gap:6px}
        .lb-row{display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid var(--border);transition:all 0.2s}
        .lb-row:hover{background:rgba(255,255,255,0.04)}
        .lb-rank{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);flex-shrink:0}
        .lb-rank.gold{background:linear-gradient(135deg,#f59e0b,#d97706);color:#000}
        .lb-rank.silver{background:linear-gradient(135deg,#d1d5db,#9ca3af);color:#000}
        .lb-rank.bronze{background:linear-gradient(135deg,#b45309,#92400e);color:#fff}
        .lb-addr{font-size:12px;font-family:var(--mono);color:rgba(255,255,255,0.5)}
        .lb-val{font-size:13px;font-weight:600;color:#10b981;font-family:var(--mono);margin-left:auto}
        .lb-name{font-size:10px;color:rgba(255,255,255,0.3);display:none}
        @media(min-width:480px){.lb-name{display:inline}}
        .empty{display:flex;flex-direction:column;align-items:center;padding:40px 0;color:rgba(255,255,255,0.2);gap:8px}
        .empty p{font-size:14px;color:rgba(255,255,255,0.3)}
        .empty span{font-size:12px}
        .lb-cta{text-align:center;font-size:11px;color:rgba(255,255,255,0.2);margin-top:16px}

        .pkg-grid{display:grid;grid-template-columns:1fr;gap:16px;max-width:900px;margin:0 auto}
        @media(min-width:768px){.pkg-grid{grid-template-columns:1fr 1fr 1fr}}
        .pkg-card{padding:32px 24px;border-radius:16px;border:1px solid var(--border);background:var(--card);display:flex;flex-direction:column;position:relative;transition:all 0.3s}
        .pkg-card:hover{border-color:rgba(255,255,255,0.12);transform:translateY(-4px)}
        .pkg-best{border-color:rgba(99,102,241,0.3);background:linear-gradient(135deg,rgba(99,102,241,0.06),rgba(41,141,255,0.06))}
        .pkg-best:hover{border-color:rgba(99,102,241,0.5)}
        .pkg-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:600;background:linear-gradient(135deg,#6366f1,#298dff);color:#fff;padding:4px 16px;border-radius:100px;text-transform:uppercase;letter-spacing:0.05em}
        .pkg-header{text-align:center;margin-bottom:24px}
        .pkg-name{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.4);margin-bottom:8px}
        .pkg-price{font-size:clamp(32px,4vw,48px);font-weight:800;letter-spacing:-0.03em;margin-bottom:4px}
        .pkg-desc{font-size:13px;color:rgba(255,255,255,0.35)}
        .pkg-features{display:flex;flex-direction:column;gap:10px;margin-bottom:24px;flex:1}
        .pkg-feat{display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(255,255,255,0.6)}
        .pkg-btn{width:100%;justify-content:center}
        .how-grid{display:grid;grid-template-columns:1fr;gap:16px;max-width:700px;margin:0 auto 48px}
        @media(min-width:640px){.how-grid{grid-template-columns:repeat(3,1fr)}}
        .how-card{text-align:center;padding:24px 16px;border-radius:14px;border:1px solid var(--border);background:var(--card);transition:all 0.3s}
        .how-card:hover{border-color:rgba(41,141,255,0.2);transform:translateY(-2px)}
        .how-n{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#298dff,#6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;margin:0 auto 12px}
        .how-t{font-size:15px;font-weight:600;margin-bottom:6px}
        .how-d{font-size:12px;color:rgba(255,255,255,0.4);line-height:1.5}
        .ref-section{max-width:400px;margin:48px auto 0;text-align:center}
        .ref-section h3{font-size:16px;font-weight:600;margin-bottom:16px}
        .ref-card{display:flex;align-items:center;gap:16px;padding:20px;border-radius:14px;border:1px solid rgba(41,141,255,0.15);background:rgba(41,141,255,0.03);text-align:left;transition:all 0.3s}
        .ref-card:hover{border-color:rgba(41,141,255,0.3)}
        .ref-icon{width:48px;height:48px;border-radius:12px;background:rgba(41,141,255,0.1);border:1px solid rgba(41,141,255,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ref-name{font-size:14px;font-weight:600;margin-bottom:2px}
        .ref-p{font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:4px}
        .ref-link{font-size:12px;color:#298dff;font-weight:500}
        .faucet{max-width:600px;margin:0 auto;text-align:center;padding:48px 32px;border-radius:20px;border:1px solid rgba(41,141,255,0.15);background:linear-gradient(135deg,rgba(41,141,255,0.05),rgba(99,102,241,0.05));position:relative;overflow:hidden}
        .faucet::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:conic-gradient(from 0deg,transparent,rgba(41,141,255,0.03),transparent,rgba(99,102,241,0.03),transparent);animation:spin 10s linear infinite;pointer-events:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        .faucet-icon{width:56px;height:56px;margin:0 auto 20px;border-radius:16px;background:linear-gradient(135deg,rgba(41,141,255,0.1),rgba(99,102,241,0.1));border:1px solid rgba(41,141,255,0.15);display:flex;align-items:center;justify-content:center;color:#298dff}
        .faucet h2{font-size:28px;font-weight:700;margin-bottom:8px}
        .faucet>p{font-size:14px;color:rgba(255,255,255,0.4);margin-bottom:6px}
        .faucet-balance{font-size:12px;font-family:var(--mono);color:rgba(255,255,255,0.25);margin-bottom:24px}
        .faucet-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .faucet-note{font-size:11px;color:rgba(255,255,255,0.2);margin-top:16px}

        .rm{max-width:700px;margin:0 auto}
        .rm-card{display:flex;gap:16px;padding:0 0 32px;position:relative}
        .rm-card.current .rm-body{border-color:rgba(41,141,255,0.2);background:rgba(41,141,255,0.03)}
        .rm-card.done .rm-body{border-color:rgba(16,185,129,0.15);background:rgba(16,185,129,0.03)}
        .rm-side{display:flex;flex-direction:column;align-items:center;width:32px;flex-shrink:0;padding-top:4px}
        .rm-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:rgba(255,255,255,0.04);border:2px solid var(--border);color:rgba(255,255,255,0.3);flex-shrink:0;z-index:1}
        .rm-dot.done{background:rgba(16,185,129,0.15);border-color:#10b981;color:#10b981}
        .rm-dot.cur{background:rgba(41,141,255,0.15);border-color:#298dff;color:#298dff;animation:pulse 2s infinite}
        .rm-line{width:2px;flex:1;background:linear-gradient(to bottom,var(--border),transparent);margin-top:4px}
        .rm-body{flex:1;padding:20px;border-radius:14px;border:1px solid var(--border);background:var(--card);transition:all 0.3s}
        .rm-body:hover{border-color:rgba(255,255,255,0.1)}
        .rm-h{display:flex;align-items:center;gap:8px;margin-bottom:8px}
        .rm-p{font-size:11px;font-family:var(--mono);color:rgba(255,255,255,0.3);letter-spacing:0.05em}
        .rm-badge{font-size:9px;padding:2px 8px;border-radius:100px;font-family:var(--mono)}
        .done-badge{background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.2)}
        .cur-badge{background:rgba(41,141,255,0.1);color:#298dff;border:1px solid rgba(41,141,255,0.2)}
        .rm-t{font-size:18px;font-weight:600;margin-bottom:8px}
        .rm-items{list-style:none;display:flex;flex-direction:column;gap:4px}
        .rm-items li{font-size:13px;color:rgba(255,255,255,0.4);padding-left:16px;position:relative}
        .rm-items li::before{content:'›';position:absolute;left:4px;color:rgba(255,255,255,0.2)}

        .news-grid{display:grid;grid-template-columns:1fr;gap:12px;max-width:700px;margin:0 auto}
        @media(min-width:640px){.news-grid{grid-template-columns:1fr 1fr}}
        .news-card{padding:20px;border-radius:14px;border:1px solid var(--border);background:var(--card);transition:all 0.3s}
        .news-card:hover{border-color:rgba(255,255,255,0.1);transform:translateY(-2px)}
        .news-card.success{border-color:rgba(16,185,129,0.2);background:rgba(16,185,129,0.03)}
        .news-card.info{border-color:rgba(41,141,255,0.15);background:rgba(41,141,255,0.03)}
        .news-card.pending{border-color:rgba(245,158,11,0.15);background:rgba(245,158,11,0.03)}
        .news-meta{display:flex;align-items:center;gap:10px;margin-bottom:10px}
        .news-badge{font-size:9px;padding:2px 10px;border-radius:100px;font-family:var(--mono);text-transform:uppercase;letter-spacing:0.05em}
        .news-badge.success{background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.2)}
        .news-badge.info{background:rgba(41,141,255,0.15);color:#298dff;border:1px solid rgba(41,141,255,0.2)}
        .news-badge.pending{background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.2)}
        .news-date{font-size:11px;color:rgba(255,255,255,0.25);font-family:var(--mono)}
        .news-t{font-size:15px;font-weight:600;margin-bottom:6px}
        .news-p{font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6}
        .audit-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:700px;margin:0 auto 24px}
        @media(max-width:640px){.audit-cards{grid-template-columns:1fr}}
        .audit-card{text-align:center;padding:24px 16px;border-radius:14px;border:1px solid var(--border);background:var(--card)}
        .audit-card.passed{border-color:rgba(16,185,129,0.2);background:rgba(16,185,129,0.03)}
        .audit-icon{width:40px;height:40px;border-radius:50%;background:rgba(16,185,129,0.15);color:#10b981;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;margin:0 auto 12px}
        .audit-name{font-size:14px;font-weight:600;margin-bottom:4px}
        .audit-findings{font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:8px}
        .audit-status{font-size:12px;font-weight:600;color:#10b981}
        .audit-details{max-width:700px;margin:0 auto}
        .audit-details summary{cursor:pointer;padding:12px 16px;border-radius:10px;border:1px solid var(--border);background:var(--card);font-size:13px;font-weight:600;transition:all 0.2s}
        .audit-details summary:hover{border-color:rgba(41,141,255,0.2)}
        .audit-report{padding:20px 0;font-size:13px}
        .audit-report h4{font-size:15px;font-weight:600;margin:20px 0 12px}
        .audit-report h4:first-child{margin-top:0}
        .audit-report table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px}
        .audit-report td,.audit-report th{padding:8px 12px;text-align:left;border-bottom:1px solid var(--border)}
        .audit-report th{font-weight:600;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.05em}
        .audit-report .pass td{color:rgba(255,255,255,0.7)}
        .audit-report .pass td:first-child{font-weight:500}
        .audit-report .pass td:nth-child(2){color:#10b981;font-weight:700}
        .audit-report p{color:rgba(255,255,255,0.5);line-height:1.6}

        .ctr{max-width:600px;margin:0 auto;border-radius:16px;border:1px solid var(--border);overflow:hidden}
        .ctr-row{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);transition:background 0.2s}
        .ctr-row:last-child{border-bottom:none}
        .ctr-row:hover{background:rgba(255,255,255,0.02)}
        .ctr-info{display:flex;align-items:center;gap:12px}
        .ctr-icon{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:rgba(255,255,255,0.3)}
        .ctr-n{font-size:13px;font-weight:500}
        .ctr-a{font-size:11px;font-family:var(--mono);color:rgba(255,255,255,0.3)}
        .ctr-actions{display:flex;gap:4px}
        .ctr-btn{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;transition:all 0.2s}
        .ctr-btn:hover{background:rgba(255,255,255,0.06);color:#fff}

        footer{border-top:1px solid var(--border);padding:48px 24px 24px;z-index:1;position:relative}
        .footer-inner{max-width:900px;margin:0 auto}
        .footer-main{display:grid;grid-template-columns:1fr;gap:32px;margin-bottom:32px}
        @media(min-width:768px){.footer-main{grid-template-columns:2fr 1fr 1fr}}
        .footer-logo{display:flex;align-items:center;gap:10px;margin-bottom:12px}
        .footer-logo span{font-size:15px;font-weight:600}
        .footer-main>div:first-child p{font-size:13px;color:rgba(255,255,255,0.3);line-height:1.6;max-width:280px}
        .footer-social{display:flex;gap:8px;margin-top:16px}
        .social-btn{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);transition:all 0.3s}
        .social-btn:hover{background:rgba(41,141,255,0.1);border-color:rgba(41,141,255,0.2);color:#298dff}
        .footer-main h4{font-size:13px;font-weight:600;margin-bottom:12px}
        .footer-link,.footer-info span{display:block;font-size:12px;color:rgba(255,255,255,0.3);padding:4px 0;transition:color 0.2s}
        .footer-link:hover{color:#fff}
        .footer-info{display:flex;flex-direction:column;gap:2px}
        .footer-bot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding-top:20px;border-top:1px solid var(--border);font-size:11px;color:rgba(255,255,255,0.2)}
        .footer-links{display:flex;gap:16px}
        .footer-links a{transition:color 0.2s}
        .footer-links a:hover{color:rgba(255,255,255,0.5)}
      `}</style>

      <script dangerouslySetInnerHTML={{
        __html: `
        const c = document.getElementById('bg'), ctx = c.getContext('2d');
        let w, h, pts = [];
        function resize() { w = c.width = innerWidth; h = c.height = innerHeight; }
        resize(); addEventListener('resize', resize);
        for (let i = 0; i < 60; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2 });
        function anim() {
          ctx.clearRect(0, 0, w, h);
          for (const p of pts) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
            ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(41,141,255,0.12)'; ctx.fill();
          }
          for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
              const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy);
              if (d < 180) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = 'rgba(41,141,255,' + (0.03 * (1 - d / 180)) + ')'; ctx.stroke(); }
            }
          }
          requestAnimationFrame(anim);
        }
        anim();
        new TradingView.widget({
          container: 'tv-chart', symbol: 'BINANCE:BNBUSDT',
          interval: '60', theme: 'dark', style: '1',
          width: '100%', height: 400,
          hide_side_toolbar: false, allow_symbol_change: true,
          save_image: false, locale: 'tr',
          autosize: true,
        });
        `,
      }} />
      <script src="https://s3.tradingview.com/tv.js" />
    </div>
  );
}
