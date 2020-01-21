import * as React from "react";
import { useContext, useEffect, useState, useReducer } from "react";

import { css } from "emotion";

import { isFile, unsafeGetItem } from "./projectModel";
import { doPackageResolution } from "./packaging/doResolution";
import { DepsLock } from "./workspace";
import { PackageJSON } from "./packaging/packageResolution";
import { fetchFileFromUnpkg, bundle } from "./packaging/bundling";
import { unsafeUnwrap, map, Result, allResult } from "./functionalNonsense";
import { normalizePath } from "./normalizedPath";
import { FilesPanel } from "./sidePanel/FilesPanel";
import {
  updateProjectModel,
  ProjectModel,
  fromPersistantForm,
  toPersistantForm
} from "./projectModel";
import { Preview } from "./preview";
import { EditorAndTabs } from "./editor_space/EditorAndTabs";
import { ApiContext } from "./ApiContext";
import { IconBtn } from "./styles";
import { FaSave } from "react-icons/fa";
import { projectPickerRoute } from "./routes";
import { Redirect } from "./NavigationPrimitives";

export const IDE: React.FC<{ projId: string }> = ({ projId }) => {
  const apiClient = useContext(ApiContext);

  const [model, setModel] = useState<ProjectModel | "loading" | "failed">(
    "loading"
  );

  useEffect(() => {
    apiClient
      .loadProject(projId)
      .then(p => setModel(p ? fromPersistantForm(p) : "failed"));
  }, [projId]);

  switch (model) {
    case "loading":
      return <div>Loading project...</div>;

    case "failed":
      return <Redirect to={projectPickerRoute} params={{}} />;

    default:
      return (
        <ProjectWorkspace
          save={m => apiClient.saveProject([projId, toPersistantForm(m)])}
          proj={model}
        />
      );
  }
};

const ProjectWorkspace: React.FC<{
  proj: ProjectModel;
  save: (model: ProjectModel) => void;
}> = ({ save, proj }) => {
  const [projectModel, dispatch] = useReducer(updateProjectModel, proj);

  const [bundlingData, setBundlingData] = useState<
    [DepsLock, Map<string, PackageJSON>] | undefined
  >(undefined);

  const [previewSource, setPreviewSource] = useState("");

  const explicitDeps = {
    react: "^16.9.0",
    "react-dom": "^16.9.0"
  };

  useEffect(() => {
    let abort = false;
    doPackageResolution(explicitDeps).then(async lock => {
      if (lock.tag !== "Ok") {
        console.warn("Failed to generate lock; aborting");
        return;
      }

      const packageJsons: Result<
        Map<string, PackageJSON>,
        string
      > = await Promise.all(
        Object.entries(lock.val).map(
          async ([specifier, version]): Promise<
            Result<[string, PackageJSON], string>
          > => {
            const name = specifier.substring(0, specifier.indexOf("@"));
            return await fetchFileFromUnpkg({
              type: "node_module",
              name,
              version,
              path: unsafeUnwrap(normalizePath("package.json"))
            }).then(result =>
              map(result, s => [`${name}@${version}`, JSON.parse(s)])
            );
          }
        )
      )
        .then(allResult)
        .then(pairs => map(pairs, ps => new Map(ps)));

      if (packageJsons.tag !== "Ok") {
        console.warn("Failed to fetch packageJsons; aborting");
        return;
      }

      if (abort) {
        return;
      }

      setBundlingData([lock.val, packageJsons.val]);
    });
    return () => {
      abort = true;
    };
  }, []);

  return (
    <div className={containerLayout}>
      <div className={headerStyle}>
        <IconBtn
          text="Save"
          onClick={() => save(projectModel)}
          Icon={FaSave}
        ></IconBtn>
      </div>
      <EditorAndTabs
        dispatch={dispatch}
        project={projectModel}
        layoutFromParentStyle={editorContent}
      />
      <div className={previewStyle}>
        <div className={runButtonStyle}>
          {bundlingData ? (
            <button
              onClick={async () => {
                const [lock, packageJsons] = bundlingData;

                // TODO: Handle nested files
                const files = unsafeGetItem(
                  projectModel.folders,
                  projectModel.rootId
                )
                  .children.filter(isFile)
                  .map(fileId => {
                    const name = unsafeGetItem(projectModel.files, fileId).name;
                    const content = unsafeGetItem(projectModel.sources, fileId);
                    return {
                      // TODO: Add TS transpilation.
                      name: name.substring(0, name.length - 2) + "js",
                      content
                    };
                  });

                const output = await bundle(
                  files,
                  "index.js",
                  lock,
                  packageJsons,
                  explicitDeps
                );

                if (output.tag === "Ok") {
                  setPreviewSource(output.val);
                } else {
                  setPreviewSource(
                    `document.body.innerText = "Bundle error: " + ${output.err}`
                  );
                }
              }}
            >
              Run
            </button>
          ) : (
            <button disabled>Run</button>
          )}
        </div>
        <div className={previewContentStyle}>
          <Preview source={previewSource} className={iframeStyle}></Preview>
        </div>
      </div>
      <div className={leftPanelStyle}>
        <FilesPanel projectModel={projectModel} dispatch={dispatch} />
      </div>
    </div>
  );
};

// const editorStyle = css({
//   width: "100%",
//   height: 350,
//   border: "1px solid grey"
// });

// const containerLayout = css`
//   display: grid;
//   grid-gap: 10px;
//   grid-template-columns: 100px auto auto;
//   background-color: #fff;
//   color: #444;
// `;

const Sizes = {
  leftPanelWidth: 200,
  editorWidth: 600,
  previewWidth: 600
};

// const editorStyle = css`
//   grid-column: editor;
//   grid-row: content;
// `;

const editorContent = css`
  grid-column: editor;
  grid-row: content;
`;

const previewStyle = css`
  grid-column: preview;
  grid-row: content;
  background-color: #ccc;
  display: grid;
  grid-template-rows: [run] 30px [content] 1fr;
`;

const runButtonStyle = css`
  grid-row: run;
`;

const previewContentStyle = css`
  grid-row: content;
`;

const iframeStyle = css`
  width: 100%;
  height: 100%;
`;

const headerStyle = css`
  grid-column: tools/ span 3;
  grid-row: header;
  background-color: #444;
`;

const leftPanelStyle = css`
  grid-column: tools;
  grid-row: content;
  background-color: pink;
`;

const containerLayout = css`
  width: 100%;
  height: 100%;
  display: grid;
  grid-gap: 10px;
  grid-template-columns: [tools] ${Sizes.leftPanelWidth}px [editor] ${Sizes.editorWidth}px [preview] ${Sizes.previewWidth}px;
  grid-template-rows: [header] 50px [content] auto;
  background-color: #fff;
  color: #444;
`;

//  grid-template-columns: [col] 100px [col] 100px [col] 100px [col] 100px  ;
//       grid-template-rows: [row] auto [row] auto [row] ;
