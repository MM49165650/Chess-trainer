<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="color-scheme" content="light dark">

        {{-- Development-only pages live in resources/js/dev, outside the pages folder. --}}
        @php($pageFolder = str_starts_with($page['component'], 'dev/') ? 'resources/js' : 'resources/js/pages')
        @vite(['resources/css/app.css', 'resources/js/app.ts', "{$pageFolder}/{$page['component']}.vue"])
        <x-inertia::head>
            <title>{{ config('app.name') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
