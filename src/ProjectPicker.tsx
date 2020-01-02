import * as React from "react";

import { css } from "emotion";

import { createProtocolClient, implementProtocol } from "shared/rpc/rpc_http";
import { clientServerAPI, ProjectDesc } from "shared/client_server_api";
import { Union, of } from "ts-union";
import { Thunk, useThunk } from "./shared/useThunk";
import { useReducer, useEffect } from "react";
import { Horizontal } from "./styles";

const projects: ProjectDesc[] = [];

const serverImpl = implementProtocol(clientServerAPI, {
  createProject: name => {
    const project = { id: "id", name };
    projects.push(project);
    return project;
  },

  listProjects: () => projects
});

const _client = createProtocolClient(clientServerAPI, msg => {
  const res = serverImpl(msg);
  return res instanceof Promise ? res : Promise.resolve(res);
});

type APIClient = typeof _client;

const State = Union({
  Loading: of(null),
  Loaded: of<ProjectDesc[]>()
});

type State = typeof State.T;

const Ev = Union({
  LoadProjects: of<ProjectDesc[]>(),
  AddProject: of<ProjectDesc>()
});

type Ev = typeof Ev.T;

const update = (prev: State, ev: Ev): State =>
  State.match(prev, {
    Loading: () =>
      Ev.match(ev, {
        LoadProjects: projects => State.Loaded(projects),
        default: () => prev
      }),

    Loaded: projects =>
      Ev.match(ev, {
        AddProject: project => State.Loaded(projects.concat(project)),
        default: () => prev
      })
  });

const createProject = (
  client: APIClient,
  name: string
): Thunk<State, Ev> => async send =>
  send(Ev.AddProject(await client.createProject(name)));

const fetchProjects = (client: APIClient): Thunk<State, Ev> => async send =>
  send(Ev.LoadProjects(await client.listProjects()));

export const ProjectPicker: React.FC = () => {
  const [state, send] = useThunk(useReducer(update, State.Loading));

  useEffect(() => {
    send(fetchProjects(_client));
  }, []);

  return (
    <Horizontal className={style}>
      {State.match(state, {
        Loading: () => <h4>Loading</h4>,
        Loaded: projects => (
          <div>
            <button
              onClick={() => {
                const projectName = prompt("Project name?");
                if (projectName) {
                  send(createProject(_client, projectName));
                }
              }}
            >
              Add project
            </button>
            <ul>
              {projects.map(p => (
                <li id={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        )
      })}
    </Horizontal>
  );
};

const style = css({
  flex: 1
});
