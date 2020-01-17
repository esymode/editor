import { makeRoute } from "typescript-safe-router";

export const projectEditingRoute = makeRoute("project", { id: "string" });
export const projectPickerRoute = makeRoute("projects", {});
