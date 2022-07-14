import { NS } from '@ns';

export function main(ns: NS) : void {
  ns.run('/bin/hacknet.js', 1);
  ns.run('/scripts/boost_hack.js', 1);
  ns.run('/bin/purchase_servers.js', 1);
}
