<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The front page answers.
 *
 * The stock version of this test asked for `/` and expected a 200 without migrating
 * anything, so it failed the moment it was actually run: the in-memory database had
 * no `categories` table to read. RefreshDatabase is what makes the assertion mean
 * something — the page is being served against a schema, not against nothing.
 */
class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
