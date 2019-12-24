import { useState } from "react";

export const useMouseHover = (): {
  isHovered: boolean;
  mouseEnter: () => void;
  mouseLeave: () => void;
} => {
  const [isHovered, setIsHovered] = useState(false);

  return {
    isHovered,
    mouseEnter: () => setIsHovered(true),
    mouseLeave: () => setIsHovered(false)
  };
};
