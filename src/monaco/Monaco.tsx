import * as React from "react";
// import * as monaco from "monaco-editor";

// @ts-ignore
// (1) Desired editor features:
// import 'monaco-editor/esm/vs/editor/browser/controller/coreCommands.js';
// import 'monaco-editor/esm/vs/editor/browser/widget/codeEditorWidget.js';
// import 'monaco-editor/esm/vs/editor/browser/widget/diffEditorWidget.js';
// import 'monaco-editor/esm/vs/editor/browser/widget/diffNavigator.js';
// import 'monaco-editor/esm/vs/editor/contrib/bracketMatching/bracketMatching.js';
// import 'monaco-editor/esm/vs/editor/contrib/caretOperations/caretOperations.js';
// import 'monaco-editor/esm/vs/editor/contrib/caretOperations/transpose.js';
// import 'monaco-editor/esm/vs/editor/contrib/clipboard/clipboard.js';
// import 'monaco-editor/esm/vs/editor/contrib/codelens/codelensController.js';
// // import 'monaco-editor/esm/vs/editor/contrib/colorPicker/colorDetector.js';
// import 'monaco-editor/esm/vs/editor/contrib/comment/comment.js';
// import 'monaco-editor/esm/vs/editor/contrib/contextmenu/contextmenu.js';
// import 'monaco-editor/esm/vs/editor/contrib/cursorUndo/cursorUndo.js';
// import 'monaco-editor/esm/vs/editor/contrib/dnd/dnd.js';
// import 'monaco-editor/esm/vs/editor/contrib/find/findController.js';
// import 'monaco-editor/esm/vs/editor/contrib/folding/folding.js';
// import 'monaco-editor/esm/vs/editor/contrib/format/formatActions.js';
// import 'monaco-editor/esm/vs/editor/contrib/goToDefinition/goToDefinitionCommands.js';
// import 'monaco-editor/esm/vs/editor/contrib/goToDefinition/goToDefinitionMouse.js';
// import 'monaco-editor/esm/vs/editor/contrib/gotoError/gotoError.js';
// import 'monaco-editor/esm/vs/editor/contrib/hover/hover.js';
// import 'monaco-editor/esm/vs/editor/contrib/inPlaceReplace/inPlaceReplace.js';
// import 'monaco-editor/esm/vs/editor/contrib/linesOperations/linesOperations.js';
// import 'monaco-editor/esm/vs/editor/contrib/links/links.js';
// import 'monaco-editor/esm/vs/editor/contrib/multicursor/multicursor.js';
// import 'monaco-editor/esm/vs/editor/contrib/parameterHints/parameterHints.js';
// import 'monaco-editor/esm/vs/editor/contrib/quickFix/quickFixCommands.js';
// import 'monaco-editor/esm/vs/editor/contrib/referenceSearch/referenceSearch.js';
// import 'monaco-editor/esm/vs/editor/contrib/rename/rename.js';
// import 'monaco-editor/esm/vs/editor/contrib/smartSelect/smartSelect.js';
// import 'monaco-editor/esm/vs/editor/contrib/snippet/snippetController2.js';
// import 'monaco-editor/esm/vs/editor/contrib/suggest/suggestController.js';
// import 'monaco-editor/esm/vs/editor/contrib/toggleTabFocusMode/toggleTabFocusMode.js';
// import 'monaco-editor/esm/vs/editor/contrib/wordHighlighter/wordHighlighter.js';
// import 'monaco-editor/esm/vs/editor/contrib/wordOperations/wordOperations.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/quickOpen/quickOutline.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/quickOpen/gotoLine.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/quickOpen/quickCommand.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js';
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

// (2) Desired languages:
// import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
// // import 'monaco-editor/esm/vs/language/css/monaco.contribution';
// import 'monaco-editor/esm/vs/language/json/monaco.contribution';
// import 'monaco-editor/esm/vs/language/html/monaco.contribution';
// import 'monaco-editor/esm/vs/basic-languages/bat/bat.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/coffee/coffee.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/csp/csp.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/css/css.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/dockerfile/dockerfile.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/fsharp/fsharp.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/go/go.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/handlebars/handlebars.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/html/html.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/ini/ini.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/java/java.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/less/less.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/lua/lua.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/msdax/msdax.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/mysql/mysql.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/objective-c/objective-c.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/pgsql/pgsql.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/php/php.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/postiats/postiats.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/powershell/powershell.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/pug/pug.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/python/python.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/r/r.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/razor/razor.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/redis/redis.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/redshift/redshift.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/sb/sb.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/scss/scss.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/solidity/solidity.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/swift/swift.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/vb/vb.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution.js';
// import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js';

import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
// import 'monaco-editor/esm/vs/language/css/monaco.contribution';
// import 'monaco-editor/esm/vs/language/json/monaco.contribution';
// import 'monaco-editor/esm/vs/language/html/monaco.contribution';

import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";

// import '../basic-languages/monaco.contribution';

import "monaco-editor/esm/vs/editor/editor.all.js";
import "monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js";
import "monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js";
import "monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js";
import "monaco-editor/esm/vs/editor/standalone/browser/quickOpen/gotoLine.js";
import "monaco-editor/esm/vs/editor/standalone/browser/quickOpen/quickCommand.js";
import "monaco-editor/esm/vs/editor/standalone/browser/quickOpen/quickOutline.js";
import "monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js";
import "monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js";

import { useState, useEffect, useRef } from "react";
import { Dispatch, FileId, Evt } from "../projectModel";

// (window as any).MonacoEnvironment = {
//   getWorkerUrl: function() {
//     return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
//             self.MonacoEnvironment = {
//               baseUrl: 'http://www.unpkg.com/monaco-editor/dev/'
//             };
//             importScripts('http://www.unpkg.com/monaco-editor/dev/vs/base/worker/workerMain.js');`)}`;
//   }
// };

// @ts-ignore
(window as any).MonacoEnvironment = {
  getWorkerUrl: (moduleId: unknown, label: string) => {
    if (label === "json") {
      return "./monaco.json.worker.js";
    }
    // if (label === "css") {
    //   return "./monaco.css.worker.js";
    // }
    // if (label === "html") {
    //   return "./monaco.html.worker.js";
    // }
    if (label === "typescript" || label === "javascript") {
      return "./monaco.ts.worker.js";
    }
    return "./monaco.editor.worker.js";
  }
};

export const Monaco: React.FC<{
  fileId: FileId;
  content: string;
  dispatch: Dispatch;
  className: string;
  type: "typescript" | "json";
}> = ({ content, fileId, dispatch, className, type }) => {
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
    const m = monaco.editor.createModel(content, type);
    setModel(m);
    return () => {
      dispatch(Evt.PersistUnsavedChanges(fileId, m.getValue()));
      // console.log(">> model disposed for ", { content }, m?.id);
      m.dispose();
    };
  }, [fileId]);

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

  // CMD + S listener
  useEffect(() => {
    const listener = (event: WindowEventMap["keydown"]) => {
      const S_KEY = 83;
      if (event.keyCode == S_KEY && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (model) dispatch(Evt.SaveContent(fileId, model.getValue()));
      }
    };
    window.addEventListener("keydown", listener, false);
    return () => window.removeEventListener("keydown", listener);
  }, [dispatch, fileId, model]);

  return <div ref={editorContainerRef} className={className}></div>;
};
