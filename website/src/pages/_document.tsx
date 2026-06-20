import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta property="og:title" content="Nexus AI ($NXI) — Community Token Ecosystem" />
        <meta property="og:description" content="BEP-20 token with 50% APY staking, PancakeSwap liquidity, and Telegram game system." />
        <meta property="og:image" content="/logo.svg" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
