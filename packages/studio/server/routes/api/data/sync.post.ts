import { defineEventHandler, createError } from "nitro/h3";
import { syncWorkspaceToProjectFiles } from "@tinyi18n/cli/src/core/index.ts";
import { getProjectRoot } from "../../../utils/project-root.ts";

export default defineEventHandler(async () => {
  const result = await syncWorkspaceToProjectFiles(getProjectRoot());

  if (!result.ok) {
    throw createError({
      statusCode: 400,
      message: result.error,
    });
  }

  return result;
});
