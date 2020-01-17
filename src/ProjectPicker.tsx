import * as React from "react";

import { css } from "emotion";

import { ProjectDesc } from "shared/client_server_api";
import { Union, of } from "ts-union";
import { Thunk, useThunk } from "./shared/useThunk";
import { useReducer, useEffect, useContext } from "react";
import { Horizontal } from "./styles";
import { APIClient, ApiContext } from "./ApiContext";
import { Link } from "./NavigationPrimitives";
import { projectEditingRoute } from "./routes";

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
    Loading: () => Ev.if.LoadProjects(ev, projects => State.Loaded(projects)),
    Loaded: projects =>
      Ev.if.AddProject(ev, proj => State.Loaded(projects.concat(proj)))
  }) ?? prev;

const createProject = (
  client: APIClient,
  name: string
): Thunk<State, Ev> => async send =>
  send(Ev.AddProject(await client.createProject(name)));

const fetchProjects = (client: APIClient): Thunk<State, Ev> => async send =>
  send(Ev.LoadProjects(await client.listProjects()));

export const ProjectPicker: React.FC = () => {
  const apiClient = useContext(ApiContext);
  const [state, send] = useThunk(useReducer(update, State.Loading));

  useEffect(() => {
    send(fetchProjects(apiClient));
  }, []);

  // console.log("###", state);

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
                  send(createProject(apiClient, projectName));
                }
              }}
            >
              Add project
            </button>
            <ul>
              {projects.map(({ id, name }) => (
                <li key={id}>
                  <Link to={projectEditingRoute} params={{ id }}>
                    {name}
                  </Link>
                </li>
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
