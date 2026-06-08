"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Wallet, 
  Share2, 
  RotateCcw, 
  Skull, 
  Coins, 
  Download, 
  ShieldAlert, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x67C7af658a90e2F06D8a9c7fbd2dc4B616CD4Ed0';

const CONTRACT_ABI = [
  "function mintBadge(uint256 degenScore, string classification, string uri, bytes signature) external payable returns (uint256)",
  "function mintPrice() external view returns (uint256)"
];

// Retro-gaming symmetric 8-bit blocky avatar generator
function GenerateMiniAvatar({ address }: { address: string }) {
  const cleanAddress = address.toLowerCase().replace('0x', '');
  const colors = [
    '#ffcc00', '#ff3377', '#00e5ff', '#8b5cf6', '#ffffff', 
    '#ff5500', '#00ff66', '#a78bfa'
  ];
  
  const c1 = colors[parseInt(cleanAddress[0] || '0', 16) % colors.length];
  const c2 = colors[parseInt(cleanAddress[4] || '1', 16) % colors.length];
  
  const grid = [];
  for (let i = 0; i < 25; i++) {
    const char = cleanAddress[i % cleanAddress.length] || '0';
    grid.push(parseInt(char, 16) % 2 === 0);
  }
  
  return (
    <svg width="72" height="72" viewBox="0 0 5 5" style={{ background: '#080312', border: '4px solid #fff' }}>
      {grid.map((active, index) => {
        if (!active) return null;
        const x = index % 5;
        const y = Math.floor(index / 5);
        const reflectX = x > 2 ? 4 - x : x;
        const color = (x + y) % 2 === 0 ? c1 : c2;
        return (
          <rect key={index} x={reflectX} y={y} width="1" height="1" fill={color} />
        );
      })}
    </svg>
  );
}

