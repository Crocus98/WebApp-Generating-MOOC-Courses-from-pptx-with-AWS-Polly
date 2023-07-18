import React, { useRef, useState } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import { useOnClickOutside } from "usehooks-ts";

type Props = {
  options: { label: string; value: string }[];
  onClick: (action: string) => void;
  name: string;
  color: string;
};

export default function EditorQuickActions({
  options,
  onClick,
  name,
  color,
}: Props) {
  const ref = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleClickOutside = () => {
    setShowDropdown(false);
  };

  useOnClickOutside(ref, handleClickOutside);

  return (
    <ActionContainer>
      <DropdownContainer
        ref={ref}
        style={showDropdown ? { visibility: "visible" } : undefined}
      >
        {options.map(({ label, value }, index) => (
          <ActionOption
            style={{
              borderBottom:
                index !== options.length - 1
                  ? `solid 1px ${colors.lightGrey}`
                  : undefined,
            }}
            key={value}
            onClick={() => {
              onClick(value);
              setShowDropdown(false);
            }}
          >
            {label}
          </ActionOption>
        ))}
      </DropdownContainer>
      <ActionButton
        style={{ backgroundColor: color }}
        onClick={() => setShowDropdown(true)}
      >
        {name}
      </ActionButton>
    </ActionContainer>
  );
}

const ActionOption = styled.button`
  display: block;
  min-width: 200px;
  background-color: ${colors.white};
  padding: 10px 20px;
  color: ${colors.black};
  outline: none;
  cursor: pointer;
  border: none;
  text-align: left;

  &:hover {
    background-color: ${colors.lightGrey};
  }
`;

const DropdownContainer = styled.div`
  display: flex;
  position: absolute;
  bottom: 40px;
  background-color: ${colors.white};
  border: solid 1px ${colors.purple};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overflow-y: auto;
  visibility: hidden;
`;

const ActionContainer = styled.div`
  position: relative;
  display: block;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  text-align: center;
  color: ${colors.white};
  font-size: 15px;
  border: none;
  border-radius: 4px;

  &:hover {
    cursor: pointer;
  }
`;
