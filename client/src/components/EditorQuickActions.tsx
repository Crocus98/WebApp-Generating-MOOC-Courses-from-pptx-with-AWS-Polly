import React, { useRef, useState } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import { useOnClickOutside } from "usehooks-ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  options: { label: string; value: string }[];
  onClick: (action: string) => void;
  name: string;
  color: string;
  disabled?: boolean;
};

export default function EditorQuickActions({
  options,
  onClick,
  name,
  color,
  disabled = false,
}: Props) {
  const ref = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleClickOutside = () => {
    setShowDropdown(false);
  };

  useOnClickOutside(ref, handleClickOutside);

  const onMouseEnter = () => setShowDropdown(!disabled && true);
  const onMouseLeave = () => setShowDropdown(!disabled && false);

  return (
    <ActionContainer onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
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
        disabled={disabled}
      >
        <FontAwesomeIcon
          icon={showDropdown ? "chevron-down" : "chevron-right"}
          size="sm"
          style={{ width: 20 }}
        />
        <span>{name}</span>
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
  top: 29px;
  background-color: ${colors.white};
  border: solid 1px ${colors.purple};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overflow-y: scroll;
  visibility: hidden;
  z-index: 100;
  max-height: 200px;
`;

const ActionContainer = styled.div`
  position: relative;
  display: block;
`;

const ActionButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  gap: 10px;
  padding: 0 12px;
  text-align: center;
  color: ${colors.white};
  font-size: 15px;
  border: none;
  border-radius: 4px;
  height: 29px;

  &:hover {
    cursor: pointer;
  }
`;

