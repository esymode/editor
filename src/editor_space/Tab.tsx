import * as React from "react";
import { css } from "emotion";

import { FaTimes } from "react-icons/fa";

import { Dispatch, Evt, FileId } from "../projectModel";
import { Color, Horizontal } from "../styles";

interface TabProps {
  dispatch: Dispatch;
  fileId: FileId | "package.json";
  text: string;
  isSelected: boolean;
  isUnsaved: boolean;
}

export const Tab: React.FC<TabProps> = ({
  dispatch,
  fileId,
  text,
  isSelected,
  isUnsaved
}) => {
  //   const { isHovered, mouseEnter, mouseLeave } = useMouseHover();

  return (
    <Horizontal className={isSelected ? selectedBorderStyle : undefined}>
      <span onClick={() => dispatch(Evt.SwitchToTab(fileId))}>
        {isUnsaved ? "* " : null}
        {text}
      </span>
      <div onClick={() => dispatch(Evt.CloseTab(fileId))}>
        <FaTimes />
      </div>
    </Horizontal>
  );
};

const selectedBorderStyle = css({
  borderWidth: "1px 1px 0 1px",
  border: `thin solid ${Color.outline}`
});
