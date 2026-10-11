<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing
    |--------------------------------------------------------------------------
    |
    | No path sends cross-origin headers. The site's own pages are served from
    | the same origin as the data endpoints, and nothing else needs to read
    | their responses. Laravel's default would open /api/* to every origin.
    |
    */

    'paths' => [],

];
