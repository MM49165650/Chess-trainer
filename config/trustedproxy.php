<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Trusted proxies
    |--------------------------------------------------------------------------
    |
    | The addresses whose forwarding headers are believed, as a comma-separated
    | list. In production this is only the gateway of the app's Docker
    | network, which is where Hestia's nginx connects from; see
    | docs/deployment.md. Unset, as in development, nothing is trusted.
    |
    */

    'proxies' => env('TRUSTED_PROXIES'),

];
