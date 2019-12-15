import * as ReactDOM from "react-dom";
import * as React from "react";
import { IDE } from "./Editor";
// import { doPackageResolution } from "./packaging/doResolution";

// doPackageResolution({ react: "^16.9.0", "react-dom": "^16.9.0" }).then(res => {
//   console.log(res);
// });

console.log({ IDE });
ReactDOM.render(<IDE />, document.getElementById("root")!);
