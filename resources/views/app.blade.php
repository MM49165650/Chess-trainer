<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="color-scheme" content="light dark">

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
        {{-- Written out in place of <x-inertia::app />, so that the root
             element can hold a plain summary of the page. The app replaces
             the summary when it starts. --}}
        <script data-page="app" type="application/json">{!! json_encode($page, JSON_HEX_TAG) !!}</script>
        <div id="app">
            @if ($heading)
                <div class="flex flex-col gap-3 px-5 pt-10 sm:mx-auto sm:w-[560px]">
                    <h1 class="font-serif text-heading tracking-heading">{{ $heading }}</h1>
                    @if ($description)
                        <p class="text-muted">{{ $description }}</p>
                    @endif
                </div>
            @endif
        </div>
    </body>
</html>
