import { cwd } from "node:process";

export function getProjectRoot() {
  return process.env.TINYI18N_PROJECT_ROOT ?? cwd();
}
