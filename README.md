# Royal Velvet 3D Multiplayer Casino Arcade

All games use virtual chips only. No real-money betting, cash-out, or prizes.

## Render deployment (single-service recommended)
1. Unzip this folder and upload **package.json, server.js, and public/** into the ROOT of a new GitHub repository. Do not upload only the public folder.
2. At render.com choose **New > Web Service**, connect GitHub, select the repository.
3. Runtime: **Node**. Build command: `npm install`. Start command: `npm start`. Root directory: leave blank.
4. Deploy. Your URL will resemble `https://royal-velvet-xxxx.onrender.com`. Open that URL directly to play; it hosts both the game and WebSocket multiplayer.
5. **Account persistence**: Without a persistent disk, Render may lose account data when redeploying/restarting. If your Render plan supports disks, add a disk mounted at `/var/data` and add environment variable `DATA_DIR=/var/data`, then redeploy. Free services may not support persistent disks. For reliable persistence on free hosting, integrate a managed database before relying on accounts.
6. On free Render services, sleeping/wake-up delays may cause initial connection delays.

## Optional GitHub Pages frontend
Upload contents of `public/` to a separate GitHub Pages repository, enable Pages on main/root. Visit the Pages URL with `?server=https://YOUR-RENDER-SERVICE.onrender.com` once. The browser saves the server URL locally. The Render service must still be running.

## Features
- 3D walkable luxury floor, low-poly performance-conscious geometry, mobile directional buttons
- WebSocket synced players, chat, accounts with scrypt password hashes, server-side balances
- Seven solo quick games: slots, roulette, simplified blackjack, dice, coin, high card, wheel
- Five multiplayer challenge categories: dice, coin, reaction, racing, poker. **All five currently use randomized server-side outcomes rather than full interactive minigames.**
- `daddykaden` code awards 100,000 virtual chips once per account
- Accounts persist in accounts.json only when filesystem is persistent

## Notes
This is an arcade prototype, not a photorealistic AAA casino. Multiplayer challenges are server-resolved rather than full interactive poker or racing. No payments or real-money wagering. CDN internet access required for Three.js. Render WebSockets work on Web Services.
