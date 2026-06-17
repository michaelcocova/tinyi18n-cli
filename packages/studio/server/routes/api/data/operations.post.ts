import { applyWorkspaceOperation } from "@tinyi18n/cli/src/core/index.ts";
import { defineEventHandler, readBody } from "nitro/h3";
import { getProjectRoot } from "../../../utils/project-root.ts";

function isTinyI18nOperation(value: unknown): value is TinyI18nOperation {
  return Boolean(value && typeof value === "object" && "type" in value && "data" in value);
}

export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event);
  const operations = Array.isArray(body) ? body : [body];

  if (!operations.length || !operations.every(isTinyI18nOperation)) {
    throw new Error("Request body must include operation type and data");
  }

  return applyWorkspaceOperation(
    getProjectRoot(),
    Array.isArray(body) ? operations : operations[0],
  );
});
