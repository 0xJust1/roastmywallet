import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Helper for deterministic mock data based on address hash
function getDeterministicMockData(address: string) {
  const randomSeed = Math.floor(Math.random() * 100);
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash) + randomSeed;

  const shitcoinPool = [
    { symbol: 'PEPE', name: 'Pepe' },
    { symbol: 'WIF', name: 'Dogwifhat' },
    { symbol: 'MOG', name: 'Mog Coin' },
    { symbol: 'DEGEN', name: 'Degen' },
    { symbol: 'BRETT', name: 'Brett' },
    { symbol: 'TOSHI', name: 'Toshi' },
    { symbol: 'ROOST', name: 'Roost' },
    { symbol: 'KEYCAT', name: 'Keyboard Cat' },
    { symbol: 'BODEN', name: 'Jeo Boden' },
    { symbol: 'TREMP', name: 'Doland Tremp' }
  ];

  const rugPool = [
    { symbol: 'PEPE2', name: 'Pepe 2.0' },
    { symbol: 'SAFEMOON', name: 'SafeMoon' },
    { symbol: 'LUNA', name: 'Terra Classic' },
    { symbol: 'FTT', name: 'FTX Token' },
    { symbol: 'PUMPCOIN', name: 'Pump Coin' },
    { symbol: 'RUGME', name: 'Rug Me Daddy' },
    { symbol: 'SCAM', name: 'Totally Not A Scam' }
  ];

  const classifications = [
    'Hopium Addict',
    'Professional Exit Liquidity',
    'Rug Collector',
    'FOMO Master',
    'Micro-cap Gambler',
    'Paper-Handed Deplorable'
  ];

  const shitcoinsCount = (absHash % 15) + 5; // 5 to 19
  const ruggedTokensCount = (absHash % 8) + 3; // 3 to 10
  const degenScore = (absHash % 31) + 68; // 68 to 98
  const classification = classifications[absHash % classifications.length];
  
  const mostHeldIndex = absHash % shitcoinPool.length;
  const mostHeld = shitcoinPool[mostHeldIndex];
  const mostHeldValue = (absHash % 1400) + 60; // $60 to $1459
  const totalValue = mostHeldValue + (absHash % 6000) + 120; // $180 to $7579
  const mostHeldPercent = Math.round((mostHeldValue / totalValue) * 100);

  const paperHandsCount = (absHash % 4) + 1;

  return {
    isMock: true,
    shitcoinsCount,
    ruggedTokensCount,
    degenScore,
    classification,
    mostHeldShitcoin: mostHeld.symbol,
    mostHeldValueUSD: mostHeldValue,
    mostHeldPercent,
    totalValueUSD: Math.round(totalValue),
    paperHandsCount,
    tokens: [
      { symbol: 'ETH', balance: '1.24', usdValue: 4340, isShitcoin: false },
      { symbol: mostHeld.symbol, balance: '45000000', usdValue: mostHeldValue, isShitcoin: true },
      ...rugPool.slice(0, 3).map((r, i) => ({ symbol: r.symbol, balance: '500000000', usdValue: 0.01, isShitcoin: true, isRugged: true }))
    ]
  };
}

