import { normalizePath, dirname, join } from "./normalizedPath";
import { Ok, unsafeUnwrap as unwrap, Err } from "./functionalNonsense";

test("normalize", () => {
  expect(normalizePath("")).toStrictEqual(Ok(""));
  expect(normalizePath("abc")).toStrictEqual(Ok("abc"));
  expect(normalizePath("./abc")).toStrictEqual(Ok("abc"));
  expect(normalizePath("././abc")).toStrictEqual(Ok("abc"));
  expect(normalizePath("foo/./abc")).toStrictEqual(Ok("foo/abc"));
  expect(normalizePath("foo/../abc")).toStrictEqual(Ok("abc"));
  expect(normalizePath("../abc")).toStrictEqual(Ok("../abc"));
  expect(normalizePath("../../abc")).toStrictEqual(Ok("../../abc"));
  expect(normalizePath("../def/../abc")).toStrictEqual(Ok("../abc"));
  expect(normalizePath(".../abc")).toStrictEqual(Ok(".../abc"));
  expect(normalizePath("//abc")).toStrictEqual(
    Err(`Path "//abc" has an empty segment`)
  );
});

test("dirname", () => {
  expect(dirname(unwrap(normalizePath("abc/def")))).toStrictEqual(
    normalizePath("abc")
  );
  expect(dirname(unwrap(normalizePath("abc")))).toStrictEqual(
    normalizePath("")
  );
});

test("join", () => {
  expect(
    join(unwrap(normalizePath("")), unwrap(normalizePath("abc")))
  ).toStrictEqual(normalizePath("abc"));

  expect(
    join(unwrap(normalizePath("abc")), unwrap(normalizePath("")))
  ).toStrictEqual(Err("Second argument to join was empty"));
  expect(
    join(unwrap(normalizePath("abc")), unwrap(normalizePath("def")))
  ).toStrictEqual(normalizePath("abc/def"));
  expect(
    join(unwrap(normalizePath("abc/def")), unwrap(normalizePath("def")))
  ).toStrictEqual(normalizePath("abc/def/def"));
});
