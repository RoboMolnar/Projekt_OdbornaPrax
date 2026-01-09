<?php

return [
    'template' => storage_path('app/templates/Dohoda_template_placeholders_v2.docx'),
    'output_dir' => 'private/agreements',
    'libreoffice_path' => env('LIBREOFFICE_PATH', null),
];