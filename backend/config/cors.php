<?php

return [
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'logout',
        'register',
        'register/*',
        'password/*',
        'two-factor*',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        env('VITE_PUBLIC_URL', 'http://localhost:5173'),
    ],

    // Povoliť localhost a 127.0.0.1 na ľubovoľnom porte (napr. 5173, 5174)
    'allowed_origins_patterns' => [
        '/^http:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Pri tokenovej autentizácii nie je potrebné posielať cookies
    'supports_credentials' => false,
];
