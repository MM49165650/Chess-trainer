<?php

declare(strict_types=1);

arch()->preset()->php();

arch()->preset()->security();

arch()->preset()->laravel();

arch('every PHP file declares strict types')
    ->expect(['App', 'Database', 'Tests'])
    ->toUseStrictTypes();

arch('no debugging helpers and no env() outside the config files')
    ->expect(['dd', 'ddd', 'dump', 'env', 'ray', 'var_dump'])
    ->not->toBeUsed();
