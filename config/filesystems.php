<?php

return [

    // Uploaded images are handled by App\Support\FileStore; nothing is served
    // from storage directly.
    'disks' => [
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => false,
            'throw' => false,
        ],
    ],

];
