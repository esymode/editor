import {
  StartOfResolution,
  lockFromExplicitDeps,
  ResolveSemverRequest
} from "./packageResolution";

test("resolves single leaf package", () => {
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
    fetchedPackageJsonRequests: [
      [{ name: "react", version: "16.11.0" }, { dependencies: {} }]
    ],
    state: res2.state
  });
  if (res3.stage !== "done-success") {
    throw new Error("wrong stage");
  }
  expect(res3.lock).toStrictEqual({
    "react@^16.0.0": "16.11.0"
  });
});

test("it dedups requests to resolve the same semver range", () => {
  const input: StartOfResolution = {
    stage: "start",
    deps: {
      a: "^1.0.0",
      b: "^1.0.0"
    }
  };

  const res = lockFromExplicitDeps(input);
  if (res.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  const res2 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [
      [{ name: "a", semver: "^1.0.0" }, "1.0.0"],
      [{ name: "b", semver: "^1.0.0" }, "1.0.0"]
    ],
    fetchedPackageJsonRequests: [],
    state: res.state
  });

  if (res2.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  const res3 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [],
    fetchedPackageJsonRequests: [
      [{ name: "a", version: "1.0.0" }, { dependencies: { c: "^0.1.0" } }],
      [{ name: "b", version: "1.0.0" }, { dependencies: { c: "^0.1.0" } }]
    ],
    state: res2.state
  });

  if (res3.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  const expectedSemverReq: ResolveSemverRequest = {
    name: "c",
    semver: "^0.1.0"
  };

  expect(res3.resolveSemverRequests).toEqual([expectedSemverReq]); // dedups c

  const res4 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [[{ name: "c", semver: "^0.1.0" }, "0.1.0"]],
    fetchedPackageJsonRequests: [],
    state: res3.state
  });

  if (res4.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res4.fetchPackageJsonRequests).toEqual([
    { name: "c", version: "0.1.0" }
  ]);

  // expect(res3.lock).toStrictEqual({
  //   "react@^16.0.0": "16.11.0"
  // });
});

test("it dedups requests to resolve the same package.json", () => {
  const input: StartOfResolution = {
    stage: "start",
    deps: {
      a: "^1.0.0",
      b: "^1.0.0"
    }
  };

  const res = lockFromExplicitDeps(input);
  if (res.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  const res2 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [
      [{ name: "a", semver: "^1.0.0" }, "1.0.0"],
      [{ name: "b", semver: "^1.0.0" }, "1.0.0"]
    ],
    fetchedPackageJsonRequests: [],
    state: res.state
  });

  if (res2.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  const res3 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [],
    fetchedPackageJsonRequests: [
      [{ name: "a", version: "1.0.0" }, { dependencies: { c: "^0.1.1" } }],
      [{ name: "b", version: "1.0.0" }, { dependencies: { c: "^0.1.0" } }]
    ],
    state: res2.state
  });

  if (res3.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  const expectedSemverReq: ResolveSemverRequest[] = [
    {
      name: "c",
      semver: "^0.1.1"
    },
    {
      name: "c",
      semver: "^0.1.0"
    }
  ];

  expect(res3.resolveSemverRequests).toEqual(expectedSemverReq); // dedups c

  const res4 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [
      [{ name: "c", semver: "^0.1.0" }, "0.1.1"],
      [{ name: "c", semver: "^0.1.1" }, "0.1.1"]
    ],
    fetchedPackageJsonRequests: [],
    state: res3.state
  });

  if (res4.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res4.fetchPackageJsonRequests).toEqual([
    { name: "c", version: "0.1.1" }
  ]);

  // expect(res3.lock).toStrictEqual({
  //   "react@^16.0.0": "16.11.0"
  // });
});

test("it dedups requests to resolve the same package.json", () => {
  const input: StartOfResolution = {
    stage: "start",
    deps: {
      a: "^1.0.0",
      b: "^1.0.0"
    }
  };

  const res = lockFromExplicitDeps(input);
  if (res.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  const res2 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [
      [{ name: "a", semver: "^1.0.0" }, "1.0.0"],
      [{ name: "b", semver: "^1.0.0" }, "1.0.0"]
    ],
    fetchedPackageJsonRequests: [],
    state: res.state
  });

  if (res2.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  const res3 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [],
    fetchedPackageJsonRequests: [
      [{ name: "a", version: "1.0.0" }, { dependencies: { c: "^0.1.0" } }],
      [{ name: "b", version: "1.0.0" }, { dependencies: { c: "^0.1.1" } }]
    ],
    state: res2.state
  });

  if (res3.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  const expectedSemverReq: ResolveSemverRequest[] = [
    {
      name: "c",
      semver: "^0.1.0"
    },
    {
      name: "c",
      semver: "^0.1.1"
    }
  ];

  expect(res3.resolveSemverRequests).toEqual(expectedSemverReq); // dedups c

  const res4 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [[{ name: "c", semver: "^0.1.1" }, "0.1.1"]],
    fetchedPackageJsonRequests: [],
    state: res3.state
  });

  if (res4.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res4.fetchPackageJsonRequests).toEqual([
    { name: "c", version: "0.1.1" }
  ]);

  // expect(res3.lock).toStrictEqual({
  //   "react@^16.0.0": "16.11.0"
  // });

  const res5 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [[{ name: "c", semver: "^0.1.0" }, "0.1.1"]],
    fetchedPackageJsonRequests: [],
    state: res4.state
  });

  if (res5.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res5.fetchPackageJsonRequests).toEqual([]);

  const res6 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [],
    fetchedPackageJsonRequests: [
      [{ name: "c", version: "0.1.1" }, { dependencies: {} }]
    ],
    state: res5.state
  });
  if (res6.stage !== "done-success") {
    throw new Error("wrong stage");
  }
  expect(res6.lock).toEqual({
    "a@^1.0.0": "1.0.0",
    "b@^1.0.0": "1.0.0",
    "c@^0.1.0": "0.1.1",
    "c@^0.1.1": "0.1.1"
  });
});

