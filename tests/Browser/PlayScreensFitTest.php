<?php

declare(strict_types=1);

use App\Models\Master;
use App\Models\MasterGame;
use App\Models\PracticeGame;
use App\Models\Puzzle;
use Database\Seeders\MasterSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Vite;
use Pest\Browser\Api\PendingAwaitablePage;

/*
 * The fit test: the four play screens, opened in a headless browser at the
 * four standard phone sizes and taken through their tall states. In every
 * state the page must not scroll in either direction, and the board must be
 * the full width of the screen, or at least 280 pixels at 375×550. The games
 * and the puzzle are made up.
 */

uses(RefreshDatabase::class);

beforeEach(function (): void {
    // The pages are tested as built, never as the dev server serves them.
    Vite::useHotFile(storage_path('framework/testing/no-dev-server'));
});

dataset('phone sizes', [
    '360×640' => [360, 640, true],
    '375×550' => [375, 550, false],
    '390×660' => [390, 660, true],
    '412×780' => [412, 780, true],
]);

/** The narrowest board a phone shows before the page is allowed to scroll. */
const SMALLEST_BOARD = 280;

/**
 * Opens a page fresh in a browser window of the given size.
 */
function openAt(string $url, int $width, int $height): PendingAwaitablePage
{
    $page = visit($url, ['viewport' => ['width' => $width, 'height' => $height]]);

    $page->assertPresent('.chess-board cg-board');

    return $page;
}

/**
 * Clicks the middle of one square of the board, as a tap would.
 */
function tapSquare(PendingAwaitablePage $page, string $square, string $orientation = 'white'): void
{
    $side = (float) $page->script("document.querySelector('cg-board').getBoundingClientRect().width") / 8;
    $file = ord($square[0]) - ord('a');
    $rank = (int) $square[1] - 1;
    [$column, $row] = $orientation === 'white' ? [$file, 7 - $rank] : [7 - $file, $rank];

    $page->page()->locator('cg-board')->click([
        'position' => ['x' => ($column + 0.5) * $side, 'y' => ($row + 0.5) * $side],
    ]);
}

/**
 * Moves a piece by tapping it and then its destination.
 */
function move(PendingAwaitablePage $page, string $from, string $to, string $orientation = 'white'): void
{
    tapSquare($page, $from, $orientation);
    tapSquare($page, $to, $orientation);
}

function pressButton(PendingAwaitablePage $page, string $name): void
{
    $page->page()->getByRole('button', ['name' => $name, 'exact' => true])->click();
}

/**
 * The page's width and height with everything on it, and the board's width,
 * read once the layout has stopped changing.
 *
 * @return array{float, float, float}
 */
function measured(PendingAwaitablePage $page): array
{
    $read = fn (): string => (string) $page->script(<<<'JS'
        (() => {
            const page = document.documentElement;
            const board = document.querySelector('.chess-board').getBoundingClientRect();

            return [page.scrollWidth, page.scrollHeight, Math.round(board.width * 100) / 100].join(' ');
        })()
        JS);

    $previous = $read();

    for ($attempt = 0; $attempt < 30; $attempt++) {
        $page->wait(0.1);
        $current = $read();

        if ($current === $previous) {
            break;
        }

        $previous = $current;
    }

    [$pageWidth, $pageHeight, $boardWidth] = array_map(floatval(...), explode(' ', $previous));

    return [$pageWidth, $pageHeight, $boardWidth];
}

/**
 * Fails when the screen, in the state it is in, does not fit the window.
 */
function expectFit(PendingAwaitablePage $page, string $state, int $width, int $height, bool $fullWidth): void
{
    [$pageWidth, $pageHeight, $boardWidth] = measured($page);
    $where = "{$state}, at {$width}×{$height}";

    expect($pageHeight)->toBeLessThanOrEqual($height, "The page scrolls vertically: {$where}.")
        ->and($pageWidth)->toBeLessThanOrEqual($width, "The page scrolls sideways: {$where}.");

    if ($fullWidth) {
        expect($boardWidth)->toEqualWithDelta($width, 0.5, "The board is not the full width: {$where}.");
    } else {
        expect($boardWidth)->toBeGreaterThanOrEqual(SMALLEST_BOARD, "The board is narrower than 280 pixels: {$where}.");
    }
}

