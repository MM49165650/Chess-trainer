<?php

declare(strict_types=1);

use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

pest()->extend(TestCase::class)->in('Feature');

/**
 * The rules every successful data response follows: a public cache header,
 * no cookie and no CORS header.
 *
 * @param  TestResponse<Response>  $response
 */
function expectCacheable(TestResponse $response, int $seconds): void
{
    $response->assertOk();

    expect($response->headers->get('Cache-Control'))->toContain('public')->toContain("max-age={$seconds}")
        ->and($response->headers->getCookies())->toBe([])
        ->and($response->headers->has('Access-Control-Allow-Origin'))->toBeFalse();
}
