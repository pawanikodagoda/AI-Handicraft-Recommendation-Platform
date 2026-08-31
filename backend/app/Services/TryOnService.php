<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class TryOnService
{
    /**
     * Sends both images as multipart file bytes rather than having the
     * Python service fetch the bracelet image back over HTTP from
     * Laravel - PHP's built-in dev server (and some single-worker
     * setups) can't serve a second request while this one is still
     * in-flight, which would otherwise deadlock until the read timeout.
     */
    public function generate(UploadedFile $handImage, string $braceletImagePath, array $extraParams = []): array
    {
        $response = Http::baseUrl(config('services.tryon_service.url'))
            ->timeout(60)
            ->attach(
                'hand_image',
                file_get_contents($handImage->getRealPath()),
                $handImage->getClientOriginalName()
            )
            ->attach(
                'bracelet_image',
                file_get_contents($braceletImagePath),
                basename($braceletImagePath)
            )
            ->post('/try-on', array_filter($extraParams, fn ($v) => $v !== null));

        $response->throw();

        return $response->json();
    }
}
