import { StartOfResolution, lockFromExplicitDeps } from "./packageResolution";

test("resolves packages", () => {
  const input: StartOfResolution = {
    stage: "start",
    deps: {
      react: "^16.0.0"
    }
  };

  const res = lockFromExplicitDeps(input);
  if (res.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res.resolveSemverRequests).toStrictEqual([
    { name: "react", semver: "^16.0.0" }
  ]);
  expect(res.fetchPackageJsonRequests).toStrictEqual([]);

  const res2 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [[{ name: "react", semver: "^16.0.0" }, "16.11.0"]],
    fetchedPackageJsonRequests: [],
    state: res.state
  });
  if (res2.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res2.fetchPackageJsonRequests).toStrictEqual([
    { name: "react", version: "16.11.0" }
  ]);
  expect(res2.resolveSemverRequests).toStrictEqual([]);

  const res3 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [],
    fetchedPackageJsonRequests: [{ dependencies: {} }],
    state: res2.state
  });
  if (res3.stage !== "done") {
    throw new Error("wrong stage");
  }
  expect(res3.lock).toStrictEqual({
    "react@^16.0.0": "16.11.0"
  });
});
