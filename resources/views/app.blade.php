<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="color-scheme" content="light dark">

        {{-- The icons and the manifest, for installing the site. The colour of
             the browser's own bar is the page background token from
             resources/css/tokens.css, in each mode. --}}
        <link rel="icon" href="/icons/favicon-32.png" sizes="32x32" type="image/png">
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="apple-mobile-web-app-title" content="Asanfa">
        <meta name="theme-color" content="#ede8dc" media="(prefers-color-scheme: light)" data-mode="light">
        <meta name="theme-color" content="#1b1a17" media="(prefers-color-scheme: dark)" data-mode="dark">

        {{-- The appearance setting, applied before anything is drawn so a reload
             does not flash the wrong mode. Settings live in IndexedDB, which
             cannot be read in time; this is a copy of that one choice, kept by
             resources/js/settings/useSettings.ts under the same key. The bar
             colour follows it as resources/js/settings/applyToPage.ts does. --}}
        <script>
            try {
                var appearance = localStorage.getItem('chess-training:appearance');
                if (appearance === 'light' || appearance === 'dark') {
                    document.documentElement.dataset.appearance = appearance;
                    document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
                        meta.media = meta.dataset.mode === appearance ? 'all' : 'not all';
                    });
                }
            } catch (error) {}
        </script>

        {{-- Development-only pages live in resources/js/dev, outside the pages folder. --}}
        @php($pageFolder = str_starts_with($page['component'], 'dev/') ? 'resources/js' : 'resources/js/pages')
        @vite(['resources/css/app.css', 'resources/js/app.ts', "{$pageFolder}/{$page['component']}.vue"])

        {{-- What the page says about itself, printed here so that it is in the
             page source without any script. PageHead.vue takes both over once
             the app starts: the description by its data-inertia key. --}}
        @php($title = data_get($page, 'props.meta.title'))
        @php($description = data_get($page, 'props.meta.description'))
        @php($heading = data_get($page, 'props.meta.heading'))
        <x-inertia::head>
            <title>{{ $title ? $title.' - '.config('app.name') : config('app.name') }}</title>
            @if ($description)
                <meta name="description" content="{{ $description }}" data-inertia="description">
            @endif
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        {{-- A plain summary of the page, for a reader that runs no script. --}}
        @if ($heading)
            <noscript>
                <div class="flex flex-col gap-3 px-5 pt-10 sm:mx-auto sm:w-[560px]">
                    <h1 class="font-serif text-heading tracking-heading">{{ $heading }}</h1>
                    @if ($description)
                        <p class="text-muted">{{ $description }}</p>
                    @endif
                </div>
            </noscript>
        @endif
        <x-inertia::app />
    </body>
</html>
