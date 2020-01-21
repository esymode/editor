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
import { Horizontal, IconBtn } from "../styles";
import { useMouseHover } from "../shared/useMouseHover";

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
  projectModel: ProjectModel;
  dispatch: Dispatch;
}> = ({ projectModel, dispatch }) => {
  const { rootId, folders } = projectModel;
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
              dispatch(Evt.AddFile(filename));
            }
          }}
        />
        <IconBtn
          text="Folder"
          Icon={FaFolderPlus}
          onClick={() => {
            const foldername = prompt("Folder name?");
            if (foldername) {
              dispatch(Evt.AddFolder(foldername));
            }
          }}
        />
      </Horizontal>

      {renderChildren(children, 0, projectModel, dispatch)}
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
  const { isHovered, mouseEnter, mouseLeave } = useMouseHover();

  const item = getFolder(projectFiles, folderId);
  const isSelected = projectFiles.selectedItem === folderId;

  const { isExpanded } = item;
  const selectFolder = () => dispatch(Evt.SelectItem(folderId));

  return (
    <>
      <div
        className={itemRowStyle}
        style={{
          paddingLeft: getPaddingLeft(level, "folder"),
          outline: isSelected ? "green solid 1px" : undefined
        }}
        onMouseEnter={mouseEnter}
        onMouseLeave={mouseLeave}
      >
        <div className={itemStyle} onClick={selectFolder}>
          <div className={chevronStyle}>
            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
          </div>

          <div className={itemIconStyle}>
            {isExpanded ? <FaFolderOpen /> : <FaFolder />}
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

      {isExpanded &&
        renderChildren(item.children, level, projectFiles, dispatch)}
    </>
  );
};

const FileView: React.FC<{
  projectFiles: ProjectModel;
  fileId: FileId;
  level?: number;
  dispatch: Dispatch;
}> = ({ projectFiles, fileId, dispatch, level = 0 }) => {
  const { isHovered, mouseEnter, mouseLeave } = useMouseHover();

  const item = getFile(projectFiles, fileId);

  const isSelected = projectFiles.selectedItem === fileId;

  const unsaved =
    projectFiles.openedFiles.tag === "filled"
      ? projectFiles.openedFiles.unsaved
      : undefined;

  return (
    <div
      className={itemRowStyle}
      style={{
        paddingLeft: getPaddingLeft(level, "file"),
        outline: isSelected ? "green solid 1px" : undefined
      }}
      onMouseEnter={mouseEnter}
      onMouseLeave={mouseLeave}
    >
      <div
        className={itemStyle}
        onClick={() => dispatch(Evt.SelectItem(fileId))}
      >
        <div className={itemIconStyle}>
          <FaFile />
        </div>

        <span role="button">
          {unsaved?.has(fileId) ? "* " : null}
          {item.name}
        </span>
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
