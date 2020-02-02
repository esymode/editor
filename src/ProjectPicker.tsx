import * as React from "react";

import { css } from "emotion";

import { ProjectDesc } from "shared/client_server_api";
import { Union, of } from "ts-union";
import { useContext } from "react";
import { Horizontal } from "./styles";
import { APIClient, ApiContext } from "./ApiContext";
import { Link } from "./NavigationPrimitives";
import { projectEditingRoute } from "./routes";
import { toPersistantForm, createModelWithIndexTS } from "./projectModel";
import {
  declareEffects,
  effect,
  UpdateFunction,
  cmd,
  AnyCommand,
  EffectHandler
} from "./shared/stateMachine";
import { useMachine } from "./shared/useMachine";

const State = Union({
  Loading: of(null),
  Loaded: of<ProjectDesc[]>()
});
const { Loaded, Loading } = State;

type State = typeof State.T;

const Ev = Union({
  LoadProjects: of<ProjectDesc[]>(),
  AddProject: of<ProjectDesc>(),
  DeleteAll: of(null),
  RequestDeleteAll: of(null),
  RequestNewProject: of<string>()
});

type Ev = typeof Ev.T;

const Effects = declareEffects({
  fetchProjects: effect<() => ProjectDesc[]>(),
  createProject: effect<(name: string) => ProjectDesc>(),
  deleteAllProjects: effect<() => boolean>()
});

const effectHandlers: EffectHandler<typeof Effects, APIClient> = {
  fetchProjects: (_, client) => client.listProjects(),
  createProject: (name, client) =>
    client.createProject(toPersistantForm(createModelWithIndexTS(name))),
  deleteAllProjects: (_, client) => client.clearProjects()
};

const update: UpdateFunction<State, Ev, typeof Effects> = (prev, ev) =>
  State.match(prev, {
    Loading: () => [
      Ev.if.LoadProjects(ev, projects => Loaded(projects)) ?? prev
    ],

    Loaded: projects =>
      Ev.match<[State, AnyCommand<typeof Effects, Ev>?]>(ev, {
        LoadProjects: () => [prev],
        AddProject: proj => [Loaded(projects.concat(proj))],
        DeleteAll: () => [Loaded([])],
        RequestNewProject: name => [
          prev,
          cmd(Effects.createProject(name), Ev.AddProject)
        ],
        RequestDeleteAll: () => [
          prev,
          cmd(Effects.deleteAllProjects(), () => Ev.DeleteAll)
        ]
      })
  });

export const ProjectPicker: React.FC = () => {
  const [state, send] = useMachine(
    update,
    () => [Loading, cmd(Effects.fetchProjects(), Ev.LoadProjects)],
    effectHandlers,
    useContext(ApiContext)
  );

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
                  send(Ev.RequestNewProject(projectName));
                }
              }}
            >
              Add project
            </button>
            <button onClick={() => send(Ev.RequestDeleteAll)}>
              Delete All
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
