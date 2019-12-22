import * as React from "react";
import * as monaco from "monaco-editor";

import { useMemo, useState, useEffect, useRef } from "react";
import { Horizontal } from "../styles";
import {
  ProjectModel,
  unsafeGetItem,
  unwrapItemId,
  Dispatch,
  FileId,
  Evt
} from "../projectModel";
import { css } from "emotion";

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
              <span
                onClick={() => dispatch(Evt.SwitchToTab(fileId))}
                style={{
                  outline:
                    fileId === openedFiles.activeTab
                      ? "green solid 1px"
                      : undefined
                }}
                key={unwrapItemId(fileId)}
              >
                {openedFiles.unsaved.has(fileId) ? "* " : null}
                {unsafeGetItem(project.files, fileId).name}
              </span>
            ))}
      </Horizontal>
      {useMemo(() => {
        if (openedFiles.tag === "empty") return "select a file";

        const { activeTab, unsaved } = openedFiles;

        const content =
          unsaved.get(activeTab) ??
          project.sources.get(openedFiles.activeTab, "");

        return (
          <Monaco
            fileId={openedFiles.activeTab}
            content={content}
            dispatch={dispatch}
          />
        );
      }, [
        openedFiles.tag,
        openedFiles.tag === "filled" && openedFiles.activeTab
      ])}
    </div>
  );
};

const Monaco: React.FC<{
  fileId: FileId;
  content: string;
  dispatch: Dispatch;
}> = ({ content, fileId, dispatch }) => {
  // console.log(">> render ", { content });

  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  const [editor, setEditor] = useState<monaco.editor.ICodeEditor | null>(null);

  // create monaco editor itself
  useEffect(() => {
    const e = monaco.editor.create(editorContainerRef.current!);
    // console.log(">> editor created");
    setEditor(e);
    return () => e.dispose();
  }, []);

  const [model, setModel] = useState<monaco.editor.ITextModel | undefined>(
    undefined
  );

  // now we create model for the editing itself
  useEffect(() => {
    // console.log(">> model created", { content });
    const m = monaco.editor.createModel(content, "typescript");
    setModel(m);
    return () => {
      dispatch(Evt.PersistUnsavedChanges(fileId, m.getValue()));
      // console.log(">> model disposed for ", { content }, m?.id);
      m.dispose();
    };
  }, [content]);

  // finally set the attach model to the editor once we have both
  useEffect(() => {
    // console.log(
    //   // ">> effect to set model to editor",
    //   {
    //     model: !!model,
    //     editor: !!editor
    //   },
    //   model?.id
    // );

    if (editor && model) {
      // const logMarker = { source: model.getValue() };
      // console.log(">> actually set model", logMarker);
      editor.setModel(model);
      editor.focus();

      // console.log(">> unset editor ", logMarker, model.id);

      const sub = editor.onDidChangeModelContent(() =>
        dispatch(Evt.MarkFileDrity(fileId))
      );

      return () => sub.dispose();
    }
    return undefined;
  }, [editor, model]);

  return <div ref={editorContainerRef} className={monacoStyle}></div>;
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
