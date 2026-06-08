import { NextResponse } from 'next/server';

// Helper for deterministic stats (matches api/roast fallback)
function getDeterministicStats(address: string) {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);

  const classifications = [
    'Hopium Addict',
    'Professional Exit Liquidity',
    'Rug Collector',
    'FOMO Master',
    'Micro-cap Gambler',
    'Paper-Handed Deplorable'
  ];

  const shitcoinsCount = (absHash % 15) + 5;
  const ruggedTokensCount = (absHash % 8) + 3;
  const degenScore = (absHash % 31) + 68;
  const classification = classifications[absHash % classifications.length];

  return {
    shitcoinsCount,
    ruggedTokensCount,
    degenScore,
    classification,
  };
}

// Generate the retro card as a raw SVG string
function generateSvgCard(address: string, stats: any) {
  const shortAddress = `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  
  // Deterministic colors for mini pixel avatar inside SVG
  const cleanAddress = address.toLowerCase().replace('0x', '');
  const colors = ['#ffcc00', '#ff3377', '#00e5ff', '#8b5cf6', '#ffffff', '#ff5500', '#00ff66', '#a78bfa'];
  const c1 = colors[parseInt(cleanAddress[0] || '0', 16) % colors.length];
  const c2 = colors[parseInt(cleanAddress[4] || '1', 16) % colors.length];
  
  // 5x5 grid avatar blocks
  let avatarRects = '';
  for (let i = 0; i < 25; i++) {
    const char = cleanAddress[i % cleanAddress.length] || '0';
    const active = parseInt(char, 16) % 2 === 0;
    if (active) {
      const x = i % 5;
      const y = Math.floor(i / 5);
      const reflectX = x > 2 ? 4 - x : x;
      const color = (x + y) % 2 === 0 ? c1 : c2;
      avatarRects += `<rect x="${30 + reflectX * 12}" y="${100 + y * 12}" width="12" height="12" fill="${color}" />`;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="460" height="280" viewBox="0 0 460 280">
      <style>
        .pixel-text { font-family: 'Courier New', monospace; font-weight: bold; }
        .label { fill: #a78bfa; font-size: 10px; }
        .val { fill: #ffffff; font-size: 14px; }
        .title { fill: #ffcc00; font-size: 20px; }
        .accent { fill: #00e5ff; }
        .danger { fill: #ff3377; }
      </style>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#120924"/>
      
      <!-- Scanlines -->
      <path d="M0,4 L460,4 M0,12 L460,12 M0,20 L460,20 M0,28 L460,28 M0,36 L460,36 M0,44 L460,44 M0,52 L460,52 M0,60 L460,60 M0,68 L460,68 M0,76 L460,76 M0,84 L460,84 M0,92 L460,92 M0,100 L460,100 M0,108 L460,108 M0,116 L460,116 M0,124 L460,124 M0,132 L460,132 M0,140 L460,140 M0,148 L460,148 M0,156 L460,156 M0,164 L460,164 M0,172 L460,172 M0,180 L460,180 M0,188 L460,188 M0,196 L460,196 M0,204 L460,204 M0,212 L460,212 M0,220 L460,220 M0,228 L460,228 M0,236 L460,236 M0,244 L460,244 M0,252 L460,252 M0,260 L460,260 M0,268 L460,268 M0,276 L460,276" stroke="#080312" stroke-width="2" opacity="0.3"/>
      
      <!-- Outer Border -->
      <rect x="8" y="8" width="444" height="264" fill="none" stroke="#ffffff" stroke-width="4"/>
      
      <!-- Header Divider -->
      <line x1="8" y1="65" x2="452" y2="65" stroke="#ffffff" stroke-width="4"/>
      
      <!-- Header -->
      <text x="25" y="42" class="pixel-text title">DEGEN PASS</text>
      <text x="25" y="55" class="pixel-text label" style="font-size: 8px;">LEVEL CHECK</text>
      
      <text x="380" y="32" class="pixel-text label" style="font-size: 8px;">STATE:</text>
      <text x="380" y="52" class="pixel-text danger" style="font-size: 16px; font-weight: 900;">REKT</text>

      <!-- Avatar Background Box -->
      <rect x="24" y="94" width="72" height="72" fill="#080312" stroke="#ffffff" stroke-width="3" />
      
      <!-- Render dynamic avatar -->
      ${avatarRects}
      
      <!-- Avatar FAIL stamp -->
      <rect x="30" y="174" width="60" height="15" fill="#ff3377" stroke="#000000" stroke-width="2"/>
      <text x="60" y="185" fill="#ffffff" font-size="8" text-anchor="middle" class="pixel-text">FAIL</text>

      <!-- Stats labels and values -->
      <text x="120" y="105" class="pixel-text label">PLAYER ADDRESS:</text>
      <text x="120" y="122" class="pixel-text val" style="font-size: 15px;">${shortAddress}</text>

      <text x="120" y="155" class="pixel-text label">CLASS:</text>
      <text x="120" y="172" class="pixel-text val accent" style="font-size: 13px;">${stats.classification.toUpperCase()}</text>

      <text x="320" y="155" class="pixel-text label">DEGEN RATIO:</text>
      <text x="320" y="172" class="pixel-text val" style="fill: #ffcc00;">${stats.degenScore}/100</text>

      <text x="120" y="210" class="pixel-text label">RUGGED TOKENS:</text>
      <text x="120" y="227" class="pixel-text danger val">${stats.ruggedTokensCount}</text>

      <text x="260" y="210" class="pixel-text label">SHITCOINS HELD:</text>
      <text x="260" y="227" class="pixel-text val accent">${stats.shitcoinsCount}</text>

      <!-- Stamp -->
      <rect x="330" y="215" width="90" height="24" fill="none" stroke="#ff3377" stroke-width="3" transform="rotate(-10, 375, 227)"/>
      <text x="375" y="231" fill="#ff3377" font-size="9" text-anchor="middle" class="pixel-text" transform="rotate(-10, 375, 227)">GAME OVER</text>
    </svg>
  `;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const address = (await params).address;

    if (!address || !address.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // Retrieve stats (deterministic fallback as database)
    const stats = getDeterministicStats(address);
    
    // Generate the SVG representation
    const svgString = generateSvgCard(address, stats);
    
    // Convert SVG to base64 Data URI
    const svgBase64 = Buffer.from(svgString).toString('base64');
    const imageDataUri = `data:image/svg+xml;base64,${svgBase64}`;

    // Return OpenSea standard metadata JSON
    return NextResponse.json({
      name: `Degen Pass #${address.substring(2, 8).toUpperCase()}`,
      description: `Official Degen License for ${address}. Generated by RoastMyWallet.`,
      image: imageDataUri,
      attributes: [
        {
          trait_type: "Degen Score",
          value: stats.degenScore
        },
        {
          trait_type: "Classification",
          value: stats.classification
        },
        {
          trait_type: "Rugged Tokens",
          value: stats.ruggedTokensCount
        },
        {
          trait_type: "Shitcoins",
          value: stats.shitcoinsCount
        }
      ]
    });

  } catch (error: any) {
    console.error('Error generating metadata:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
