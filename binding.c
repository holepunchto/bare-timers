#include <assert.h>
#include <bare.h>
#include <js.h>
#include <stdlib.h>
#include <uv.h>

typedef struct {
  uv_timer_t *timer;
  js_ref_t *on_timeout;
  js_env_t *env;
  volatile int32_t next_delay;
} bare_timer_t;

static void
on_timer (uv_timer_t *handle) {
  bare_timer_t *self = (bare_timer_t *) handle->data;

  js_handle_scope_t *scope;
  js_open_handle_scope(self->env, &scope);

  js_value_t *ctx;
  js_get_global(self->env, &ctx);

  js_value_t *callback;
  js_get_reference_value(self->env, self->on_timeout, &callback);

  self->next_delay = -1; // Reset delay

  js_call_function(self->env, ctx, callback, 0, NULL, NULL);

  if (self->next_delay > -1) {
    uv_timer_start(handle, on_timer, self->next_delay, 0);
  }

  js_close_handle_scope(self->env, scope);
}

static void
on_close (uv_handle_t *handle) {
  free(handle);
}

static js_value_t *
bare_timer_init (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_timer_t *self;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &self, NULL, NULL, NULL);
  assert(err == 0);

  self->env = env;
  self->next_delay = -1;

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  self->timer = malloc(sizeof(uv_timer_t));
  self->timer->data = self;

  err = uv_timer_init(loop, self->timer);
  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));
    return NULL;
  }

  uv_unref((uv_handle_t *) self->timer);

  err = js_create_reference(env, argv[1], 1, &self->on_timeout);
  assert(err == 0);

  return NULL;
}

static js_value_t *
bare_timer_destroy (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_timer_t *self;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &self, NULL, NULL, NULL);
  assert(err == 0);

  uv_close((uv_handle_t *) self->timer, on_close);

  err = js_delete_reference(env, self->on_timeout);
  assert(err == 0);

  return NULL;
}

static js_value_t *
bare_timer_pause (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_timer_t *self;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &self, NULL, NULL, NULL);
  assert(err == 0);

  uv_unref((uv_handle_t *) self->timer);

  err = uv_timer_stop(self->timer);
  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));
    return NULL;
  }

  return NULL;
}

static js_value_t *
bare_timer_resume (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_timer_t *self;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &self, NULL, NULL, NULL);
  assert(err == 0);

  int32_t ms;
  err = js_get_value_int32(env, argv[1], &ms);
  assert(err == 0);

  uint32_t ref;
  err = js_get_value_uint32(env, argv[2], &ref);
  assert(err == 0);

  if (ref > 0) uv_ref((uv_handle_t *) self->timer);

  self->next_delay = 0;

  err = uv_timer_start(self->timer, on_timer, ms, 0);
  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));
    return NULL;
  }

  return NULL;
}

static js_value_t *
bare_timer_ref (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_timer_t *self;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &self, NULL, NULL, NULL);
  assert(err == 0);

  uv_ref((uv_handle_t *) self->timer);

  return NULL;
}

static js_value_t *
bare_timer_unref (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_timer_t *self;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &self, NULL, NULL, NULL);
  assert(err == 0);

  uv_unref((uv_handle_t *) self->timer);

  return NULL;
}

static js_value_t *
bare_timer_start (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_timer_t *self;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &self, NULL, NULL, NULL);
  assert(err == 0);

  int32_t ms;
  err = js_get_value_int32(env, argv[1], &ms);
  assert(err == 0);

  err = uv_timer_start(self->timer, on_timer, ms, 0);
  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));
    return NULL;
  }

  return NULL;
}

static js_value_t *
bare_timer_stop (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_timer_t *self;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &self, NULL, NULL, NULL);
  assert(err == 0);

  err = uv_timer_stop(self->timer);
  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));
    return NULL;
  }

  return NULL;
}

static js_value_t *
init (js_env_t *env, js_value_t *exports) {
  {
    js_value_t *val;
    js_create_uint32(env, sizeof(bare_timer_t), &val);
    js_set_named_property(env, exports, "sizeofTimer", val);
  }
  {
    js_value_t *val;
    js_create_uint32(env, offsetof(bare_timer_t, next_delay), &val);
    js_set_named_property(env, exports, "offsetofTimerNextDelay", val);
  }
  {
    js_value_t *fn;
    js_create_function(env, "init", -1, bare_timer_init, NULL, &fn);
    js_set_named_property(env, exports, "init", fn);
  }
  {
    js_value_t *fn;
    js_create_function(env, "destroy", -1, bare_timer_destroy, NULL, &fn);
    js_set_named_property(env, exports, "destroy", fn);
  }
  {
    js_value_t *fn;
    js_create_function(env, "ref", -1, bare_timer_ref, NULL, &fn);
    js_set_named_property(env, exports, "ref", fn);
  }
  {
    js_value_t *fn;
    js_create_function(env, "unref", -1, bare_timer_unref, NULL, &fn);
    js_set_named_property(env, exports, "unref", fn);
  }
  {
    js_value_t *fn;
    js_create_function(env, "start", -1, bare_timer_start, NULL, &fn);
    js_set_named_property(env, exports, "start", fn);
  }
  {
    js_value_t *fn;
    js_create_function(env, "stop", -1, bare_timer_stop, NULL, &fn);
    js_set_named_property(env, exports, "stop", fn);
  }
  {
    js_value_t *fn;
    js_create_function(env, "pause", -1, bare_timer_pause, NULL, &fn);
    js_set_named_property(env, exports, "pause", fn);
  }
  {
    js_value_t *fn;
    js_create_function(env, "resume", -1, bare_timer_resume, NULL, &fn);
    js_set_named_property(env, exports, "resume", fn);
  }

  return exports;
}

BARE_MODULE(bare_timers, init)
