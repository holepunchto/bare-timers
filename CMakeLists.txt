cmake_minimum_required(VERSION 4.0)

find_package(cmake-bare REQUIRED PATHS node_modules/cmake-bare)

project(bare_timers C)

add_bare_module(bare_timers)

target_sources(
  ${bare_timers}
  PRIVATE
    binding.c
)
