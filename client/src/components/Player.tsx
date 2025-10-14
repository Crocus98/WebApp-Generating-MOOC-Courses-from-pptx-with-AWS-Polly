import React, { Component, MouseEventHandler } from "react";
import styled from "styled-components";
import colors from "../style/colors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ReactHowler, { HowlErrorCallback } from "react-howler";
import raf from "raf"; // requestAnimationFrame polyfill
import { ceil } from "lodash";

type Props = {
  audio: string | null;
  loading: boolean;
};

type State = {
  playing: boolean;
  seek: number;
  isSeeking: boolean;
  duration: number;
};

class Player extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.handleToggle = this.handleToggle.bind(this);
    this.handleOnLoad = this.handleOnLoad.bind(this);
    this.handleOnEnd = this.handleOnEnd.bind(this);
    this.handleOnPlay = this.handleOnPlay.bind(this);
    this.handleStop = this.handleStop.bind(this);
    this.renderSeekPos = this.renderSeekPos.bind(this);
    this.handleMouseDownSeek = this.handleMouseDownSeek.bind(this);
    this.handleMouseUpSeek = this.handleMouseUpSeek.bind(this);
    this.handleSeekingChange = this.handleSeekingChange.bind(this);
  }

  player: ReactHowler | null = null;
  _raf: number | undefined = undefined;

  state = {
    playing: false,
    seek: 0.0,
    isSeeking: false,
    duration: 0.0,
  };

  handleToggle() {
    this.setState({
      playing: !this.state.playing,
    });
  }

  handleOnLoad() {
    this.setState({
      seek: 0.0,
      playing: false,
      duration: this.player ? this.player.duration() : 1.0,
    });
  }

  handleOnLoadError: HowlErrorCallback = (id, error) => {
    console.log(error);
  };

  handleOnPlay() {
    this.renderSeekPos();
  }

  handleOnEnd() {
    this.setState({
      playing: false,
    });
    this.clearRAF();
  }

  handleStop() {
    if (this.player) {
      this.player.stop();
      this.setState({
        playing: false, // Need to update our local state so we don't immediately invoke autoplay
      });
      this.renderSeekPos();
    }
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

  renderSeekPos() {
    if (!this.state.isSeeking && this.player) {
      this.setState({
        seek: this.player.seek(),
      });
    }
    if (this.state.playing) {
      this._raf = raf(this.renderSeekPos);
    }
  }

  clearRAF() {
    this._raf != null && raf.cancel(this._raf);
  }

  render() {
    const { audio } = this.props;

    return (
      <PlayerContainer>
        <IconButton onClick={this.handleToggle}>
          <FontAwesomeIcon
            icon={this.state.playing ? "pause" : "play"}
            size="2x"
          />
        </IconButton>
        <SliderContainer>
          <Slider
            type="range"
            min="0"
            max={this.state.duration ? this.state.duration : 0}
            step=".01"
            value={this.state.seek}
            onChange={this.handleSeekingChange}
            onMouseDown={this.handleMouseDownSeek}
            onMouseUp={this.handleMouseUpSeek}
          />

          {audio && (
            <ReactHowler
              src={audio}
              playing={this.state.playing}
              onLoad={this.handleOnLoad}
              onLoadError={this.handleOnLoadError}
              onPlay={this.handleOnPlay}
              onEnd={this.handleOnEnd}
              format={["mp3"]}
              loop={false}
              ref={(ref) => (this.player = ref)}
            />
          )}
        </SliderContainer>
        <TimerContainer>
          <span>
            {(ceil(this.state.seek) / 100).toFixed(2)} /{" "}
            {(ceil(this.state.duration) / 100).toFixed(2)}
          </span>
        </TimerContainer>
      </PlayerContainer>
    );
  }
}

export default Player;

const PlayerContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
`;

const TimerContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100px;
  color: ${colors.white};
  font-weight: bolder;
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

const SliderContainer = styled.div`
  flex: 1;
`;

const Slider = styled.input`
  width: 100%;
  height: 5px;
  border-radius: 5px;
  background: ${colors.lightGrey};
  outline: none;
  opacity: 0.7;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
`;
