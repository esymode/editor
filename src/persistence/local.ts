import { Option, Ok, Some, None, Err, Result } from "src/functionalNonsense";
import { Workspace } from "src/workspace";

export const get = (projectId: string): Option<Workspace> => {
  const saved = localStorage.getItem(projectId);
  return saved !== "null" ? Some(saved as any) : None;
};

export const put = (
  projectId: string,
  workspace: Workspace
): Result<void, string> => {
  try {
    localStorage.setItem(projectId, JSON.stringify(workspace));
    return Ok(undefined);
  } catch (e) {
    return Err(`localStorage.setItem failed: ${e}`);
  }
};
