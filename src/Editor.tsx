import * as React from "react";
// import { css } from "linaria";

import * as monaco from "monaco-editor";
import { css } from "emotion";

import { useState, useEffect, useRef } from "react";
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

export type EditorFile = { name: string; content: string };

export const IDEFrom = (initial: {
  files: EditorFile[];
  entry: string;
  //   packageJson: PackageJSON;
}): React.FC<{
  onChange: (data: {
    files: EditorFile[];
    entry: string;
    // packageJson: PackageJSON;
  }) => void;
}> => {
  const models = initial.files.map(({ name, content }) => ({
    name,
    model: monaco.editor.createModel(content, "typescript")
  }));

  return ({ onChange }) => {
    const [tabIndex, setTabIndex] = useState(0);

    const emit = () =>
      onChange({
        files: models.map(({ name, model }) => ({
          name,
          content: model.getValue()
        })),
        entry: initial.entry
        // packageJson: initial.packageJson
      });

    // Initial compilation
    useEffect(() => {
      emit();
    }, []);

    return (
      <>
        {models.map((_, i) => (
          <button key={i} onClick={() => setTabIndex(i)}>
            {models[i].name}
          </button>
        ))}
        <Editor
          model={models[tabIndex].model}
          onChange={() => {
            emit();
          }}
        />
      </>
    );
  };
};

const Editor: React.FC<{
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
      // Note: This callback has to be re-added after each setModel call.
      return editor.onDidChangeModelContent(onChange).dispose;
    }
    return undefined;
  }, [editor, model, onChange]);

  return <div ref={editorContainerRef} className={editorStyle}></div>;
};

const editorStyle = css({
  width: "100%",
  height: 350,
  border: "1px solid grey"
});
