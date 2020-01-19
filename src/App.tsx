// import * as Messages from "./messages";
// import * as Employees from "./employee";
import * as React from "react";
import { makeRouter, Router } from "typescript-safe-router";
import { ProjectPicker } from "./ProjectPicker";
import { implementProtocol, createProtocolClient } from "shared/rpc/rpc_http";
import {
  clientServerAPI,
  ProjectDesc,
  ProjectData
} from "shared/client_server_api";
import { ApiContext } from "./ApiContext";
import { projectPickerRoute, projectEditingRoute } from "./routes";
import { IDE } from "./Editor";
import { Redirect } from "./NavigationPrimitives";

const wait = (ms: number) => new Promise(res => setTimeout(() => res(), ms));

function getStorageItem<K, V>(key: string): Map<K, V> | null {
  const val = localStorage.getItem(key);
  if (val === null) return null;

  const values: [K, V][] = JSON.parse(val);
  return new Map(values);
}

function setStorageItem<K, V>(key: string, m: Map<K, V>): void {
  localStorage.setItem(key, JSON.stringify([...m.entries()]));
}

const serverImpl = (() => {
  const projects =
    getStorageItem<string, ProjectData>("#projects") ??
    new Map<string, ProjectData>();

  const descriptions =
    getStorageItem<string, ProjectDesc>("#descriptions") ??
    new Map<string, ProjectDesc>();

  console.log("loaded", { projects, descriptions });

  const persist = () => {
    setStorageItem("#projects", projects);
    setStorageItem("#descriptions", descriptions);
  };

  return implementProtocol(clientServerAPI, {
    createProject: async ([name, data]) => {
      await wait(500);
      const project = {
        id: Math.round(Math.random() * 100000).toString(),
        name
      };
      projects.set(project.id, data);
      descriptions.set(project.id, project);
      persist();
      console.log("createProject", { project, data });
      return project;
    },

    saveProject: ([id, data]) => {
      console.log("saveProject", { id, data });
      projects.set(id, data);
      persist();
    },

    loadProject: async id => {
      await wait(500);
      const t = projects.get(id);
      console.log("loadProject", id, t);
      return t;
    },

    listProjects: () => {
      console.log("loadProjects", descriptions);
      return [...descriptions.values()];
    },

    clearProjects: () => {
      console.log("clearProjects");
      projects.clear();
      descriptions.clear();
      persist();
      return true;
    }
  });
})();

const _client = createProtocolClient(clientServerAPI, msg => {
  const res = serverImpl(msg);
  return res instanceof Promise ? res : Promise.resolve(res);
});

export class App extends React.Component<{}, {}> {
  private router: Router<JSX.Element>;

  constructor(props: {}) {
    super(props);

    // Defining what we want functions we want router.match to execute for every route
    this.router = makeRouter(projectPickerRoute, ({}) => (
      <ProjectPicker />
    )).registerRoute(projectEditingRoute, ({ id }) => <IDE projId={id} />);

    window.onhashchange = () => {
      console.log("4444", window.location);
      this.forceUpdate();
    };
  }

  render() {
    const matchedPage = this.router.match(window.location.hash);
    return (
      <ApiContext.Provider value={_client}>
        {matchedPage ?? <Redirect to={projectPickerRoute} params={{}} />}
      </ApiContext.Provider>
    );
  }
}
