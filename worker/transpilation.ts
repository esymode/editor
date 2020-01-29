import * as t from "typescript";
import { Result, Err, Ok } from "../src/functionalNonsense";

type Observable<T> = {
  subscribe: (cb: (t: T) => void) => { unsubscribe: () => void };
};

type ObservableWithEmit<T> = {
  emit: (t: T) => void;
  observable: Observable<T>;
};

function makeObservable<T>(): ObservableWithEmit<T> {
  let listeners: ((t: T) => void)[] = [];

  return {
    observable: {
      subscribe: cb => {
        listeners.push(cb);
        return {
          unsubscribe: () => {
            listeners = listeners.filter(x => x !== cb);
          }
        };
      }
    },
    emit: x => listeners.forEach(f => f(x))
  };
}

type Host = {
  host: t.CompilerHost;
  output: Observable<{ name: string; content: string }>;
};

const makeHost = (files: { name: string; content: string }[]): Host => {
  const observable: ObservableWithEmit<{
    name: string;
    content: string;
  }> = makeObservable();
  const host: t.CompilerHost = {
    getSourceFile: name => {
      for (let i = 0; i < files.length; i++) {
        if (name === files[i].name) {
          return t.createSourceFile(
            name,
            files[i].content,
            t.ScriptTarget.ESNext
          );
        }
      }
      return undefined;
    },
    writeFile: (name: string, content: string) => {
      observable.emit({ name, content });
    },
    getDefaultLibFileName: () => {
      return "lib.ts";
    },
    getCurrentDirectory: () => {
      return ".";
    },
    getCanonicalFileName: s => s,
    useCaseSensitiveFileNames: () => {
      return true;
    },
    getNewLine: () => "\n",
    fileExists: (s: string) => files.some(({ name }) => name === s),
    readFile: () => {
      throw new Error("readFile");
    }
  };
  return { host, output: observable.observable };
};

export const compile = (
  files: { name: string; content: string }[],
  entry: string
): Result<{ name: string; content: string }[], string> => {
  const { host, output } = makeHost(files);

  const program = t.createProgram({
    rootNames: [entry],
    options: {
      jsx: t.JsxEmit.React,
      //   outFile: "output.js",
      module: t.ModuleKind.ESNext
      // Should turn this on, but then it requires loading a bunch of library definitions
      //checkJS: true,
    },
    host
  });

  const compiledFiles: { name: string; content: string }[] = [];
  output.subscribe(file => compiledFiles.push(file));
  const result = program.emit();
  if (result.diagnostics.length > 0) {
    return Err(result.diagnostics[0].messageText.toString());
  }
  return Ok(compiledFiles);
};
