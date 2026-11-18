# Velvet Tables 2D

A multiplayer social casino arcade with a WASD walkable 2D lobby and **working multiplayer blackjack** for 2–6 people per table (also supports solo). Virtual chips only; no real money or prizes.

## Run locally

Install Node.js 18+, then:

```
npm install
npm start
```

Open http://localhost:3000 . Open multiple browser tabs to test multiplayer.

## Render deployment

1. Create a new GitHub repository.
2. Upload `server.js`, `package.json`, `README.md`, and the `public` folder to the **repository root** (not nested inside another folder).
3. Render Dashboard → New → Web Service → connect the GitHub repository.
4. Runtime: Node. Root directory: blank. Build command: `npm install`. Start command: `npm start`.
5. Deploy, then share the generated `https://...onrender.com` URL. Render serves the site and WebSocket multiplayer together; GitHub Pages is not needed.

## Current features and limitations

- WASD/arrow-key lobby movement; click a table or press E near it.
- Three independent blackjack tables, each up to six players; dealer rules, hit/stand, betting and payouts are enforced by server.
- Shared global chat, live players, visible hands, turns, dealer, bets, and virtual chip balances.
- Poker, roulette, and dice rooms are **social placeholders**, not implemented games.
- Nicknames and balances are **session-only**; reconnecting resets to 1,000 chips. No account persistence or password login.
- The server is designed for one Render instance, without cross-instance synchronization.
- No actual monetary gambling, cash-out, purchases, or prizes.
