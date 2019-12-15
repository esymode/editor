import { of, Union } from "ts-union";

type FilePath = string;

export const Evt = Union({
  SelectFile: of<FilePath>(),
  AddFile: of<FilePath>(),
  SaveContent: of<FilePath, string>()
});

export type Evt = typeof Evt.T;

export type Dispatch = (evt: Evt) => void;
