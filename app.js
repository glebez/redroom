function main() {
  const textarea = document.querySelector('#message');
  const hintText = document.querySelector('.hint-text');
  const videoEl = document.querySelector('.video');

  textarea.addEventListener('change', handleTextareaChange);
  textarea.addEventListener('keyup', handleTextareaChange);

  function handleTextareaChange (e) {
    const value = e.target.value;
    if (hintText.innerText === value) return;
    hintText.innerText = value.split('').reverse().join('');
  }

  function captureUserMedia() {
    const constraints = {
        audio: true,
        video: true
    };

    return navigator.mediaDevices.getUserMedia(constraints);
  }

  captureUserMedia().then(function (stream) {
    videoEl.srcObject = stream;
    videoEl.play();
    videoEl.muted = true;
    videoEl.controls = false;
  }).catch(function (err) {
    console.log(err);
  })


}

document.addEventListener('DOMContentLoaded', main);