test('guess the move fits the screen in every state', function (int $width, int $height, bool $fullWidth): void {
    $this->seed(MasterSeeder::class);

    // Made up: the shortest game there is, won by Black.
    $game = MasterGame::query()->create([
        'master_id' => Master::query()->where('slug', 'morphy')->firstOrFail()->id,
        'fingerprint' => str_repeat('a', 64),
        'master_color' => 'black',
        'opponent_name' => 'Maximilian Madeupington',
        'opponent_short_name' => 'Madeupington',
        'year' => 1850,
        'event' => 'A made-up casual game',
        'ply_count' => 4,
        'guess_count' => 2,
        'moves' => [
            ['uci' => 'f2f3', 'san' => 'f3'],
            ['uci' => 'e7e5', 'san' => 'e5'],
            ['uci' => 'g2g4', 'san' => 'g4'],
            ['uci' => 'd8h4', 'san' => 'Qh4#'],
        ],
    ]);

    $page = openAt("/guess/morphy/{$game->id}", $width, $height);

    $page->assertSee('played 1. f3');
    expectFit($page, 'guess the move, playing', $width, $height, $fullWidth);

    move($page, 'd7', 'd5', 'black');
    $page->assertSee('Not this time');
    expectFit($page, 'guess the move, after a wrong guess', $width, $height, $fullWidth);

    $page->assertSee('played 2. g4');
    expectFit($page, 'guess the move, playing after a wrong guess', $width, $height, $fullWidth);

    pressButton($page, 'Previous move');
    pressButton($page, 'Previous move');
    $page->assertSee('Earlier position');
    expectFit($page, 'guess the move, looking back at a move', $width, $height, $fullWidth);

    pressButton($page, 'Back to the game');
    move($page, 'd8', 'h4', 'black');
    $page->assertSee('Game over');
    expectFit($page, 'guess the move, the end of the game', $width, $height, $fullWidth);

    pressButton($page, 'Review');
    $page->assertSee('Back');
    expectFit($page, 'guess the move, looking back from the end', $width, $height, $fullWidth);
})->with('phone sizes');

test('tactics fits the screen in every state', function (int $width, int $height, bool $fullWidth): void {
    // Made up: the knight checks, the king steps aside, the knight takes.
    Puzzle::query()->create([
        'lichess_id' => 'madeup',
        'fen' => 'r2k4/8/8/3N4/8/8/8/6K1 b - - 0 1',
        'setup_move' => 'd8e8',
        'first_move' => 'd5c7',
        'reply_move' => 'e8d7',
        'second_move' => 'c7a8',
        'piece' => 'knight',
        'rating' => 870,
        'popularity' => 90,
        'plays' => 600,
        'themes' => ['fork', 'short'],
    ]);

    $page = openAt('/tactics/knight', $width, $height);

    $page->assertSee('Two moves with the same piece');
    expectFit($page, 'tactics, playing', $width, $height, $fullWidth);

    move($page, 'd5', 'e3');
    $page->assertSee('Not that move')->assertSee('Show solution');
    expectFit($page, 'tactics, a failed puzzle with Show solution', $width, $height, $fullWidth);

    pressButton($page, 'Show solution');
    $page->assertSee('Here is the solution.');
    expectFit($page, 'tactics, the solution shown', $width, $height, $fullWidth);

    pressButton($page, 'Previous move');
    expectFit($page, 'tactics, looking back at a move', $width, $height, $fullWidth);

    pressButton($page, 'Redo');
    $page->assertSee('Two moves with the same piece');
    move($page, 'd5', 'c7');
    $page->assertSee('Now finish with the same piece');
    move($page, 'c7', 'a8');
    $page->assertSee('You found both moves.');
    expectFit($page, 'tactics, the puzzle played to the end', $width, $height, $fullWidth);
})->with('phone sizes');

