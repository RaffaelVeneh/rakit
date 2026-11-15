<?php
\ = opcache_get_status(false);
header('Content-Type: application/json');
echo json_encode([
  'enabled' => \['opcache_enabled'] ?? false,
  'used_mb' => round((\['memory_usage']['used_memory'] ?? 0)/1048576, 1),
  'free_mb' => round((\['memory_usage']['free_memory'] ?? 0)/1048576, 1),
  'wasted_mb' => round((\['memory_usage']['wasted_memory'] ?? 0)/1048576, 1),
  'cached_scripts' => \['opcache_statistics']['num_cached_scripts'] ?? 0,
  'hits' => \['opcache_statistics']['hits'] ?? 0,
  'misses' => \['opcache_statistics']['misses'] ?? 0,
  'max_files' => ini_get('opcache.max_accelerated_files'),
  'file_override' => ini_get('opcache.enable_file_override'),
  'revalidate' => ini_get('opcache.revalidate_freq'),
]);
