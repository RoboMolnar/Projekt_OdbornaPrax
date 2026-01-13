<?php

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:5173,127.0.0.1,127.0.0.1:5173')),

    'guard' => ['web'],

    'expiration' => 60,

    // V tomto projekte nepoužívame vlastné App\Http middleware triedy, ale skeleton
    // konfiguruje middleware v bootstrap/app.php. Preto použijeme frameworkové triedy.
    'middleware' => [
        'verify_csrf_token' => Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
    ],
];
