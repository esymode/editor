// import * as Messages from "./messages";
// import * as Employees from "./employee";
import * as React from "react";
import { makeRouter, Router } from "typescript-safe-router";
import { ProjectPicker } from "./ProjectPicker";
import { implementProtocol, createProtocolClient } from "shared/rpc/rpc_http";
import { clientServerAPI, ProjectDesc } from "shared/client_server_api";
import { ApiContext } from "./ApiContext";
import { projectPickerRoute, projectEditingRoute } from "./routes";
import { IDE } from "./Editor";
import { Redirect } from "./NavigationPrimitives";

const projects: ProjectDesc[] = [];

const serverImpl = implementProtocol(clientServerAPI, {
  createProject: name => {
    const project = { id: Math.round(Math.random() * 100000).toString(), name };
    projects.push(project);
    console.log("createProject", project);
    return project;
  },

  listProjects: () => projects.slice()
});

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

    window.location.assign;
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
