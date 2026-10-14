// The move sounds: Move and Capture from Enigmahack's sfx set. See
// resources/sounds/sfx/LICENSE.md. They play only while sound is switched on
// in the settings.

import captureMp3 from '../../sounds/sfx/Capture.mp3';
import captureOgg from '../../sounds/sfx/Capture.ogg';
import moveMp3 from '../../sounds/sfx/Move.mp3';
import moveOgg from '../../sounds/sfx/Move.ogg';

type Sounds = { move: HTMLAudioElement; capture: HTMLAudioElement };

let sounds: Sounds | null = null;

// Made when first needed, so a page with sound off loads no sound files.
function load(): Sounds {
    if (sounds === null) {
        const ogg =
            new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '';

        sounds = {
            move: new Audio(ogg ? moveOgg : moveMp3),
            capture: new Audio(ogg ? captureOgg : captureMp3),
        };
    }

    return sounds;
}

export function playMoveSound(capture: boolean): void {
    const sound = capture ? load().capture : load().move;

    sound.currentTime = 0;

    // A browser may refuse to play before the user has touched the page.
    sound.play().catch(() => undefined);
}
