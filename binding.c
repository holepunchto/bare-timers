#include <assert.h>
#include <bare.h>
#include <js.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include <uv.h>

#define BARE_TIMERS_MAX_DELAY 9007199254740991

typedef struct {
  uv_timer_t timer;
  uv_check_t check;
  uv_idle_t idle;

  int closing;

  js_env_t *env;
  js_ref_t *handle;
  js_ref_t *ctx;
  js_ref_t *on_timeout;
  js_ref_t *on_immediate;

  js_deferred_teardown_t *teardown;
} bare_timer_scheduler_t;

static const js_type_tag_t bare_timers__scheduler_tag = {
  .lower = 0x9f3c5a1e6b2d4708,
  .upper = 0xc481ed70a53b9f26,
};

static bool
bare_timers__check_object(js_env_t *env, js_value_t *value, const char *message) {
  int err;

  bool is_object;
  err = js_is_object(env, value, &is_object);
  assert(err == 0);

  if (!is_object) {
    err = js_throw_type_error(env, NULL, message);
    assert(err == 0);
  }

  return is_object;
}

static bool
bare_timers__check_function(js_env_t *env, js_value_t *value, const char *message) {
  int err;

  bool is_function;
  err = js_is_function(env, value, &is_function);
  assert(err == 0);

  if (!is_function) {
    err = js_throw_type_error(env, NULL, message);
    assert(err == 0);
  }

  return is_function;
}

static bool
bare_timers__get_delay(js_env_t *env, js_value_t *value, uint64_t *result) {
  int err;

  bool is_number;
  err = js_is_number(env, value, &is_number);
  assert(err == 0);

  if (!is_number) {
    err = js_throw_type_error(env, NULL, "Delay must be a number");
    assert(err == 0);

    return false;
  }

  double delay;
  err = js_get_value_double(env, value, &delay);
  assert(err == 0);

  // Written so that NaN, which compares false against everything, clamps to the
  // lower bound rather than converting to an unspecified integer.
  if (delay > BARE_TIMERS_MAX_DELAY) delay = BARE_TIMERS_MAX_DELAY;
  else if (!(delay > 0)) delay = 0;

  *result = (uint64_t) delay;

  return true;
}

static bool
bare_timers__get_scheduler(js_env_t *env, js_value_t *value, bare_timer_scheduler_t **result) {
  int err;

  bool is_object;
  err = js_is_object(env, value, &is_object);
  assert(err == 0);

  bool tagged = false;

  if (is_object) {
    err = js_check_type_tag(env, value, &bare_timers__scheduler_tag, &tagged);
    assert(err == 0);
  }

  if (!tagged) {
    err = js_throw_type_error(env, NULL, "Handle must be a timer scheduler");
    assert(err == 0);

    return false;
  }

  return js_unwrap(env, value, (void **) result) == 0;
}

static void
bare_timers__on_timer(uv_timer_t *handle) {
  int err;

  bare_timer_scheduler_t *scheduler = (bare_timer_scheduler_t *) handle->data;

  js_env_t *env = scheduler->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, scheduler->ctx, &ctx);
  assert(err == 0);

  js_value_t *callback;
  err = js_get_reference_value(env, scheduler->on_timeout, &callback);
  assert(err == 0);

  err = js_call_function(env, ctx, callback, 0, NULL, NULL);
  (void) err;

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static void
bare_timers__on_check(uv_check_t *handle) {
  int err;

  bare_timer_scheduler_t *scheduler = (bare_timer_scheduler_t *) handle->data;

#define V(name) \
  err = uv_##name##_stop(&scheduler->name); \
  assert(err == 0);
  V(check)
  V(idle)
#undef V

  js_env_t *env = scheduler->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, scheduler->ctx, &ctx);
  assert(err == 0);

  js_value_t *callback;
  err = js_get_reference_value(env, scheduler->on_immediate, &callback);
  assert(err == 0);

  err = js_call_function(env, ctx, callback, 0, NULL, NULL);
  (void) err;

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static void
bare_timers__on_idle(uv_idle_t *handle) {}

static void
bare_timers__on_close(uv_handle_t *handle) {
  int err;

  bare_timer_scheduler_t *scheduler = (bare_timer_scheduler_t *) handle->data;

  if (--scheduler->closing) return;

  js_env_t *env = scheduler->env;

  js_deferred_teardown_t *teardown = scheduler->teardown;

  err = js_delete_reference(env, scheduler->on_timeout);
  assert(err == 0);

  err = js_delete_reference(env, scheduler->on_immediate);
  assert(err == 0);

  err = js_delete_reference(env, scheduler->ctx);
  assert(err == 0);

  err = js_delete_reference(env, scheduler->handle);
  assert(err == 0);

  free(scheduler);

  err = js_finish_deferred_teardown_callback(teardown);
  assert(err == 0);
}

