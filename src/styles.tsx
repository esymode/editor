import { css } from "emotion";
import * as React from "react";
import { IconType } from "react-icons/lib/cjs";

const s_horizontal = css`
  display: flex;
`;

const s_vertical = css`
  display: flex;
  flex-direction: column;
`;

export const Vertical: React.FC = ({ children }) => (
  <div className={s_vertical}>{children}</div>
);

export const Horizontal: React.FC<{ className?: string }> = ({
  children,
  className
}) => <div className={s_horizontal + " " + (className || "")}>{children}</div>;

export const IconBtn: React.FC<{
  text: string;
  Icon: IconType;
  onClick: () => void;
}> = ({ text, Icon, onClick }) => (
  <button onClick={onClick}>
    <Icon></Icon>
    {text}
  </button>
);
