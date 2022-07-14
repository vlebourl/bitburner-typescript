import { NS } from '@ns';
import { getServersInfos, generateRandomString } from '/compiler/utilities';

function buyServer(ns: NS, name: string, ram: number): string {
  ns.printf(`[*] Purchasing server ${name} with ${2 ** ram} MB RAM`);
  const server = ns.purchaseServer(name, 2 ** ram);
  return server;
}

function killHomeScripts(ns: NS): string[] {
  const toStart: string[] = [];
  for (const script of ['/scripts/boost_hack.js', '/scripts/get_money.js']) {
    if (ns.getRunningScript(script, 'home')) {
      ns.printf(`[*] Killing ${script}`);
      ns.kill(script, 'home');
      toStart.push(script);
    }
  }
  return toStart;
}

function restartHomeScript(ns: NS, toStart: string[]): void {
  for (const script of toStart) {
    ns.printf(`[*] Restarting ${script}`);
    ns.exec(script, 'home', 1);
  }
}

export async function main(ns : NS) : Promise<void> {
  ns.disableLog('ALL');

  let ram = 1;
  while (ram <= 20) {
    ns.printf(`[+] Attempting to buy servers with 2^${ram} RAM`);
    let del = 0;
    let enough = 0;
    let kept = 0;
    let bought = 0;
    const serversData = getServersInfos(ns);
    const serversPurchased = serversData.filter((server) => server.purchased);
    for (let i = 0; i < 25; i += 1) {
      if (i < serversPurchased.length) {
        const server = serversPurchased[i];
        if (server.logRam < ram && ns.getPurchasedServerCost(2 ** ram) < ns.getServerMoneyAvailable('home')) {
          // ns.printf('... Server upgrade possible');
          // ns.printf(`[*] Removing server ${server.hostname}`);
          const toStart = killHomeScripts(ns);
          ns.killall(server.hostname);
          ns.deleteServer(server.hostname);
          const newServer = buyServer(ns, generateRandomString(), ram);
          restartHomeScript(ns, toStart);
          del += 1;
          if (newServer !== '') {
            bought += 1;
          } else {
            ns.printf('[-] Failed to buy server, not enough money ?');
          }
        } else if (server.logRam >= ram) {
          // ns.printf('... Server has enough RAM, keeping it');
          enough += 1;
        } else if (ns.getPurchasedServerCost(2 ** ram) >= ns.getServerMoneyAvailable('home')) {
          // ns.printf('... Server upgrade is too expensive, keeping it');
          kept += 1;
        }
      } else if (ns.getPurchasedServerCost(2 ** ram) < ns.getServerMoneyAvailable('home')) {
        // ns.printf('... Server upgrade possible');
        const newServer = buyServer(ns, generateRandomString(), ram);
        if (newServer !== '') {
          bought += 1;
        } else {
          ns.printf('[-] Failed to buy server, not enough money ?');
        }
      }
    }
    if (enough === 25) {
      ram += 1;
      ns.printf(`... next buy with 2^${ram} RAM`);
      continue;
    }

    ns.printf(`[+] ${enough} servers with enough RAM`);
    ns.printf(`[+] Deleted ${del} servers`);
    ns.printf(`[*] Kept ${kept} servers`);
    ns.printf(`[*] Bought ${bought} servers`);
    await ns.sleep(60000);
  }
}