test("resolve diamond of packages", () => {
  const input: StartOfResolution = {
    stage: "start",
    deps: {
      a: "^1.2.3"
    }
  };

  const res = lockFromExplicitDeps(input);
  if (res.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res.resolveSemverRequests).toStrictEqual([
    { name: "a", semver: "^1.2.3" }
  ]);
  expect(res.fetchPackageJsonRequests).toStrictEqual([]);

  const res2 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [[{ name: "a", semver: "^1.2.3" }, "1.2.3"]],
    fetchedPackageJsonRequests: [],
    state: res.state
  });
  if (res2.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res2.fetchPackageJsonRequests).toStrictEqual([
    { name: "a", version: "1.2.3" }
  ]);
  expect(res2.resolveSemverRequests).toStrictEqual([]);

  const res3 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [],
    fetchedPackageJsonRequests: [
      [
        { name: "a", version: "1.2.3" },
        { dependencies: { b: "^1.2.3", c: "^1.2.3" } }
      ]
    ],
    state: res2.state
  });
  if (res3.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }
  expect(res3.resolveSemverRequests).toStrictEqual([
    { name: "b", semver: "^1.2.3" },
    { name: "c", semver: "^1.2.3" }
  ]);
  expect(res3.fetchPackageJsonRequests).toStrictEqual([]);

  const res4 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [
      [{ name: "b", semver: "^1.2.3" }, "1.2.3"],
      [{ name: "c", semver: "^1.2.3" }, "1.2.3"]
    ],
    fetchedPackageJsonRequests: [],
    state: res3.state
  });
  if (res4.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res4.fetchPackageJsonRequests).toStrictEqual([
    { name: "b", version: "1.2.3" },
    { name: "c", version: "1.2.3" }
  ]);
  expect(res4.resolveSemverRequests).toStrictEqual([]);

  const res5 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [],
    fetchedPackageJsonRequests: [
      [{ name: "b", version: "1.2.3" }, { dependencies: {} }],
      [{ name: "c", version: "1.2.3" }, { dependencies: {} }]
    ],
    state: res4.state
  });

  if (res5.stage !== "done-success") {
    throw new Error("wrong stage");
  }

  expect(res5.lock).toStrictEqual({
    "a@^1.2.3": "1.2.3",
    "b@^1.2.3": "1.2.3",
    "c@^1.2.3": "1.2.3"
  });
});

test("resolves peer dependencies but does not fetch them", () => {
  const input: StartOfResolution = {
    stage: "start",
    deps: {
      a: "1.0.0",
      b: "1.0.0"
    }
  };

  const res = lockFromExplicitDeps(input);
  if (res.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res.resolveSemverRequests).toStrictEqual([
    { name: "a", semver: "1.0.0" },
    { name: "b", semver: "1.0.0" }
  ]);
  expect(res.fetchPackageJsonRequests).toStrictEqual([]);

  const res2 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [
      [{ name: "a", semver: "1.0.0" }, "1.0.0"],
      [{ name: "b", semver: "1.0.0" }, "1.0.0"]
    ],
    fetchedPackageJsonRequests: [],
    state: res.state
  });
  if (res2.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res2.fetchPackageJsonRequests).toStrictEqual([
    { name: "a", version: "1.0.0" },
    { name: "b", version: "1.0.0" }
  ]);
  expect(res2.resolveSemverRequests).toStrictEqual([]);

  const res3 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [],
    fetchedPackageJsonRequests: [
      [{ name: "a", version: "1.0.0" }, { dependencies: { c: "1.0.0" } }],
      [{ name: "b", version: "1.0.0" }, { peerDependencies: { c: "^1.0.0" } }]
    ],
    state: res2.state
  });
  if (res3.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }
  expect(res3.resolveSemverRequests).toStrictEqual([
    { name: "c", semver: "1.0.0" }
  ]);
  expect(res3.fetchPackageJsonRequests).toStrictEqual([]);

  const res4 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [[{ name: "c", semver: "1.0.0" }, "1.0.0"]],
    fetchedPackageJsonRequests: [],
    state: res3.state
  });
  if (res4.stage !== "paused-for-io") {
    throw new Error("wrong stage");
  }

  expect(res4.fetchPackageJsonRequests).toStrictEqual([
    { name: "c", version: "1.0.0" }
  ]);
  expect(res4.resolveSemverRequests).toStrictEqual([]);

  const res5 = lockFromExplicitDeps({
    stage: "ready-to-resume",
    resolvedSemVerRequests: [],
    fetchedPackageJsonRequests: [
      [{ name: "c", version: "1.0.0" }, { dependencies: {} }]
    ],
    state: res4.state
  });

  if (res5.stage !== "done-success") {
    throw new Error("wrong stage");
  }

  expect(res5.lock).toStrictEqual({
    "a@1.0.0": "1.0.0",
    "b@1.0.0": "1.0.0",
    "c@1.0.0": "1.0.0",
    "c@^1.0.0": "1.0.0"
  });
});
