import React from "react";
import styled from "styled-components";
import colors from "../style/colors";
import classNames from "classnames";

type Props = {
  nSlides: number;
  focus: number;
  onFocus: (index: number) => void;
};

export default function EditorSideBar({ nSlides, focus, onFocus }: Props) {
  return (
    <Container>
      {Array.from(Array(nSlides).keys()).map((i) => (
        <SlideButton
          key={i}
          onClick={() => onFocus(i)}
          style={
            focus === i
              ? {
                  borderColor: colors.purple,
                  borderWidth: 2,
                  color: colors.purple,
                  backgroundColor: colors.lightGrey,
                }
              : undefined
          }
        >
          <span>{i + 1}</span>
        </SlideButton>
      ))}
    </Container>
  );
}
const Container = styled.div`
  display: flex;
  padding: 20px 20px;
  flex-direction: column;
  gap: 20px;
  background-color: ${colors.white};
  border-right: solid 1px ${colors.purple};
  max-height: 100%;
  overflow-y: auto;
  align-items: center;
`;

const SlideButton = styled.button`
  display: block;
  width: 100px;
  height: 100px;
  background-color: ${colors.white};
  border: solid 1.5px ${colors.darkGrey};
  border-radius: 8px;

  &:hover {
    cursor: pointer;
    border: solid 2px ${colors.purple};
  }

  > span {
    font-size: 18px;
  }
`;
