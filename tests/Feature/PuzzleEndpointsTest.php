<?php

declare(strict_types=1);

use App\Models\Puzzle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpFoundation\Response;

uses(RefreshDatabase::class);

/**
 * Stores one made-up puzzle and returns it.
 */
function madeUpPuzzle(string $lichessId, string $piece, int $rating): Puzzle
{
    return Puzzle::query()->create([
        'lichess_id' => $lichessId,
        'fen' => 'made up',
        'setup_move' => 'e7e5',
        'first_move' => 'g1f3',
        'reply_move' => 'd7d6',
        'second_move' => 'f3e5',
        'piece' => $piece,
        'rating' => $rating,
        'popularity' => 90,
        'plays' => 600,
        'themes' => ['fork', 'short'],
    ]);
}

/**
 * The rules every successful data response follows: a public cache header,
 * no cookie and no CORS header.
 *
 * @param  TestResponse<Response>  $response
 */
function expectCacheable(TestResponse $response, int $seconds): void
{
    $response->assertOk();

    expect($response->headers->get('Cache-Control'))->toContain('public')->toContain("max-age={$seconds}")
        ->and($response->headers->getCookies())->toBe([])
        ->and($response->headers->has('Access-Control-Allow-Origin'))->toBeFalse();
}

/**
 * A refused request: a 422 with a short message and no public cache header.
 *
 * @param  TestResponse<Response>  $response
 */
function expectRefused(TestResponse $response): void
{
    $response->assertStatus(422)->assertJsonStructure(['message']);

    expect($response->json())->toHaveCount(1)
        ->and($response->headers->get('Cache-Control'))->not->toContain('public');
}

test('the ID list is ordered by rating, then ID', function (): void {
    $hard = madeUpPuzzle('aaaaa', 'knight', 1400);
    $easyFirst = madeUpPuzzle('bbbbb', 'knight', 900);
    madeUpPuzzle('ccccc', 'queen', 800);
    $easySecond = madeUpPuzzle('ddddd', 'knight', 900);

    $response = $this->get('/api/puzzles/ids?piece=knight');

    expectCacheable($response, 3600);

    $response->assertExactJson([
        'piece' => 'knight',
        'items' => [[$easyFirst->id, 900], [$easySecond->id, 900], [$hard->id, 1400]],
    ]);

    expect($response->getContent())->toBe(
        '{"piece":"knight","items":[['.$easyFirst->id.',900],['.$easySecond->id.',900],['.$hard->id.',1400]]}',
    );
});

test('an unknown or missing piece in the ID list is refused', function (string $query): void {
    madeUpPuzzle('aaaaa', 'knight', 1000);

    expectRefused($this->get('/api/puzzles/ids'.$query));
})->with([
    'unknown' => '?piece=dragon',
    'all' => '?piece=all',
    'capitalised' => '?piece=Knight',
    'empty' => '?piece=',
    'missing' => '',
    'a list' => '?piece[]=knight',
]);

test('a missing, empty, non-numeric or over-long ids list is refused', function (string $query): void {
    madeUpPuzzle('aaaaa', 'knight', 1000);

    expectRefused($this->get('/api/puzzles'.$query));
})->with([
    'missing' => '',
    'empty' => '?ids=',
    'a word' => '?ids=abc',
    'a word among numbers' => '?ids=1,abc,3',
    'a negative number' => '?ids=-1',
    'a decimal' => '?ids=1.5',
    'a trailing comma' => '?ids=1,2,',
    'spaces' => '?ids=1,%202',
    'a list' => '?ids[]=1',
    'twenty-one IDs' => '?ids='.implode(',', range(1, 21)),
]);

test('twenty IDs are accepted', function (): void {
    $puzzle = madeUpPuzzle('aaaaa', 'knight', 1000);

    $ids = [$puzzle->id, ...range($puzzle->id + 1, $puzzle->id + 19)];

    $this->get('/api/puzzles?ids='.implode(',', $ids))->assertOk()->assertJsonCount(1, 'items');
});

test('IDs that do not exist are left out of the answer', function (): void {
    $first = madeUpPuzzle('aaaaa', 'knight', 1000);
    $second = madeUpPuzzle('bbbbb', 'queen', 1100);

    $missing = $second->id + 100;

    $response = $this->get("/api/puzzles?ids={$second->id},{$missing},{$first->id}");

    expectCacheable($response, 86400);

    expect($response->json('items.*.id'))->toBe([$second->id, $first->id]);

    // When none of them exist the answer is an empty list, not an error.
    $this->get("/api/puzzles?ids={$missing}")->assertOk()->assertExactJson(['items' => []]);
});

test('repeated IDs are returned once', function (): void {
    $first = madeUpPuzzle('aaaaa', 'knight', 1000);
    $second = madeUpPuzzle('bbbbb', 'queen', 1100);

    $response = $this->get("/api/puzzles?ids={$first->id},{$second->id},{$first->id},0{$second->id}");

    expect($response->json('items.*.id'))->toBe([$first->id, $second->id]);
});

test('a puzzle carries its Lichess ID, and not its theme labels, popularity or plays', function (): void {
    $puzzle = madeUpPuzzle('aaaaa', 'knight', 1000);

    $response = $this->get("/api/puzzles?ids={$puzzle->id}");

    expectCacheable($response, 86400);

    $response->assertExactJson([
        'items' => [[
            'id' => $puzzle->id,
            'lichess_id' => 'aaaaa',
            'fen' => 'made up',
            'setup_move' => 'e7e5',
            'first_move' => 'g1f3',
            'reply_move' => 'd7d6',
            'second_move' => 'f3e5',
            'piece' => 'knight',
            'rating' => 1000,
        ]],
    ]);
});