/**
 * Made up: three moves, with the answers of Appendix B's examples. Both
 * marking modes work through the same game.
 */
function madeUpPracticeGame(): void
{
    PracticeGame::query()->create([
        'fingerprint' => str_repeat('b', 64),
        'white_rating' => 1010,
        'black_rating' => 990,
        'time_control' => '600+0',
        'ply_count' => 3,
        'answers_version' => 2,
        'moves' => [
            [
                'uci' => 'e2e4',
                'san' => 'e4',
                'piece' => 'pawn',
                'lost' => ['d3', 'f3'],
                'controlled' => ['d5', 'f5'],
                'rook' => null,
                'hanging' => [],
            ],
            [
                'uci' => 'e7e5',
                'san' => 'e5',
                'piece' => 'pawn',
                'lost' => ['d6', 'f6'],
                'controlled' => ['d4', 'f4'],
                'rook' => null,
                'hanging' => [],
            ],
            [
                'uci' => 'g1f3',
                'san' => 'Nf3',
                'piece' => 'knight',
                'lost' => ['e2', 'f3', 'h3'],
                'controlled' => ['d2', 'd4', 'e1', 'e5', 'g1', 'g5', 'h2', 'h4'],
                'rook' => null,
                'hanging' => ['e5'],
            ],
        ],
    ]);
}

// The feedback is measured on an answer that is not right. One that is
// exactly right shows the same lines, and moves on before it can be measured.
test('square control fits the screen in every state', function (int $width, int $height, bool $fullWidth): void {
    madeUpPracticeGame();

    $page = openAt('/squares/play', $width, $height);

    $page->assertSee('Which squares does the pawn no longer control?');
    expectFit($page, 'square control, marking', $width, $height, $fullWidth);

    pressButton($page, 'd3, empty');
    pressButton($page, 'e4, empty');
    pressButton($page, 'Submit · 2 marked');
    $page->assertSee('Not quite');
    expectFit($page, 'square control, feedback', $width, $height, $fullWidth);

    pressButton($page, 'Show the position before the move');
    expectFit($page, 'square control, feedback with rewind on', $width, $height, $fullWidth);

    pressButton($page, 'Show the position before the move');
    pressButton($page, 'Next: squares controlled');
    $page->assertSee('Which squares does the pawn control now?');
    pressButton($page, 'Show the position before the move');
    $page->assertSee('Before move 1');
    expectFit($page, 'square control, marking the second phase with rewind on', $width, $height, $fullWidth);
})->with('phone sizes');

test('spot the hanging piece fits the screen in every state', function (int $width, int $height, bool $fullWidth): void {
    madeUpPracticeGame();

    $page = openAt('/hanging/play', $width, $height);

    $page->assertSee('Which pieces are hanging, on either side?');
    expectFit($page, 'spot the hanging piece, marking', $width, $height, $fullWidth);

    pressButton($page, 'e4, empty');
    pressButton($page, 'Submit · 1 marked');
    $page->assertSee('Not quite');
    expectFit($page, 'spot the hanging piece, feedback', $width, $height, $fullWidth);

    pressButton($page, 'Show the position before the move');
    expectFit($page, 'spot the hanging piece, feedback with rewind on', $width, $height, $fullWidth);

    pressButton($page, 'Show the position before the move');
    pressButton($page, 'Next move');
    $page->assertSee('Black played');
    pressButton($page, 'Show the position before the move');
    $page->assertSee('Before move 1');
    expectFit($page, 'spot the hanging piece, marking the next move with rewind on', $width, $height, $fullWidth);
})->with('phone sizes');
