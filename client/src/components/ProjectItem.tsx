import React from "react";
import styled from "styled-components";
import colors from "../style/colors";
import { Link, LinkProps } from "react-router-dom";

interface Props extends React.RefAttributes<HTMLAnchorElement> {
  name: string;
  style?: React.CSSProperties;
}

export default function ProjectItem({ name, style = {}, ...rest }: Props) {
  const color = getProjectColor(name);
  return (
    <ProjectItemContainer
      to={`/project/${name}`}
      {...rest}
      style={{ backgroundColor: color, ...style }}
    >
      {name}
    </ProjectItemContainer>
  );
}

const getProjectColor = (projectName: string) => {
  const hash = projectName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const h = Math.floor(hash * 358);
  const s = 35;
  const l = 50;

  return `hsl(${h}, ${s}%, ${l}%)`;
};

const ProjectItemContainer = styled(Link)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 60px 60px;
  border-radius: 4px;
  flex: 1;
  color: white;

  &:hover {
    transform: scale(1.2);
    z-index: 10;

    background-color: ${colors.white};
    transition: 0.2s;
    cursor: pointer;
    //Shadows
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.2);
    backface-visibility: hidden;
  }
`;

