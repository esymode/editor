import { of, Union } from "ts-union";
import { Map as Dict } from "immutable";

export const Evt = Union({
  SelectFile: of<FileId>(),
  AddFile: of<string, FolderId | undefined>(),
  AddFolder: of<string, FolderId>(),
  // SaveContent: of<FileId, string>(),
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

export type ProjectFiles = {
  version: number;
  selectedFile: FileId | null;
  rootId: FolderId;
  files: Dict<FileId, FileItem>;
  folders: Dict<FolderId, FolderItem>;
};

// fileContent: Map<FileId, string>;

export const createProjectFiles = (): ProjectFiles => {
  const rootId = genFolderId(0);
  return {
    version: 1,
    rootId,
    selectedFile: null,
    files: Dict(),
    folders: Dict<FolderId, FolderItem>().set(rootId, {
      children: [],
      name: "root"
    })
  };
};

const unsafeGetItem = <K, T>(map: Dict<K, T>, key: K): T => {
  const item = map.get(key);
  if (item === undefined)
    throw new Error(`unsafeGetItem failed for key=${key}`);
  return item;
};

// const toRealProject = (proj: ProjectFiles): ProjectFiles => proj as any;
// const toOpaqueProject = (proj: ProjectFiles): ProjectFiles => proj as any;

export const getFile = (project: ProjectFiles, fileId: FileId): FileItem =>
  unsafeGetItem(project.files, fileId);

export const getFolder = (
  project: ProjectFiles,
  folderId: FolderId
): FolderItem => unsafeGetItem(project.folders, folderId);

// export function getProjectItem(project: ProjectFiles, id: FileId): FileItem;
// export function getProjectItem(project: ProjectFiles, id: FolderId): FolderItem;
// export function getProjectItem(
//   project: ProjectFiles,
//   id: FolderId | FileId
// ): FolderItem | FileItem;
// export function getProjectItem(
//   project: ProjectFiles,
//   id: FolderId | FileId
// ): FolderItem | FileItem {
//   return isFile(id) ? getFile(project, id) : getFolder(project, id);
// }

// export const addFile = (
//   project: ProjectFiles,
//   name: string,
//   toFolderId?: FolderId
// ): [ProjectFiles, FileId] => {
//   const { rootId, folders, files } = toRealProject(project);

//   const id = genFileId();

//   const folderId = toFolderId ?? rootId;
//   const folderItem = unsafeGetItem(folders, folderId);

//   return [
//     toOpaqueProject({
//       rootId,
//       folders: folders.set(folderId, {
//         ...folderItem,
//         children: folderItem.children.concat(id)
//       }),
//       files: files.set(id, { name })
//     }),
//     id
//   ];
// };

// export const addFolder = (
//   project: ProjectFiles,
//   name: string,
//   toFolderId?: FolderId
// ): [ProjectFiles, FolderId] => {
//   const { rootId, folders, files } = toRealProject(project);

//   const id = genFolderId();

//   const parent = toFolderId ?? rootId;
//   const folderItem = unsafeGetItem(folders, parent);

//   folders.set(id, { name, children: [] }).set(parent, {
//     ...folderItem,
//     children: folderItem.children.concat(id)
//   });

//   return [toOpaqueProject({ rootId, folders, files }), id];
// };

// export const getRootFiles = (project: ProjectFiles): (FileId | FolderId)[] => {
//   const { rootId, folders } = toRealProject(project);
//   return unsafeGetItem(folders, rootId).children;
// };

export const projectFileReducer = (
  prev: ProjectFiles,
  evt: Evt
): ProjectFiles =>
  Evt.match<ProjectFiles>(evt, {
    SelectFile: id => ({ ...prev, activeFileId: id }),

    AddFile: (fileName, toFolderId = prev.rootId) => {
      const { version, files, folders, rootId } = prev;
      const id = genFileId(version);

      const { name, children } = unsafeGetItem(folders, toFolderId);

      return {
        rootId,
        selectedFile: id,
        version: version + 1,
        folders: folders.set(toFolderId, {
          name,
          children: children.concat(id)
        }),
        files: files.set(id, { name: fileName })
      };
    },

    AddFolder: (folderName, toFolderId = prev.rootId) => {
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

    DeleteFileOrFolder: id => {
      // TODO
      const { version, files, folders, rootId, selectedFile } = prev;
      const { name, children } = unsafeGetItem(folders, rootId);

      if (children.find(cid => cid === id) || !isFile(id)) {
        throw new Error("unimplemented");
      }

      return {
        ...prev,
        version: version + 1,
        files: files.delete(id),
        folders: folders.set(rootId, {
          name,
          children: children.filter(cid => cid !== id)
        }),
        selectedFile: selectedFile === id ? null : selectedFile
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