export async function POST(req: Request) {
  try {
    const { address } = await req.json();

    if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Invalid EVM address. Must start with 0x.' },
        { status: 400 }
      );
    }

    let stats;

    const hasMoralisKey = !!process.env.MORALIS_API_KEY;

    if (hasMoralisKey) {
      // 1. Fetch from Moralis on multiple chains in parallel
      try {
        const chains = ['base', 'eth', 'arbitrum', 'polygon'];
        
        const fetchChainTokens = async (chain: string) => {
          try {
            const response = await fetch(
              `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?chain=${chain}`,
              {
                headers: {
                  'accept': 'application/json',
                  'X-API-Key': process.env.MORALIS_API_KEY || '',
                },
                signal: AbortSignal.timeout(5000) // Timeout after 5s
              }
            );
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data.result) ? data.result : (data || []);
          } catch (e) {
            console.error(`Failed to fetch Moralis tokens for chain ${chain}:`, e);
            return [];
          }
        };

        const allChainsResults = await Promise.all(chains.map(fetchChainTokens));
        
        // Merge tokens across chains
        const mergedTokensMap = new Map<string, any>();
        
        for (const chainResult of allChainsResults) {
          for (const token of chainResult) {
            const addressKey = (token.token_address || '').toLowerCase();
            const symbol = (token.symbol || '').toUpperCase();
            const usdValue = Number(token.usd_value) || 0;
            
            if (mergedTokensMap.has(addressKey)) {
              const existing = mergedTokensMap.get(addressKey);
              existing.usd_value = (Number(existing.usd_value) || 0) + usdValue;
            } else {
              mergedTokensMap.set(addressKey, { ...token });
            }
          }
        }

        const tokens = Array.from(mergedTokensMap.values());

        if (tokens.length === 0) {
          throw new Error('No tokens returned from Moralis API');
        }

        let totalValueUSD = 0;
        let shitcoinsCount = 0;
        let ruggedTokensCount = 0;
        let mostHeldShitcoin = 'None';
        let mostHeldValueUSD = 0;
        const processedTokens: any[] = [];

        const bluechips = ['ETH', 'WETH', 'WBTC', 'USDC', 'USDT', 'DAI'];

        for (const token of tokens) {
          const symbol = (token.symbol || '').toUpperCase();
          const usdValue = Number(token.usd_value) || 0;
          totalValueUSD += usdValue;

          const isBluechip = bluechips.includes(symbol);
          const isShitcoin = !isBluechip && symbol !== '';

          // A rugged token has balance but its value is under $0.50 (or Moralis flags it as possible spam)
          const isRugged = isShitcoin && (usdValue < 0.50 || token.possible_spam === true);

          if (isShitcoin) {
            shitcoinsCount++;
            if (isRugged) {
              ruggedTokensCount++;
            }

            if (usdValue > mostHeldValueUSD) {
              mostHeldValueUSD = usdValue;
              mostHeldShitcoin = symbol;
            }
          }

          processedTokens.push({
            symbol,
            name: token.name || symbol,
            balance: token.balance_formatted || (Number(token.balance) / Math.pow(10, token.decimals || 18)).toString(),
            usdValue,
            isShitcoin,
            isRugged,
          });
        }

        if (mostHeldShitcoin === 'None' && processedTokens.length > 0) {
          const firstShitcoin = processedTokens.find(t => t.isShitcoin);
          if (firstShitcoin) {
            mostHeldShitcoin = firstShitcoin.symbol;
          }
        }

        // Calculate a mockable degen score
        let degenScore = 50;
        if (shitcoinsCount > 0) degenScore += Math.min(shitcoinsCount * 3, 25);
        if (ruggedTokensCount > 0) degenScore += Math.min(ruggedTokensCount * 5, 20);
        if (totalValueUSD > 10000) degenScore = Math.max(degenScore - 10, 50); // whales are slightly less degen
        degenScore = Math.min(Math.max(degenScore, 60), 99); // clamp between 60 and 99

        let classification = 'Standard Trader';
        if (degenScore > 90) classification = 'Professional Exit Liquidity';
        else if (degenScore > 80) classification = 'Hopium Addict';
        else if (degenScore > 70) classification = 'Rug Collector';
        else classification = 'Micro-cap Gambler';

        const mostHeldPercent = totalValueUSD > 0 ? Math.round((mostHeldValueUSD / totalValueUSD) * 100) : 0;

        stats = {
          isMock: false,
          shitcoinsCount,
          ruggedTokensCount,
          degenScore,
          classification,
          mostHeldShitcoin,
          mostHeldValueUSD: Math.round(mostHeldValueUSD),
          mostHeldPercent,
          totalValueUSD: Math.round(totalValueUSD),
          paperHandsCount: Math.round((degenScore % 3) + 1),
          tokens: processedTokens.slice(0, 15)
        };
      } catch (err) {
        console.error('Real fetch failed, falling back to mock:', err);
        stats = getDeterministicMockData(address);
      }
    } else {
      // Fallback to deterministic mock data
      stats = getDeterministicMockData(address);
    }

    // 2. Generate Roast with Groq
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        stats,
        roast: "API Key for Groq is missing. But let's assume your wallet is a complete disaster. You buy high, you sell low, and your portfolio looks like a cemetery of rugged memecoins. Go get a real job."
      });
    }

    const systemPrompt = `You are a savage, cynical, and hilarious Web3 degen auditor.
You write brutal, stand-up comedy style reviews (roasts) of crypto portfolios based on their on-chain statistics.
CRITICAL RULES:
1. NEVER use any emojis under any circumstances.
2. Be extremely direct, sarcastic, and funny. Mock their shitcoins, their rugged tokens, and their degen rating.
3. Sound like a real raw human on Reddit (r/cryptocurrency) or X (Twitter).
4. Do NOT use bullet points or lists. Write exactly 2 or 3 short, punchy paragraphs.
5. Do NOT introduce yourself or write conversational filler like "Here is your roast:". Go straight to the roast.`;

    const userPrompt = `Roast this EVM wallet address: ${address}
Stats:
- Total Shitcoins Held: ${stats.shitcoinsCount}
- Rugged/Dead Tokens: ${stats.ruggedTokensCount}
- Most Held Asset: ${stats.mostHeldShitcoin} (representing ${stats.mostHeldPercent}% of portfolio)
- Total Estimated Wallet Value: $${stats.totalValueUSD} USD
- Degen Score: ${stats.degenScore}/100
- Degen Classification: ${stats.classification}
- Paper Hands Incidents (sold early before pump): ${stats.paperHandsCount}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.85,
      max_tokens: 400
    });

    const roastText = completion.choices[0]?.message?.content || 'Your wallet is too depressing even for me to roast.';

    return NextResponse.json({
      stats,
      roast: roastText.trim()
    });

  } catch (error: any) {
    console.error('Error in api/roast:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
