import * as ReactDOM from "react-dom";
import * as React from "react";
import { App } from "./App";
// import { doPackageResolution } from "./packaging/doResolution";

// doPackageResolution({ react: "^16.9.0", "react-dom": "^16.9.0" }).then(res => {
//   console.log(res);

//   //   const project = {
//   //       file:'index.js',
//   //       content: `
//   //       import {foo} from './foo.js';
//   //       console.log(foo);`
//   //   }
// });

ReactDOM.render(<App />, document.getElementById("root")!);
