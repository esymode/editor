import * as React from "react";

import * as monaco from "monaco-editor";
import { css } from "emotion";

import { useState, useEffect, useRef, useReducer } from "react";
import { FilesPanel } from "./sidePanel/FilesPanel";
import {
  Evt,
  createProjectFiles,
  projectFileReducer,
  unsafeGetItem
} from "./projectFilesModel";
import { Preview } from "./preview";
// import { PackageJSON } from "./virtual-path-types";

(window as any).MonacoEnvironment = {
  getWorkerUrl: function(workerId: string, label: string) {
    return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
            self.MonacoEnvironment = {
              baseUrl: 'http://www.unpkg.com/monaco-editor/dev/'
            };
            importScripts('http://www.unpkg.com/monaco-editor/dev/vs/base/worker/workerMain.js');`)}`;
  }
};

const init = () => {
  let p = projectFileReducer(
    createProjectFiles(),
    Evt.AddFile("index.ts", undefined)
  );

  const fileId = p.files.findKey(fi => fi.name === "index.ts")!;

  return projectFileReducer(
    p,
    Evt.SaveContent(fileId, 'console.log("Hello world!")')
  );
};

export const IDE: React.FC = () => {
  const [projectModel, dispatch] = useReducer(projectFileReducer, init());

  console.log("IDE render model=", projectModel);

  const { selectedFile, sources, files } = projectModel;

  const [model, setModel] = useState<monaco.editor.ITextModel | undefined>(
    undefined
  );
  useEffect(() => {
    if (selectedFile) {
      const m = monaco.editor.createModel(
        sources.get(selectedFile)!,
        "typescript"
      );
      setModel(m);
      return () => {
        const currentContent = m.getValue();
        dispatch(Evt.SaveContent(selectedFile, currentContent));
      };
    }
  }, [selectedFile]);

  const emit = () => {};
  // onChange({
  //   files: models.map(({ name, model }) => ({
  //     name,
  //     content: model.getValue()
  //   })),
  //   entry
  //   // packageJson: initial.packageJson
  // });

  // Initial compilation
  useEffect(() => {
    emit();
  }, []);

  return (
    <div className={containerLayout}>
      <div className={headerStyle}></div>
      <div className={editorContent}>
        <div className={editorOpenedFiles}>
          {selectedFile ? (
            <span>{unsafeGetItem(files, selectedFile).name}</span>
          ) : null}
        </div>
        {model ? (
          <Monaco
            model={model}
            onChange={() => {
              emit();
            }}
          />
        ) : (
          "Click on a file."
        )}
      </div>
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

const Monaco: React.FC<{
  model: monaco.editor.ITextModel;
  onChange: () => void;
}> = ({ model, onChange }) => {
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [editor, setEditor] = useState<monaco.editor.ICodeEditor | null>(null);

  useEffect(() => {
    const e = monaco.editor.create(editorContainerRef.current!);
    setEditor(e);
    return e.dispose;
  }, []);

  useEffect(() => {
    if (editor) {
      editor.setModel(model);
      editor.focus();
      // Note: This callback has to be re-added after each setModel call.
      return editor.onDidChangeModelContent(onChange).dispose;
    }
    return undefined;
  }, [editor, model, onChange]);

  return <div ref={editorContainerRef} className={monacoStyle}></div>;
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

const editorContent = css`
  grid-column: editor;
  grid-row: content;
  /* width: 100%;
  height: 100%; */
  display: grid;
  /* grid-gap: 10px; */
  grid-template-rows: [openedFiles] 25px [monaco] auto;
  background-color: #fff;
  color: #444;
`;

const editorOpenedFiles = css`
  grid-row: openedFiles;
`;

const monacoStyle = css`
  grid-row: monaco;
`;

// const editorStyle = css`
//   grid-column: editor;
//   grid-row: content;
// `;

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
