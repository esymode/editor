import * as React from "react";
import { useState } from "react";

import { css } from "emotion";

import {
  FaFile,
  FaFolder,
  FaFolderOpen,
  FaChevronDown,
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
    <button onClick={() => dispatch(Evt.AddFile("foo.ts"))}>New file</button>

    {children.map(child => (
      <TreeNode
        parentPath=""
        key={child.name}
        item={child}
        onFileSelected={path => dispatch(Evt.SelectFile(path))}
      ></TreeNode>
    ))}
  </div>
);

const INDENT = 16;
const getPaddingLeft = (level: number, type: Item["tag"]) =>
  type === "folder" ? level * INDENT : level * INDENT + 12;

// padding-left: ${props => getPaddingLeft(props.level, props.type)}px;
const itemStyle = css`
  display: flex;
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
const TreeNode: React.FC<{
  item: Item;
  level?: number;
  parentPath: string;
  onFileSelected: (path: string) => void;
}> = ({ parentPath, item, onFileSelected, level = 0 }) => {
  const [isOpened, setIsOpened] = useState(false);

  const myPath = joinPath(parentPath, item.name);
  return (
    <>
      <div
        className={itemStyle}
        style={{ paddingLeft: getPaddingLeft(level, item.tag) }}
        onClick={() => onFileSelected(myPath)}
      >
        <div className={chevronStyle} onClick={() => setIsOpened(!isOpened)}>
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

      {isOpened &&
        item.tag === "folder" &&
        item.children.map(child => (
          <TreeNode
            parentPath={myPath}
            onFileSelected={onFileSelected}
            key={child.name}
            item={child}
            level={level + 1}
          />
        ))}
    </>
  );
};

// onClick={() => onNodeSelect(node)}

// Treeitem.propTypes = {
//   node: PropTypes.object.isRequired,
//   getChildNodes: PropTypes.func.isRequired,
//   level: PropTypes.number.isRequired,
//   onToggle: PropTypes.func.isRequired,
//   onNodeSelect: PropTypes.func.isRequired
// };

// TreeNode.defaultProps = {
//   level: 0
// };

// <div>
//   {selectedFile && selectedFile.type === "file" && selectedFile.content}
// </div>
