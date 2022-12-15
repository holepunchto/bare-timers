{
  'targets': [{
    'target_name': 'tiny_timers',
    'include_dirs': [
      '<!(node -e "require(\'napi-macros\')")',
    ],
    'sources': [
      './binding.c',
    ],
    'xcode_settings': {
      'OTHER_CFLAGS': [
        '-O3',
      ]
    },
    'cflags': [
      '-O3',
    ],
  }]
}
