'use strict';
import uuid from 'uuid';
import RecordRTC from 'recordrtc';
import axios from 'axios';

import '../scss/main.scss';

function main() {
  const textarea = document.querySelector('#message');
  const hintText = document.querySelector('.hint-text');
  const videoEl = document.querySelector('.video');
  const startBtn = document.querySelector('#start');
  const stopBtn = document.querySelector('#stop');

  let recorder, mediaStream;

  textarea.addEventListener('change', handleTextareaChange);
  textarea.addEventListener('keyup', handleTextareaChange);
  startBtn.addEventListener('click', handleStartRecord);
  stopBtn.addEventListener('click', handleStopRecord);
  streamUserMedia();

  function handleTextareaChange(e) {
    const value = e.target.value;
    if (hintText.innerText === value) return;
    hintText.innerText = value.split('').reverse().join('');
  }

  function toggleRecordBtns() {
    startBtn.disabled = !startBtn.disabled;
    stopBtn.disabled = !stopBtn.disabled;
  }

  function handleStartRecord(e) {
    streamUserMedia().then(function () {
      recorder = new RecordRTC(mediaStream, { video: true });
      recorder.startRecording();
      toggleRecordBtns();
    });
  }

  function handleStopRecord(e) {
    recorder.stopRecording(postFiles);
    toggleRecordBtns();
  }

  function captureUserMedia() {
    const constraints = {
        audio: true,
        video: true
    };

    return navigator.mediaDevices.getUserMedia(constraints);
  }

  function streamUserMedia() {
    if (!mediaStream) {
      return captureUserMedia().then(function (stream) {
        videoEl.srcObject = mediaStream = stream;
        videoEl.play();
        videoEl.muted = true;
        videoEl.controls = false;
        stopBtn.disabled = true;
      }).catch(function (err) {
        console.log(err);
      });
    } else {
      return Promise.resolve();
    }
  }

  function postFiles() {
    const blob = recorder.getBlob();
    console.log('posting');

    // getting unique identifier for the file name
    const fileName = uuid.v1() + '.webm';

    const file = new File([blob], fileName, {
        type: 'video/webm'
    });
    const data = new FormData();
    data.append('file', file);

    axios.post('/uploadFile', data)
      .then(function(res) {
          const fileURL = res.data.fileURL;

          console.info('fileURL', fileURL);
          if(mediaStream) {
            mediaStream.stop();
            mediaStream = null;
          }
          videoEl.srcObject = null;
          videoEl.src = fileURL;
          videoEl.play();
          videoEl.muted = false;
          videoEl.controls = true;
      }).catch(function (err) {
        console.error(err);
      });
  }
}

document.addEventListener('DOMContentLoaded', main);
