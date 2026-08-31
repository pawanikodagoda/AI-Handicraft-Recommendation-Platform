<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class TaggingService
{
    public function suggest(string $title, string $description): array
    {
        $response = Http::baseUrl(config('services.tagging_service.url'))
            ->timeout(10)
            ->post('/tag', [
                'title' => $title,
                'description' => $description,
            ]);

        $response->throw();

        return $response->json();
    }
}
