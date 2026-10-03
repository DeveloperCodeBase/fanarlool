import { chmodSync, existsSync, lstatSync, unlinkSync } from 'node:fs';
import { openDatabase } from './storage.mjs';
import { createApp } from './app.mjs';
const dataRoot=process.env.FANAR_DATA_ROOT;
const socket=process.env.FANAR_SOCKET;
if(!dataRoot || !socket || !socket.startsWith('/run/fanarlool/')) throw new Error('Explicit project data root and Unix socket required');
const db=openDatabase(`${dataRoot}/platform.sqlite`);
const app=createApp({db,origin:process.env.FANAR_ORIGIN,sha:process.env.FANAR_SHA});
app.requestTimeout=15000; app.headersTimeout=20000;
if(existsSync(socket)) { if(!lstatSync(socket).isSocket()) throw new Error('Socket path is not a socket'); unlinkSync(socket); }
app.listen(socket,()=>{chmodSync(socket,0o660);console.log('FanarLool API ready',process.env.FANAR_SHA);});
for(const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>app.close(()=>{db.close();process.exit(0);}));
