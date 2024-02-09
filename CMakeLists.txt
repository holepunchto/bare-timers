cmake_minimum_required(VERSION 3.25)

project(bare_timers C)

include(bare)

add_bare_module(bare_timers)

target_sources(
  ${bare_timers}
  PRIVATE
    binding.c
)
