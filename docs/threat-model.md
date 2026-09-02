# Threat model

## What this is

`bare-timers` is compiled into Bare. It is listed in `src/builtins.json`, so every Bare process has it. That holds whether or not the process sealed, and no code has to load anything to reach it.

So this addon is part of Bare, and [Bare's threat model](https://github.com/holepunchto/bare/blob/main/docs/threat-model.md) covers it. Read that one first. This one only says where this addon sits in it.

## What it inherits

- **The promise.** Bare promises a sealed process gets no new native code. This addon is native code that is already in, so the seal neither adds it nor takes it away.
- **The attacker.** Untrusted JavaScript in a sealed process. It writes what it likes, runs on as many threads as it wants, and calls anything it can reach in any order and all at once. It can reach all of this addon.
- **The trust.** This addon is trusted, because Bare compiles it in. Whatever you compile in is your security policy, and this is one of the things you picked.
- **The walls.** The same table applies. A thread is not a wall and neither is a realm, so nothing here gets to assume it is alone.
- **The rules.** What Bare says to report, and what Bare says is not a bug, is the same here.

## What counts

- **Counts:** `binding.c` and the JavaScript that ships with it. Sealed JavaScript reaches all of it without loading a thing.
- **Does not count:** tests, benchmarks, and scratch code.

## What this addon adds

Timers on the loop. Timeouts, immediates, and the refs that say whether a timer keeps the loop alive.

Bare's document already lists fast timers, jamming the loop, and using as much memory and as many threads as you like under what still works after the seal. This addon is where the timers come from. Filling the loop with work, or holding it open forever, is sealed code attacking its own process, and it is not a bug.

## Where the risk is

Two things.

**Precision.** Bare's document says fast timers plus `SharedArrayBuffer` give side channels against anything in the same address space, the embedder's own app included. This is one of those clocks, and the answer is an OS sandbox rather than a coarser timer.

**Lifetime.** A timer is a C structure that JavaScript starts and stops, and its callback runs while the loop owns it. Stopping a timer from inside its own callback, stopping one twice, and tearing down a thread with timers still armed are the shapes to watch.

## What to report

- Use after free or double free of a timer handle, including from a callback that reenters
- Memory bugs in the timer bookkeeping that JavaScript can reach
- Anything on Bare's report list

Not a bug: keeping the loop alive, starving it, or measuring time precisely.
