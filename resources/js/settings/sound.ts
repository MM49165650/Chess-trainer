// The move sounds: one for a move and one for a capture, played when a move is
// played on the board while sound is on in the settings.
//
// Sound is switched off until original sounds are chosen. To bring it back:
// put the files in a folder under resources/sounds/, named Move and Capture,
// as .ogg, .mp3 or both, with a LICENSE.md beside them; credit the set in
// resources/js/settings/catalogue.ts; and set SOUND_ENABLED to true. That also
// shows the sound option on the settings page.

/** Whether sound is offered at all. While it is false nothing loads or plays. */
export const SOUND_ENABLED: boolean = false;

type Kind = 'move' | 'capture';

// Every sound file under resources/sounds/, as a URL. Only the addresses are
// read here; a file is fetched when it is first played.
const files = import.meta.glob<string>('../../sounds/*/*.{ogg,mp3}', {
    eager: true,
    query: '?url',
    import: 'default',
});

/** The address of one sound, preferring Ogg where the browser plays it. */
function fileFor(kind: Kind, ogg: boolean): string | null {
    const name = kind === 'move' ? 'Move' : 'Capture';
    const order = ogg ? ['ogg', 'mp3'] : ['mp3'];

    for (const extension of order) {
        const path = Object.keys(files).find((key) =>
            key.endsWith(`/${name}.${extension}`),
        );

        if (path !== undefined) {
            return files[path] ?? null;
        }
    }

    return null;
}

let sounds: Record<Kind, HTMLAudioElement | null> | null = null;

// Made when first needed, so a page with sound off loads no sound files.
function load(): Record<Kind, HTMLAudioElement | null> {
    if (sounds === null) {
        const ogg =
            new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== '';
        const move = fileFor('move', ogg);
        const capture = fileFor('capture', ogg);

        sounds = {
            move: move === null ? null : new Audio(move),
            capture: capture === null ? null : new Audio(capture),
        };
    }

    return sounds;
}

export function playMoveSound(capture: boolean): void {
    if (!SOUND_ENABLED) {
        return;
    }

    const sound = load()[capture ? 'capture' : 'move'];

    if (sound === null) {
        return;
    }

    sound.currentTime = 0;

    // A browser may refuse to play before the user has touched the page.
    sound.play().catch(() => undefined);
}
