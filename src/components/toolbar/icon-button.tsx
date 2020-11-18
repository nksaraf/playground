import * as React from "react";
import { ButtonWrapper, ShortcutHint, Button } from "./styled";

type IconButtonProps = {
  isActive?: boolean;
  shortcut?: string;
} & React.HTMLProps<HTMLButtonElement>;

export default function IconButton({
  isActive = false,
  src,
  shortcut,
  children,
  ...props
}: IconButtonProps) {
  return (
    <ButtonWrapper>
      <Button
        disabled={props.disabled}
        status={isActive ? "active" : ""}
        type="button"
        {...(props as any)}
      >
        {children}
      </Button>
      {shortcut && <ShortcutHint>{shortcut}</ShortcutHint>}
    </ButtonWrapper>
  );
}
