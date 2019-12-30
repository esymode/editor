import * as React from "react";

import { useMemo } from "react";
import { Horizontal } from "../styles";
import {
  ProjectModel,
  unsafeGetItem,
  unwrapItemId,
  Dispatch
} from "../projectModel";
import { css } from "emotion";
import { Tab } from "./Tab";
import { Monaco } from "../monaco/Monaco";

export const EditorAndTabs: React.FC<{
  project: ProjectModel;
  dispatch: Dispatch;
  layoutFromParentStyle: string;
}> = ({ project, dispatch, layoutFromParentStyle }) => {
  const { openedFiles } = project;
  return (
    <div className={layoutFromParentStyle + " " + editorContent}>
      <Horizontal className={openedFilesStyle}>
        {openedFiles.tag === "empty"
          ? null
          : openedFiles.tabs.map(fileId => (
              <Tab
                fileId={fileId}
                key={unwrapItemId(fileId)}
                dispatch={dispatch}
                isSaved={openedFiles.unsaved.has(fileId)}
                isSelected={fileId === openedFiles.activeTab}
                text={unsafeGetItem(project.files, fileId).name}
              />
            ))}
      </Horizontal>
      {useMemo(() => {
        if (openedFiles.tag === "empty") return "select a file";

        const { activeTab, unsaved } = openedFiles;

        const content =
          unsaved.get(activeTab) ??
          project.sources.get(openedFiles.activeTab, "");

        return (
          <Monaco
            fileId={openedFiles.activeTab}
            content={content}
            dispatch={dispatch}
            className={monacoStyle}
          />
        );
      }, [
        openedFiles.tag,
        openedFiles.tag === "filled" && openedFiles.activeTab
      ])}
    </div>
  );
};

const editorContent = css`
  /* width: 100%;
  height: 100%; */
  display: grid;
  /* grid-gap: 10px; */
  grid-template-rows: [openedFiles] 25px [monaco] auto;
  background-color: #fff;
  color: #444;
`;

const monacoStyle = css`
  grid-row: monaco;
`;

const openedFilesStyle = css`
  grid-row: openedFiles;
`;
