import * as ReactDOM from "react-dom";
import * as React from "react";
import { IDEFrom } from "./Editor";
// import { doPackageResolution } from "./packaging/doResolution";

const Editor = IDEFrom({
  files: [{ name: "bla.ts", content: "const bla = 1;" }],
  entry: "bla.ts"
});

// doPackageResolution({ react: "^16.9.0", "react-dom": "^16.9.0" }).then(res => {
//   console.log(res);
// });

ReactDOM.render(
  <Editor onChange={data => console.log(data)}></Editor>,
  document.getElementById("root")!
);
