import { readWorkspaceSnapshot } from "tinyi18n";
import { defineEventHandler } from "nitro/h3";
import { getProjectRoot } from "../../utils/project-root.ts";

export default defineEventHandler(() => readWorkspaceSnapshot(getProjectRoot()));
