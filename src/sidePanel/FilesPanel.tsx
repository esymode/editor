import * as React from "react";
import { useState } from "react";

import { css } from "emotion";

import {
  FaFile,
  FaFolder,
  FaFolderOpen,
  FaChevronDown,
  FaTrash,
  FaChevronRight,
  FaFolderPlus,
  FaPlusSquare
} from "react-icons/fa";
import {
  Dispatch,
  Evt,
  ProjectModel,
  unwrapItemId,
  FolderId,
  FileId,
  isFile,
  getFile,
  getFolder,
  unsafeGetItem
} from "../projectModel";
import { Horizontal, IconBtn } from "src/styles";

// const panelStyle = css`
//   flex: 1;
// `;

// import React, { Component } from "react";
// import styled from "styled-components";
// import Tree from "./Tree";

// width: 800px;
// max-width: 100%;

const panelStyle = css`
  margin: 0 auto;
  display: flex;
  flex-direction: column;
`;

// const TreeWrapper = css`
//   width: 250px;
// `;

export const FilesPanel: React.FC<{
  projectFiles: ProjectModel;
  dispatch: Dispatch;
}> = ({ projectFiles, dispatch }) => {
  const { rootId, folders } = projectFiles;
  const { children } = unsafeGetItem(folders, rootId);
  return (
    <div className={panelStyle}>
      <Horizontal>
        <IconBtn
          text="File"
          Icon={FaPlusSquare}
          onClick={() => {
            const filename = prompt("File name?");
            if (filename) {
              dispatch(Evt.AddFile(filename, undefined));
            }
          }}
        />
        <IconBtn
          text="Folder"
          Icon={FaFolderPlus}
          onClick={() => {
            const foldername = prompt("Folder name?");
            if (foldername) {
              dispatch(Evt.AddFolder(foldername, undefined));
            }
          }}
        />
      </Horizontal>

      {renderChildren(children, 0, projectFiles, dispatch)}
    </div>
  );
};

const INDENT = 16;
const getPaddingLeft = (level: number, type: "folder" | "file") =>
  type === "folder" ? level * INDENT : level * INDENT + 12;

// padding-left: ${props => getPaddingLeft(props.level, props.type)}px;
const itemStyle = css`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
`;

const itemRowStyle = css`
  display: flex;
  flex: 1;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  padding: 5px 8px;
  &:hover {
    background: lightgray;
  }
`;

const chevronStyle = css`
  font-size: 12px;
  margin-right: 5px;
`;

const itemIconStyle = css`
  font-size: 12px;
  margin-right: 10px;
`;

// level={level} type={item.tag}
const FolderView: React.FC<{
  projectFiles: ProjectModel;
  folderId: FolderId;
  level?: number;
  dispatch: Dispatch;
}> = ({ projectFiles, folderId, dispatch, level = 0 }) => {
  const [isOpened, setIsOpened] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const toggleOpen = () => setIsOpened(!isOpened);

  const item = getFolder(projectFiles, folderId);

  return (
    <>
      <div
        className={itemRowStyle}
        style={{ paddingLeft: getPaddingLeft(level, "folder") }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={itemStyle} onClick={toggleOpen}>
          <div className={chevronStyle} onClick={toggleOpen}>
            {isOpened ? <FaChevronDown /> : <FaChevronRight />}
          </div>

          <div className={itemIconStyle}>
            {isOpened ? <FaFolderOpen /> : <FaFolder />}
          </div>

          <span role="button">{item.name}</span>
        </div>
        <div
          role="button"
          hidden={!isHovered}
          onClick={() => dispatch(Evt.DeleteFileOrFolder(folderId))}
        >
          <FaTrash size={12} />
        </div>
      </div>

      {isOpened && renderChildren(item.children, level, projectFiles, dispatch)}
    </>
  );
};

const FileView: React.FC<{
  projectFiles: ProjectModel;
  fileId: FileId;
  level?: number;
  dispatch: Dispatch;
}> = ({ projectFiles, fileId, dispatch, level = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  const item = getFile(projectFiles, fileId);

  const isSelected = projectFiles.selectedFile === fileId;
  return (
    <div
      className={itemRowStyle}
      style={{
        paddingLeft: getPaddingLeft(level, "file"),
        outline: isSelected ? "green solid 1px" : undefined
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={itemStyle}
        onClick={() => dispatch(Evt.SelectFile(fileId))}
      >
        <div className={itemIconStyle}>
          <FaFile />
        </div>

        <span role="button">{item.name}</span>
      </div>
      <div
        role="button"
        hidden={!isHovered}
        onClick={() => dispatch(Evt.DeleteFileOrFolder(fileId))}
      >
        <FaTrash size={12} />
      </div>
    </div>
  );
};

function renderChildren(
  children: (FileId | FolderId)[],
  level: number,
  projectFiles: ProjectModel,
  dispatch: Dispatch
) {
  return children.map(childId =>
    isFile(childId) ? (
      <FileView
        key={unwrapItemId(childId)}
        level={level + 1}
        fileId={childId}
        projectFiles={projectFiles}
        dispatch={dispatch}
      />
    ) : (
      <FolderView
        projectFiles={projectFiles}
        dispatch={dispatch}
        key={unwrapItemId(childId)}
        level={level + 1}
        folderId={childId}
      />
    )
  );
}
