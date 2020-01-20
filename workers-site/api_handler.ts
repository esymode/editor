// import { U32, Str } from "ts-binary-types";
import { clientServerAPI, ProjectData } from "../shared/client_server_api";
import { implementProtocol } from "../shared/rpc/rpc_http";

import { KVNamespace } from "@cloudflare/workers-types";

declare const PROJECTS: KVNamespace;

export const serverAPIwithKVImpl = implementProtocol(clientServerAPI, {
  createProject: async data => {
    const id = "proj:" + Math.round(Math.random() * 1000000).toString();
    await PROJECTS.put(id, JSON.stringify(data));
    return { id, name: data.name };
  },

  saveProject: async ([id, data]) => {
    await PROJECTS.put(id, JSON.stringify(data));
  },

  loadProject: async id => {
    return await PROJECTS.get<ProjectData>(id, "json");
  },

  listProjects: async () => {
    const { keys } = await PROJECTS.list({ prefix: "proj:" });

    // TODO this is wildly inefficient!
    const projects = await Promise.all(
      keys.map(({ name }) => PROJECTS.get<ProjectData>(name, "json"))
    );

    return keys.map(({ name }, i) => ({
      id: name,
      name: projects[i]?.name ?? "unknown"
    }));
  },

  clearProjects: async () => {
    const { keys } = await PROJECTS.list({ prefix: "proj:" });
    await Promise.all(keys.map(({ name }) => PROJECTS.delete(name)));
    return true;
  }
});