static void
bare_timers__on_teardown(js_deferred_teardown_t *handle, void *data) {
  bare_timer_scheduler_t *scheduler = (bare_timer_scheduler_t *) data;

  scheduler->closing = 3;

#define V(name) uv_close((uv_handle_t *) &scheduler->name, bare_timers__on_close);
  V(timer)
  V(check)
  V(idle)
#undef V
}

static js_value_t *
bare_timers_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  if (!bare_timers__check_object(env, argv[0], "Context must be an object")) return NULL;
  if (!bare_timers__check_function(env, argv[1], "Timeout handler must be a function")) return NULL;
  if (!bare_timers__check_function(env, argv[2], "Immediate handler must be a function")) return NULL;

  js_value_t *handle;
  err = js_create_object(env, &handle);
  if (err < 0) return NULL;

  bare_timer_scheduler_t *scheduler = malloc(sizeof(bare_timer_scheduler_t));

  if (scheduler == NULL) {
    err = js_throw_error(env, uv_err_name(UV_ENOMEM), uv_strerror(UV_ENOMEM));
    assert(err == 0);

    return NULL;
  }

  scheduler->env = env;
  scheduler->closing = 0;

  uv_loop_t *loop;
  err = js_get_env_loop(env, &loop);
  assert(err == 0);

#define V(name) \
  err = uv_##name##_init(loop, &scheduler->name); \
  assert(err == 0); \
  scheduler->name.data = scheduler;
  V(timer)
  V(check)
  V(idle)
#undef V

  err = js_wrap(env, handle, (void *) scheduler, NULL, NULL, NULL);
  assert(err == 0);

  err = js_add_type_tag(env, handle, &bare_timers__scheduler_tag);
  assert(err == 0);

  err = js_create_reference(env, handle, 1, &scheduler->handle);
  assert(err == 0);

  err = js_create_reference(env, argv[0], 1, &scheduler->ctx);
  assert(err == 0);

  err = js_create_reference(env, argv[1], 1, &scheduler->on_timeout);
  assert(err == 0);

  err = js_create_reference(env, argv[2], 1, &scheduler->on_immediate);
  assert(err == 0);

  err = js_add_deferred_teardown_callback(env, bare_timers__on_teardown, (void *) scheduler, &scheduler->teardown);
  assert(err == 0);

  return handle;
}

static js_value_t *
bare_timers_ref(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  bare_timer_scheduler_t *scheduler;
  if (!bare_timers__get_scheduler(env, argv[0], &scheduler)) return NULL;

  if (scheduler->closing) return NULL;

#define V(name) uv_ref((uv_handle_t *) &scheduler->name);
  V(timer)
  V(check)
  V(idle)
#undef V

  return NULL;
}

static js_value_t *
bare_timers_unref(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  bare_timer_scheduler_t *scheduler;
  if (!bare_timers__get_scheduler(env, argv[0], &scheduler)) return NULL;

  if (scheduler->closing) return NULL;

#define V(name) uv_unref((uv_handle_t *) &scheduler->name);
  V(timer)
  V(check)
  V(idle)
#undef V

  return NULL;
}

static js_value_t *
bare_timers_timeout(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  bare_timer_scheduler_t *scheduler;
  if (!bare_timers__get_scheduler(env, argv[0], &scheduler)) return NULL;

  uint64_t delay;
  if (!bare_timers__get_delay(env, argv[1], &delay)) return NULL;

  if (scheduler->closing) return NULL;

  err = uv_timer_start(&scheduler->timer, bare_timers__on_timer, delay, 0);
  assert(err == 0);

  return NULL;
}

static js_value_t *
bare_timers_immediate(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  bare_timer_scheduler_t *scheduler;
  if (!bare_timers__get_scheduler(env, argv[0], &scheduler)) return NULL;

  if (scheduler->closing) return NULL;

#define V(name) \
  err = uv_##name##_start(&scheduler->name, bare_timers__on_##name); \
  assert(err == 0);
  V(check)
  V(idle)
#undef V

  return NULL;
}

static js_value_t *
bare_timers_stop(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  bare_timer_scheduler_t *scheduler;
  if (!bare_timers__get_scheduler(env, argv[0], &scheduler)) return NULL;

  if (scheduler->closing) return NULL;

#define V(name) \
  err = uv_##name##_stop(&scheduler->name); \
  assert(err == 0);
  V(timer)
  V(check)
  V(idle)
#undef V

  return NULL;
}

static js_value_t *
bare_timers_exports(js_env_t *env, js_value_t *exports) {
  int err;

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("init", bare_timers_init)
  V("ref", bare_timers_ref)
  V("unref", bare_timers_unref)
  V("timeout", bare_timers_timeout)
  V("immediate", bare_timers_immediate)
  V("stop", bare_timers_stop)
#undef V

  return exports;
}

BARE_MODULE(bare_timers, bare_timers_exports)
