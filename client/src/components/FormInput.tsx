import React, { useEffect, useState } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import classNames from "classnames";

interface Props
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "style" | "className"
  > {
  style?: React.CSSProperties;
  className?: string;
  error?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, Props>(
  (
    { style = {}, className, placeholder, id, onChange, error, ...rest },
    ref
  ) => {
    const [notEmpty, setNotEmpty] = useState(false);
    const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNotEmpty(e.target.value.length > 0);
      onChange && onChange(e);
    };
    return (
      <FormInputContainer
        style={style}
        className={classNames(className, !!error && "hasError")}
      >
        <InputComponent
          className={classNames(notEmpty ? "notEmpty" : false)}
          onChange={onChangeHandler}
          ref={ref}
          {...rest}
        />
        <Label>{placeholder}</Label>
        {error && <Error>{error}</Error>}
      </FormInputContainer>
    );
  }
);

export default FormInput;

const Error = styled.span`
  margin-bottom: -2px;
  line-height: 4px;
  left: 20px;
  bottom: 0;
  height: 4px;
  position: absolute;
  vertical-align: middle;
  transition: 0.2s;
  color: ${colors.darkGrey};
  pointer-events: none;
  background-color: ${colors.white};
  color: ${colors.orange};
  font-size: 12px;
`;

const Label = styled.label`
  top: 50%;
  margin-top: -1px;
  line-height: 2px;
  left: 40px;
  bottom: 0;
  height: 2px;
  position: absolute;
  vertical-align: middle;
  transition: 0.2s;
  color: ${colors.darkGrey};
  pointer-events: none;
`;

const FormInputContainer = styled.div`
  display: flex;
  flex-direction: row;
  border: solid 1px ${colors.black};
  border-radius: 6px;
  position: relative;

  &.hasError {
    border-color: ${colors.orange};
  }
`;

const InputComponent = styled.input`
  flex: 1;
  border: none;
  padding: 14px 40px;
  border-radius: 6px;
  outline: none;

  :focus + ${Label} {
    background-color: ${colors.white};
    color: ${colors.black};
    top: 0;
    left: 20px;
    font-size: 12px;
  }

  &.notEmpty + ${Label} {
    background-color: ${colors.white};
    color: ${colors.black};
    top: 0;
    left: 20px;
    font-size: 12px;
  }
`;
