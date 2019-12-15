import * as React from "react";
import { useState } from "react";

import { css } from "emotion";

import {
  FaFile,
  FaFolder,
  FaFolderOpen,
  FaChevronDown,
  FaPlusCircle,
  FaTrash,
  FaChevronRight
} from "react-icons/fa";
import { Dispatch, Evt } from "src/ideEvents";

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

export type FileItem = {
  tag: "file";
  name: string;
};

export type FolderItem = {
  tag: "folder";
  name: string;
  children: (FolderItem | FileItem)[];
};

// TODO put proper path manipulation
const joinPath = (a: string, b: string) => (a === "" ? b : a + "/" + b);

export type Item = FolderItem | FileItem;

export const FilesPanel: React.FC<{
  root: FolderItem;
  dispatch: Dispatch;
}> = ({ root: { children }, dispatch }) => (
  <div className={panelStyle}>
    <button
      onClick={() => {
        const filename = prompt("Filename?");

        if (filename) {
          dispatch(Evt.AddFile(filename));
        }
      }}
    >
      <FaPlusCircle /> New file
    </button>

    {children.map(child => (
      <FileTreeItem
        parentPath=""
        key={child.name}
        item={child}
        dispatch={dispatch}
      ></FileTreeItem>
    ))}
  </div>
);

const INDENT = 16;
const getPaddingLeft = (level: number, type: Item["tag"]) =>
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
const FileTreeItem: React.FC<{
  item: Item;
  level?: number;
  parentPath: string;
  dispatch: Dispatch;
}> = ({ parentPath, item, dispatch, level = 0 }) => {
  const [isOpened, setIsOpened] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const myPath = joinPath(parentPath, item.name);
  const toggleOpen = () => setIsOpened(!isOpened);
  return (
    <>
      <div
        className={itemRowStyle}
        style={{ paddingLeft: getPaddingLeft(level, item.tag) }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={itemStyle}
          onClick={
            item.tag === "folder"
              ? toggleOpen
              : () => dispatch(Evt.SelectFile(myPath))
          }
        >
          <div className={chevronStyle} onClick={toggleOpen}>
            {item.tag === "folder" &&
              (isOpened ? <FaChevronDown /> : <FaChevronRight />)}
          </div>

          <div className={itemIconStyle}>
            {item.tag === "file" && <FaFile />}
            {item.tag === "folder" && isOpened === true && <FaFolderOpen />}
            {item.tag === "folder" && !isOpened && <FaFolder />}
          </div>

          <span role="button">{item.name}</span>
        </div>
        <div
          role="button"
          hidden={!isHovered}
          onClick={() => dispatch(Evt.DeleteFile(myPath))}
        >
          <FaTrash size={12} />
        </div>
      </div>

      {isOpened &&
        item.tag === "folder" &&
        item.children.map(child => (
          <FileTreeItem
            parentPath={myPath}
            dispatch={dispatch}
            key={child.name}
            item={child}
            level={level + 1}
          />
        ))}
    </>
  );
};
