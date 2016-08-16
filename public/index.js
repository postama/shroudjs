'use strict';
nacl_fatory.instantiate(nacl => {
  console.log(nacl.to_hex(nacl.random_bytes(16)));
});
