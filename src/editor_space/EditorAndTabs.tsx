import * as React from "react";

import { useMemo, useState } from "react";
import { Horizontal } from "../styles";
import {
  ProjectModel,
  unsafeGetItem,
  unwrapItemId,
  Dispatch,
  Evt
} from "../projectModel";
import { css } from "emotion";
import { Tab } from "./Tab";
import { Monaco } from "../monaco/Monaco";
import {
  doPackageResolution,
  fetchPackageJsons
} from "src/packaging/doResolution";
import { ExplicitDeps } from "src/workspace";

export const EditorAndTabs: React.FC<{
  project: ProjectModel;
  dispatch: Dispatch;
  layoutFromParentStyle: string;
}> = ({ project, dispatch, layoutFromParentStyle }) => {
  const { openedFiles } = project;
  return (
    <div className={layoutFromParentStyle + " " + editorContent}>
      <Horizontal className={openedFilesStyle}>
        {openedFiles.tag === "empty"
          ? null
          : openedFiles.tabs.map(fileId => (
              <Tab
                fileId={fileId}
                key={fileId === "package.json" ? fileId : unwrapItemId(fileId)}
                dispatch={dispatch}
                isUnsaved={
                  fileId !== "package.json" && openedFiles.unsaved.has(fileId)
                }
                isSelected={fileId === openedFiles.activeTab}
                text={
                  fileId === "package.json"
                    ? "package.json"
                    : unsafeGetItem(project.files, fileId).name
                }
              />
            ))}
      </Horizontal>
      {useMemo(() => {
        if (openedFiles.tag === "empty") return "select a file";

        const { activeTab, unsaved } = openedFiles;

        if (activeTab === "package.json") {
          return (
            <PackageJsonEditor
              deps={project.explicitDeps}
              dispatch={dispatch}
            />
          );
        } else {
          const content =
            unsaved.get(activeTab) ?? project.sources.get(activeTab, "");
          return (
            <Monaco
              fileId={activeTab}
              content={content}
              dispatch={dispatch}
              className={monacoStyle}
            />
          );
        }
      }, [
        openedFiles.tag,
        openedFiles.tag === "filled" && openedFiles.activeTab,
        project.explicitDeps
      ])}
    </div>
  );
};

const PackageJsonEditor: React.FC<{
  dispatch: Dispatch;
  deps: ExplicitDeps;
}> = ({ deps, dispatch }) => {
  const [name, setName] = useState("");
  const [semverRange, setSemverRange] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <pre>{JSON.stringify({ dependencies: deps }, null, 2)}</pre>
      <div>
        <button
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            const newDeps = { ...deps, [name]: semverRange };

            const lock = await doPackageResolution(newDeps);
            if (lock.tag !== "Ok") {
              setSubmitting(false);
              setError(lock.err);
              return;
            }

            const pkgs = await fetchPackageJsons(lock.val);
            if (pkgs.tag !== "Ok") {
              setSubmitting(false);
              setError(pkgs.err);
              return;
            }

            setSubmitting(false);
            dispatch(Evt.UpdateDeps(newDeps, lock.val, pkgs.val));
          }}
        >
          Add new dep
        </button>
        <div>
          Name
          <input
            type="text"
            value={name}
            onChange={e => {
              setName(e.target.value);
              setError("");
            }}
          />
        </div>
        <div>
          Semver Range
          <input
            type="text"
            value={semverRange}
            onChange={e => {
              setSemverRange(e.target.value);
              setError("");
            }}
          />
        </div>
        {error}
      </div>
    </div>
  );
};

const editorContent = css`
  /* width: 100%;
  height: 100%; */
  display: grid;
  /* grid-gap: 10px; */
  grid-template-rows: [openedFiles] 25px [monaco] auto;
  background-color: #fff;
  color: #444;
`;

const monacoStyle = css`
  grid-row: monaco;
`;

const openedFilesStyle = css`
  grid-row: openedFiles;
`;
