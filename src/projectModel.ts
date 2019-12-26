import { of, Union } from "ts-union";
import { Map as Dict } from "immutable";

export const Evt = Union({
  SelectItem: of<FileId | FolderId>(),
  AddFile: of<string>(),
  AddFolder: of<string>(),
  SaveContent: of<FileId, string>(),
  DeleteFileOrFolder: of<FileId | FolderId>(),
  SwitchToTab: of<FileId>(),
  CloseTab: of<FileId>(),
  MarkFileDrity: of<FileId>(),
  PersistUnsavedChanges: of<FileId, string>()
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
  isExpanded: boolean;
  children: (FolderId | FileId)[];
};

interface SomeOpenedFiles {
  tag: "filled";
  activeTab: FileId;
  tabs: FileId[];
  unsaved: Dict<FileId, string | null>;
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
  let { tabs, activeTab, unsaved } = prev;

  if (tabs.findIndex(t => t === fileId) < 0) return [prev, prev.activeTab];

  tabs = tabs.filter(t => t !== fileId);
  unsaved = unsaved.delete(fileId);

  if (tabs.length === 0) return [{ tag: "empty" }, null];

  activeTab = activeTab === fileId ? tabs[0] : activeTab;
  return [{ tag: "filled", unsaved, tabs, activeTab }, activeTab];
};

export type ProjectModel = {
  nextId: number;
  selectedItem: FileId | FolderId | null;
  rootId: FolderId;
  files: Dict<FileId, FileItem>;
  folders: Dict<FolderId, FolderItem>;
  sources: Dict<FileId, string>;
  openedFiles: OpenedFiles;
};

export const createProjectFiles = (): ProjectModel => {
  const rootId = genFolderId(1);
  return {
    nextId: 2,
    rootId,
    selectedItem: null,
    files: Dict(),
    folders: Dict<FolderId, FolderItem>().set(rootId, {
      children: [],
      name: "root",
      isExpanded: true
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

const findParentFolder = (
  folders: Dict<FolderId, FolderItem>,
  start: FolderId,
  id: FileId | FolderId
): FolderId | undefined => {
  const folder = unsafeGetItem(folders, start);

  for (const child of folder.children) {
    if (child === id) return start;

    const candidate = isFile(child)
      ? undefined
      : findParentFolder(folders, child, id);

    if (candidate) return candidate;
  }

  return undefined;
};

// it is a copy paste from above but a bit slower because of array shenanigans
const findFolderHierarchy = (
  folders: Dict<FolderId, FolderItem>,
  start: FolderId,
  id: FileId | FolderId
): [FolderId, ...FolderId[]] | undefined => {
  const folder = unsafeGetItem(folders, start);

  for (const child of folder.children) {
    if (child === id) return [start];

    const candidate = isFile(child)
      ? undefined
      : findFolderHierarchy(folders, child, id);

    if (candidate) return [start, ...candidate];
  }

  return undefined;
};

const DeleteCommand = Union({
  Folder: of<FolderId, FolderId>(),
  File: of<FileId, FolderId>()
});
type DeleteCommand = typeof DeleteCommand.T;

const aggregateAllNestedItemsToDelete = (
  folders: Dict<FolderId, FolderItem>,
  start: FolderId,
  parent: FolderId
): DeleteCommand[] =>
  unsafeGetItem(folders, start).children.reduce(
    (cmds, child) =>
      cmds.concat(
        isFile(child)
          ? DeleteCommand.File(child, start)
          : aggregateAllNestedItemsToDelete(folders, child, start)
      ),
    [DeleteCommand.Folder(start, parent)]
  );

const collectAllFilesAndFoldersToDelete = (
  id: FileId | FolderId,
  project: ProjectModel
): DeleteCommand[] => {
  const { folders, rootId } = project;

  const parent =
    findParentFolder(folders, rootId, id) ??
    fail(`couldn't find parent for ${id}`);

  return isFile(id)
    ? [DeleteCommand.File(id, parent)]
    : aggregateAllNestedItemsToDelete(folders, id, parent);
};

const removeChild = (
  parent: FolderItem,
  id: FolderId | FileId
): FolderItem => ({
  ...parent,
  children: parent.children.filter(cid => cid !== id)
});

const updateInDict = <K, V>(
  dict: Dict<K, V>,
  key: K,
  upd: (v: V) => V | undefined
): Dict<K, V> => {
  const val = dict.get(key);
  if (val === undefined) return dict;
  const newVal = upd(val);
  return newVal === undefined ? dict : dict.set(key, newVal);
};

const fail = (reason: string): never => {
  throw new Error(reason);
};

export const updateProjectModel = (
  prev: ProjectModel,
  evt: Evt
): ProjectModel => {
  const start = performance.now();
  const res = Evt.match<ProjectModel>(evt, {
    SelectItem: (id): ProjectModel => {
      const { openedFiles, folders } = prev;
      return {
        ...prev,
        selectedItem: id,
        folders: isFile(id)
          ? folders
          : updateInDict(folders, id, f => ({
              ...f,
              isExpanded: !f.isExpanded
            })),
        openedFiles: isFile(id)
          ? openFileInEditor(openedFiles, id)
          : openedFiles
      };
    },

    SaveContent: (fileId, source) => {
      const { openedFiles, sources } = prev;

      const opened =
        openedFiles.tag === "filled" && openedFiles.unsaved.has(fileId)
          ? {
              ...openedFiles,
              unsaved: openedFiles.unsaved.delete(fileId)
            }
          : openedFiles;

      return {
        ...prev,
        openedFiles: opened,
        sources: sources.set(fileId, source)
      };
    },

    AddFile: (fileName): ProjectModel => {
      const {
        nextId,
        files,
        folders,
        rootId,
        openedFiles,
        sources,
        selectedItem
      } = prev;
      const id = genFileId(nextId);
      const toFolderId = selectedItem
        ? isFile(selectedItem)
          ? findParentFolder(folders, rootId, selectedItem) || rootId
          : selectedItem
        : rootId;
      const { name, children } = unsafeGetItem(folders, toFolderId);
      return {
        rootId,
        sources: sources.set(id, ""),
        selectedItem: id,
        nextId: nextId + 1,
        folders: folders.set(toFolderId, {
          name,
          isExpanded: true,
          children: children.concat(id)
        }),
        files: files.set(id, { name: fileName }),
        openedFiles: openFileInEditor(openedFiles, id)
      };
    },
    AddFolder: (folderName): ProjectModel => {
      const { nextId, folders, selectedItem, rootId } = prev;
      const id = genFolderId(nextId);
      const toFolderId = selectedItem
        ? isFile(selectedItem)
          ? findParentFolder(folders, rootId, selectedItem) || rootId
          : selectedItem
        : rootId;
      const { name, children } = unsafeGetItem(folders, toFolderId);
      return {
        ...prev,
        nextId: nextId + 1,
        selectedItem: id,
        folders: folders
          .set(toFolderId, {
            name,
            isExpanded: true,
            children: children.concat(id)
          })
          .set(id, { name: folderName, children: [], isExpanded: true })
      };
    },
    DeleteFileOrFolder: (id): ProjectModel => {
      // all of these references might be mutated, thus "let"
      let { files, folders, sources, selectedItem, openedFiles } = prev;
      const deleteCmds = collectAllFilesAndFoldersToDelete(id, prev);
      let openedTab: FileId | null = null;
      // console.log("$$", { id, prev });
      // mutation block
      for (const cmd of deleteCmds) {
        DeleteCommand.match(cmd, {
          Folder: (folderId, parentId) => {
            folders = folders.delete(folderId);
            // todo this is copypaste from below
            const parent = folders.get(parentId);
            if (parent !== undefined) {
              folders = folders.set(parentId, removeChild(parent, folderId));
            }
            if (selectedItem === folderId) selectedItem = null;
          },
          File: (fileId, parentId) => {
            // todo this is copypaste from above
            const parent = folders.get(parentId);
            if (parent !== undefined) {
              folders = folders.set(parentId, removeChild(parent, fileId));
            }
            files = files.delete(fileId);
            sources = sources.delete(fileId);
            [openedFiles, openedTab] = closeFileInEditor(openedFiles, fileId);
            if (selectedItem === fileId) selectedItem = null;
          }
        });
      }
      // if we close selected tab by deleting a file reselect the first one
      if (openedTab === null) {
        if (openedFiles.tag === "filled" && openedFiles.tabs.length > 0) {
          openedTab = openedFiles.tabs[0];
          openedFiles = openFileInEditor(openedFiles, openedTab);
        }
      }
      // console.log("$$", {
      //   id,
      //   files,
      //   folders,
      //   sources,
      //   openedFiles
      // });
      return {
        ...prev,
        nextId: prev.nextId + 1,
        files,
        folders,
        sources,
        // if we deleted selected item reselect the one in tabs instead
        // TODO: is this actually desired behavior?
        selectedItem: selectedItem ?? openedTab,
        openedFiles
      };
    },
    SwitchToTab: (fileId): ProjectModel => {
      // note that referece itself is mutable but data structures are immutable
      let { openedFiles, folders, rootId } = prev;
      openedFiles = openFileInEditor(openedFiles, fileId);
      // auto expand on switching a tab
      const path = findFolderHierarchy(folders, rootId, fileId);

      // console.log("##", { path, folders });
      if (path) {
        folders = folders.withMutations(fs =>
          path.forEach(folderId =>
            updateInDict(fs, folderId, f =>
              f.isExpanded ? undefined : { ...f, isExpanded: true }
            )
          )
        );
      }
      // console.log("##", { folders });
      return {
        ...prev,
        openedFiles,
        folders,
        selectedItem: openedFiles.activeTab
      };
    },

    CloseTab: (fileId): ProjectModel => {
      const [opened] = closeFileInEditor(prev.openedFiles, fileId);
      return { ...prev, openedFiles: opened };
    },

    MarkFileDrity: (fileId): ProjectModel => {
      const { openedFiles } = prev;
      if (openedFiles.tag === "empty") return prev;
      const { unsaved } = openedFiles;
      return {
        ...prev,
        openedFiles: {
          ...openedFiles,
          unsaved: unsaved.has(fileId) ? unsaved : unsaved.set(fileId, null)
        }
      };
    },
    PersistUnsavedChanges: (fileId, content): ProjectModel => {
      const { openedFiles } = prev;
      if (openedFiles.tag === "empty") return prev;
      const { unsaved } = openedFiles;
      if (!unsaved.has(fileId)) return prev;
      return {
        ...prev,
        openedFiles: {
          ...openedFiles,
          unsaved: unsaved.set(fileId, content)
        }
      };
    }
  });

  const duration = performance.now() - start;

  console.log("projectModel update evt=", evt, `took=${duration}ms`);

  return res;
};

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
