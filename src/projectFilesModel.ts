import { of, Union } from "ts-union";
import { Map as Dict } from "immutable";

export const Evt = Union({
  SelectFile: of<FileId>(),
  AddFile: of<string, FolderId | undefined>(),
  AddFolder: of<string, FolderId>(),
  SaveContent: of<FileId, string>(),
  DeleteFileOrFolder: of<FileId | FolderId>()
});

export type Evt = typeof Evt.T;

export type Dispatch = (evt: Evt) => void;

export type FileItem = {
  // tag: "file";
  // id: FileId;
  name: string;
};

export type FolderItem = {
  // tag: "folder";
  // id: FolderId;
  name: string;
  children: (FolderId | FileId)[];
};

// export interface ProjectFiles {
//   readonly __tag: unique symbol;
// }

export type ProjectModel = {
  version: number;
  selectedFile: FileId | null;
  rootId: FolderId;
  files: Dict<FileId, FileItem>;
  folders: Dict<FolderId, FolderItem>;
  sources: Map<FileId, string>;
};

// fileContent: Map<FileId, string>;

export const createProjectFiles = (): ProjectModel => {
  const rootId = genFolderId(0);
  return {
    version: 1,
    rootId,
    selectedFile: null,
    files: Dict(),
    folders: Dict<FolderId, FolderItem>().set(rootId, {
      children: [],
      name: "root"
    }),
    sources: new Map()
  };
};

export const unsafeGetItem = <K, T>(map: Dict<K, T>, key: K): T => {
  const item = map.get(key);
  if (item === undefined)
    throw new Error(`unsafeGetItem failed for key=${key}`);
  return item;
};

export const getFile = (project: ProjectModel, fileId: FileId): FileItem =>
  unsafeGetItem(project.files, fileId);

export const getFolder = (
  project: ProjectModel,
  folderId: FolderId
): FolderItem => unsafeGetItem(project.folders, folderId);

export const projectFileReducer = (
  prev: ProjectModel,
  evt: Evt
): ProjectModel =>
  Evt.match<ProjectModel>(evt, {
    SelectFile: (id): ProjectModel => ({ ...prev, selectedFile: id }),

    SaveContent: (fileId, source) => {
      // mutable set
      prev.sources.set(fileId, source);
      // avoid rerender
      return prev;
    },

    AddFile: (fileName, toFolderId = prev.rootId): ProjectModel => {
      const { version, files, folders, rootId, sources } = prev;
      const id = genFileId(version);

      const { name, children } = unsafeGetItem(folders, toFolderId);

      return {
        rootId,
        sources: sources.set(id, ""),
        selectedFile: id,
        version: version + 1,
        folders: folders.set(toFolderId, {
          name,
          children: children.concat(id)
        }),
        files: files.set(id, { name: fileName })
      };
    },

    AddFolder: (folderName, toFolderId = prev.rootId): ProjectModel => {
      const { version, folders } = prev;
      const id = genFolderId(version);

      const { name, children } = unsafeGetItem(folders, toFolderId);

      return {
        ...prev,
        version: version + 1,
        folders: folders
          .set(toFolderId, {
            name,
            children: children.concat(id)
          })
          .set(id, { name: folderName, children: [] })
      };
    },

    DeleteFileOrFolder: (id): ProjectModel => {
      // TODO
      const { version, files, folders, rootId, selectedFile } = prev;
      const { name, children } = unsafeGetItem(folders, rootId);

      if (!children.find(cid => cid === id) || !isFile(id)) {
        throw new Error("unimplemented");
      }

      const newFiles = files.delete(id);
      return {
        ...prev,
        version: version + 1,
        files: newFiles,
        folders: folders.set(rootId, {
          name,
          children: children.filter(cid => cid !== id)
        }),
        selectedFile:
          selectedFile === id
            ? newFiles.size > 0
              ? newFiles.findKey(() => true) || null
              : null
            : selectedFile
      };
    }
  });

// new types to mark files and folders
export interface FileId {
  readonly __tag: unique symbol;
}

export interface FolderId {
  readonly __tag: unique symbol;
}

// const genBigPositiveNumber = () => Math.round(Math.random() * 2 ** 31);

export const unwrapItemId = (id: FileId | FolderId): number => id as any;
const genFileId = (version: number): FileId => version as any;
const genFolderId = (version: number): FolderId => (-1 * version) as any;
export const isFile = (id: FileId | FolderId): id is FileId =>
  ((id as unknown) as number) > 0;
