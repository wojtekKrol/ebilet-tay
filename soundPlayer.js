import play from 'play-sound';

const player = play();

export function playSoundLoop(filePath) {
    function playLoop() {
        player.play(filePath, function (err) {
            if (err) {
                console.log(`Could not play sound: ${err}`);
            } else {
                playLoop(); // Replay the sound once it finishes
            }
        });
    }

    playLoop();
}
