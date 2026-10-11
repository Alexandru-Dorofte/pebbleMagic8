#include <pebble.h>

int main(void) {
  Window *w = window_create();
  window_stack_push(w, true);

  // The default JS heap (~21KB) was constantly full, so the engine spent its time
  // collecting garbage. The app has ~107KB free, so give it more room.
  ModdableCreationRecord creation = {
    .recordSize = sizeof(ModdableCreationRecord),
    .stack = 6 * 1024,   // must be set too, 0 is rejected
    .slot = 32 * 1024,
    .chunk = 24 * 1024,
  };
  moddable_createMachine(&creation);

  window_destroy(w);
}
