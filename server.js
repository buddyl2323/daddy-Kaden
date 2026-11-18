
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000;
const players=new Map(), rooms=new Map();
const games=['blackjack','poker','roulette','dice'];
for(const game of games)for(let i=1;i<=3;i++)rooms.set(game+'-'+i,{id:game+'-'+i,game,seats:[],phase:'waiting',dealer:[],hands:{},turn:0,round:0,log:'Waiting for players',timer:null});
const deck=()=>{const a=[];for(const s of ['♠','♥','♦','♣'])for(const r of ['A','2','3','4','5','6','7','8','9','10','J','Q','K'])a.push({r,s});return a.sort(()=>Math.random()-.5)};
function draw(r){if(!r.deck?.length)r.deck=deck();return r.deck.pop()}
function value(h){let v=0,aces=0;for(const c of h){if(c.r==='A'){v+=11;aces++}else v+=['J','Q','K'].includes(c.r)?10:+c.r}while(v>21&&aces){v-=10;aces--}return v}
function send(p,obj){if(p&&p.ws.readyState===1)p.ws.send(JSON.stringify(obj))}
function broadcast(r){for(const id of r.seats){const p=players.get(id);if(!p)continue;send(p,{type:'room',room:publicRoom(r,p.id),chips:p.chips})}}
function publicRoom(r,id){return {id:r.id,game:r.game,phase:r.phase,turn:r.seats[r.turn]||null,round:r.round,log:r.log,seats:r.seats.map((pid,i)=>{const p=players.get(pid),h=r.hands[pid];return {id:pid,name:p?.name||'Guest',seat:i,chips:p?.chips||0,bet:h?.bet||0,cards:h?.cards||[],status:h?.status||'waiting',score:h?value(h.cards):0}}),dealer:r.phase==='playing'?[r.dealer[0],{r:'?',s:'?'}]:r.dealer,dealerScore:r.phase==='playing'?null:value(r.dealer)}}
function endRound(r){r.phase='results';while(value(r.dealer)<17)r.dealer.push(draw(r));const dv=value(r.dealer);for(const id of r.seats){const h=r.hands[id],p=players.get(id);if(!h||!p)continue;const v=value(h.cards),natural=h.cards.length===2&&v===21;let payout=0;if(v<=21&&(dv>21||v>dv))payout=natural?Math.floor(h.bet*2.5):h.bet*2;else if(v===dv&&v<=21)payout=h.bet;p.chips+=payout;h.status=payout>h.bet?'win':payout===h.bet?'push':'lose';}r.log='Dealer '+dv+' · Round finished. Place your next bet.';broadcast(r)}
function nextTurn(r){while(r.turn<r.seats.length){const h=r.hands[r.seats[r.turn]];if(h&&h.status==='playing')break;r.turn++}if(r.turn>=r.seats.length)endRound(r);else{r.log=players.get(r.seats[r.turn])?.name+"'s turn";broadcast(r)}}
function start(r){if(r.phase==='playing')return;const active=r.seats.filter(id=>r.hands[id]?.bet>0);if(!active.length)return;r.phase='playing';r.round++;r.deck=deck();r.dealer=[draw(r),draw(r)];for(const id of r.seats){const h=r.hands[id];if(h?.bet){h.cards=[draw(r),draw(r)];h.status=value(h.cards)===21?'blackjack':'playing'}else if(h)h.status='spectating'}r.turn=0;nextTurn(r)}
function leave(p){if(!p.room)return;const r=rooms.get(p.room);if(!r)return;if(r.hands[p.id]?.bet&&r.phase==='betting')p.chips+=r.hands[p.id].bet;r.seats=r.seats.filter(id=>id!==p.id);delete r.hands[p.id];p.room=null;if(!r.seats.length){r.phase='waiting';r.hands={};r.dealer=[];r.log='Waiting for players'}else if(r.phase==='playing'){r.turn=0;nextTurn(r)}broadcast(r)}
function join(p,id){const r=rooms.get(id);if(!r)return send(p,{type:'error',message:'Table unavailable'});if(r.seats.length>=6)return send(p,{type:'error',message:'Table full'});leave(p);r.seats.push(p.id);p.room=id;r.hands[p.id]={bet:0,cards:[],status:'waiting'};if(r.phase==='waiting')r.phase='betting';r.log=p.name+' joined the table';broadcast(r)}
function handle(p,m){const r=rooms.get(p.room);if(m.type==='move'){p.x=Math.max(45,Math.min(955,Number(m.x)||500));p.y=Math.max(55,Math.min(595,Number(m.y)||400));return}
if(m.type==='join')return join(p,String(m.id));if(m.type==='leave')return leave(p);
if(m.type==='chat'){const msg=String(m.message||'').slice(0,160).trim();if(!msg)return;for(const q of players.values())send(q,{type:'chat',name:p.name,message:msg});return}
if(!r||r.game!=='blackjack')return;
const h=r.hands[p.id];if(m.type==='bet'&&['waiting','betting','results'].includes(r.phase)){if(r.phase==='results'){r.phase='betting';r.dealer=[];r.hands=Object.fromEntries(r.seats.map(id=>[id,{bet:0,cards:[],status:'waiting'}]))}const bet=Math.floor(Number(m.amount));if(!Number.isFinite(bet)||bet<10||bet>500||bet>p.chips)return send(p,{type:'error',message:'Bet must be 10–500 chips, within your balance'});if(h!==r.hands[p.id]){}r.hands[p.id].bet+=bet;p.chips-=bet;r.hands[p.id].status='ready';r.log=p.name+' placed a bet';broadcast(r);return}
if(m.type==='start'&&r.phase==='betting')return start(r);
if(r.phase!=='playing'||r.seats[r.turn]!==p.id)return;
const hand=r.hands[p.id];if(m.type==='hit'){hand.cards.push(draw(r));if(value(hand.cards)>=21){hand.status=value(hand.cards)>21?'bust':'stand';r.turn++;nextTurn(r)}else broadcast(r)}
if(m.type==='stand'){hand.status='stand';r.turn++;nextTurn(r)}
}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{let pathname=decodeURIComponent(req.url.split('?')[0]);if(pathname==='/')pathname='/index.html';const file=path.resolve(__dirname,'public','.'+pathname);if(!file.startsWith(path.resolve(__dirname,'public')+path.sep)){res.writeHead(403);return res.end()}fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)})});
const {WebSocketServer}=require('ws');const wss=new WebSocketServer({server});
wss.on('connection',ws=>{const id=crypto.randomUUID().slice(0,8);let p;ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}if(!p){if(m.type!=='hello')return;const name=String(m.name||'Guest').replace(/[^\w -]/g,'').slice(0,18)||'Guest';p={id,name,ws,x:500,y:450,chips:1000,room:null};players.set(id,p);send(p,{type:'welcome',id,chips:p.chips});send(p,{type:'tables',rooms:[...rooms.values()].map(r=>({id:r.id,game:r.game,count:r.seats.length,phase:r.phase}))});return}handle(p,m)});ws.on('close',()=>{if(p){leave(p);players.delete(id)}})});
setInterval(()=>{const state=[...players.values()].map(p=>({id:p.id,name:p.name,x:p.x,y:p.y,room:p.room}));const tableState=[...rooms.values()].map(r=>({id:r.id,game:r.game,count:r.seats.length,phase:r.phase}));for(const p of players.values())send(p,{type:'world',players:state,rooms:tableState})},120);
server.listen(PORT,'0.0.0.0',()=>console.log('Casino live on '+PORT));
