import React from "react";
import styled from "styled-components";
import colors from "../style/colors";
import classNames from "classnames";

type Props = {
  slidePreviews: string[];
  focus: number;
  onFocus: (index: number) => void;
};

export default function EditorSideBar({
  slidePreviews,
  focus,
  onFocus,
}: Props) {
  return (
    <Container>
      {slidePreviews.map((slide64, i) => (
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
          <SlidePreview src={slide64} alt="Can't load preview" />
        </SlideButton>
      ))}
    </Container>
  );
}
const Container = styled.div`
  padding: 20px 20px 0 20px;
  flex-direction: column;
  gap: 20px;
  background-color: ${colors.white};
  border-right: solid 1px ${colors.purple};
  overflow-y: scroll;
  align-items: center;
`;

const SlideButton = styled.button`
  margin-bottom: 20px;
  position: relative;
  display: block;
  width: 100px;
  height: 100px;
  background-color: ${colors.white};
  border: solid 1.5px ${colors.darkGrey};
  border-radius: 8px;
  overflow: hidden;

  &:hover {
    cursor: pointer;
    border: solid 2px ${colors.purple};
  }

  > span {
    font-size: 18px;
  }
`;

const SlidePreview = styled.img`
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  object-fit: cover;
`;
