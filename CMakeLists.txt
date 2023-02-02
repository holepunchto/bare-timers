cmake_minimum_required(VERSION 3.25)

project(pear_timers C)

include(pear)

add_pear_module(pear_timers)

target_sources(
  pear_timers
  PRIVATE
    binding.c
)
