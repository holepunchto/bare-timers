#include <assert.h>
#include <bare.h>
#include <js.h>
#include <stdlib.h>
#include <uv.h>

typedef struct {
  uv_timer_t timer;
  uv_check_t check;
  uv_idle_t idle;

  int active_handles;

  js_env_t *env;
  js_ref_t *ctx;
  js_ref_t *on_timer;
  js_ref_t *on_check;

  int64_t next_delay;

  js_deferred_teardown_t *teardown;
} bare_timer_t;

static void
bare_timers__on_idle(uv_idle_t *handle) {}

static void
bare_timers__on_check(uv_check_t *handle) {
  int err;

  bare_timer_t *self = (bare_timer_t *) handle->data;

  err = uv_check_stop(&self->check);
  assert(err == 0);

  err = uv_idle_stop(&self->idle);
  assert(err == 0);

  js_env_t *env = self->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_global(env, &ctx);
  assert(err == 0);

  js_value_t *callback;
  err = js_get_reference_value(env, self->on_check, &callback);
  assert(err == 0);

  js_call_function(env, ctx, callback, 0, NULL, NULL);

  err = js_close_handle_scope(self->env, scope);
  assert(err == 0);
}

static void
bare_timers__on_timer(uv_timer_t *handle) {
  int err;

  bare_timer_t *self = (bare_timer_t *) handle->data;

  js_env_t *env = self->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_global(env, &ctx);
  assert(err == 0);

  js_value_t *callback;
  err = js_get_reference_value(env, self->on_timer, &callback);
  assert(err == 0);

  self->next_delay = -1; // Reset delay

  js_value_t *result;
  err = js_call_function(env, ctx, callback, 0, NULL, &result);

  if (err < 0) self->next_delay = 0; // Retrigger on next tick
  else {
    int64_t next_delay;
    err = js_get_value_int64(env, result, &next_delay);
    assert(err == 0);

    if (next_delay < self->next_delay || self->next_delay == -1) {
      self->next_delay = next_delay;
    }
  }

  if (self->next_delay > -1) {
    err = uv_timer_start(handle, bare_timers__on_timer, self->next_delay, 0);
    assert(err == 0);
  }

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static void
bare_timers__on_close(uv_handle_t *handle) {
  int err;

  bare_timer_t *self = (bare_timer_t *) handle->data;

  if (--self->active_handles) return;

  err = js_finish_deferred_teardown_callback(self->teardown);
  assert(err == 0);

  err = js_delete_reference(self->env, self->on_timer);
  assert(err == 0);

  err = js_delete_reference(self->env, self->on_check);
  assert(err == 0);

  err = js_delete_reference(self->env, self->ctx);
  assert(err == 0);
}

static void
bare_timers__on_teardown(js_deferred_teardown_t *handle, void *data) {
  bare_timer_t *self = (bare_timer_t *) data;

  uv_close((uv_handle_t *) &self->timer, bare_timers__on_close);
  uv_close((uv_handle_t *) &self->check, bare_timers__on_close);
  uv_close((uv_handle_t *) &self->idle, bare_timers__on_close);
}

static js_value_t *
bare_timers_init(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  js_value_t *handle;

  bare_timer_t *self;
  err = js_create_arraybuffer(env, sizeof(bare_timer_t), (void **) &self, &handle);
  assert(err == 0);

  self->active_handles = 0;
  self->env = env;
  self->next_delay = -1;

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  self->timer.data = self;
  self->check.data = self;
  self->idle.data = self;

  err = uv_timer_init(loop, &self->timer);
  assert(err == 0);

  err = uv_check_init(loop, &self->check);
  assert(err == 0);

  err = uv_idle_init(loop, &self->idle);
  assert(err == 0);

  self->active_handles = 3;

  uv_unref((uv_handle_t *) &self->timer);
  uv_unref((uv_handle_t *) &self->check);
  uv_unref((uv_handle_t *) &self->idle);

  err = js_create_reference(env, handle, 1, &self->ctx);
  assert(err == 0);

  err = js_create_reference(env, argv[0], 1, &self->on_timer);
  assert(err == 0);

  err = js_create_reference(env, argv[1], 1, &self->on_check);
  assert(err == 0);

  err = js_add_deferred_teardown_callback(env, bare_timers__on_teardown, (void *) self, &self->teardown);
  assert(err == 0);

  return handle;
}

static js_value_t *
bare_timers_pause(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_timer_t *self;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &self, NULL);
  assert(err == 0);

  uv_unref((uv_handle_t *) &self->timer);
  uv_unref((uv_handle_t *) &self->check);
  uv_unref((uv_handle_t *) &self->idle);

  err = uv_timer_stop(&self->timer);
  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));
    return NULL;
  }

  return NULL;
}

static js_value_t *
bare_timers_resume(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_timer_t *self;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &self, NULL);
  assert(err == 0);

  int64_t ms;
  err = js_get_value_int64(env, argv[1], &ms);
  assert(err == 0);

  uint32_t ref;
  err = js_get_value_uint32(env, argv[2], &ref);
  assert(err == 0);

  if (ref > 0) {
    uv_ref((uv_handle_t *) &self->timer);
    uv_ref((uv_handle_t *) &self->check);
    uv_ref((uv_handle_t *) &self->idle);
  }

  self->next_delay = 0;

  err = uv_timer_start(&self->timer, bare_timers__on_timer, ms, 0);
  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));
    return NULL;
  }

  return NULL;
}

static js_value_t *
bare_timers_ref(js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_timer_t *self;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &self, NULL);
  assert(err == 0);

  uv_ref((uv_handle_t *) &self->timer);
  uv_ref((uv_handle_t *) &self->check);
  uv_ref((uv_handle_t *) &self->idle);

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

  bare_timer_t *self;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &self, NULL);
  assert(err == 0);

  uv_unref((uv_handle_t *) &self->timer);
  uv_unref((uv_handle_t *) &self->check);
  uv_unref((uv_handle_t *) &self->idle);

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

  bare_timer_t *self;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &self, NULL);
  assert(err == 0);

  int64_t ms;
  err = js_get_value_int64(env, argv[1], &ms);
  assert(err == 0);

  self->next_delay = ms;

  err = uv_timer_start(&self->timer, bare_timers__on_timer, ms, 0);
  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));
    return NULL;
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

  bare_timer_t *self;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &self, NULL);
  assert(err == 0);

  err = uv_timer_stop(&self->timer);
  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));
    return NULL;
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

  bare_timer_t *self;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &self, NULL);
  assert(err == 0);

  err = uv_check_start(&self->check, bare_timers__on_check);
  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));
    return NULL;
  }

  err = uv_idle_start(&self->idle, bare_timers__on_idle);
  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));
    return NULL;
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
  V("pause", bare_timers_pause)
  V("resume", bare_timers_resume)
#undef V

  return exports;
}

BARE_MODULE(bare_timers, bare_timers_exports)
