<?php

declare(strict_types=1);

namespace App\Providers;

use Override;
use Spatie\LaravelTypeScriptTransformer\LaravelData\LaravelDataTypeScriptTransformerExtension;
use Spatie\LaravelTypeScriptTransformer\TypeScriptTransformerApplicationServiceProvider;
use Spatie\TypeScriptTransformer\TypeScriptTransformerConfigFactory;
use Spatie\TypeScriptTransformer\Writers\FlatModuleWriter;

/**
 * Generates a TypeScript type for every data class in app/Data, so each data
 * shape is defined once, in PHP. The check command regenerates the file, and
 * it is not committed.
 */
class TypeScriptTransformerServiceProvider extends TypeScriptTransformerApplicationServiceProvider
{
    #[Override]
    protected function configure(TypeScriptTransformerConfigFactory $config): void
    {
        $config
            ->extension(new LaravelDataTypeScriptTransformerExtension)
            ->transformDirectories(app_path('Data'))
            ->outputDirectory(resource_path('js/generated'))
            ->writer(new FlatModuleWriter('data.ts'))
            ->withoutManifest();
    }
}
