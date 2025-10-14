import React from "react";
import styled from "styled-components";
import colors from "../style/colors";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  initials: string;
  width?: number;
  height?: number;
}

export default function Avatar({
  width = 36,
  height = 36,
  initials,
  ...rest
}: Props) {
  return (
    <AvatarContainer width={width} height={height} {...rest}>
      <Initials>{initials}</Initials>
    </AvatarContainer>
  );
}

const AvatarContainer = styled.div<{ width: number; height: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background-color: ${colors.white};
  border: solid 2px ${colors.purple};
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
`;

const Initials = styled.span`
  font-size: 14px;
  text-align: center;
  vertical-align: middle;
  line-height: 14px;
  color: ${colors.purple};
  font-weight: bold;
`;