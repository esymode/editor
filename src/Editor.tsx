import * as React from "react";

import { css } from "emotion";

import { useReducer } from "react";
import { FilesPanel } from "./sidePanel/FilesPanel";
import { Evt, createProjectFiles, updateProjectModel } from "./projectModel";
import { Preview } from "./preview";
import { EditorAndTabs } from "./editor_space/EditorAndTabs";
import { ProjectPicker } from "./ProjectPicker";
// import { PackageJSON } from "./virtual-path-types";

const init = () => {
  let p = updateProjectModel(createProjectFiles(), Evt.AddFile("index.ts"));

  const fileId = p.files.findKey(fi => fi.name === "index.ts")!;

  return updateProjectModel(
    p,
    Evt.SaveContent(fileId, 'console.log("Hello world!")')
  );
};

const initial = init();

export const IDE: React.FC = () => {
  const [projectModel, dispatch] = useReducer(updateProjectModel, initial);

  // console.log("IDE render model=", projectModel);

  return (
    <div className={containerLayout}>
      <div className={headerStyle}>
        <ProjectPicker />
      </div>
      <EditorAndTabs
        dispatch={dispatch}
        project={projectModel}
        layoutFromParentStyle={editorContent}
      />
      <Preview source={source} className={previewStyle}></Preview>
      <div className={leftPanelStyle}>
        <FilesPanel projectFiles={projectModel} dispatch={dispatch} />
      </div>
    </div>
  );
};

const source = `const helloWorld = document.createElement("span");
helloWorld.innerText = "hello world";
document.body.appendChild(helloWorld);
console.log({ helloWorld });`;

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
  background-color: #444;
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
