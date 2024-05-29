import React, { Component } from "react";
import "../index.css";
import { FaRegCirclePlay, FaRegCirclePause } from "react-icons/fa6";

class AudioButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: false
    };
  }

  onPlay = (event) => {
    this.setState({ playing: true });
  };
  onPause = (event) => {
    this.setState({ playing: false });
  };
  onEnded = (event) => {
    this.setState({ playing: false });
  };

  playAudio = () => {
    this.audioEl.play();
    const audio = this.audioEl;
    audio.addEventListener("play", this.onPlay);
    audio.addEventListener("pause", this.onPause);
  };

  pauseAudio = () => {
    this.audioEl.pause();
  };

  startAudio = () => {
    this.playAudio();
  };

  renderAudio = () => {
    const { url } = this.props;
    const { playing } = this.state;
    const notSupportedMsg =
      "Your browser does not support the <code>audio</code> element.";
    return (
      <>
        {!playing && (
          <FaRegCirclePlay className="btn-play" onClick={this.playAudio}/>
        )}
        {playing && <FaRegCirclePause className="btn-play" onClick={this.pauseAudio}/>}

        <audio
          src={url}
          ref={(ref) => {
            this.audioEl = ref;
          }}
        >
          {notSupportedMsg}
        </audio>
      </>
    );
  };

  render() {
    return this.renderAudio();
  }
}

export default AudioButton;
