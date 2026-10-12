<?php

declare(strict_types=1);

namespace App\Http\Controllers\Guess;

use App\Data\MasterGameFiltersData;
use App\Data\MasterGameListItemData;
use App\Data\MasterSummaryData;
use App\Http\Controllers\Controller;
use App\Models\Master;
use App\Models\MasterGame;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GET /guess/{master}: one master's games, sorted by year, a page at a time.
 * The query parameters are q, color, year_from, year_to and page. One that is
 * not valid is ignored.
 */
class ListMasterGamesController extends Controller
{
    private const int PER_PAGE = 30;

    private const int SEARCH_MAX_LENGTH = 100;

    public function __invoke(Request $request, string $master): Response
    {
        $found = Master::query()->where('slug', $master)->first();

        abort_if($found === null, 404);

        $filters = new MasterGameFiltersData(
            q: $this->search($request),
            color: $this->color($request),
            year_from: $this->year($request, 'year_from'),
            year_to: $this->year($request, 'year_to'),
        );

        // The moves are never selected for a list.
        $query = MasterGame::query()
            ->select(['id', 'master_color', 'opponent_name', 'year', 'event', 'guess_count'])
            ->where('master_id', $found->id);

        if ($filters->q !== null) {
            // The search text is matched as it is written, not as a pattern.
            $pattern = '%'.addcslashes($filters->q, '%_\\').'%';

            $query->whereAny(['opponent_name', 'event'], 'ilike', $pattern);
        }

        if ($filters->color !== null) {
            $query->where('master_color', $filters->color);
        }

        if ($filters->year_from !== null) {
            $query->where('year', '>=', $filters->year_from);
        }

        if ($filters->year_to !== null) {
            $query->where('year', '<=', $filters->year_to);
        }

        // Oldest first. Postgres puts a game with no year last; the ID keeps
        // the order of games within a year the same on every page.
        $page = $query->orderBy('year')->orderBy('id')->paginate(self::PER_PAGE);

        $games = array_map(
            fn (MasterGame $game): MasterGameListItemData => MasterGameListItemData::from([
                'id' => $game->id,
                'master_color' => $game->master_color,
                'opponent_name' => $game->opponent_name,
                'year' => $game->year,
                'event' => $game->event,
                'guess_count' => $game->guess_count,
            ]),
            $page->items(),
        );

        return Inertia::render('guess/Games', [
            'master' => new MasterSummaryData($found->slug, $found->name),
            'games' => $games,
            'filters' => $filters,
            'page' => $page->currentPage(),
            'lastPage' => $page->lastPage(),
            'total' => $page->total(),
        ]);
    }

    private function search(Request $request): ?string
    {
        $value = $request->query('q');

        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' || mb_strlen($value) > self::SEARCH_MAX_LENGTH ? null : $value;
    }

    private function color(Request $request): ?string
    {
        $value = $request->query('color');

        return $value === 'white' || $value === 'black' ? $value : null;
    }

    private function year(Request $request, string $name): ?int
    {
        $value = $request->query($name);

        if (! is_string($value) || preg_match('/^[0-9]{4}$/', $value) !== 1) {
            return null;
        }

        $year = (int) $value;

        return $year >= 1800 && $year <= 2100 ? $year : null;
    }
}