export default function Home() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ stats: any; roast: string } | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError("ERROR: WEB3 WALLET NOT DETECTED.");
      return;
    }
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setConnectedAddress(account);
      setAddress(account);
    } catch (err: any) {
      setError(err.message || "WALLET CONNECTION REJECTED.");
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      
      // Attempt to check if already connected
      ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
          if (!address) {
            setAddress(accounts[0]);
          }
        }
      });

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
          setAddress(accounts[0]);
        } else {
          setConnectedAddress(null);
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const loadingTexts = [
    "LOADING LEVEL 1: BLOCKCHAIN LANDFILL...",
    "SCANNING MULTI-CHAIN INVENTORY...",
    "COUNTING DEFEATED MEMECOINS...",
    "IDENTIFYING LIQUIDITY BOSS FIGHTS...",
    "WRITING SAVAGE AI SCOREBOARD...",
    "GENERATING HIGH SCORE PASS..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingTexts.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.startsWith('0x') || address.length < 40) {
      setError("ERROR: WALLET ADDRESS REQUIRED.");
      return;
    }

    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null);
    setPaymentDone(false);
    setTxHash(null);

    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "STAGE CLEAR FAILURE.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "HARDWARE CONFIG ERROR.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `degen-card-${address.substring(0, 6)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
    }
  };

  const shareOnX = () => {
    if (!result) return;
    const tweetText = `My wallet just got roasted by RoastMyWallet!\n\nScore: ${result.stats.degenScore}/100\nRank: ${result.stats.classification}\nShitcoins: ${result.stats.shitcoinsCount} | Rugs: ${result.stats.ruggedTokensCount}\n\nRoast yours: https://roastmywallet.lol`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, '_blank');
  };

  const triggerMint = async () => {
    if (!result) return;
    
    // Check if web3 provider is available
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError("ERROR: WEB3 WALLET (METAMASK/COINBASE) NOT DETECTED. PLEASE INSTALL AN EXTENSION.");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const ethereum = (window as any).ethereum;

      // 1. Request account connection
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const activeAccount = accounts[0];

      if (activeAccount.toLowerCase() !== address.toLowerCase()) {
        throw new Error(`PLEASE CONNECT THE AUDITED WALLET: ${address.substring(0, 6)}...`);
      }

      // 2. Switch network to Base Mainnet (0x2105 / 8453)
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base Mainnet',
              rpcUrls: ['https://mainnet.base.org'],
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://basescan.org']
            }]
          });
        } else {
          throw switchError;
        }
      }

      // 3. Fetch cryptographic signature from backend
      const res = await fetch('/api/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerAddress: address,
          degenScore: result.stats.degenScore,
          classification: result.stats.classification,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "MINT_SIGNATURE_FETCH_ERROR");
      }

      // 4. Setup ethers BrowserProvider and contract connection
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // 5. Submit payable transaction to smart contract (0.0003 ETH)
      const mintPriceWei = ethers.parseEther("0.0003");
      console.log("Submitting transaction to contract...");
      
      const tx = await contract.mintBadge(
        data.degenScore,
        data.classification,
        data.tokenURI,
        data.signature,
        { value: mintPriceWei }
      );

      console.log(`Transaction sent: ${tx.hash}`);

      // 6. Wait for 1 confirmation
      const receipt = await tx.wait(1);
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      setTxHash(tx.hash);
      setPaymentDone(true);

    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || "TRANSACTION REJECTED ON-CHAIN.");
    } finally {
      setPaying(false);
    }
  };

  const asciiLogo = `
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |R|o|a|s|t|M|y|W|a|l|l|e|t|   |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     [ PRESS START TO AUDIT ]
`;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div className="crt-overlay"></div>

      {/* Retro Arcade Top Info Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontFamily: 'var(--font-pixel)', 
        fontSize: '0.65rem', 
        color: 'var(--retro-yellow)', 
        marginBottom: '1.5rem',
        padding: '0.5rem 1rem',
        border: '4px solid var(--retro-white)',
        background: 'var(--bg-black)'
      }}>
        <span>HIGH SCORE: 99,999</span>
        {connectedAddress ? (
          <span onClick={connectWallet} style={{ cursor: 'pointer', color: 'var(--retro-cyan)' }}>
            [ P1: {connectedAddress.substring(0, 6)}...{connectedAddress.substring(connectedAddress.length - 4)} ]
          </span>
        ) : (
          <span onClick={connectWallet} className="blink" style={{ cursor: 'pointer', color: 'var(--retro-pink)', textDecoration: 'underline' }}>
            [ CONNECT WALLET ]
          </span>
        )}
        <span>CREDITS: 99</span>
      </div>

      {/* Responsive Retro Title banner */}
      <pre style={{ 
        color: 'var(--retro-cyan)', 
        fontSize: '0.75rem', 
        lineHeight: '1.3', 
        textAlign: 'center', 
        marginBottom: '2rem',
        overflowX: 'auto',
        fontFamily: 'var(--font-pixel)',
        background: 'var(--bg-black)',
        padding: '1rem',
        border: '4px solid var(--retro-pink)',
        boxShadow: '4px 4px 0px var(--bg-black)'
      }}>
        {asciiLogo}
      </pre>

      {/* Main Container */}
      {!result && !loading && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ borderBottom: '4px solid var(--retro-white)', paddingBottom: '1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>[ SELECT_PLAYER_WALLET ]</h2>
            <span className="coin-float" style={{ fontFamily: 'var(--font-pixel)', color: 'var(--retro-yellow)', fontSize: '0.8rem' }}>($)</span>
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontFamily: 'var(--font-terminal)' }}>
            PASTE YOUR PUBLIC EVM WALLET ADDRESS BELOW. THIS SYSTEM SCANS ETHEREUM, BASE, ARBITRUM, AND POLYGON NETWORKS TO GENERATE YOUR SHAME CARD AND EVALUATE YOUR OVERALL RATING.
          </p>

          <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="input-group">
              <span style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem', color: 'var(--retro-pink)', fontFamily: 'var(--font-pixel)', fontSize: '0.8rem' }}>&gt;</span>
              <input 
                type="text" 
                className="input-field" 
                placeholder="INPUT EVM ADDRESS (0x...)" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="off"
              />
            </div>

            {error && (
              <div style={{ color: 'var(--retro-pink)', fontSize: '1.1rem', fontFamily: 'var(--font-pixel)', letterSpacing: '-0.05em' }}>
                * ERROR: {error}
              </div>
            )}

            <button type="submit" className="btn">
              START GAME
            </button>
          </form>

          <div style={{ borderTop: '2px dashed var(--text-muted)', paddingTop: '1rem', fontSize: '1.1rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>STAGE 01: INITIATION</span>
            <span>NO WALLET CONNECT NEEDED</span>
          </div>
        </div>
      )}

      {/* Loading Terminal */}
      {loading && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '300px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="blink" style={{ color: 'var(--retro-yellow)', fontFamily: 'var(--font-pixel)', fontSize: '1.2rem' }}>&gt;&gt;&gt; STAGE LOADING</span>
            <span className="coin-float" style={{ fontFamily: 'var(--font-pixel)', color: 'var(--retro-cyan)' }}>($)</span>
          </div>
          
          <div style={{ border: '4px solid var(--bg-black)', padding: '1rem', background: '#000', fontFamily: 'monospace' }}>
            <p style={{ color: 'var(--text-muted)' }}>&gt; SCANNING WALLET: {address.substring(0, 12)}...</p>
            <div style={{ margin: '1rem 0' }}>
              <div className="progress-bar-container">
                <div className="progress-bar-fill"></div>
              </div>
            </div>
            <p style={{ color: '#fff', fontSize: '1.2rem', fontFamily: 'var(--font-terminal)' }}>
              {loadingTexts[loadingStep]}
            </p>
          </div>
        </div>
      )}

      {/* Results Terminal */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Roast Display Card */}
          <div className="card" style={{ borderColor: 'var(--retro-pink)', boxShadow: '8px 8px 0px var(--bg-black)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid var(--retro-pink)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
              <h2>[ ROAST_DIALOGUE.TXT ]</h2>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                PLAYER: {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </span>
            </div>
            
            <div style={{ color: '#fff', fontSize: '1.35rem', lineHeight: '1.6', fontFamily: 'var(--font-terminal)', whiteSpace: 'pre-line' }}>
              {result.roast}
              <span className="blink" style={{ display: 'inline-block', width: '12px', height: '20px', background: 'var(--retro-pink)', marginLeft: '5px' }}></span>
            </div>
          </div>

          {/* Tokens Inspected Table */}
          {result.stats.tokens && result.stats.tokens.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--retro-cyan)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid var(--retro-cyan)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
                <h2>[ WALLET_INVENTORY.DAT ]</h2>
                <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-pixel)', color: 'var(--retro-cyan)' }}>ITEMS: {result.stats.tokens.length}</span>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '1.2rem', color: '#fff' }}>
                  <thead>
                    <tr style={{ borderBottom: '3px solid var(--retro-cyan)', color: 'var(--retro-cyan)' }}>
                      <th style={{ padding: '0.5rem', fontFamily: 'var(--font-pixel)', fontSize: '0.6rem' }}>TOKEN</th>
                      <th style={{ padding: '0.5rem', fontFamily: 'var(--font-pixel)', fontSize: '0.6rem' }}>BALANCE</th>
                      <th style={{ padding: '0.5rem', fontFamily: 'var(--font-pixel)', fontSize: '0.6rem' }}>VALUE (USD)</th>
                      <th style={{ padding: '0.5rem', fontFamily: 'var(--font-pixel)', fontSize: '0.6rem' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.stats.tokens.map((token: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '2px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>${token.symbol}</td>
                        <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace' }}>
                          {Number(token.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace', color: token.usdValue > 1 ? 'var(--retro-yellow)' : 'var(--text-muted)' }}>
                          ${Number(token.usdValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem' }}>
                          {token.isRugged ? (
                            <span style={{ color: '#fff', background: 'var(--retro-pink)', padding: '2px 6px', fontFamily: 'var(--font-pixel)', fontSize: '0.5rem' }}>RUGGED</span>
                          ) : token.isShitcoin ? (
                            <span style={{ color: 'var(--bg-black)', background: 'var(--retro-yellow)', padding: '2px 6px', fontFamily: 'var(--font-pixel)', fontSize: '0.5rem' }}>SHITCOIN</span>
                          ) : (
                            <span style={{ color: 'var(--bg-black)', background: 'var(--retro-cyan)', padding: '2px 6px', fontFamily: 'var(--font-pixel)', fontSize: '0.5rem' }}>BLUECHIP</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Degen Pass / Card */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            
            <div 
              ref={cardRef}
              style={{
                width: '100%',
                maxWidth: '460px',
                background: 'var(--bg-card)',
                border: '6px solid var(--retro-white)',
                padding: '1.5rem',
                boxShadow: '10px 10px 0px var(--bg-black)',
                position: 'relative',
                fontFamily: 'var(--font-terminal)',
                color: 'var(--text-primary)',
                imageRendering: 'pixelated'
              }}
            >
              {/* Retro scanline overlay inside card */}
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 50%)', 
                backgroundSize: '100% 8px',
                pointerEvents: 'none' 
              }}></div>

              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid var(--retro-white)', paddingBottom: '0.6rem', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'var(--font-pixel)', color: 'var(--retro-yellow)' }}>DEGEN PASS</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-pixel)' }}>LEVEL CHECK</span>
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-pixel)', fontSize: '0.65rem' }}>
                  <span>STATE:</span>
                  <span style={{ color: 'var(--retro-pink)', display: 'block', fontSize: '0.85rem', marginTop: '2px' }}>REKT</span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <GenerateMiniAvatar address={address} />
                  <span style={{ 
                    fontFamily: 'var(--font-pixel)', 
                    fontSize: '0.55rem', 
                    color: '#fff', 
                    background: 'var(--retro-pink)',
                    padding: '3px 6px', 
                    marginTop: '0.5rem',
                    textAlign: 'center',
                    border: '2px solid #000'
                  }}>
                    FAIL
                  </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>PLAYER ADDRESS:</span>
                    <span style={{ fontSize: '1.2rem', color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {address.substring(0, 8)}...{address.substring(address.length - 6)}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>CLASS:</span>
                      <span style={{ fontSize: '1.15rem', color: 'var(--retro-cyan)', fontWeight: 'bold' }}>
                        {result.stats.classification.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>DEGEN RATIO:</span>
                      <span style={{ fontSize: '1.15rem', color: 'var(--retro-yellow)', fontWeight: 'bold' }}>
                        {result.stats.degenScore}/100
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>RUGGED:</span>
                      <span style={{ fontSize: '1.15rem', color: 'var(--retro-pink)', fontWeight: 'bold' }}>
                        {result.stats.ruggedTokensCount}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>SHITCOINS:</span>
                      <span style={{ fontSize: '1.15rem', color: 'var(--retro-cyan)', fontWeight: 'bold' }}>
                        {result.stats.shitcoinsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retro arcade watermark stamp */}
              <div style={{
                position: 'absolute',
                bottom: '0.4rem',
                right: '0.4rem',
                border: '4px double var(--retro-pink)',
                color: 'var(--retro-pink)',
                fontFamily: 'var(--font-pixel)',
                fontSize: '0.6rem',
                padding: '4px 8px',
                transform: 'rotate(-12deg)',
                background: 'rgba(255,51,119,0.1)'
              }}>
                GAME OVER
              </div>
            </div>

            {/* Arcade Buttons row */}
            <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '460px' }}>
              <button onClick={shareOnX} className="btn" style={{ flex: 1 }}>
                <Share2 size={12} style={{ marginRight: '5px' }} /> TWEET_SCORE
              </button>
              <button onClick={downloadCard} className="btn btn-secondary" style={{ flex: 1 }}>
                <Download size={12} style={{ marginRight: '5px' }} /> SAVE_SCREEN
              </button>
            </div>

            <button 
              onClick={() => {
                setResult(null);
                setAddress('');
              }}
              className="btn btn-secondary" 
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', marginTop: '1.2rem' }}
            >
              [ &lt; RESET STAGE &gt; ]
            </button>
          </div>

          {/* Paywall Box */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderStyle: 'dashed', borderColor: 'var(--retro-yellow)' }}>
            <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.8rem', color: 'var(--retro-yellow)', marginBottom: '0.8rem' }}>
              {paymentDone ? "SBT MINT COMPLETE" : "MINT SCORE ON-CHAIN (BASE L2)"}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '500px', marginBottom: '1.5rem' }}>
              {paymentDone 
                ? "YOUR RATING RECORD HAS BEEN PERMANENTLY RECORDED ON BASE NETWORK BLOCKCHAIN LEDGER."
                : "MINT THIS SHAME CARD AS A NON-TRANSFERABLE SOULBOUND NFT ON BASE L2 FOR 0.0003 ETH (~$1). RECORD YOUR DEGEN HIGH SCORE PERMANENTLY."
              }
            </p>

            {error && (
              <div style={{ color: 'var(--retro-pink)', fontSize: '1.1rem', fontFamily: 'var(--font-pixel)', marginBottom: '1rem', letterSpacing: '-0.05em' }}>
                * ERROR: {error}
              </div>
            )}

            {!paymentDone ? (
              <button 
                onClick={triggerMint}
                disabled={paying}
                className="btn"
                style={{ width: '100%', maxWidth: '300px' }}
              >
                {paying ? "TRANSACTING..." : "MINT_NFT_NOW ($1)"}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ color: 'var(--retro-cyan)', fontFamily: 'var(--font-pixel)', fontSize: '0.7rem' }}>
                  +++ STAGE CLEARED: TRANSACTION RECORDED +++
                </div>
                {txHash && (
                  <a 
                    href={`https://basescan.org/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'var(--retro-yellow)', textDecoration: 'underline', fontSize: '1.2rem', marginTop: '0.5rem', fontFamily: 'monospace' }}
                  >
                    VIEW ON BASESCAN: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                  </a>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop: '5rem', color: 'var(--text-muted)', fontSize: '1.1rem', textAlign: 'center', borderTop: '4px solid var(--retro-white)', paddingTop: '1.5rem' }}>
        <span>ROASTMYWALLET ARCADE CORP • EST. 2026 • INSERT COIN TO PLAY</span>
      </footer>
    </div>
  );
}
