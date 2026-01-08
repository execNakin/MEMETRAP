
import React from 'react';

export const INITIAL_BALANCE = 100.00;
export const UPDATE_INTERVAL = 3000; // ms

export const INITIAL_COINS = [
  {
    id: 'pepe-gold',
    symbol: 'PEPEG',
    name: 'Pepe Gold 2.0',
    price: 0.0042,
    change24h: 12.5,
    volume24h: 1250000,
    scamLikelihood: 0.85,
    isRugged: false,
    history: [],
    creatorWallet: '0xScam...6969',
    description: 'The real successor to the green frog. 100x or nothing!',
    tax: 0,
    marketCap: 420000
  },
  {
    id: 'doge-mars',
    symbol: 'MARSDOGE',
    name: 'Mars Doge Protocol',
    price: 0.125,
    change24h: -2.4,
    volume24h: 5600000,
    scamLikelihood: 0.3,
    isRugged: false,
    history: [],
    creatorWallet: '0xElon...420',
    description: 'A serious attempt at inter-planetary meme currency.',
    tax: 5,
    marketCap: 15000000
  }
];

export const NEWS_TEMPLATES = {
  HYPE: [
    "[SYMBOL] is the next 1000x gem! Don't miss out.",
    "Major influencer just mentioned [SYMBOL] on X.",
    "Whale wallet 0x[RAND] bought [AMOUNT] USD of [SYMBOL]!",
    "Breaking: [SYMBOL] to be listed on major CEX soon?"
  ],
  WARNING: [
    "Unusual contract activity detected in [SYMBOL].",
    "Dev wallet for [SYMBOL] just moved a massive amount of tokens.",
    "Liquidity for [SYMBOL] seems dangerously low.",
    "Multiple reports of 'Honeypot' behavior in [SYMBOL] Telegram."
  ],
  MARKET: [
    "Overall meme market is looking [MOOD] today.",
    "Bitcoin is steady, degens are flocking to [SYMBOL].",
    "New wave of investors entering [SYMBOL] ecosystem."
  ],
  RUG: [
    "REKT! [SYMBOL] dev just drained the pool.",
    "Total collapse: [SYMBOL] value dropped 99.99%.",
    "Stay away! [SYMBOL] project is confirmed RUG."
  ]
};

export const RUG_PULL_LESSONS = [
  "The 'Locked Liquidity' was a lie. The developer used a hidden function in the smart contract to drain the pool. Always verify the contract on-chain.",
  "You chased a 400% green candle. This is the 'FOMO Trap'. Scammers pump the price themselves to attract 'exit liquidity' (you).",
  "The developer held 80% of the supply across 10 different wallets. When you bought in, they dumped everything at once. Check holder distribution next time.",
  "This was a 'Honeypot'. The code allowed you to buy, but blocked the 'Sell' function for everyone except the creator. Check if others are successfully selling.",
  "The project had 100k 'followers' on Twitter, but all were bots. Hype is easy to fake; look for genuine community engagement and GitHub activity."
];

export const NEWS_SOURCES = [
  "MoonShill Times",
  "DEX Alerts",
  "RugWatch",
  "WhaleTracker",
  "DegenPulse"
];
