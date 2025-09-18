#include <assert.h>
#include <bare.h>
#include <js.h>
#include <stdlib.h>
#include <uv.h>

typedef struct {
  uv_timer_t timer;
  uv_check_t check;
  uv_idle_t idle;

  int closing;

  js_env_t *env;
  js_ref_t *ctx;
  js_ref_t *on_timeout;
  js_ref_t *on_immediate;

  js_deferred_teardown_t *teardown;
} bare_timer_scheduler_t;

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

  err = uv_check_stop(&scheduler->check);
  assert(err == 0);

  err = uv_idle_stop(&scheduler->idle);
  assert(err == 0);

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

  err = js_finish_deferred_teardown_callback(teardown);
  assert(err == 0);
}

static void
bare_timers__on_teardown(js_deferred_teardown_t *handle, void *data) {
  bare_timer_scheduler_t *scheduler = (bare_timer_scheduler_t *) data;

  scheduler->closing = 3;

#define V(handle) uv_close((uv_handle_t *) &scheduler->handle, bare_timers__on_close);
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

  assert(argc == 3);

  js_value_t *handle;

  bare_timer_scheduler_t *scheduler;
  err = js_create_arraybuffer(env, sizeof(bare_timer_scheduler_t), (void **) &scheduler, &handle);
  assert(err == 0);

  scheduler->env = env;
  scheduler->closing = 0;

  uv_loop_t *loop;
  err = js_get_env_loop(env, &loop);
  assert(err == 0);

#define V(handle) \
  err = uv_##handle##_init(loop, &scheduler->handle); \
  assert(err == 0); \
  scheduler->handle.data = scheduler;
  V(timer)
  V(check)
  V(idle)
#undef V

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

  assert(argc == 1);

  bare_timer_scheduler_t *scheduler;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &scheduler, NULL);
  assert(err == 0);

#define V(handle) uv_ref((uv_handle_t *) &scheduler->handle);
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

  assert(argc == 1);

  bare_timer_scheduler_t *scheduler;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &scheduler, NULL);
  assert(err == 0);

#define V(handle) uv_unref((uv_handle_t *) &scheduler->handle);
  V(timer)
  V(check)
  V(idle)
#undef V

  return NULL;
}

static js_value_t *
bare_timers_start(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_timer_scheduler_t *scheduler;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &scheduler, NULL);
  assert(err == 0);

  int64_t delay;
  err = js_get_value_int64(env, argv[1], &delay);
  assert(err == 0);

  err = uv_timer_start(&scheduler->timer, bare_timers__on_timer, delay, 0);

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_timers_stop(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_timer_scheduler_t *scheduler;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &scheduler, NULL);
  assert(err == 0);

  err = uv_timer_stop(&scheduler->timer);

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);
  }

  return NULL;
}

static js_value_t *
bare_timers_immediate(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_timer_scheduler_t *scheduler;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &scheduler, NULL);
  assert(err == 0);

  err = uv_check_start(&scheduler->check, bare_timers__on_check);

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);

    return NULL;
  }

  err = uv_idle_start(&scheduler->idle, bare_timers__on_idle);

  if (err < 0) {
    err = js_throw_error(env, uv_err_name(err), uv_strerror(err));
    assert(err == 0);
  }

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
  V("start", bare_timers_start)
  V("stop", bare_timers_stop)
  V("immediate", bare_timers_immediate)
#undef V

  return exports;
}

BARE_MODULE(bare_timers, bare_timers_exports)
