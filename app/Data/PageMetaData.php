<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Master;
use App\Models\MasterGame;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Spatie\LaravelData\Data;

/**
 * What a page says about itself: its title, its description and its heading.
 * The template prints all three in the page source, so a search engine reads
 * them without running a script, and the page shows the same title.
 */
final class PageMetaData extends Data
{
    /**
     * @param  string  $title  Without the site's name; empty for the home page
     * @param  string|null  $description  Null for a page that has none
     */
    public function __construct(
        public string $title,
        public ?string $description,
        public string $heading,
    ) {}

    public static function home(): self
    {
        return new self(
            title: '',
            description: 'Free, open source chess training in four modes: guess the move, square control, spot the hanging piece and tactics by piece.',
            heading: Config::string('app.name'),
        );
    }

    public static function notFound(): self
    {
        return new self(
            title: 'Page not found',
            description: null,
            heading: 'This page is not here.',
        );
    }

    public static function masters(): self
    {
        return new self(
            title: 'Guess the move',
            description: 'Guess the move in games won by eleven masters, from Morphy to Fischer.',
            heading: 'Guess the move',
        );
    }

    public static function master(Master $master, int $gameCount): self
    {
        $games = match ($gameCount) {
            0 => 'Games',
            1 => '1 game',
            default => $gameCount.' games',
        };

        return new self(
            title: 'Guess the move: '.$master->name,
            description: $games.' won by '.$master->name.". Pick one and guess the winner's moves.",
            heading: $master->name,
        );
    }

    public static function tacticsCategories(): self
    {
        return new self(
            title: 'Tactics by piece',
            description: 'Short tactics grouped by piece. Win material in two moves, ending in a capture.',
            heading: 'Tactics by piece',
        );
    }

    /**
     * @param  string  $piece  One of the six piece types, or "all"
     */
    public static function tactics(string $piece): self
    {
        if ($piece === 'all') {
            return new self(
                title: 'Tactics: all pieces',
                description: 'Short tactics with every piece. Win material in two moves, ending in a capture.',
                heading: 'All pieces',
            );
        }

        return new self(
            title: 'Tactics: '.$piece,
            description: 'Short '.$piece.' tactics. Win material in two moves with the '.$piece.', ending in a capture.',
            heading: Str::ucfirst($piece).' tactics',
        );
    }

    public static function squares(): self
    {
        return new self(
            title: 'Square control',
            description: 'Watch a beginner game move by move, and mark the squares each moved piece gave up and now controls.',
            heading: 'Square control',
        );
    }

    public static function hanging(): self
    {
        return new self(
            title: 'Spot the hanging piece',
            description: 'Watch a beginner game move by move, and mark every piece left hanging, on either side.',
            heading: 'Spot the hanging piece',
        );
    }

    public static function squaresPlay(): self
    {
        return new self(
            title: 'Square control',
            description: 'Watch a beginner game one move at a time. After every move, mark the squares the piece gave up and the squares it controls now.',
            heading: 'Square control',
        );
    }

    public static function hangingPlay(): self
    {
        return new self(
            title: 'Spot the hanging piece',
            description: 'Watch a beginner game one move at a time. After every move, mark every piece and pawn left hanging, on either side.',
            heading: 'Spot the hanging piece',
        );
    }

    public static function game(Master $master, MasterGame $game): self
    {
        // White's name first. Both players go by family name; an opponent
        // without one goes by the full name.
        $winner = Str::afterLast($master->name, ' ');
        $opponent = $game->opponent_short_name ?? $game->opponent_name;
        $players = $game->master_color === 'white'
            ? $winner.' vs. '.$opponent
            : $opponent.' vs. '.$winner;

        $occasion = trim(($game->event ?? '').' '.($game->year ?? ''));
        $occasion = $occasion === '' ? '' : ', '.$occasion;

        $moves = $game->guess_count === 1
            ? '1 move, one guess.'
            : $game->guess_count.' moves, one guess each.';

        return new self(
            title: 'Guess the move: '.$players.$occasion,
            description: 'Guess every move '.$master->name.' played to beat '.$game->opponent_name.$occasion.'. '.$moves,
            heading: $players,
        );
    }
}
