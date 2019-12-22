import { of, Union } from "ts-union";
import { Map as Dict } from "immutable";

export const Evt = Union({
  SelectFile: of<FileId>(),
  AddFile: of<string, FolderId | undefined>(),
  AddFolder: of<string, FolderId | undefined>(),
  SaveContent: of<FileId, string>(),
  DeleteFileOrFolder: of<FileId | FolderId>(),
  SwitchToTab: of<FileId>()
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

interface SomeOpenedFiles {
  tag: "filled";
  activeTab: FileId;
  tabs: FileId[];
  unsaved: Dict<FileId, string>;
}

// export interface ProjectFiles {
//   readonly __tag: unique symbol;
// }

export type OpenedFiles = { tag: "empty" } | SomeOpenedFiles;

const openFileInEditor = (
  prev: OpenedFiles,
  fileId: FileId
): SomeOpenedFiles => {
  if (prev.tag === "empty") {
    return {
      tag: "filled",
      activeTab: fileId,
      tabs: [fileId],
      unsaved: Dict()
    };
  }

  const { tabs, activeTab } = prev;
  const isAlreadyInTabs = tabs.findIndex(t => t === fileId) >= 0;

  if (!isAlreadyInTabs) {
    // open a new file
    return {
      ...prev,
      tabs: tabs.concat(fileId),
      activeTab: fileId
    };
  }

  // nothing to do here, reselecting already opened file
  if (activeTab === fileId) return prev;

  // just jump to selected file
  return { ...prev, activeTab: fileId };
};

const closeFileInEditor = (
  prev: OpenedFiles,
  fileId: FileId
): [OpenedFiles, FileId | null] => {
  if (prev.tag === "empty") return [prev, null];
  let { tabs, activeTab } = prev;

  if (tabs.findIndex(t => t === fileId) < 0) return [prev, prev.activeTab];

  tabs = tabs.filter(t => t !== fileId);

  if (tabs.length === 0) return [{ tag: "empty" }, null];

  activeTab = activeTab === fileId ? tabs[0] : activeTab;
  return [{ ...prev, tabs, activeTab }, activeTab];
};

export type ProjectModel = {
  version: number;
  selectedFile: FileId | null;
  rootId: FolderId;
  files: Dict<FileId, FileItem>;
  folders: Dict<FolderId, FolderItem>;
  sources: Dict<FileId, string>;
  openedFiles: OpenedFiles;
};

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
    sources: Dict(),
    openedFiles: { tag: "empty" }
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

export const updateProjectModel = (
  prev: ProjectModel,
  evt: Evt
): ProjectModel =>
  Evt.match<ProjectModel>(evt, {
    SelectFile: (id): ProjectModel => ({
      ...prev,
      selectedFile: id,
      openedFiles: openFileInEditor(prev.openedFiles, id)
    }),

    SaveContent: (fileId, source) => {
      // mutable set
      prev.sources = prev.sources.set(fileId, source);
      // avoid rerender
      return prev;
    },

    AddFile: (fileName, toFolderId = prev.rootId): ProjectModel => {
      const { version, files, folders, rootId, openedFiles, sources } = prev;
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
        files: files.set(id, { name: fileName }),
        openedFiles: openFileInEditor(openedFiles, id)
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
      // TODO implement deleting nested files and folders
      const {
        version,
        files,
        folders,
        rootId,
        // selectedFile,
        openedFiles
      } = prev;
      const { name, children } = unsafeGetItem(folders, rootId);

      if (!children.find(cid => cid === id) || !isFile(id)) {
        throw new Error(
          "at the moment you can only delete files at the root level (not folders or nested files)"
        );
      }

      const newFiles = files.delete(id);

      let [opened, selected] = closeFileInEditor(openedFiles, id);

      if (selected === null) {
        if (newFiles.size > 0) {
          selected = newFiles.findKey(() => true)!;
          opened = openFileInEditor(opened, selected);
        }
      }

      return {
        ...prev,
        version: version + 1,
        files: newFiles,
        folders: folders.set(rootId, {
          name,
          children: children.filter(cid => cid !== id)
        }),
        selectedFile: selected,
        openedFiles: opened
      };
    },

    SwitchToTab: (fileId): ProjectModel => {
      const { openedFiles } = prev;
      const opened = openFileInEditor(openedFiles, fileId);
      return { ...prev, openedFiles: opened, selectedFile: opened.activeTab };
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
