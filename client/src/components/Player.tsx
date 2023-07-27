import React, { Component, MouseEventHandler } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ReactHowler from "react-howler";

type Props = {
  audio: Blob | undefined;
  loading: boolean;
};

type State = {
  playing: boolean;
  seek: number;
  isSeeking: boolean;
};

class Player extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.handleToggle = this.handleToggle.bind(this);
    this.handleMouseDownSeek = this.handleMouseDownSeek.bind(this);
    this.handleMouseUpSeek = this.handleMouseUpSeek.bind(this);
    this.handleSeekingChange = this.handleSeekingChange.bind(this);
  }

  player: ReactHowler | null = null;

  state = {
    playing: false,
    seek: 0.0,
    isSeeking: false,
  };

  handleToggle() {
    this.setState({
      playing: !this.state.playing,
    });
  }

  handleMouseDownSeek: MouseEventHandler<HTMLInputElement> = (e) => {
    this.setState({
      isSeeking: true,
    });
  };

  handleMouseUpSeek: MouseEventHandler<HTMLInputElement> = (e) => {
    this.setState({
      isSeeking: false,
    });

    this.player && this.player.seek(parseFloat(e.currentTarget.value));
    console.log(parseFloat(e.currentTarget.value));
  };

  handleSeekingChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    this.setState({
      seek: parseFloat(e.target.value),
    });
  };

  render() {
    return (
      <PlayerContainer>
        <IconButton onClick={this.handleToggle}>
          <FontAwesomeIcon
            icon={this.state.playing ? "pause" : "play"}
            size="2x"
          />
        </IconButton>
        <input
          type="range"
          min="0"
          max="1"
          step=".01"
          value={this.state.seek}
          onChange={this.handleSeekingChange}
          onMouseDown={this.handleMouseDownSeek}
          onMouseUp={this.handleMouseUpSeek}
        />
        <ReactHowler
          src={"http://goldfirestudios.com/proj/howlerjs/sound.ogg"}
          playing={this.state.playing}
          ref={(ref) => (this.player = ref)}
        />
      </PlayerContainer>
    );
  }
}

export default Player;

const PlayerContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
`;

const IconButton = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border: none;
  background-color: transparent;
  cursor: pointer;
  height: 28px;
  width: 28px;
  color: ${colors.purple};
`;

const PlayerSlider = styled.div``;
