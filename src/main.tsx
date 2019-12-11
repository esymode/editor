import * as ReactDOM from "react-dom";
import * as React from "react";
import { IDEFrom } from "./Editor";

const Editor = IDEFrom({
  files: [{ name: "bla.ts", content: "const bla = 1;" }],
  entry: "bla.ts"
});

ReactDOM.render(
  <Editor onChange={data => console.log(data)}></Editor>,
  document.getElementById("root")!
);
