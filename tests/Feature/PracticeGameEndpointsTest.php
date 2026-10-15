<?php

declare(strict_types=1);

use App\Models\PracticeGame;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpFoundation\Response;

uses(RefreshDatabase::class);

/**
 * Stores one made-up practice game of two moves and returns it. The second
 * move is written as a castling move, so it carries the rook's answers.
 */
function madeUpPracticeGame(string $fingerprintLetter): PracticeGame
{
    return PracticeGame::query()->create([
        'fingerprint' => str_repeat($fingerprintLetter, 64),
        'white_rating' => 1010,
        'black_rating' => 990,
        'time_control' => '600+0',
        'ply_count' => 2,
        'answers_version' => 2,
        'moves' => [
            [
                'uci' => 'g1f3',
                'san' => 'Nf3',
                'piece' => 'knight',
                'lost' => ['e2', 'f3', 'h3'],
                'controlled' => ['d2', 'd4', 'e1', 'e5', 'g1', 'g5', 'h2', 'h4'],
                'rook' => null,
                'hanging' => ['e5'],
            ],
            [
                'uci' => 'e8g8',
                'san' => 'O-O',
                'piece' => 'king',
                'lost' => ['d7', 'd8', 'e7'],
                'controlled' => ['f7', 'f8', 'g7', 'h7', 'h8'],
                'rook' => ['lost' => ['f8', 'h7'], 'controlled' => ['d8', 'e8', 'f7', 'g8']],
                'hanging' => [],
            ],
        ],
    ]);
}

/**
 * A game that is not there: a 404 with the one fixed message, which does not
 * repeat the address, and no public cache header.
 *
 * @param  TestResponse<Response>  $response
 */
function expectNoSuchGame(TestResponse $response): void
{
    $response->assertNotFound()->assertExactJson(['message' => 'Not found.']);

    expect($response->headers->get('Cache-Control'))->not->toContain('public')
        ->and($response->headers->getCookies())->toBe([]);
}

test('the ID list holds every practice game with its length, lowest ID first', function (): void {
    $first = madeUpPracticeGame('a');
    $second = madeUpPracticeGame('b');
    $third = madeUpPracticeGame('c');

    $response = $this->get('/api/practice-games/ids');

    expectCacheable($response, 3600);

    $response->assertExactJson(['items' => [[$first->id, 2], [$second->id, 2], [$third->id, 2]]]);

    expect($response->getContent())->toBe(
        '{"items":[['.$first->id.',2],['.$second->id.',2],['.$third->id.',2]]}',
    );
});

test('the ID list is empty when no game is loaded', function (): void {
    $response = $this->get('/api/practice-games/ids');

    expectCacheable($response, 3600);

    expect($response->getContent())->toBe('{"items":[]}');
});

test('a game carries its moves and answers, and nothing the screen does not use', function (): void {
    $game = madeUpPracticeGame('a');

    $response = $this->get("/api/practice-games/{$game->id}");

    expectCacheable($response, 86400);

    $response->assertExactJson([
        'id' => $game->id,
        'ply_count' => 2,
        'answers_version' => 2,
        'moves' => [
            [
                'uci' => 'g1f3',
                'san' => 'Nf3',
                'piece' => 'knight',
                'lost' => ['e2', 'f3', 'h3'],
                'controlled' => ['d2', 'd4', 'e1', 'e5', 'g1', 'g5', 'h2', 'h4'],
                'rook' => null,
                'hanging' => ['e5'],
            ],
            [
                'uci' => 'e8g8',
                'san' => 'O-O',
                'piece' => 'king',
                'lost' => ['d7', 'd8', 'e7'],
                'controlled' => ['f7', 'f8', 'g7', 'h7', 'h8'],
                'rook' => ['lost' => ['f8', 'h7'], 'controlled' => ['d8', 'e8', 'f7', 'g8']],
                'hanging' => [],
            ],
        ],
    ]);

    // An empty answer is an empty list, never an object.
    expect($response->getContent())->toContain('"hanging":[]');
});

test('an unknown game ID is a 404', function (): void {
    $game = madeUpPracticeGame('a');

    expectNoSuchGame($this->get('/api/practice-games/'.($game->id + 100)));
});

test('a game ID that is not a whole number is a 404', function (string $id): void {
    madeUpPracticeGame('a');

    expectNoSuchGame($this->get('/api/practice-games/'.$id));
})->with([
    'a word' => 'abc',
    'a number then letters' => '1abc',
    'a negative number' => '-1',
    'a decimal' => '1.5',
    'a list' => '1,2',
    'too long for an ID' => str_repeat('9', 19),
]);

test('both endpoints are limited to 120 requests a minute', function (string $path): void {
    $game = madeUpPracticeGame('a');

    $response = $this->get(str_replace('{id}', (string) $game->id, $path));

    expect($response->headers->get('X-RateLimit-Limit'))->toBe('120');
})->with([
    'the ID list' => '/api/practice-games/ids',
    'a game' => '/api/practice-games/{id}',
]);
